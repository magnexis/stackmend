import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ClientHello,
  DaemonStatus,
  FeedbackRequest,
  FeedbackResponse,
  FracturesRequest,
  FracturesResponse,
  STACKMEND_PROTOCOL_VERSION,
  StackMendResponse,
} from "@stackmend/protocol";

const STACKMEND_HOME = process.env.STACKMEND_HOME || path.join(os.homedir(), ".stackmend");
const CONFIG_DIR = path.join(STACKMEND_HOME, "config");
const DATA_DIR = path.join(STACKMEND_HOME, "data");
const CACHE_DIR = path.join(STACKMEND_HOME, "cache");
const LOG_DIR = path.join(STACKMEND_HOME, "logs");
const RUNTIME_DIR = path.join(STACKMEND_HOME, "runtime");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "daemon-runtime.json");
const LOCK_FILE = path.join(RUNTIME_DIR, "daemon.lock.json");
const PID_FILE = path.join(RUNTIME_DIR, "daemon.pid");
const STATE_FILE = path.join(RUNTIME_DIR, "daemon-state.json");
const DEFAULT_TIMEOUT_MS = 15000;
const STALE_HEARTBEAT_MS = 15000;

export interface DaemonRuntimeInfo {
  port: number;
  token: string;
  pid: number;
  instanceId?: string;
  startedAt: string;
  lastHeartbeatAt?: string;
}

export interface DaemonClientOptions {
  clientId: string;
  clientType: ClientHello["clientType"];
  clientVersion: string;
}

export interface DaemonHealthReport {
  daemonReachable: boolean;
  runtimeFilePresent: boolean;
  lockFilePresent: boolean;
  pidFilePresent: boolean;
  stateFilePresent: boolean;
  runtimeLooksStale: boolean;
  runtimeRepaired: boolean;
  pidAlive: boolean;
  heartbeatFresh: boolean;
  protocolVersion: string;
  runtimeFile: string;
}

export class StackMendDaemonClient {
  constructor(private readonly options: DaemonClientOptions) {}

  async ensureStarted(): Promise<void> {
    const runtime = readRuntimeInfo();
    if (runtime && (await this.ping(runtime))) {
      return;
    }

    repairRuntimeArtifacts();
    await startDaemonProcess();
    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const nextRuntime = readRuntimeInfo();
      if (nextRuntime && (await this.ping(nextRuntime))) {
        return;
      }
      await sleep(250);
    }

    throw new Error("STACKMEND daemon did not become ready in time.");
  }

  async status(): Promise<DaemonStatus> {
    return this.request<DaemonStatus>("GET", "/status");
  }

  async analyze(projectPath: string): Promise<AnalyzeResponse> {
    return this.request<AnalyzeResponse>("POST", "/analyze", {
      projectPath: normalizeProjectPath(projectPath),
    } satisfies AnalyzeRequest);
  }

  async fractures(projectPath: string, severity?: FracturesRequest["severity"]): Promise<FracturesResponse> {
    return this.request<FracturesResponse>("POST", "/fractures", {
      projectPath: normalizeProjectPath(projectPath),
      severity,
    } satisfies FracturesRequest);
  }

  async feedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
    return this.request<FeedbackResponse>("POST", "/feedback", payload);
  }

  async doctor(fix = false): Promise<DaemonHealthReport> {
    const report = inspectRuntimeHealth();
    if (fix && report.runtimeLooksStale) {
      repairRuntimeArtifacts();
      const repaired = inspectRuntimeHealth();
      return {
        ...repaired,
        runtimeRepaired: true,
      };
    }

    const runtime = readRuntimeInfo();
    return {
      ...report,
      daemonReachable: runtime ? await this.ping(runtime) : false,
    };
  }

  async stop(): Promise<void> {
    await this.request<{ stopped: true }>("POST", "/stop");
  }

  private async ping(runtime: DaemonRuntimeInfo): Promise<boolean> {
    try {
      const response = await rawRequest<DaemonStatus>(runtime, "GET", "/status", undefined, 3000);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async request<T>(method: "GET" | "POST", route: string, body?: unknown): Promise<T> {
    const runtime = readRuntimeInfo();
    if (!runtime) {
      throw new Error("STACKMEND daemon runtime info is missing.");
    }

    const response = await rawRequest<T>(runtime, method, route, body);
    if (!response.ok) {
      throw new Error(`${response.error.code}: ${response.error.message}`);
    }
    return response.data;
  }
}

export function getStackMendPaths() {
  return {
    home: STACKMEND_HOME,
    configDir: CONFIG_DIR,
    dataDir: DATA_DIR,
    cacheDir: CACHE_DIR,
    logDir: LOG_DIR,
    runtimeDir: RUNTIME_DIR,
    runtimeFile: RUNTIME_FILE,
    lockFile: LOCK_FILE,
    pidFile: PID_FILE,
    stateFile: STATE_FILE,
  };
}

export function readRuntimeInfo(): DaemonRuntimeInfo | null {
  try {
    if (!fs.existsSync(RUNTIME_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8")) as DaemonRuntimeInfo;
  } catch {
    return null;
  }
}

export async function startDaemonProcess(): Promise<void> {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const daemonEntry = resolveDaemonEntry();
  const child = spawn(process.execPath, [daemonEntry], {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
    windowsHide: true,
    env: createDaemonEnvironment(),
  });
  child.unref();
}

export function inspectRuntimeHealth(): DaemonHealthReport {
  const runtime = readRuntimeInfo();
  const lock = readJsonFile<{ pid?: number; lastHeartbeatAt?: string }>(LOCK_FILE);
  const pid = runtime?.pid ?? lock?.pid ?? readPidFile();
  const lastHeartbeatAt = runtime?.lastHeartbeatAt ?? lock?.lastHeartbeatAt;
  const pidAlive = typeof pid === "number" ? isPidAlive(pid) : false;
  const heartbeatFresh = isHeartbeatFresh(lastHeartbeatAt);
  const runtimeFilePresent = fs.existsSync(RUNTIME_FILE);
  const lockFilePresent = fs.existsSync(LOCK_FILE);
  const pidFilePresent = fs.existsSync(PID_FILE);
  const stateFilePresent = fs.existsSync(STATE_FILE);
  const runtimeLooksStale =
    runtimeFilePresent || lockFilePresent || pidFilePresent || stateFilePresent
      ? !pidAlive || !heartbeatFresh
      : false;

  return {
    daemonReachable: false,
    runtimeFilePresent,
    lockFilePresent,
    pidFilePresent,
    stateFilePresent,
    runtimeLooksStale,
    runtimeRepaired: false,
    pidAlive,
    heartbeatFresh,
    protocolVersion: STACKMEND_PROTOCOL_VERSION,
    runtimeFile: RUNTIME_FILE,
  };
}

export function repairRuntimeArtifacts(): boolean {
  const health = inspectRuntimeHealth();
  if (!health.runtimeLooksStale) {
    return false;
  }

  for (const target of [RUNTIME_FILE, LOCK_FILE, PID_FILE, STATE_FILE]) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
  return true;
}

async function rawRequest<T>(
  runtime: DaemonRuntimeInfo,
  method: "GET" | "POST",
  route: string,
  body?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<StackMendResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`http://127.0.0.1:${runtime.port}${route}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-stackmend-token": runtime.token,
        "x-stackmend-client-id": "stackmend-client",
        "x-stackmend-protocol-version": STACKMEND_PROTOCOL_VERSION,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (route === "/stop" && !response.body) {
      return {
        ok: true,
        requestId: "stop-request",
        data: { stopped: true } as T,
      };
    }
    return (await response.json()) as StackMendResponse<T>;
  } catch (error) {
    if (route === "/stop") {
      return {
        ok: true,
        requestId: "stop-request",
        data: { stopped: true } as T,
      };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonFile<T>(target: string): T | null {
  try {
    if (!fs.existsSync(target)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(target, "utf8")) as T;
  } catch {
    return null;
  }
}

function readPidFile(): number | null {
  try {
    if (!fs.existsSync(PID_FILE)) {
      return null;
    }
    const value = Number.parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
    return Number.isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isHeartbeatFresh(lastHeartbeatAt?: string): boolean {
  if (!lastHeartbeatAt) {
    return false;
  }
  const heartbeatMs = Date.parse(lastHeartbeatAt);
  if (Number.isNaN(heartbeatMs)) {
    return false;
  }
  return Date.now() - heartbeatMs <= STALE_HEARTBEAT_MS;
}

function normalizeProjectPath(value: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error("Project path must be a non-empty string.");
  }
  if (containsTraversalSegment(value)) {
    throw new Error("Project path must not contain traversal segments.");
  }
  const resolved = path.resolve(value);
  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error("Project path must reference an existing directory.");
  }
  return fs.realpathSync(resolved);
}

function containsTraversalSegment(value: string): boolean {
  return value.split(/[\\/]+/).includes("..");
}

function createDaemonEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of ["NODE_OPTIONS", "NODE_PATH", "npm_config_node_options"]) {
    delete env[key];
  }
  return env;
}

function resolveDaemonEntry(): string {
  const packageDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = findPackageRoot(packageDir);
  const monorepoRoot = packageRoot ? path.resolve(packageRoot, "..", "..") : undefined;
  const candidates = [
    ...(monorepoRoot ? [path.join(monorepoRoot, "apps", "daemon", "dist", "apps", "daemon", "src", "index.js")] : []),
    ...(packageRoot ? [path.resolve(packageRoot, "..", "daemon", "dist", "apps", "daemon", "src", "index.js")] : []),
    path.resolve(STACKMEND_HOME, "bin", "stackmend-daemon.js"),
  ];
  const trustedRoots = [monorepoRoot, path.resolve(STACKMEND_HOME, "bin")].filter(
    (value): value is string => Boolean(value),
  );

  const override = process.env.STACKMEND_DAEMON_ENTRY;
  if (override) {
    const resolvedOverride = validateDaemonEntry(override, trustedRoots);
    if (!resolvedOverride) {
      throw new Error("STACKMEND_DAEMON_ENTRY must point to a trusted daemon JavaScript file.");
    }
    return resolvedOverride;
  }

  for (const candidate of candidates) {
    const resolved = validateDaemonEntry(candidate, trustedRoots);
    if (resolved) {
      return resolved;
    }
  }

  throw new Error(`Unable to locate STACKMEND daemon entry. Checked: ${candidates.join(", ")}`);
}

function validateDaemonEntry(candidate: string, trustedRoots: string[]): string | null {
  if (!path.isAbsolute(candidate) || candidate.includes("\0") || !/\.(?:cjs|mjs|js)$/i.test(candidate)) {
    return null;
  }
  try {
    const realCandidate = fs.realpathSync(candidate);
    if (!fs.statSync(realCandidate).isFile()) {
      return null;
    }
    return trustedRoots.some((root) => isWithinDirectory(realCandidate, root)) ? realCandidate : null;
  } catch {
    return null;
  }
}

function findPackageRoot(start: string): string | null {
  let current = start;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    current = path.dirname(current);
  }
  return null;
}

function isWithinDirectory(candidate: string, root: string): boolean {
  const relative = path.relative(fs.existsSync(root) ? fs.realpathSync(root) : path.resolve(root), candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

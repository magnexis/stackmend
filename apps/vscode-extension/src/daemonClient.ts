import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export type DaemonState =
  | "stopped"
  | "starting"
  | "ready"
  | "busy"
  | "degraded"
  | "updating"
  | "stopping"
  | "failed";

export interface EvidenceRef {
  file: string;
  line?: number;
  excerpt?: string;
}

export interface RepairOption {
  summary: string;
  actions: string[];
}

export interface Fracture {
  id: string;
  title: string;
  category: "environment" | "route";
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  expected: string[];
  actual: string[];
  evidence: EvidenceRef[];
  repairOptions: RepairOption[];
}

export interface ScanSummary {
  targetPath: string;
  fractures: Fracture[];
}

interface AnalyzeResponse {
  summary: ScanSummary;
}

interface FeedbackResponse {
  interactionId: string;
  intelligenceDeltaId: string;
  gradient: number;
}

interface DaemonRuntimeInfo {
  port: number;
  token: string;
}

interface DaemonStatus {
  state: DaemonState;
}

interface StackMendResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface FeedbackRequest {
  kind: "repair_feedback" | "diagnosis_correction";
  payload: Record<string, unknown>;
}

const STACKMEND_PROTOCOL_VERSION = "1.0";
const STACKMEND_HOME = process.env.STACKMEND_HOME || path.join(os.homedir(), ".stackmend");
const RUNTIME_DIR = path.join(STACKMEND_HOME, "runtime");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "daemon-runtime.json");
const DEFAULT_TIMEOUT_MS = 15000;

export class StackMendDaemonClient {
  constructor(
    private readonly options: {
      clientId: string;
      clientType: "vscode" | "cli" | "desktop" | "ci";
      clientVersion: string;
    },
  ) {}

  async ensureStarted(): Promise<void> {
    const runtime = readRuntimeInfo();
    if (runtime && (await this.ping(runtime))) {
      return;
    }

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
    });
  }

  async feedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
    return this.request<FeedbackResponse>("POST", "/feedback", payload);
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
    if (!response.ok || !response.data) {
      const error = response.error ?? { code: "daemon_request_failed", message: "Unknown daemon error." };
      throw new Error(`${error.code}: ${error.message}`);
    }

    return response.data;
  }
}

function readRuntimeInfo(): DaemonRuntimeInfo | null {
  try {
    if (!fs.existsSync(RUNTIME_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8")) as DaemonRuntimeInfo;
  } catch {
    return null;
  }
}

async function startDaemonProcess(): Promise<void> {
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
        "x-stackmend-client-id": "stackmend-vscode",
        "x-stackmend-protocol-version": STACKMEND_PROTOCOL_VERSION,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (route === "/stop" && !response.body) {
      return { ok: true, data: { stopped: true } as T };
    }

    return (await response.json()) as StackMendResponse<T>;
  } finally {
    clearTimeout(timeout);
  }
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
  const extensionRoot = findPackageRoot(__dirname);
  const monorepoRoot = extensionRoot ? path.resolve(extensionRoot, "..", "..") : undefined;
  const candidates = [
    ...(monorepoRoot ? [path.join(monorepoRoot, "apps", "daemon", "dist", "apps", "daemon", "src", "index.js")] : []),
    ...(extensionRoot ? [path.resolve(extensionRoot, "dist", "apps", "daemon", "src", "index.js")] : []),
    path.resolve(STACKMEND_HOME, "bin", "stackmend-daemon.js"),
  ];
  const trustedRoots = [monorepoRoot, extensionRoot, path.resolve(STACKMEND_HOME, "bin")].filter(
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

  throw new Error(
    `Unable to locate STACKMEND daemon entry. Set STACKMEND_DAEMON_ENTRY or install the daemon runtime.`,
  );
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

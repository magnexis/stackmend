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
    return this.request<AnalyzeResponse>("POST", "/analyze", { projectPath });
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
    env: { ...process.env },
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

function resolveDaemonEntry(): string {
  const override = process.env.STACKMEND_DAEMON_ENTRY;
  if (override && fs.existsSync(override)) {
    return override;
  }

  const candidates = [
    path.resolve(process.cwd(), "apps", "daemon", "dist", "apps", "daemon", "src", "index.js"),
    path.resolve(process.cwd(), "dist", "apps", "daemon", "src", "index.js"),
    path.resolve(STACKMEND_HOME, "bin", "stackmend-daemon.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate STACKMEND daemon entry. Set STACKMEND_DAEMON_ENTRY or install the daemon runtime.`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

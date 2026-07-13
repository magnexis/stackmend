import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  AnalyzeRequest,
  AnalyzeResponse,
  DaemonStatus,
  DiagnosisCorrectionInput,
  FeedbackRequest,
  FeedbackResponse,
  FracturesRequest,
  FracturesResponse,
  RepairFeedbackInput,
  STACKMEND_PROTOCOL_VERSION,
  StackMendResponse,
} from "@stackmend/protocol";
import {
  recordDiagnosisCorrection,
  recordRepairFeedback,
  scanProject,
} from "@stackmend/fracture-engine";

const STACKMEND_HOME = process.env.STACKMEND_HOME || path.join(os.homedir(), ".stackmend");
const CONFIG_DIR = path.join(STACKMEND_HOME, "config");
const DATA_DIR = path.join(STACKMEND_HOME, "data");
const CACHE_DIR = path.join(STACKMEND_HOME, "cache");
const RUNTIME_DIR = path.join(STACKMEND_HOME, "runtime");
const LOG_DIR = path.join(STACKMEND_HOME, "logs");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "daemon-runtime.json");
const PID_FILE = path.join(RUNTIME_DIR, "daemon.pid");
const LOCK_FILE = path.join(RUNTIME_DIR, "daemon.lock.json");
const STATE_FILE = path.join(RUNTIME_DIR, "daemon-state.json");
const LOG_FILE = path.join(LOG_DIR, "daemon.log");
const DAEMON_VERSION = "0.1.0";
const MAX_LOG_BYTES = 256 * 1024;
const MAX_LOG_ARCHIVES = 3;
const HEARTBEAT_INTERVAL_MS = 2000;
const STALE_HEARTBEAT_MS = 15000;
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;


type DaemonState =
  | "starting"
  | "ready"
  | "busy"
  | "degraded"
  | "stopping"
  | "failed";

const state = {
  current: "starting" as DaemonState,
  startedAt: Date.now(),
  activeProjects: new Set<string>(),
  queuedJobs: 0,
  mode: "suggest" as DaemonStatus["mode"],
};
const instanceId = crypto.randomUUID();

async function main(): Promise<void> {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });

  cleanupStaleRuntimeArtifacts("startup");

  const existing = readRuntime();
  if (existing && (await isPortReachable(existing.port))) {
    log(`Existing daemon already running on port ${existing.port}.`);
    process.exit(0);
  }

  const port = await findOpenPort();
  const token = crypto.randomBytes(24).toString("hex");

  let heartbeatTimer: NodeJS.Timeout | undefined;
  const server = http.createServer(async (req, res) => {
    try {
      if (req.headers["x-stackmend-token"] !== token) {
        return respond(res, 401, {
          ok: false,
          requestId: requestId(),
          error: { code: "UNAUTHORIZED", message: "Missing or invalid daemon token." },
        });
      }

      if (req.headers["x-stackmend-protocol-version"] !== STACKMEND_PROTOCOL_VERSION) {
        return respond(res, 409, {
          ok: false,
          requestId: requestId(),
          error: {
            code: "PROTOCOL_MISMATCH",
            message: `Expected protocol ${STACKMEND_PROTOCOL_VERSION}.`,
          },
        });
      }

      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (req.method === "GET" && url.pathname === "/status") {
        return respondOk<DaemonStatus>(res, buildStatus());
      }

      if (req.method === "POST" && url.pathname === "/analyze") {
        const body = (await readJson(req)) as AnalyzeRequest;
        const projectPath = validateProjectPath(body.projectPath);
        return withActiveProject(projectPath, () => {
          const summary = scanProject(projectPath);
          return respondOk<AnalyzeResponse>(res, { summary });
        });
      }

      if (req.method === "POST" && url.pathname === "/fractures") {
        const body = (await readJson(req)) as FracturesRequest;
        const projectPath = validateProjectPath(body.projectPath);
        return withActiveProject(projectPath, () => {
          const summary = scanProject(projectPath);
          const filtered = body.severity
            ? summary.fractures.filter((fracture) => fracture.severity === body.severity)
            : summary.fractures;
          return respondOk<FracturesResponse>(res, {
            summary: { targetPath: summary.targetPath, fractures: filtered },
          });
        });
      }

      if (req.method === "POST" && url.pathname === "/feedback") {
        state.current = "busy";
        const body = (await readJson(req)) as FeedbackRequest;
        const payload = validateFeedbackPayload(body.payload);
        const result =
          body.kind === "repair_feedback"
            ? recordRepairFeedback(payload as RepairFeedbackInput)
            : recordDiagnosisCorrection(payload as DiagnosisCorrectionInput);
        state.current = "ready";
        return respondOk<FeedbackResponse>(res, {
          interactionId: result.interactionRecord.id,
          intelligenceDeltaId: result.intelligenceDelta.id,
          gradient: result.intelligenceDelta.interactionGradient,
        });
      }

      if (req.method === "POST" && url.pathname === "/stop") {
        state.current = "stopping";
        respondOk(res, { stopped: true });
        setTimeout(() => shutdown(server, heartbeatTimer), 100).unref();
        return;
      }

      return respond(res, 404, {
        ok: false,
        requestId: requestId(),
        error: { code: "NOT_FOUND", message: `Unknown route ${req.method} ${url.pathname}` },
      });
    } catch (error) {
      state.current = "degraded";
      log(`Request failed: ${String(error)}`);
      return respond(res, 500, {
        ok: false,
        requestId: requestId(),
        error: { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : String(error) },
      });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    state.current = "ready";
    writeRuntimeFiles(port, token);
    heartbeatTimer = setInterval(() => writeRuntimeFiles(port, token), HEARTBEAT_INTERVAL_MS);
    heartbeatTimer.unref();
    log(`stackmend-daemon ready on port ${port}`);
  });

  process.on("SIGINT", () => shutdown(server, heartbeatTimer));
  process.on("SIGTERM", () => shutdown(server, heartbeatTimer));
  process.on("uncaughtException", (error) => {
    state.current = "failed";
    log(`Uncaught exception: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  });
  process.on("unhandledRejection", (reason) => {
    state.current = "failed";
    log(`Unhandled rejection: ${reason instanceof Error ? reason.stack ?? reason.message : String(reason)}`);
  });
  process.on("exit", cleanupRuntime);
}

function buildStatus(): DaemonStatus {
  return {
    state: state.current,
    daemonVersion: DAEMON_VERSION,
    protocolVersion: STACKMEND_PROTOCOL_VERSION,
    activeProjects: state.activeProjects.size,
    queuedJobs: state.queuedJobs,
    uptimeMs: Date.now() - state.startedAt,
    mode: state.mode,
  };
}

function writeStateSnapshot(): void {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        state: state.current,
        daemonVersion: DAEMON_VERSION,
        protocolVersion: STACKMEND_PROTOCOL_VERSION,
        activeProjects: [...state.activeProjects],
        queuedJobs: state.queuedJobs,
        mode: state.mode,
        pid: process.pid,
        instanceId,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

function writeRuntimeFiles(port: number, token: string): void {
  const heartbeatAt = new Date().toISOString();
  fs.writeFileSync(PID_FILE, String(process.pid), "utf8");
  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify(
      {
        pid: process.pid,
        instanceId,
        acquiredAt: new Date(state.startedAt).toISOString(),
        lastHeartbeatAt: heartbeatAt,
      },
      null,
      2,
    ),
    "utf8",
  );
  fs.writeFileSync(
    RUNTIME_FILE,
    JSON.stringify(
      {
        port,
        token,
        pid: process.pid,
        instanceId,
        startedAt: new Date(state.startedAt).toISOString(),
        lastHeartbeatAt: heartbeatAt,
      },
      null,
      2,
    ),
    "utf8",
  );
  writeStateSnapshot();
}

function respondOk<T>(res: http.ServerResponse, data: T): void {
  respond<T>(res, 200, {
    ok: true,
    requestId: requestId(),
    data,
  });
}

function respond<T>(res: http.ServerResponse, statusCode: number, body: StackMendResponse<T>): void {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      throw new Error(`Request body exceeds ${MAX_REQUEST_BODY_BYTES} bytes.`);
    }
    chunks.push(buffer);
  }
  return chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks, totalBytes).toString("utf8"));
}

function validateProjectPath(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) {
    throw new Error("Project path must be a non-empty string.");
  }
  if (containsTraversalSegment(value)) {
    throw new Error("Project path must not contain traversal segments.");
  }
  if (!path.isAbsolute(value)) {
    throw new Error("Project path must be absolute.");
  }

  const resolved = path.resolve(value);
  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error("Project path must reference an existing directory.");
  }
  return fs.realpathSync(resolved);
}

function validateFeedbackPayload(payload: unknown): RepairFeedbackInput | DiagnosisCorrectionInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Feedback payload must be an object.");
  }
  const candidate = payload as { targetPath?: unknown };
  return {
    ...(payload as RepairFeedbackInput | DiagnosisCorrectionInput),
    targetPath: validateProjectPath(candidate.targetPath),
  };
}

function withActiveProject(projectPath: string, action: () => void): void {
  state.current = "busy";
  state.activeProjects.add(projectPath);
  try {
    action();
  } finally {
    state.activeProjects.delete(projectPath);
    state.current = "ready";
  }
}

function containsTraversalSegment(value: string): boolean {
  return value.split(/[\\/]+/).includes("..");
}

function requestId(): string {
  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function readRuntime(): { port: number; pid: number; lastHeartbeatAt?: string } | null {
  try {
    if (!fs.existsSync(RUNTIME_FILE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8")) as { port: number; pid: number };
  } catch {
    return null;
  }
}

async function isPortReachable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function cleanupStaleRuntimeArtifacts(reason: string): void {
  const runtime = readRuntime();
  const lock = readJsonFile<{ pid?: number; lastHeartbeatAt?: string }>(LOCK_FILE);
  const pid = runtime?.pid ?? lock?.pid;
  const lastHeartbeatAt = runtime?.lastHeartbeatAt ?? lock?.lastHeartbeatAt;
  const pidAlive = typeof pid === "number" ? isPidAlive(pid) : false;
  const heartbeatFresh = isHeartbeatFresh(lastHeartbeatAt);

  if (!runtime && !lock && !fs.existsSync(PID_FILE) && !fs.existsSync(STATE_FILE)) {
    return;
  }

  if (pidAlive && heartbeatFresh) {
    return;
  }

  cleanupRuntime();
  log(`Cleaned stale daemon runtime during ${reason}. pidAlive=${pidAlive} heartbeatFresh=${heartbeatFresh}`);
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

async function findOpenPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const { port } = address;
        server.close(() => resolve(port));
        return;
      }
      server.close();
      reject(new Error("Failed to allocate a daemon port."));
    });
    server.once("error", reject);
  });
}

function log(message: string): void {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  rotateLogsIfNeeded();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line, "utf8");
}

function shutdown(server: http.Server, heartbeatTimer?: NodeJS.Timeout): void {
  state.current = "stopping";
  writeStateSnapshot();
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  cleanupRuntime();
  server.close(() => process.exit(0));
}

function cleanupRuntime(): void {
  for (const target of [RUNTIME_FILE, PID_FILE, LOCK_FILE, STATE_FILE]) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
}

function rotateLogsIfNeeded(): void {
  if (!fs.existsSync(LOG_FILE)) {
    return;
  }

  const size = fs.statSync(LOG_FILE).size;
  if (size < MAX_LOG_BYTES) {
    return;
  }

  for (let index = MAX_LOG_ARCHIVES - 1; index >= 1; index -= 1) {
    const from = `${LOG_FILE}.${index}`;
    const to = `${LOG_FILE}.${index + 1}`;
    if (fs.existsSync(from)) {
      if (index + 1 > MAX_LOG_ARCHIVES) {
        fs.rmSync(from, { force: true });
      } else {
        fs.renameSync(from, to);
      }
    }
  }

  fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
}

void main().catch((error) => {
  log(`Daemon startup failed: ${String(error)}`);
  process.exit(1);
});

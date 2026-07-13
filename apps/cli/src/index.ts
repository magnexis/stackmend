#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import {
  StackMendDaemonClient,
  getStackMendPaths,
  inspectRuntimeHealth,
  readRuntimeInfo,
  repairRuntimeArtifacts,
} from "@stackmend/daemon-client";

const args = process.argv.slice(2);
const command = args[0] ?? "status";
const client = new StackMendDaemonClient({
  clientId: "stackmend-cli",
  clientType: "cli",
  clientVersion: "0.1.0",
});

async function main(): Promise<void> {
  if (command === "daemon") {
    await handleDaemonCommand(args.slice(1));
    return;
  }

  if (command === "analyze") {
    const target = path.resolve(args[1] ?? process.cwd());
    await client.ensureStarted();
    const result = await client.analyze(target);
    printAnalyzeResult(result.summary);
    return;
  }

  if (command === "fractures") {
    const target = path.resolve(args[1] ?? process.cwd());
    const severityFlagIndex = args.findIndex((arg) => arg === "--severity");
    const severity =
      severityFlagIndex >= 0 ? (args[severityFlagIndex + 1] as "critical" | "high" | "medium" | "low" | undefined) : undefined;
    await client.ensureStarted();
    const result = await client.fractures(target, severity);
    printFractureList(result.summary.targetPath, result.summary.fractures);
    return;
  }

  if (command === "status") {
    await client.ensureStarted();
    const status = await client.status();
    console.log("STACKMEND STATUS");
    console.log(`State: ${status.state}`);
    console.log(`Daemon version: ${status.daemonVersion}`);
    console.log(`Protocol version: ${status.protocolVersion}`);
    console.log(`Active projects: ${status.activeProjects}`);
    console.log(`Queued jobs: ${status.queuedJobs}`);
    console.log(`Mode: ${status.mode}`);
    return;
  }

  if (command === "doctor") {
    const shouldFix = args.includes("--fix");
    const doctor = await client.doctor(shouldFix);
    const paths = getStackMendPaths();
    console.log("STACKMEND DOCTOR");
    console.log(`Runtime file present: ${doctor.runtimeFilePresent}`);
    console.log(`Lock file present: ${doctor.lockFilePresent}`);
    console.log(`PID file present: ${doctor.pidFilePresent}`);
    console.log(`State file present: ${doctor.stateFilePresent}`);
    console.log(`Daemon reachable: ${doctor.daemonReachable}`);
    console.log(`PID alive: ${doctor.pidAlive}`);
    console.log(`Heartbeat fresh: ${doctor.heartbeatFresh}`);
    console.log(`Runtime stale: ${doctor.runtimeLooksStale}`);
    console.log(`Runtime repaired: ${doctor.runtimeRepaired}`);
    console.log(`Protocol version: ${doctor.protocolVersion}`);
    console.log(`Runtime path: ${paths.runtimeFile}`);
    return;
  }

  if (command === "config" && args[1] === "paths") {
    const paths = getStackMendPaths();
    console.log(JSON.stringify(paths, null, 2));
    return;
  }

  if (command === "storage") {
    await handleStorageCommand(args.slice(1));
    return;
  }

  console.log(`Unknown command: ${command}`);
  process.exitCode = 1;
}

async function handleDaemonCommand(args: string[]): Promise<void> {
  const subcommand = args[0] ?? "status";

  if (subcommand === "start") {
    await client.ensureStarted();
    const status = await client.status();
    console.log(`stackmend-daemon is ${status.state} on protocol ${status.protocolVersion}.`);
    return;
  }

  if (subcommand === "status") {
    const runtime = readRuntimeInfo();
    if (!runtime) {
      console.log("stackmend-daemon is stopped.");
      return;
    }
    await client.ensureStarted();
    const status = await client.status();
    console.log(`stackmend-daemon is ${status.state}. PID: ${runtime.pid}. Port: ${runtime.port}.`);
    return;
  }

  if (subcommand === "stop") {
    const runtime = readRuntimeInfo();
    if (!runtime) {
      console.log("stackmend-daemon is already stopped.");
      return;
    }
    await client.stop();
    console.log("stackmend-daemon stopped.");
    return;
  }

  if (subcommand === "restart") {
    const runtime = readRuntimeInfo();
    if (runtime) {
      await client.stop();
    }
    await client.ensureStarted();
    const status = await client.status();
    console.log(`stackmend-daemon restarted and is ${status.state}.`);
    return;
  }

  if (subcommand === "logs") {
    const { logDir } = getStackMendPaths();
    const logFile = path.join(logDir, "daemon.log");
    if (!fs.existsSync(logFile)) {
      console.log("No daemon log file found.");
      return;
    }
    console.log(fs.readFileSync(logFile, "utf8"));
    return;
  }

  if (subcommand === "doctor") {
    const shouldFix = args.includes("--fix");
    const doctor = await client.doctor(shouldFix);
    console.log(JSON.stringify(doctor, null, 2));
    return;
  }

  if (subcommand === "clean-runtime") {
    const repaired = repairRuntimeArtifacts();
    const health = inspectRuntimeHealth();
    console.log(
      repaired
        ? "STACKMEND stale runtime artifacts cleaned."
        : "STACKMEND runtime artifacts already healthy.",
    );
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  console.log(`Unknown daemon subcommand: ${subcommand}`);
  process.exitCode = 1;
}

async function handleStorageCommand(args: string[]): Promise<void> {
  const subcommand = args[0] ?? "status";
  const paths = getStackMendPaths();

  if (subcommand === "status") {
    console.log("STACKMEND STORAGE");
    for (const [label, target] of Object.entries(paths)) {
      const size = directorySize(target);
      console.log(`${label}: ${target}${size !== null ? ` (${size} bytes)` : ""}`);
    }
    return;
  }

  if (subcommand === "clean-cache") {
    if (fs.existsSync(paths.cacheDir)) {
      for (const entry of fs.readdirSync(paths.cacheDir)) {
        fs.rmSync(path.join(paths.cacheDir, entry), { recursive: true, force: true });
      }
    }
    console.log("STACKMEND cache cleaned.");
    return;
  }

  console.log(`Unknown storage subcommand: ${subcommand}`);
  process.exitCode = 1;
}

function printAnalyzeResult(summary: {
  targetPath: string;
  fractures: Array<{
    id: string;
    severity: string;
    title: string;
    summary: string;
  }>;
  repairPlan?: { id: string };
  learningDecision?: { recommendedAction: string };
}): void {
  console.log("STACKMEND ANALYZE");
  console.log(`Target: ${summary.targetPath}`);
  console.log(`Fractures found: ${summary.fractures.length}`);
  if (summary.learningDecision) {
    console.log(`Recommended action: ${summary.learningDecision.recommendedAction}`);
  }
  if (summary.repairPlan) {
    console.log(`Repair plan: ${summary.repairPlan.id}`);
  }

  for (const fracture of summary.fractures) {
    console.log(`${fracture.id} [${fracture.severity.toUpperCase()}] ${fracture.title}`);
    console.log(`  ${fracture.summary}`);
  }
}

function printFractureList(
  targetPath: string,
  fractures: Array<{ id: string; severity: string; title: string }>,
): void {
  console.log(`STACKMEND FRACTURES: ${targetPath}`);
  if (fractures.length === 0) {
    console.log("No fractures found.");
    return;
  }
  for (const fracture of fractures) {
    console.log(`${fracture.id} [${fracture.severity.toUpperCase()}] ${fracture.title}`);
  }
}

function directorySize(target: string): number | null {
  if (!fs.existsSync(target)) {
    return null;
  }

  const stats = fs.statSync(target);
  if (stats.isFile()) {
    return stats.size;
  }

  let total = 0;
  for (const entry of fs.readdirSync(target)) {
    total += directorySize(path.join(target, entry)) ?? 0;
  }
  return total;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

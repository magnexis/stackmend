import process from "node:process";

const startedAt = new Date().toISOString();

function main(): void {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    writeJson({
      app: "beacon-daemon",
      state: "ready",
      startedAt,
      missionQueue: 0,
      approvedSources: 0,
      quarantinedSources: 0,
    });
    return;
  }

  if (command === "run-once") {
    writeJson({
      app: "beacon-daemon",
      action: "run-once",
      missionsExecuted: 0,
      result: "no-op scaffold",
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

main();

import process from "node:process";

function main(): void {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    output({
      app: "evolution-daemon",
      state: "ready",
      activeCycle: null,
      queuedRetests: 0,
      promotedTechniques: 0,
    });
    return;
  }

  if (command === "cycle") {
    output({
      app: "evolution-daemon",
      action: "cycle",
      result: "scheduled scaffold cycle",
      stages: ["study", "attempt", "test", "promote"],
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

function output(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();

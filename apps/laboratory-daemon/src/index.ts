import process from "node:process";

function main(): void {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    print({
      app: "laboratory-daemon",
      state: "ready",
      candidateCount: 0,
      activeTrials: 0,
      rollbackQueue: 0,
    });
    return;
  }

  if (command === "trial") {
    print({
      app: "laboratory-daemon",
      action: "trial",
      result: "candidate trial scaffold",
      evaluatedFamilies: [],
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

main();

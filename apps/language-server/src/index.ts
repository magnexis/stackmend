import process from "node:process";

function main(): void {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    respond({
      app: "language-server",
      state: "ready",
      mode: "scaffold",
      transport: "stdio",
      diagnosticsStream: false,
    });
    return;
  }

  if (command === "handshake") {
    respond({
      jsonrpc: "2.0",
      server: "stackmend-language-server",
      capabilities: {
        diagnostics: false,
        codeActions: false,
        semanticTokens: false,
      },
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

function respond(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();

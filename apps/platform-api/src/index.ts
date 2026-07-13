import http from "node:http";
import process from "node:process";

function main(): void {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    writeJson({
      app: "platform-api",
      state: "ready",
      routes: ["/health", "/reports", "/repairs"],
      mode: "scaffold",
    });
    return;
  }

  if (command === "serve") {
    const port = Number.parseInt(process.env.PORT ?? "4318", 10);
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "stackmend-platform-api" }));
    });
    server.listen(port, "127.0.0.1", () => {
      writeJson({ app: "platform-api", state: "listening", port });
    });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

function writeJson(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();

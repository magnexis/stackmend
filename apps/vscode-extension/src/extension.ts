import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";
import { FeedbackRequest, ScanSummary, StackMendDaemonClient } from "./daemonClient";

const client = new StackMendDaemonClient({
  clientId: "stackmend-vscode",
  clientType: "vscode",
  clientVersion: "0.1.0",
});

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("STACKMEND");
  context.subscriptions.push(output);

  context.subscriptions.push(
    vscode.commands.registerCommand("stackmend.startDaemon", async () => {
      await client.ensureStarted();
      const status = await client.status();
      void vscode.window.showInformationMessage(`STACKMEND daemon is ${status.state}.`);
    }),
    vscode.commands.registerCommand("stackmend.stopDaemon", async () => {
      await client.stop();
      void vscode.window.showInformationMessage("STACKMEND daemon stopped.");
    }),
    vscode.commands.registerCommand("stackmend.restartDaemon", async () => {
      try {
        await client.stop();
      } catch {
        // no-op
      }
      await client.ensureStarted();
      const status = await client.status();
      void vscode.window.showInformationMessage(`STACKMEND daemon restarted and is ${status.state}.`);
    }),
    vscode.commands.registerCommand("stackmend.scanProject", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showWarningMessage("STACKMEND needs an open workspace folder.");
        return;
      }

      await client.ensureStarted();
      const result = await client.analyze(folder.uri.fsPath);
      const report = buildMarkdownReport(result.summary);
      const document = await vscode.workspace.openTextDocument({
        content: report,
        language: "markdown",
      });

      output.appendLine(`Analyzed ${folder.uri.fsPath} via daemon.`);
      await vscode.window.showTextDocument(document, { preview: false });
      void vscode.window.showInformationMessage(
        `STACKMEND found ${result.summary.fractures.length} fracture(s).`,
      );
    }),
    vscode.commands.registerCommand("stackmend.generateProjectTruth", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showWarningMessage("STACKMEND needs an open workspace folder.");
        return;
      }

      await client.ensureStarted();
      const result = await client.analyze(folder.uri.fsPath);
      const summary = result.summary;
      const truthPath = path.join(folder.uri.fsPath, ".stackmend", "project-truth.yml");
      fs.mkdirSync(path.dirname(truthPath), { recursive: true });
      fs.writeFileSync(
        truthPath,
        toProjectTruthYaml(summary),
      );

      const doc = await vscode.workspace.openTextDocument(truthPath);
      await vscode.window.showTextDocument(doc, { preview: false });
    }),
    vscode.commands.registerCommand("stackmend.markRepairSuccessful", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showWarningMessage("STACKMEND needs an open workspace folder.");
        return;
      }

      const repairPlanId = await vscode.window.showInputBox({
        prompt: "Repair plan ID to confirm",
        placeHolder: "RP-001",
      });
      if (!repairPlanId) {
        return;
      }

      const summary = await vscode.window.showInputBox({
        prompt: "Short note about why this repair was successful",
        placeHolder: "Tests passed and route contract now matches.",
      });
      if (!summary) {
        return;
      }

      const result = await sendFeedback({
        kind: "repair_feedback",
        payload: {
          targetPath: folder.uri.fsPath,
          repairPlanId,
          action: "confirmed",
          summary,
          verification: { build: "passed", tests: "passed", runtimeProbe: "unknown" },
        },
      });

      void vscode.window.showInformationMessage(
        `STACKMEND recorded repair feedback with interaction gradient ${result.gradient.toFixed(3)}.`,
      );
    }),
    vscode.commands.registerCommand("stackmend.markRepairIncorrect", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showWarningMessage("STACKMEND needs an open workspace folder.");
        return;
      }

      const repairPlanId = await vscode.window.showInputBox({
        prompt: "Repair plan ID to reject",
        placeHolder: "RP-001",
      });
      if (!repairPlanId) {
        return;
      }

      const summary = await vscode.window.showInputBox({
        prompt: "Why was this repair incorrect?",
        placeHolder: "This repository uses cookie sessions, not authorization headers.",
      });
      if (!summary) {
        return;
      }

      const result = await sendFeedback({
        kind: "repair_feedback",
        payload: {
          targetPath: folder.uri.fsPath,
          repairPlanId,
          action: "rejected",
          summary,
          verification: { build: "unknown", tests: "failed", runtimeProbe: "unknown" },
        },
      });

      void vscode.window.showWarningMessage(
        `STACKMEND recorded a rejected repair and demoted it for similar future cases. Gradient ${result.gradient.toFixed(3)}.`,
      );
    }),
    vscode.commands.registerCommand("stackmend.correctDiagnosis", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        void vscode.window.showWarningMessage("STACKMEND needs an open workspace folder.");
        return;
      }

      const previousDiagnosis = await vscode.window.showInputBox({
        prompt: "Diagnosis to correct",
        placeHolder: "Express route classification",
      });
      if (!previousDiagnosis) {
        return;
      }

      const correctedDiagnosis = await vscode.window.showInputBox({
        prompt: "Correct diagnosis",
        placeHolder: "Fastify plugin registration",
      });
      if (!correctedDiagnosis) {
        return;
      }

      const summary = await vscode.window.showInputBox({
        prompt: "Short note about the correction",
        placeHolder: "This file registers nested Fastify routes and should not be parsed as Express.",
      });
      if (!summary) {
        return;
      }

      const result = await sendFeedback({
        kind: "diagnosis_correction",
        payload: {
          targetPath: folder.uri.fsPath,
          previousDiagnosis,
          correctedDiagnosis,
          summary,
          verification: { build: "passed", tests: "unknown", runtimeProbe: "unknown" },
        },
      });

      void vscode.window.showInformationMessage(
        `STACKMEND recorded the diagnosis correction. Gradient ${result.gradient.toFixed(3)}.`,
      );
    }),
  );
}

export function deactivate(): void {}

async function sendFeedback(request: FeedbackRequest) {
  await client.ensureStarted();
  return client.feedback(request);
}

function buildMarkdownReport(summary: ScanSummary): string {
  const lines: string[] = [
    "# STACKMEND Scan",
    "",
    `Target: \`${summary.targetPath}\``,
    `Fractures found: **${summary.fractures.length}**`,
    "",
  ];

  if (summary.fractures.length === 0) {
    lines.push("No fractures found.");
    return lines.join("\n");
  }

  for (const fracture of summary.fractures) {
    lines.push(`## ${fracture.id} - ${fracture.title}`);
    lines.push("");
    lines.push(`- Severity: \`${fracture.severity}\``);
    lines.push(`- Summary: ${fracture.summary}`);
    if (fracture.actual.length > 0) {
      lines.push(`- Actual: ${fracture.actual.join(", ")}`);
    }
    if (fracture.expected.length > 0) {
      lines.push(`- Expected: ${fracture.expected.join(", ")}`);
    }
    if (fracture.evidence.length > 0) {
      lines.push(`- Evidence: ${fracture.evidence.map((item) => item.file).join(", ")}`);
    }
    if (fracture.repairOptions[0]) {
      lines.push(`- Repair: ${fracture.repairOptions[0].summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function scoreSummary(summary: ScanSummary): number {
  return Math.max(0, 100 - summary.fractures.length * 12);
}

function toProjectTruthYaml(summary: ScanSummary): string {
  const evidence = summary.fractures.flatMap((fracture) =>
    fracture.evidence.map((entry) => entry.file),
  );
  const lines = [
    `generatedAt: ${new Date().toISOString()}`,
    `completionIntegrityScore: ${scoreSummary(summary)}`,
    "features:",
    "  environment_configuration:",
    `    status: ${summary.fractures.length === 0 ? "working" : "broken"}`,
    `    fractureCount: ${summary.fractures.length}`,
    "    evidence:",
  ];

  if (evidence.length === 0) {
    lines.push("      []");
  } else {
    for (const file of evidence) {
      lines.push(`      - ${quoteYaml(file)}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}

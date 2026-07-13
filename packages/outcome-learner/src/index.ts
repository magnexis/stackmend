import fs from "node:fs";
import path from "node:path";
import {
  DiagnosisCorrectionInput,
  RepairFeedbackInput,
  RepairOutcomeRecord,
  ScanSummary,
} from "@stackmend/shared";

export function createRepairOutcome(summary: ScanSummary): RepairOutcomeRecord | undefined {
  if (!summary.repairPlan || !summary.learningDecision) {
    return undefined;
  }

  return {
    id: `outcome:${summary.repairPlan.id}`,
    repairPlanId: summary.repairPlan.id,
    targetPath: summary.targetPath,
    fractureIds: summary.fractures.map((fracture) => fracture.id),
    recommendedAction: summary.learningDecision.recommendedAction,
    stage: "proposed",
    result: "pending",
    summary: summary.repairPlan.summary,
    timestamp: new Date().toISOString(),
  };
}

export function persistRepairOutcome(
  targetPath: string,
  outcome: RepairOutcomeRecord | undefined,
): void {
  if (!outcome) {
    return;
  }

  const learningDir = path.join(targetPath, ".stackmend", "learning");
  const memoryDir = path.join(targetPath, ".stackmend", "memory");
  fs.mkdirSync(learningDir, { recursive: true });
  fs.mkdirSync(memoryDir, { recursive: true });

  const line = `${JSON.stringify(outcome)}\n`;
  fs.appendFileSync(path.join(learningDir, "repair-outcomes.jsonl"), line, "utf8");
  fs.appendFileSync(path.join(memoryDir, "repair-outcomes.db"), line, "utf8");
}

export function createFeedbackRepairOutcome(
  input: RepairFeedbackInput | DiagnosisCorrectionInput,
): RepairOutcomeRecord {
  const isRepairFeedback = "repairPlanId" in input;

  return {
    id: `outcome:${Date.now()}`,
    repairPlanId: isRepairFeedback ? input.repairPlanId : "diagnosis-correction",
    targetPath: input.targetPath,
    fractureIds: [],
    recommendedAction: "defer_for_review",
    stage: isRepairFeedback
      ? mapFeedbackStage(input.action)
      : "modified",
    result: isRepairFeedback ? mapFeedbackResult(input.action) : "successful",
    summary: input.summary,
    timestamp: new Date().toISOString(),
  };
}

function mapFeedbackStage(action: RepairFeedbackInput["action"]): RepairOutcomeRecord["stage"] {
  if (action === "accepted") {
    return "accepted";
  }
  if (action === "modified") {
    return "modified";
  }
  if (action === "confirmed") {
    return "confirmed";
  }
  return "reverted";
}

function mapFeedbackResult(action: RepairFeedbackInput["action"]): RepairOutcomeRecord["result"] {
  if (action === "rejected") {
    return "rejected";
  }
  if (action === "confirmed" || action === "accepted" || action === "modified") {
    return "successful";
  }
  return "pending";
}

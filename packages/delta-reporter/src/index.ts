import fs from "node:fs";
import path from "node:path";
import {
  DiagnosisCorrectionInput,
  IntelligenceDeltaRecord,
  InteractionLearningRecord,
  RepairFeedbackInput,
  ScanSummary,
} from "@stackmend/shared";

export function createIntelligenceDelta(
  summary: ScanSummary,
  interactionRecord: InteractionLearningRecord,
): IntelligenceDeltaRecord {
  const confirmedClaims = summary.claimTrials?.filter((trial) => trial.status === "confirmed").length ?? 0;
  const unsupportedClaims = summary.claimTrials?.filter((trial) => trial.status === "unsupported").length ?? 0;
  const gradient =
    confirmedClaims * 0.02 +
    (summary.memoryPatterns?.length ?? 0) * 0.005 +
    (summary.repairOutcome ? 0.01 : 0) -
    unsupportedClaims * 0.01;

  return {
    id: `DELTA-${Date.now()}`,
    interactionId: interactionRecord.id,
    summary: "Interaction produced reusable learning signals and updated scoped repository intelligence.",
    interactionGradient: Number(gradient.toFixed(3)),
    improvements: [
      `${summary.knowledgeClaims?.length ?? 0} knowledge claims evaluated`,
      `${confirmedClaims} claims confirmed`,
      `${summary.sourceTrustRecords?.length ?? 0} source trust records available for future retrieval`,
    ],
    reinforced: [
      `${summary.memoryPatterns?.length ?? 0} memory patterns reinforced`,
      `${summary.learningDecision ? 1 : 0} learning decisions recorded`,
    ],
    quarantined:
      summary.claimTrials
        ?.filter((trial) => trial.status === "unsupported")
        .map((trial) => trial.claimId) ?? [],
    readyForNextUse: unsupportedClaims === 0,
  };
}

export function persistIntelligenceDelta(targetPath: string, delta: IntelligenceDeltaRecord): void {
  const deltaDir = path.join(targetPath, ".stackmend", "interaction", "deltas");
  fs.mkdirSync(deltaDir, { recursive: true });
  fs.appendFileSync(
    path.join(deltaDir, "intelligence-deltas.jsonl"),
    `${JSON.stringify(delta)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(deltaDir, "last-intelligence-delta.json"),
    `${JSON.stringify(delta, null, 2)}\n`,
    "utf8",
  );
}

export function createFeedbackIntelligenceDelta(
  interactionRecord: InteractionLearningRecord,
  input: RepairFeedbackInput | DiagnosisCorrectionInput,
): IntelligenceDeltaRecord {
  const isRejected = "action" in input && input.action === "rejected";
  const isModified =
    ("action" in input && input.action === "modified") || !("action" in input);
  const gradient = isRejected ? 0.026 : isModified ? 0.041 : 0.033;

  return {
    id: `DELTA-${Date.now()}`,
    interactionId: interactionRecord.id,
    summary: "Feedback interaction updated future repair behavior and scoped repository intelligence.",
    interactionGradient: gradient,
    improvements: interactionRecord.learned,
    reinforced: interactionRecord.intelligenceChanges,
    quarantined: [],
    readyForNextUse: true,
  };
}

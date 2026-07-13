import fs from "node:fs";
import path from "node:path";
import {
  DiagnosisCorrectionInput,
  InteractionLearningRecord,
  InteractionOutcomeRecord,
  InteractionPredictionRecord,
  RepairFeedbackInput,
  ScanSummary,
} from "@stackmend/shared";

export function createInteractionLearningRecord(
  summary: ScanSummary,
  prediction: InteractionPredictionRecord,
  outcome: InteractionOutcomeRecord,
): InteractionLearningRecord {
  return {
    id: `IX-${Date.now()}`,
    type: summary.repairPlan ? "repository_scan" : "repair_confirmed",
    targetPath: summary.targetPath,
    repositoryFamily: inferRepositoryFamily(summary),
    subsystem: inferSubsystem(summary),
    defectFamilies: [...new Set(summary.fractures.map((fracture) => fracture.category))],
    prediction,
    outcome,
    learned: [
      `${summary.knowledgeClaims?.length ?? 0} knowledge claims reviewed`,
      `${summary.claimTrials?.filter((trial) => trial.status === "confirmed").length ?? 0} claim trials confirmed`,
      `${summary.sourceTrustRecords?.length ?? 0} source trust records available`,
    ],
    intelligenceChanges: [
      `${summary.memoryPatterns?.length ?? 0} memory patterns active`,
      `${summary.repairOutcome ? 1 : 0} repair outcomes captured`,
      `${summary.fractures.length} fractures shaped the current interaction`,
    ],
    verificationChecks: buildVerificationChecks(summary, outcome),
    timestamp: new Date().toISOString(),
  };
}

export function persistInteractionLearningRecord(
  targetPath: string,
  record: InteractionLearningRecord,
): void {
  const interactionDir = path.join(targetPath, ".stackmend", "interaction");
  fs.mkdirSync(interactionDir, { recursive: true });
  fs.appendFileSync(path.join(interactionDir, "interactions.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  fs.writeFileSync(
    path.join(interactionDir, "last-interaction.json"),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );

  if (record.type === "repair_rejected" || record.type === "repair_modified_by_user") {
    fs.appendFileSync(
      path.join(interactionDir, "corrections.jsonl"),
      `${JSON.stringify(record)}\n`,
      "utf8",
    );
  }
}

export function createRepairFeedbackInteractionRecord(
  input: RepairFeedbackInput,
): InteractionLearningRecord {
  const actionToType: Record<RepairFeedbackInput["action"], InteractionLearningRecord["type"]> = {
    accepted: "repair_proposed",
    rejected: "repair_rejected",
    modified: "repair_modified_by_user",
    confirmed: "repair_confirmed",
  };

  return {
    id: `IX-${Date.now()}`,
    type: actionToType[input.action],
    targetPath: input.targetPath,
    repositoryFamily: "interactive-feedback",
    subsystem: input.subsystem ?? "repair",
    defectFamilies: ["repair_feedback"],
    prediction: {
      repairStrategy: input.repairPlanId,
      confidence: input.action === "rejected" ? 0.2 : input.action === "modified" ? 0.65 : 0.9,
      expectedOutcome: input.summary,
    },
    outcome: {
      action: mapFeedbackAction(input.action),
      build: input.verification?.build ?? "unknown",
      tests: input.verification?.tests ?? "unknown",
      runtimeProbe: input.verification?.runtimeProbe ?? "unknown",
      summary: input.summary,
    },
    learned: buildFeedbackLearnedList(input),
    intelligenceChanges: buildFeedbackIntelligenceChanges(input),
    verificationChecks: buildFeedbackVerificationChecks(input),
    timestamp: new Date().toISOString(),
  };
}

export function createDiagnosisCorrectionInteractionRecord(
  input: DiagnosisCorrectionInput,
): InteractionLearningRecord {
  return {
    id: `IX-${Date.now()}`,
    type: "repair_modified_by_user",
    targetPath: input.targetPath,
    repositoryFamily: "interactive-feedback",
    subsystem: input.subsystem ?? "diagnosis",
    defectFamilies: ["diagnosis_correction"],
    prediction: {
      repairStrategy: input.previousDiagnosis,
      confidence: 0.18,
      expectedOutcome: `Previous diagnosis ${input.previousDiagnosis} should be replaced by corrected diagnosis ${input.correctedDiagnosis}.`,
    },
    outcome: {
      action: "modified",
      build: input.verification?.build ?? "unknown",
      tests: input.verification?.tests ?? "unknown",
      runtimeProbe: input.verification?.runtimeProbe ?? "unknown",
      summary: input.summary,
    },
    learned: [
      `Corrected diagnosis: ${input.correctedDiagnosis}`,
      `Previous diagnosis rejected: ${input.previousDiagnosis}`,
    ],
    intelligenceChanges: [
      "1 diagnosis correction captured",
      "1 repeated-mistake prevention candidate created",
    ],
    verificationChecks: buildCorrectionVerificationChecks(input),
    timestamp: new Date().toISOString(),
  };
}

function inferRepositoryFamily(summary: ScanSummary): string {
  const fileEntities = summary.knowledgeModel?.entities.filter((entity) => entity.kind === "file") ?? [];
  const hasTsx = fileEntities.some((entity) => String(entity.label).endsWith(".tsx"));
  const hasTs = fileEntities.some((entity) => String(entity.label).endsWith(".ts"));
  if (hasTsx) {
    return "typescript-react";
  }
  if (hasTs) {
    return "typescript-node";
  }
  return "unknown";
}

function inferSubsystem(summary: ScanSummary): string {
  if (summary.fractures.some((fracture) => fracture.category === "route")) {
    return "integration";
  }
  if (summary.fractures.some((fracture) => fracture.category === "environment")) {
    return "configuration";
  }
  return "repository";
}

function buildVerificationChecks(
  summary: ScanSummary,
  outcome: InteractionOutcomeRecord,
): string[] {
  const checks = [`build:${outcome.build}`, `tests:${outcome.tests}`, `runtime:${outcome.runtimeProbe}`];
  if (summary.claimTrials?.length) {
    checks.push(`claim_trials:${summary.claimTrials.length}`);
  }
  if (summary.repairPlan) {
    checks.push(`repair_plan:${summary.repairPlan.id}`);
  }
  return checks;
}

function mapFeedbackAction(action: RepairFeedbackInput["action"]): InteractionOutcomeRecord["action"] {
  if (action === "rejected") {
    return "rejected";
  }
  if (action === "modified") {
    return "modified";
  }
  return "confirmed";
}

function buildFeedbackLearnedList(input: RepairFeedbackInput): string[] {
  if (input.action === "rejected") {
    return [`Rejected repair plan ${input.repairPlanId}`, "Search exclusion candidate recorded"];
  }
  if (input.action === "modified") {
    return [
      `Repair plan ${input.repairPlanId} was modified`,
      input.finalStrategy ? `Preferred final strategy: ${input.finalStrategy}` : "Repository preferred an alternative implementation",
    ];
  }
  return [`Repair plan ${input.repairPlanId} reinforced`, "Repository accepted the current repair direction"];
}

function buildFeedbackIntelligenceChanges(input: RepairFeedbackInput): string[] {
  if (input.action === "rejected") {
    return ["1 negative repair memory recorded", "1 future repair confidence demotion candidate created"];
  }
  if (input.action === "modified") {
    return ["1 repository-specific repair preference recorded", "1 correction-weighted feedback event stored"];
  }
  return ["1 repair confidence reinforcement recorded", "1 successful interaction outcome stored"];
}

function buildFeedbackVerificationChecks(input: RepairFeedbackInput): string[] {
  return [
    `build:${input.verification?.build ?? "unknown"}`,
    `tests:${input.verification?.tests ?? "unknown"}`,
    `runtime:${input.verification?.runtimeProbe ?? "unknown"}`,
    `repair_plan:${input.repairPlanId}`,
  ];
}

function buildCorrectionVerificationChecks(input: DiagnosisCorrectionInput): string[] {
  return [
    `build:${input.verification?.build ?? "unknown"}`,
    `tests:${input.verification?.tests ?? "unknown"}`,
    `runtime:${input.verification?.runtimeProbe ?? "unknown"}`,
    `corrected_diagnosis:${input.correctedDiagnosis}`,
  ];
}

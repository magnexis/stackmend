import { InteractionPredictionRecord, ScanSummary } from "@stackmend/shared";

export function createInteractionPrediction(summary: ScanSummary): InteractionPredictionRecord {
  const repairStrategy =
    summary.repairPlan?.steps[0]?.action ??
    summary.learningDecision?.recommendedAction ??
    "observe-repository";
  const topScore = summary.learningDecision?.rankedActions[0]?.score ?? 0.5;
  const fracturePenalty = Math.min(summary.fractures.length, 10) * 0.01;

  return {
    repairStrategy,
    confidence: Number(Math.max(0.45, Math.min(0.99, 0.5 + topScore / 2 - fracturePenalty)).toFixed(2)),
    expectedOutcome:
      summary.fractures.length === 0
        ? "Repository scan should reinforce current repository knowledge without requiring a repair."
        : "Repository scan should produce actionable fracture analysis and a reusable repair direction.",
  };
}

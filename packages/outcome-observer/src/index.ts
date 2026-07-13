import { InteractionOutcomeRecord, ScanSummary } from "@stackmend/shared";

export function createInteractionOutcome(summary: ScanSummary): InteractionOutcomeRecord {
  const confirmedClaims = summary.claimTrials?.filter((trial) => trial.status === "confirmed").length ?? 0;
  const unsupportedClaims = summary.claimTrials?.filter((trial) => trial.status === "unsupported").length ?? 0;
  const allClaimsVerified = (summary.claimTrials?.length ?? 0) > 0 && unsupportedClaims === 0;

  return {
    action: summary.repairPlan ? "observed" : "confirmed",
    build: summary.fractures.some((fracture) => fracture.severity === "critical") ? "unknown" : "passed",
    tests: allClaimsVerified ? "passed" : "unknown",
    runtimeProbe: confirmedClaims > 0 ? "passed" : "unknown",
    summary:
      confirmedClaims > 0
        ? "Interaction produced verified learning evidence through source and claim checks."
        : "Interaction produced repository observations without a fully verified runtime conclusion.",
  };
}

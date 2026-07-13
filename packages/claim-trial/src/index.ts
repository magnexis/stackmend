import {
  ClaimTrialRecord,
  KnowledgeClaimRecord,
  RepositoryKnowledgeModel,
  SourceTrustRecord,
} from "@stackmend/shared";

export interface ClaimTrialContext {
  targetPath: string;
  knowledgeModel: RepositoryKnowledgeModel;
  sourceTrustRecords: SourceTrustRecord[];
  claims: KnowledgeClaimRecord[];
}

export function runClaimTrials(context: ClaimTrialContext): ClaimTrialRecord[] {
  const sources = new Map(context.sourceTrustRecords.map((record) => [record.id, record] as const));

  return context.claims.map((claim) => {
    const source = sources.get(claim.sourceId);
    const checks = buildChecks(claim, context.knowledgeModel, source);
    const supportedChecks = checks.filter((check) => check.startsWith("pass:")).length;
    const totalChecks = checks.length;
    const confidence = totalChecks === 0 ? 0.4 : supportedChecks / totalChecks;
    const status =
      confidence >= 0.99 ? "confirmed" : confidence >= 0.5 ? "partial" : "unsupported";

    return {
      id: `trial:${claim.id}`,
      claimId: claim.id,
      sourceId: claim.sourceId,
      status,
      confidence,
      summary: `${claim.title} trial completed with ${supportedChecks}/${totalChecks} supporting checks.`,
      checks,
    };
  });
}

function buildChecks(
  claim: KnowledgeClaimRecord,
  knowledgeModel: RepositoryKnowledgeModel,
  source: SourceTrustRecord | undefined,
): string[] {
  const checks: string[] = [];
  checks.push(source?.status === "approved" ? "pass:source-approved" : "fail:source-approved");

  if (claim.scope === "api_contracts") {
    checks.push(
      hasEntityKind(knowledgeModel, "route_contract")
        ? "pass:route-contract-entities"
        : "fail:route-contract-entities",
    );
    checks.push(
      hasEntityKind(knowledgeModel, "http_request")
        ? "pass:http-requests-present"
        : "fail:http-requests-present",
    );
    checks.push(
      hasEntityKind(knowledgeModel, "route") ? "pass:routes-present" : "fail:routes-present",
    );
    return checks;
  }

  if (claim.scope === "integration_surfaces") {
    checks.push(
      hasEntityKind(knowledgeModel, "http_request")
        ? "pass:frontend-surface-detected"
        : "fail:frontend-surface-detected",
    );
    checks.push(
      hasEntityKind(knowledgeModel, "route")
        ? "pass:backend-surface-detected"
        : "fail:backend-surface-detected",
    );
    return checks;
  }

  if (claim.scope === "configuration") {
    checks.push(
      hasEntityKind(knowledgeModel, "environment_variable")
        ? "pass:environment-entities-present"
        : "fail:environment-entities-present",
    );
    checks.push(
      hasEntityKind(knowledgeModel, "fracture")
        ? "pass:configuration-fracture-evidence"
        : "fail:configuration-fracture-evidence",
    );
    return checks;
  }

  checks.push("fail:unsupported-claim-scope");
  return checks;
}

function hasEntityKind(knowledgeModel: RepositoryKnowledgeModel, kind: string): boolean {
  return knowledgeModel.entities.some((entity) => entity.kind === kind);
}

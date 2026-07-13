import fs from "node:fs";
import path from "node:path";
import {
  ClaimTrialRecord,
  Fracture,
  KnowledgeClaimRecord,
  RepositoryKnowledgeModel,
  SourceTrustRecord,
} from "@stackmend/shared";

export interface TrustScopeContext {
  targetPath: string;
  knowledgeModel: RepositoryKnowledgeModel;
  fractures: Fracture[];
  sourceTrustRecords: SourceTrustRecord[];
}

export function buildKnowledgeClaims(context: TrustScopeContext): KnowledgeClaimRecord[] {
  const claims: KnowledgeClaimRecord[] = [];
  const sourceByPath = new Map(
    context.sourceTrustRecords.map((record) => [record.sourcePath, record] as const),
  );
  const routeContractCount = countEntities(context.knowledgeModel, "route_contract");
  const requestCount = countEntities(context.knowledgeModel, "http_request");
  const routeCount = countEntities(context.knowledgeModel, "route");
  const envCount = countEntities(context.knowledgeModel, "environment_variable");

  const configSource = sourceByPath.get(".stackmend/config.yaml");
  if (configSource && routeContractCount > 0) {
    claims.push({
      id: "claim:route-contract-intelligence",
      title: "Repository models explicit route contracts",
      summary:
        "Requests, routes, and route contracts are tracked as distinct repository entities for API integrity analysis.",
      scope: "api_contracts",
      sourceId: configSource.id,
      confidence: 0.86,
      versionScope: "0.1.x",
      evidence: summarizeEvidence(context.fractures, "route"),
      tags: ["routes", "contracts", "repository-intelligence"],
    });
  }

  const packageSource = sourceByPath.get("package.json");
  if (packageSource && requestCount > 0 && routeCount > 0) {
    claims.push({
      id: "claim:end-to-end-http-surfaces",
      title: "Repository contains connected HTTP request and route surfaces",
      summary:
        "The repository exposes both frontend request points and backend route handlers, making contract verification meaningful.",
      scope: "integration_surfaces",
      sourceId: packageSource.id,
      confidence: 0.82,
      versionScope: "workspace-current",
      evidence: summarizeEvidence(context.fractures, "route"),
      tags: ["http", "requests", "routes"],
    });
  }

  const readmeSource = sourceByPath.get("README.md");
  if (readmeSource && envCount > 0) {
    claims.push({
      id: "claim:environment-governance",
      title: "Repository depends on coordinated environment governance",
      summary:
        "Environment variables are part of the repository's operational contract and require synchronization across code and configuration.",
      scope: "configuration",
      sourceId: readmeSource.id,
      confidence: 0.79,
      versionScope: "workspace-current",
      evidence: summarizeEvidence(context.fractures, "environment"),
      tags: ["environment", "configuration", "governance"],
    });
  }

  return claims;
}

export function persistKnowledgeClaims(
  targetPath: string,
  claims: KnowledgeClaimRecord[],
  claimTrials: ClaimTrialRecord[],
): void {
  const sourcesDir = path.join(targetPath, ".stackmend", "sources");
  const learningDir = path.join(targetPath, ".stackmend", "learning");
  fs.mkdirSync(sourcesDir, { recursive: true });
  fs.mkdirSync(learningDir, { recursive: true });

  fs.writeFileSync(
    path.join(sourcesDir, "knowledge-claims.json"),
    `${JSON.stringify(claims, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(sourcesDir, "claim-trials.json"),
    `${JSON.stringify(claimTrials, null, 2)}\n`,
    "utf8",
  );

  for (const claim of claims) {
    fs.appendFileSync(path.join(learningDir, "verified-claims.jsonl"), `${JSON.stringify(claim)}\n`, "utf8");
  }
}

function countEntities(knowledgeModel: RepositoryKnowledgeModel, kind: string): number {
  return knowledgeModel.entities.filter((entity) => entity.kind === kind).length;
}

function summarizeEvidence(fractures: Fracture[], category: Fracture["category"]) {
  return fractures
    .filter((fracture) => fracture.category === category)
    .flatMap((fracture) => fracture.evidence)
    .slice(0, 6);
}

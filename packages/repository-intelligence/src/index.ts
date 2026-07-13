import {
  Fracture,
  RepositoryEntity,
  RepositoryEdge,
  RepositoryKnowledgeModel,
  RepositorySignal,
} from "@stackmend/shared";

export function buildRepositoryKnowledgeModel(
  targetPath: string,
  fractures: Fracture[],
): RepositoryKnowledgeModel {
  const repositoryId = "repo:current";
  const entities: RepositoryEntity[] = [
    {
      id: repositoryId,
      kind: "repository",
      label: targetPath,
    },
  ];
  const edges: RepositoryEdge[] = [];
  const fileIds = new Map<string, string>();
  const envVarIds = new Map<string, string>();

  for (const fracture of fractures) {
    const fractureId = `fracture:${fracture.id}`;
    entities.push({
      id: fractureId,
      kind: "fracture",
      label: fracture.title,
      metadata: {
        category: fracture.category,
        severity: fracture.severity,
      },
    });
    edges.push({
      from: repositoryId,
      to: fractureId,
      relation: "BROKEN_BY",
    });

    const variables = collectEnvironmentVariables(fracture);
    for (const variable of variables) {
      const envId = ensureEnvironmentVariable(entities, envVarIds, variable);
      edges.push({
        from: fractureId,
        to: envId,
        relation: "EVIDENCES",
      });
    }

    for (const evidence of fracture.evidence) {
      const fileId = ensureFileEntity(entities, fileIds, evidence.file);
      edges.push({
        from: repositoryId,
        to: fileId,
        relation: "CONTAINS",
      });
      edges.push({
        from: fileId,
        to: fractureId,
        relation: "EVIDENCES",
      });
    }
  }

  return {
    repositoryId,
    targetPath,
    entities,
    edges,
  };
}

export function deriveRepositorySignals(
  knowledgeModel: RepositoryKnowledgeModel,
  fractures: Fracture[],
): RepositorySignal {
  const criticalCount = fractures.filter((fracture) => fracture.severity === "critical").length;
  const highSeverityCount = fractures.filter((fracture) => fracture.severity === "high").length;
  const environmentVariableCount = knowledgeModel.entities.filter(
    (entity) => entity.kind === "environment_variable",
  ).length;
  const routeCount = knowledgeModel.entities.filter((entity) => entity.kind === "route").length;
  const requestCount = knowledgeModel.entities.filter(
    (entity) => entity.kind === "http_request",
  ).length;
  const routeContractCount = knowledgeModel.entities.filter(
    (entity) => entity.kind === "route_contract",
  ).length;
  const evidenceCount = fractures.reduce((total, fracture) => total + fracture.evidence.length, 0);

  return {
    fractureCount: fractures.length,
    criticalCount,
    highSeverityCount,
    environmentVariableCount,
    routeCount,
    requestCount,
    routeContractCount,
    evidenceCount,
  };
}

function collectEnvironmentVariables(fracture: Fracture): string[] {
  const results = new Set<string>();
  const textParts = [...fracture.expected, ...fracture.actual, fracture.title, fracture.summary];

  for (const text of textParts) {
    for (const match of text.matchAll(/\b[A-Z][A-Z0-9_]+\b/g)) {
      results.add(match[0]);
    }
  }

  for (const evidence of fracture.evidence) {
    if (evidence.excerpt?.match(/^[A-Z][A-Z0-9_]+$/)) {
      results.add(evidence.excerpt);
    }
  }

  return [...results];
}

function ensureFileEntity(
  entities: RepositoryEntity[],
  fileIds: Map<string, string>,
  file: string,
): string {
  const existing = fileIds.get(file);
  if (existing) {
    return existing;
  }

  const id = `file:${file}`;
  entities.push({
    id,
    kind: "file",
    label: file,
  });
  fileIds.set(file, id);
  return id;
}

function ensureEnvironmentVariable(
  entities: RepositoryEntity[],
  envVarIds: Map<string, string>,
  variable: string,
): string {
  const existing = envVarIds.get(variable);
  if (existing) {
    return existing;
  }

  const id = `env:${variable}`;
  entities.push({
    id,
    kind: "environment_variable",
    label: variable,
  });
  envVarIds.set(variable, id);
  return id;
}

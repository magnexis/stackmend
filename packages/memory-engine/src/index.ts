import fs from "node:fs";
import path from "node:path";
import {
  Fracture,
  KnowledgeClaimRecord,
  MemoryPatternRecord,
  RepositoryConventionRecord,
  RepositoryKnowledgeModel,
} from "@stackmend/shared";

export interface MemoryEngineContext {
  targetPath: string;
  fractures: Fracture[];
  knowledgeModel: RepositoryKnowledgeModel;
  knowledgeClaims?: KnowledgeClaimRecord[];
}

export function buildMemoryPatterns(context: MemoryEngineContext): MemoryPatternRecord[] {
  const patterns: MemoryPatternRecord[] = [];

  for (const fracture of context.fractures) {
    patterns.push({
      id: `pattern:${fracture.id}`,
      scope: "repository",
      category: fracture.category === "route" ? "diagnostic" : "repair",
      title: fracture.title,
      summary: fracture.summary,
      confidence: fracture.severity === "high" ? 0.84 : 0.68,
      evidenceCount: fracture.evidence.length,
      source: "fracture-engine",
      tags: [fracture.category, fracture.severity],
    });
  }

  for (const claim of context.knowledgeClaims ?? []) {
    patterns.push({
      id: `pattern:${claim.id}`,
      scope: "repository",
      category: claim.scope === "configuration" ? "architecture" : "verification",
      title: claim.title,
      summary: claim.summary,
      confidence: claim.confidence,
      evidenceCount: claim.evidence.length,
      source: claim.sourceId,
      tags: claim.tags,
    });
  }

  return patterns;
}

export function buildRepositoryConventions(
  context: MemoryEngineContext,
): RepositoryConventionRecord[] {
  const conventions: RepositoryConventionRecord[] = [];
  const hasRouteContracts = context.knowledgeModel.entities.some(
    (entity) => entity.kind === "route_contract",
  );

  if (hasRouteContracts) {
    conventions.push({
      id: "convention:route-contracts",
      title: "Repository uses explicit route contracts",
      summary:
        "HTTP requests, backend routes, and route contracts are modeled as distinct repository entities.",
      confidence: 0.78,
      source: "repository-intelligence",
    });
  }

  if (context.fractures.some((fracture) => fracture.category === "environment")) {
    conventions.push({
      id: "convention:env-governance",
      title: "Repository requires environment configuration alignment",
      summary:
        "Environment variables should stay synchronized across code, examples, and deployment configuration.",
      confidence: 0.81,
      source: "environment-analyzer",
    });
  }

  if ((context.knowledgeClaims ?? []).some((claim) => claim.scope === "api_contracts")) {
    conventions.push({
      id: "convention:beacon-verified-api-contracts",
      title: "Repository exposes Beacon-verifiable API contract knowledge",
      summary:
        "Approved local sources and route-contract entities are sufficient to generate verified API integrity claims.",
      confidence: 0.83,
      source: "trust-scope-engine",
    });
  }

  return conventions;
}

export function persistRepositoryMemory(
  targetPath: string,
  patterns: MemoryPatternRecord[],
  conventions: RepositoryConventionRecord[],
): void {
  const memoryDir = path.join(targetPath, ".stackmend", "memory");
  fs.mkdirSync(memoryDir, { recursive: true });

  writeYamlArray(
    path.join(memoryDir, "accepted-patterns.yaml"),
    "patterns",
    patterns.map((pattern) => ({
      id: pattern.id,
      scope: pattern.scope,
      category: pattern.category,
      title: pattern.title,
      summary: pattern.summary,
      confidence: pattern.confidence,
      source: pattern.source,
      tags: pattern.tags,
    })),
  );

  writeYamlArray(
    path.join(memoryDir, "conventions.yaml"),
    "conventions",
    conventions.map((convention) => ({
      id: convention.id,
      title: convention.title,
      summary: convention.summary,
      confidence: convention.confidence,
      source: convention.source,
    })),
  );
}

export function persistInteractionMemoryNotes(
  targetPath: string,
  acceptedNotes: string[],
  rejectedNotes: string[],
): void {
  const memoryDir = path.join(targetPath, ".stackmend", "memory");
  fs.mkdirSync(memoryDir, { recursive: true });

  if (acceptedNotes.length > 0) {
    writeYamlArray(
      path.join(memoryDir, "interaction-patterns.yaml"),
      "patterns",
      acceptedNotes.map((summary, index) => ({
        id: `interaction-pattern-${index + 1}`,
        summary,
      })),
    );
  }

  if (rejectedNotes.length > 0) {
    writeYamlArray(
      path.join(memoryDir, "rejected-patterns.yaml"),
      "patterns",
      rejectedNotes.map((summary, index) => ({
        id: `rejected-pattern-${index + 1}`,
        summary,
      })),
    );
  }
}

function writeYamlArray(filePath: string, key: string, items: Array<Record<string, unknown>>): void {
  const lines: string[] = [`${key}:`];
  if (items.length === 0) {
    lines.push("  []");
  } else {
    for (const item of items) {
      lines.push("  -");
      for (const [entryKey, value] of Object.entries(item)) {
        if (Array.isArray(value)) {
          lines.push(`    ${entryKey}:`);
          for (const part of value) {
            lines.push(`      - ${escapeYamlScalar(String(part))}`);
          }
        } else {
          lines.push(`    ${entryKey}: ${escapeYamlScalar(String(value))}`);
        }
      }
    }
  }

  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function escapeYamlScalar(value: string): string {
  const escaped = value.replace(/"/g, '\\"');
  return `"${escaped}"`;
}

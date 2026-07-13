import fs from "node:fs";
import path from "node:path";
import {
  Fracture,
  RepositoryKnowledgeModel,
  SourceTrustRecord,
} from "@stackmend/shared";

export interface ComplianceContext {
  targetPath: string;
  knowledgeModel: RepositoryKnowledgeModel;
  fractures: Fracture[];
}

const LOCAL_SOURCE_SPECS = [
  { file: "README.md", sourceType: "repository_readme", tags: ["documentation"] },
  { file: "package.json", sourceType: "package_manifest", tags: ["package", "build"] },
  { file: "tsconfig.base.json", sourceType: "typescript_config", tags: ["typescript", "compiler"] },
  { file: ".stackmend/config.yaml", sourceType: "stackmend_config", tags: ["stackmend", "policy"] },
] as const;

export function buildSourceTrustRecords(context: ComplianceContext): SourceTrustRecord[] {
  const records: SourceTrustRecord[] = [];

  for (const spec of LOCAL_SOURCE_SPECS) {
    const absolutePath = path.join(context.targetPath, spec.file);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const stats = fs.statSync(absolutePath);
    const evidenceCount = inferEvidenceCount(spec.file, context.knowledgeModel, context.fractures);
    records.push({
      id: `source:${spec.file.replace(/[\\/.:]/g, "-")}`,
      sourcePath: spec.file,
      sourceType: spec.sourceType,
      publisher: "local_repository",
      tier: "canonical",
      status: "approved",
      trustScore: 0.99,
      authorityScore: spec.file === ".stackmend/config.yaml" ? 0.97 : 0.94,
      freshnessScore: scoreFreshness(stats.mtimeMs),
      canonical: true,
      automatedAccessAllowed: true,
      trainingUseAllowed: true,
      attributionRequired: false,
      evidenceCount,
      tags: [...spec.tags, "local-first", "inspectable"],
    });
  }

  return records;
}

export function persistSourceTrustRecords(
  targetPath: string,
  sourceTrustRecords: SourceTrustRecord[],
): void {
  const sourcesDir = path.join(targetPath, ".stackmend", "sources");
  const trustDir = path.join(sourcesDir, "trust");
  fs.mkdirSync(trustDir, { recursive: true });

  for (const record of sourceTrustRecords) {
    fs.writeFileSync(
      path.join(trustDir, `${sanitizeRecordId(record.id)}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
      "utf8",
    );
  }

  fs.writeFileSync(
    path.join(sourcesDir, "sources-index.json"),
    `${JSON.stringify(sourceTrustRecords, null, 2)}\n`,
    "utf8",
  );
}

function inferEvidenceCount(
  file: string,
  knowledgeModel: RepositoryKnowledgeModel,
  fractures: Fracture[],
): number {
  if (file === "README.md") {
    return fractures.length;
  }

  if (file === "package.json") {
    return knowledgeModel.entities.filter(
      (entity) => entity.kind === "route" || entity.kind === "http_request",
    ).length;
  }

  if (file === "tsconfig.base.json") {
    return knowledgeModel.entities.filter((entity) => entity.kind === "file").length;
  }

  return knowledgeModel.entities.length;
}

function scoreFreshness(lastModifiedMs: number): number {
  const ageInDays = (Date.now() - lastModifiedMs) / (1000 * 60 * 60 * 24);
  if (ageInDays <= 7) {
    return 0.99;
  }
  if (ageInDays <= 30) {
    return 0.95;
  }
  if (ageInDays <= 90) {
    return 0.88;
  }
  return 0.74;
}

function sanitizeRecordId(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-");
}

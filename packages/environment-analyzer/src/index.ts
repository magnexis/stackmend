import fs from "node:fs";
import path from "node:path";
import { Fracture, ScanSummary } from "@stackmend/shared";

const CODE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml)$/i;
const ENV_REFERENCE_PATTERN =
  /\b(?:process\.env|import\.meta\.env|env)\.([A-Z][A-Z0-9_]+)\b/g;
const ENV_DECLARATION_PATTERN = /^\s*([A-Z][A-Z0-9_]+)\s*=/;

export function scanEnvironment(targetPath: string): ScanSummary {
  const files = collectFiles(targetPath);
  const declaredVars = new Map<string, string[]>();
  const referencedVars = new Map<string, string[]>();

  for (const file of files) {
    const content = safeRead(file);
    if (!content) {
      continue;
    }

    const relativeFile = path.relative(targetPath, file);

    if (isEnvFile(file)) {
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(ENV_DECLARATION_PATTERN);
        if (match) {
          pushMapValue(declaredVars, match[1], relativeFile);
        }
      }
    }

    if (CODE_FILE_PATTERN.test(file)) {
      for (const match of content.matchAll(ENV_REFERENCE_PATTERN)) {
        pushMapValue(referencedVars, match[1], relativeFile);
      }
    }
  }

  const fractures = buildFractures(declaredVars, referencedVars);
  return { targetPath, fractures };
}

function buildFractures(
  declaredVars: Map<string, string[]>,
  referencedVars: Map<string, string[]>,
): Fracture[] {
  const fractures: Fracture[] = [];
  let counter = 1;

  for (const [variable, references] of referencedVars) {
    if (!declaredVars.has(variable)) {
      fractures.push({
        id: `SM-ENV-${String(counter++).padStart(3, "0")}`,
        title: `Missing environment variable declaration for ${variable}`,
        category: "environment",
        severity: "high",
        summary: `${variable} is referenced in code or documentation but not declared in an environment file.`,
        expected: [`Declare ${variable} in .env or .env.example`],
        actual: [`Referenced in ${references.length} file(s)`],
        evidence: references.map((file) => ({ file })),
        repairOptions: [
          {
            summary: `Add ${variable} to .env.example and align runtime configuration`,
            actions: [
              `Create a canonical declaration for ${variable}`,
              "Update validation and deployment configuration if needed"
            ]
          }
        ]
      });
    }
  }

  const normalizedGroups = new Map<string, string[]>();
  for (const variable of new Set([...declaredVars.keys(), ...referencedVars.keys()])) {
    const normalized = normalizeVariable(variable);
    pushMapValue(normalizedGroups, normalized, variable);
  }

  for (const [, variants] of normalizedGroups) {
    const uniqueVariants = [...new Set(variants)];
    if (uniqueVariants.length > 1) {
      fractures.push({
        id: `SM-ENV-${String(counter++).padStart(3, "0")}`,
        title: `Inconsistent environment naming: ${uniqueVariants.join(", ")}`,
        category: "environment",
        severity: "medium",
        summary: "Multiple environment variable names appear to represent the same concept.",
        expected: ["Use one canonical variable name across code, docs, and deployment"],
        actual: uniqueVariants,
        evidence: uniqueVariants.flatMap((variant) => [
          ...(declaredVars.get(variant) ?? []).map((file) => ({ file, excerpt: variant })),
          ...(referencedVars.get(variant) ?? []).map((file) => ({ file, excerpt: variant }))
        ]),
        repairOptions: [
          {
            summary: `Normalize to a single variable such as ${pickCanonical(uniqueVariants)}`,
            actions: [
              "Choose a canonical variable name",
              "Update code references",
              "Update docs and deployment settings"
            ]
          }
        ]
      });
    }
  }

  return fractures;
}

function normalizeVariable(name: string): string {
  return name
    .replace(/^(NEXT_PUBLIC_|VITE_)/, "")
    .replace(/(URI|URL|CONNECTION_STRING)$/, "URL");
}

function pickCanonical(variants: string[]): string {
  return [...variants].sort((left, right) => left.length - right.length)[0];
}

function isEnvFile(file: string): boolean {
  const base = path.basename(file);
  return base.startsWith(".env");
}

function collectFiles(root: string): string[] {
  const results: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        continue;
      }

      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(nextPath);
      } else {
        results.push(nextPath);
      }
    }
  }

  return results;
}

function safeRead(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function pushMapValue(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key);
  if (existing) {
    if (!existing.includes(value)) {
      existing.push(value);
    }
    return;
  }

  map.set(key, [value]);
}

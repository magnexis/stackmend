import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(extensionRoot, "..", "..");
const vendoredNodeModules = path.join(extensionRoot, "node_modules");
const vendoredScopeRoot = path.join(vendoredNodeModules, "@stackmend");

const internalPackageSources = [
  path.join(repoRoot, "packages"),
  path.join(repoRoot, "apps", "daemon"),
];

prepare();

function prepare() {
  fs.mkdirSync(vendoredScopeRoot, { recursive: true });

  for (const sourceRoot of internalPackageSources) {
    if (!fs.existsSync(sourceRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const sourceDir = path.join(sourceRoot, entry.name);
      const packageJsonPath = path.join(sourceDir, "package.json");
      const distDir = path.join(sourceDir, "dist");
      if (!fs.existsSync(packageJsonPath) || !fs.existsSync(distDir)) {
        continue;
      }

      const manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (typeof manifest.name !== "string" || !manifest.name.startsWith("@stackmend/")) {
        continue;
      }

      const targetDir = path.join(vendoredScopeRoot, manifest.name.replace("@stackmend/", ""));
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.mkdirSync(targetDir, { recursive: true });
      fs.cpSync(distDir, path.join(targetDir, "dist"), { recursive: true });
      fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify(manifest, null, 2));
    }
  }

  copyExternalDependency("yaml");
}

function copyExternalDependency(name) {
  const sourceDir = path.join(repoRoot, "node_modules", name);
  const targetDir = path.join(vendoredNodeModules, name);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Required dependency '${name}' was not found at ${sourceDir}.`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

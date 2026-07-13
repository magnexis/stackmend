import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(extensionRoot, "..", "..");
const manifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, "package.json"), "utf8"));
const version = manifest.version;
const outputDir = path.join(repoRoot, "artifacts", "vsix");
const outputFile = path.join(outputDir, `stackmend-${version}.vsix`);

packageVsix();

function packageVsix() {
  fs.mkdirSync(outputDir, { recursive: true });
  cleanupLocalArtifacts();

  execFileSync(process.execPath, [path.join(scriptDir, "prepare-vsix.mjs")], {
    cwd: extensionRoot,
    stdio: "inherit",
  });

  if (process.platform === "win32") {
    execSync(
      `npx @vscode/vsce package --no-dependencies --allow-missing-repository --out "${outputFile}"`,
      {
        cwd: extensionRoot,
        stdio: "inherit",
      },
    );
  } else {
    execFileSync(
      "npx",
      [
        "@vscode/vsce",
        "package",
        "--no-dependencies",
        "--allow-missing-repository",
        "--out",
        outputFile,
      ],
      {
        cwd: extensionRoot,
        stdio: "inherit",
      },
    );
  }

  cleanupLocalArtifacts();
}

function cleanupLocalArtifacts() {
  const vendoredNodeModules = path.join(extensionRoot, "node_modules");
  if (fs.existsSync(vendoredNodeModules)) {
    fs.rmSync(vendoredNodeModules, { recursive: true, force: true });
  }

  for (const entry of fs.readdirSync(extensionRoot)) {
    if (entry.startsWith("stackmend-") && entry.endsWith(".vsix")) {
      fs.rmSync(path.join(extensionRoot, entry), { force: true });
    }
  }
}

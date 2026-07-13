import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const rootManifest = readJson(path.join(repoRoot, "package.json"));
const extensionManifest = readJson(path.join(repoRoot, "apps", "vscode-extension", "package.json"));

const releaseVersion = rootManifest.version;
const extensionVersion = extensionManifest.version;
const artifactRoot = path.join(repoRoot, "artifacts");
const releaseRoot = path.join(repoRoot, "release", `v${releaseVersion}`);
const stagingRoot = path.join(releaseRoot, "staging");

prepareRelease();

function prepareRelease() {
  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });

  const releaseAssets = [];
  const vsixSource = path.join(
    artifactRoot,
    "vsix",
    `stackmend-${extensionVersion}.vsix`,
  );
  if (!fs.existsSync(vsixSource)) {
    throw new Error(`Expected VSIX not found at ${vsixSource}`);
  }

  const vsixTarget = path.join(releaseRoot, path.basename(vsixSource));
  fs.copyFileSync(vsixSource, vsixTarget);
  releaseAssets.push({
    name: path.basename(vsixTarget),
    type: "vsix",
    target: "vscode",
    requirements: ["VS Code 1.90+", "Workspace trust for repair workflows"],
  });

  const cliBundleDir = path.join(stagingRoot, `stackmend-cli-v${releaseVersion}-windows-x64`);
  prepareCliBundle(cliBundleDir);
  releaseAssets.push({
    name: `${path.basename(cliBundleDir)}.zip`,
    type: "zip",
    target: "cli",
    requirements: ["Windows", "Node.js 20+"],
  });

  const desktopBundleDir = path.join(stagingRoot, `stackmend-desktop-v${releaseVersion}-windows-x64`);
  prepareDesktopBundle(desktopBundleDir);
  releaseAssets.push({
    name: `${path.basename(desktopBundleDir)}.zip`,
    type: "zip",
    target: "desktop",
    requirements: ["Windows", "Node.js 20+"],
  });

  const servicesBundleDir = path.join(stagingRoot, `stackmend-services-v${releaseVersion}-windows-x64`);
  prepareServicesBundle(servicesBundleDir);
  releaseAssets.push({
    name: `${path.basename(servicesBundleDir)}.zip`,
    type: "zip",
    target: "services",
    requirements: ["Windows", "Node.js 20+"],
  });

  fs.writeFileSync(
    path.join(releaseRoot, "release-manifest.json"),
    JSON.stringify(
      {
        product: "STACKMEND",
        version: releaseVersion,
        generatedAt: new Date().toISOString(),
        assets: releaseAssets,
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(releaseRoot, "RELEASE_NOTES.md"),
    [
      `# STACKMEND v${releaseVersion}`,
      "",
      "## Release Assets",
      "",
      `- \`stackmend-${extensionVersion}.vsix\`: VS Code extension package.`,
      `- \`stackmend-cli-v${releaseVersion}-windows-x64.zip\`: portable CLI + daemon bundle for users who do not use VS Code.`,
      `- \`stackmend-desktop-v${releaseVersion}-windows-x64.zip\`: desktop shell + daemon bundle for users who want a standalone GUI entry point.`,
      `- \`stackmend-services-v${releaseVersion}-windows-x64.zip\`: service workspace bundle for Beacon, evolution, laboratory, language server, and platform API runtimes.`,
      "",
      "## Notes",
      "",
      "- CLI, desktop, and services bundles currently target Windows and require Node.js 20+.",
      "- The desktop bundle is a first shell focused on daemon health and future repository controls.",
      "- The services bundle exposes the newly-realized app workspaces outside the source tree.",
      "- All bundles include the MIT license.",
      "",
      "## Checks",
      "",
      "- VSIX rebuilt from current extension manifest",
      "- CLI, desktop, and services bundles built from current repository sources",
      "- GitHub release manifest generated",
      "",
    ].join("\n"),
  );
}

function prepareCliBundle(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(path.join(repoRoot, "apps", "cli", "dist"), path.join(targetDir, "apps", "cli", "dist"));
  copyDir(path.join(repoRoot, "apps", "daemon", "dist"), path.join(targetDir, "apps", "daemon", "dist"));
  vendorInternalPackages(targetDir);

  fs.copyFileSync(path.join(repoRoot, "LICENSE"), path.join(targetDir, "LICENSE"));
  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    [
      "# StackMend CLI Bundle",
      "",
      "Portable Windows bundle for using StackMend without VS Code.",
      "",
      "## Requirements",
      "",
      "- Node.js 20+",
      "",
      "## Usage",
      "",
      "Run `stackmend.cmd` from this folder, or call:",
      "",
      "```powershell",
      "node apps/cli/dist/apps/cli/src/index.js status",
      "```",
      "",
      "The CLI will start the bundled daemon automatically when needed.",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(targetDir, "stackmend.cmd"),
    [
      "@echo off",
      "setlocal",
      "cd /d %~dp0",
      "node apps\\cli\\dist\\apps\\cli\\src\\index.js %*",
      "",
    ].join("\r\n"),
  );
}

function prepareDesktopBundle(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(path.join(repoRoot, "apps", "desktop", "dist"), path.join(targetDir, "apps", "desktop", "dist"));
  copyDir(path.join(repoRoot, "apps", "daemon", "dist"), path.join(targetDir, "apps", "daemon", "dist"));
  vendorInternalPackages(targetDir);
  copyExternalDependency(targetDir, "electron");

  fs.copyFileSync(path.join(repoRoot, "LICENSE"), path.join(targetDir, "LICENSE"));
  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(
      {
        name: "stackmend-desktop-bundle",
        version: releaseVersion,
        private: true,
        type: "module",
        main: "apps/desktop/dist/apps/desktop/src/main.js",
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    [
      "# StackMend Desktop Bundle",
      "",
      "Standalone desktop shell bundle for StackMend users who do not work inside VS Code.",
      "",
      "## Requirements",
      "",
      "- Node.js 20+",
      "- Windows",
      "",
      "## Usage",
      "",
      "Run `stackmend-desktop.cmd` from this folder.",
      "",
      "The desktop shell talks to the same bundled daemon runtime used by the CLI.",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(targetDir, "stackmend-desktop.cmd"),
    [
      "@echo off",
      "setlocal",
      "cd /d %~dp0",
      "\"node_modules\\electron\\dist\\electron.exe\" .",
      "",
    ].join("\r\n"),
  );
}

function prepareServicesBundle(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const services = [
    "beacon-daemon",
    "evolution-daemon",
    "laboratory-daemon",
    "language-server",
    "platform-api",
  ];

  for (const service of services) {
    const serviceRoot = path.join(repoRoot, "apps", service);
    copyDir(path.join(serviceRoot, "dist"), path.join(targetDir, "apps", service, "dist"));
    fs.copyFileSync(path.join(serviceRoot, "package.json"), path.join(targetDir, "apps", service, "package.json"));
    fs.copyFileSync(path.join(serviceRoot, "README.md"), path.join(targetDir, "apps", service, "README.md"));
  }

  fs.copyFileSync(path.join(repoRoot, "LICENSE"), path.join(targetDir, "LICENSE"));
  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    [
      "# StackMend Services Bundle",
      "",
      "Portable service bundle for StackMend app workspaces outside VS Code.",
      "",
      "## Included apps",
      "",
      "- beacon-daemon",
      "- evolution-daemon",
      "- laboratory-daemon",
      "- language-server",
      "- platform-api",
      "",
      "## Requirements",
      "",
      "- Node.js 20+",
      "- Windows",
      "",
      "Each app exposes a build output and a minimal runtime scaffold suitable for process supervision and future orchestration.",
      "",
    ].join("\n"),
  );
}

function vendorInternalPackages(targetDir) {
  const nodeModulesScopeRoot = path.join(targetDir, "node_modules", "@stackmend");
  fs.mkdirSync(nodeModulesScopeRoot, { recursive: true });

  for (const sourceRoot of [path.join(repoRoot, "packages"), path.join(repoRoot, "apps", "daemon")]) {
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

      const manifest = readJson(packageJsonPath);
      if (typeof manifest.name !== "string" || !manifest.name.startsWith("@stackmend/")) {
        continue;
      }

      const packageName = manifest.name.replace("@stackmend/", "");
      const targetPackageDir = path.join(nodeModulesScopeRoot, packageName);
      fs.rmSync(targetPackageDir, { recursive: true, force: true });
      fs.mkdirSync(targetPackageDir, { recursive: true });
      copyDir(distDir, path.join(targetPackageDir, "dist"));
      fs.writeFileSync(path.join(targetPackageDir, "package.json"), JSON.stringify(manifest, null, 2));
    }
  }
}

function copyExternalDependency(targetDir, packageName) {
  const sourceDir = path.join(repoRoot, "node_modules", packageName);
  const targetPackageDir = path.join(targetDir, "node_modules", packageName);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing external dependency '${packageName}' at ${sourceDir}`);
  }

  copyDir(sourceDir, targetPackageDir);
}

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

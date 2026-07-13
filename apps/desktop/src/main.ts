import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";
import { StackMendDaemonClient } from "@stackmend/daemon-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new StackMendDaemonClient({
  clientId: "stackmend-desktop",
  clientType: "desktop",
  clientVersion: "0.1.0",
});

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#08141E",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  await window.loadFile(path.join(__dirname, "renderer.html"));
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("stackmend:daemon-status", async () => {
  await client.ensureStarted();
  return client.status();
});

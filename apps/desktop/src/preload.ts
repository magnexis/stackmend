import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("stackmendDesktop", {
  getDaemonStatus: () => ipcRenderer.invoke("stackmend:daemon-status"),
});

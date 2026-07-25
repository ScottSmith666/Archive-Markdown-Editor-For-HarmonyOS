"use strict";
const electron = require("electron");
const api = {
  "docLoaderPreload": {
    docLoader: (fileName) => electron.ipcRenderer.invoke("doc-loader", fileName)
  },
  "openURLPreload": {
    openURL: (url) => electron.ipcRenderer.send("open-url", url)
  },
  "loadLangPreload": {
    loadLang: () => electron.ipcRenderer.invoke("get-system-lang")
  },
  "sqliteDataManPreload": {
    getRecentOpenedHistory: () => electron.ipcRenderer.invoke("get-recent-opened-history"),
    setRecentOpenedHistory: (fileName, filePath, openTime) => electron.ipcRenderer.invoke("set-recent-opened-history", fileName, filePath, openTime),
    deleteRecentOpenedHistory: (hsId) => electron.ipcRenderer.invoke("delete-recent-opened-history", hsId)
  },
  "clipboardPreload": {
    mediaPaster: () => electron.ipcRenderer.invoke("media-paster")
  },
  "fileManPreload": {
    activateOpenFileDialog: (title, content) => electron.ipcRenderer.invoke("activate-open-file-dialog", title, content),
    loadFileContent: (filePath, content) => electron.ipcRenderer.invoke("load-file-content", filePath, content),
    loadEncryptedMdzFileContent: (filePath, password) => electron.ipcRenderer.invoke("load-encrypted-mdz-content", filePath, password),
    cleanMdzFolder: (cleanPath) => electron.ipcRenderer.invoke("clean-mdz-folder", cleanPath),
    saveFileInMdz: (title, filePathOrURL) => electron.ipcRenderer.send("save-file-in-mdz", title, filePathOrURL),
    getSavePath: (title, btLabel) => electron.ipcRenderer.invoke("activate-save-file-dialog", title, btLabel),
    makeMdzDirectory: (purePath, pureFileName) => electron.ipcRenderer.invoke("make-mdz-directory", purePath, pureFileName),
    makeMdMediaDirectory: (purePath, pureFileName) => electron.ipcRenderer.invoke("make-md-media-directory", purePath, pureFileName),
    copyMdzMediaFiles: (filePathArray) => electron.ipcRenderer.invoke("copy-mdz-media-files", filePathArray),
    defaultOpenFile: (callback) => electron.ipcRenderer.on("default-open-file", (event, value) => callback(value)),
    saveFileContent: (purePath, pureFileName, content, ext) => electron.ipcRenderer.invoke("save-file-content", purePath, pureFileName, content, ext),
    compressToMdz: (purePath, pureFileName, password) => electron.ipcRenderer.invoke("compress-to-mdz", purePath, pureFileName, password),
    getMdzMediaList: (mediaHomePath) => electron.ipcRenderer.invoke("get-media-list-in-mdz", mediaHomePath),
    getFileBuffer: (filePath, isXlsx = false) => electron.ipcRenderer.invoke("get-file-buffer", filePath, isXlsx),
    getFileAsText: (filePath) => electron.ipcRenderer.invoke("get-file-as-txt", filePath),
    deleteMediaInMdz: (mediaPath) => electron.ipcRenderer.invoke("delete-media-in-mdz", mediaPath),
    importMediaIntoMdz: (title, destinationPath) => electron.ipcRenderer.invoke("import-media-into-mdz", title, destinationPath)
  },
  "confirmPreload": {
    onAskForClose: (callback) => electron.ipcRenderer.on("ask-for-close", callback),
    confirmClose: (canClose, mdzPaths) => electron.ipcRenderer.send("confirm-close", canClose, mdzPaths),
    tryClose: () => electron.ipcRenderer.send("try-close")
  },
  "permissionsPreload": {
    getPermissions: (callback) => electron.ipcRenderer.invoke("get-rw-permission"),
    getOS: () => electron.ipcRenderer.invoke("get-os")
  },
  "windowManPreload": {
    getWindowWhAndPos: () => electron.ipcRenderer.invoke("get-window-wh-and-pos"),
    setWindowWhAndPos: (whXyArray) => electron.ipcRenderer.send("set-window-wh-and-pos", whXyArray)
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("docLoaderPreload", api.docLoaderPreload);
    electron.contextBridge.exposeInMainWorld("openURLPreload", api.openURLPreload);
    electron.contextBridge.exposeInMainWorld("sqliteDataManPreload", api.sqliteDataManPreload);
    electron.contextBridge.exposeInMainWorld("fileManPreload", api.fileManPreload);
    electron.contextBridge.exposeInMainWorld("confirmPreload", api.confirmPreload);
    electron.contextBridge.exposeInMainWorld("loadLangPreload", api.loadLangPreload);
    electron.contextBridge.exposeInMainWorld("clipboardPreload", api.clipboardPreload);
    electron.contextBridge.exposeInMainWorld("permissionsPreload", api.permissionsPreload);
    electron.contextBridge.exposeInMainWorld("windowManPreload", api.windowManPreload);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}

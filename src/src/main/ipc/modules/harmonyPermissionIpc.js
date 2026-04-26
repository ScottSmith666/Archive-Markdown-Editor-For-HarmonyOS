import {ipcMain, systemPreferences, app} from "electron";

export const harmonyPermissionIpc = () => {
    ipcMain.handle("get-rw-permission", async (event) => {
        // 申请用户文档、下载和桌面的读写权限
        const documentsPath = app.getPath('documents');
        const downloadsPath = app.getPath('downloads');
        const desktopPath = app.getPath('desktop');
        await systemPreferences.requestDirectoryPermission(documentsPath);
        await systemPreferences.requestDirectoryPermission(downloadsPath);
        await systemPreferences.requestDirectoryPermission(desktopPath);
    });
};

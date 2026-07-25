"use strict";
const electron = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const promises = require("fs/promises");
class Dialogs {
  constructor() {
  }
  confirm(windowObject, type, buttonList, defaultButtonIndex, title, content, cancelButtonIndex) {
    return 1 === electron.dialog.showMessageBoxSync(windowObject, {
      type,
      buttons: buttonList,
      defaultId: defaultButtonIndex,
      title,
      detail: content,
      cancelId: cancelButtonIndex
    });
  }
  openFileDialog(title, isMedia = false) {
    let extFilters = isMedia ? [] : [
      { name: "Archive Markdown File", extensions: ["mdz"] },
      { name: "Markdown File", extensions: ["md"] },
      { name: "Text File", extensions: ["txt"] }
    ];
    return electron.dialog.showOpenDialogSync({
      /**
       * 打开文件
       */
      title,
      properties: ["openFile"],
      defaultPath: os.homedir(),
      message: title,
      filters: extFilters
    });
  }
  saveFileDialog(title = "保存文件", btLabel = "确定") {
    return electron.dialog.showOpenDialogSync({
      /**
       * 另存为文件
       */
      title,
      defaultPath: os.homedir(),
      properties: ["openDirectory"],
      // 设置为只能选择文件夹
      buttonLabel: btLabel,
      message: title
    });
  }
  saveMediaDialog(title = "保存文件", defPath = os.homedir()) {
    return electron.dialog.showSaveDialogSync({
      /**
       * 另存为文件
       */
      title,
      defaultPath: defPath,
      buttonLabel: "保存",
      message: title
    });
  }
}
class SqliteMan {
  // 私有属性
  #Sqlite3;
  #dbPath;
  #windowW;
  #windowH;
  #windowX;
  #windowY;
  constructor(Sqlite32, dbPath) {
    this.#Sqlite3 = Sqlite32;
    this.#dbPath = dbPath;
    this.#windowW = 1600;
    this.#windowH = 1e3;
    this.#windowX = 0;
    this.#windowY = 0;
  }
  // 私有方法
  #historiesTable(needType = true) {
    return {
      "AME_OPEN_HISTORIES": [
        // 打开文件历史记录相关的表
        `hsId${needType ? " TEXT" : ""}`,
        `fileName${needType ? " TEXT" : ""}`,
        `filePath${needType ? " TEXT" : ""}`,
        `openTime${needType ? " INT" : ""}`
      ],
      "AME_WINDOW_HW_POS": [
        // 窗口属性相关的表
        `w${needType ? " INTEGER" : ""}`,
        `h${needType ? " INTEGER" : ""}`,
        `x${needType ? " INTEGER" : ""}`,
        `y${needType ? " INTEGER" : ""}`
      ]
    };
  }
  // 公有方法
  init() {
    let hsTable = Object.keys(this.#historiesTable())[0];
    let cols = `(${this.#historiesTable()[hsTable].join(", ")})`;
    let connection = new this.#Sqlite3(this.#dbPath);
    connection.prepare(`CREATE TABLE IF NOT EXISTS ${hsTable} ${cols};`).run();
    let wdTable = Object.keys(this.#historiesTable())[1];
    let wdCols = `(${this.#historiesTable()[wdTable].join(", ")})`;
    let wdColsWithoutType = `(${this.#historiesTable(false)[wdTable].join(", ")})`;
    connection.prepare(`CREATE TABLE IF NOT EXISTS ${wdTable} ${wdCols};`).run();
    connection.prepare(
      `INSERT INTO ${wdTable} ${wdColsWithoutType} SELECT ${this.#windowW}, ${this.#windowH}, ${this.#windowX}, ${this.#windowY} WHERE NOT EXISTS (SELECT 1 FROM ${wdTable});`
    ).run();
    connection.close();
  }
  getAllHistories() {
    let hsTable = Object.keys(this.#historiesTable())[0];
    let connection = new this.#Sqlite3(this.#dbPath);
    let res = connection.prepare(`SELECT *
                                         FROM ${hsTable};`).all();
    connection.close();
    return res;
  }
  setHistory(hsId, fileName, filePath, openTime) {
    let hsTableObject = this.#historiesTable(false);
    let hsTable = Object.keys(hsTableObject)[0];
    let cols = `(${hsTableObject[hsTable].join(", ")})`;
    let values = `('${hsId}', '${fileName}', '${filePath}', '${openTime}')`;
    let connection = new this.#Sqlite3(this.#dbPath);
    const stmt = connection.prepare(`SELECT filePath FROM ${hsTable} WHERE filePath = '${filePath}' LIMIT 1;`);
    const exists = !!stmt.get();
    if (exists) {
      connection.prepare(`UPDATE ${hsTable} SET hsId = '${hsId}', openTime = '${openTime}' WHERE filePath = '${filePath}';`).run();
    } else {
      connection.prepare(`INSERT INTO ${hsTable} ${cols} VALUES ${values};`).run();
    }
    connection.close();
  }
  deleteHistory(hsId) {
    let hsTableObject = this.#historiesTable(false);
    let hsTable = Object.keys(hsTableObject)[0];
    let col = hsTableObject[hsTable][0];
    let connection = new this.#Sqlite3(this.#dbPath);
    connection.prepare(`DELETE FROM ${hsTable} WHERE ${col} = '${hsId}';`).run();
    connection.close();
  }
  deleteAllHistories() {
    let hsTableObject = this.#historiesTable(false);
    let hsTable = Object.keys(hsTableObject)[0];
    let connection = new this.#Sqlite3(this.#dbPath);
    connection.prepare(`DELETE FROM ${hsTable};`).run();
    connection.close();
  }
  getLastExitWhAndPos() {
    let connection = new this.#Sqlite3(this.#dbPath);
    let wdTable = Object.keys(this.#historiesTable())[1];
    let res = connection.prepare(`SELECT *
                                         FROM ${wdTable};`).all();
    connection.close();
    return res;
  }
  setLastExitWhAndPos(whXyArray) {
    let connection = new this.#Sqlite3(this.#dbPath);
    let wdTable = Object.keys(this.#historiesTable())[1];
    let wdColsWithoutType = this.#historiesTable(false)[wdTable];
    let assign = "";
    for (let i = 0; i < whXyArray.length; i++) {
      assign = assign + `${wdColsWithoutType[i]} = ${whXyArray[i]},`;
    }
    connection.prepare(`UPDATE ${wdTable} SET ${assign.substring(0, assign.length - 1)};`).run();
    connection.close();
  }
}
const sqliteIpc = (Sqlite32, dbPath) => {
  const sqliteMan = new SqliteMan(Sqlite32, dbPath);
  electron.ipcMain.handle("get-recent-opened-history", (event) => {
    return sqliteMan.getAllHistories();
  });
  electron.ipcMain.handle("set-recent-opened-history", (event, fileName, filePath, openTime) => {
    let hsId = crypto.randomUUID();
    sqliteMan.setHistory(hsId, fileName, filePath, openTime);
    return { "success": true, "message": "写入成功" };
  });
  electron.ipcMain.handle("delete-recent-opened-history", (event, hsId) => {
    if (hsId === "ALL") {
      sqliteMan.deleteAllHistories();
    } else {
      sqliteMan.deleteHistory(hsId);
    }
    return { "success": true, "message": "删除成功" };
  });
};
const harmonyPermissionIpc = () => {
  electron.ipcMain.handle("get-rw-permission", async (event) => {
    if (process.platform === "openharmony") {
      const documentsPath = electron.app.getPath("documents");
      const downloadsPath = electron.app.getPath("downloads");
      const desktopPath = electron.app.getPath("desktop");
      await electron.systemPreferences.requestSystemPermission("pasteboard");
      await electron.systemPreferences.requestDirectoryPermission(documentsPath);
      await electron.systemPreferences.requestDirectoryPermission(downloadsPath);
      await electron.systemPreferences.requestDirectoryPermission(desktopPath);
    }
  });
  electron.ipcMain.handle("get-os", (event) => process.platform);
};
const util = require("util");
const exec = util.promisify(require("child_process").exec);
let mdzUtils;
let docRootPath;
let XLSX;
if (!electron.app.isPackaged) {
  mdzUtils = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}napi_cpp${path.sep}mdz_utils`)) : require(path.join(__dirname, "..", "..", "libs", "napi_cpp", "mdz_utils"));
  docRootPath = path.join(__dirname, "..", "..", "document");
  XLSX = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}node_modules${path.sep}xlsx`)) : require("xlsx");
} else {
  const unpackedRoot = path.join(process.resourcesPath, "app.asar.unpacked");
  mdzUtils = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}napi_cpp${path.sep}mdz_utils`)) : require(path.join(unpackedRoot, "libs", "napi_cpp", "mdz_utils"));
  XLSX = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}node_modules${path.sep}xlsx`)) : require(path.join(unpackedRoot, "node_modules", "xlsx"));
  docRootPath = process.platform === "openharmony" ? path.join(__dirname, "..", "..", "document") : path.join(unpackedRoot, `document`);
}
const dialogs = new Dialogs();
const setOpenedFileHistory = (sqliteMan, fileName, filePath, openTime) => {
  let uuid = crypto.randomUUID();
  sqliteMan.setHistory(uuid, fileName, filePath, openTime);
};
const getNow = () => {
  const now = /* @__PURE__ */ new Date();
  return now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
    // 使用24小时制
  }).replace(/\//g, "-");
};
const stox = (wb) => {
  let out = [];
  wb.SheetNames.forEach(function(name) {
    let o = { name, rows: {} };
    let ws = wb.Sheets[name];
    if (!ws || !ws["!ref"]) return;
    let range = XLSX.utils.decode_range(ws["!ref"]);
    range.s = { r: 0, c: 0 };
    let aoa = XLSX.utils.sheet_to_json(ws, {
      raw: false,
      header: 1,
      range
    });
    aoa.forEach(function(r, i) {
      let cells = {};
      r.forEach(function(c, j) {
        cells[j] = { text: c || String(c) };
        let cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        if (ws[cellRef] != null && ws[cellRef].f != null) {
          cells[j].text = "=" + ws[cellRef].f;
        }
      });
      o.rows[i] = { cells };
    });
    o.rows.len = aoa.length;
    o.merges = [];
    (ws["!merges"] || []).forEach(function(merge, i) {
      if (o.rows[merge.s.r] == null) {
        o.rows[merge.s.r] = { cells: {} };
      }
      if (o.rows[merge.s.r].cells[merge.s.c] == null) {
        o.rows[merge.s.r].cells[merge.s.c] = {};
      }
      o.rows[merge.s.r].cells[merge.s.c].merge = [
        merge.e.r - merge.s.r,
        merge.e.c - merge.s.c
      ];
      o.merges[i] = XLSX.utils.encode_range(merge);
    });
    out.push(o);
  });
  return out;
};
const copyOnHarmony = async (src, dest) => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);
    readStream.on("error", (err) => {
      resolve({ success: false, message: `读取失败: ${err.message}` });
    });
    writeStream.on("error", (err) => {
      resolve({ success: false, message: `写入失败: ${err.message}` });
    });
    writeStream.on("finish", () => {
      resolve({
        success: true,
        message: "写入成功"
      });
    });
    readStream.pipe(writeStream);
  });
};
const ipc = (Sqlite32, dbPath) => {
  const sqliteMan = new SqliteMan(Sqlite32, dbPath);
  sqliteMan.init();
  electron.ipcMain.handle("activate-open-file-dialog", (event, title, content) => {
    let filePath = dialogs.openFileDialog(title);
    if (!filePath) {
      return { "success": false, "message": content };
    }
    return {
      "success": true,
      "filePath": filePath[0].replaceAll("\\", "/"),
      "fileName": filePath[0].replaceAll("\\", "/").split("/").pop()
    };
  });
  electron.ipcMain.handle("activate-save-file-dialog", (event, title, btLabel) => {
    let filePath = dialogs.saveFileDialog(title, btLabel);
    if (!filePath) {
      return { "success": false };
    }
    return { "success": true, "savePath": filePath[0].replaceAll("\\", "/") };
  });
  electron.ipcMain.handle("load-encrypted-mdz-content", async (event, filePath, password) => {
    let filePathArray = filePath.split("/");
    let fileName = filePathArray.pop();
    let fileNameArray = fileName.split(".");
    fileNameArray.pop();
    let pureFileName = fileNameArray.join(".");
    let realFilePathInMdz = path.join(filePathArray.join(path.sep), `._mdz_content.${pureFileName}`, "mdz_contents", `${pureFileName}.md`);
    let realDirPathInMdz = path.join(filePathArray.join(path.sep), `._mdz_content.${pureFileName}`);
    try {
      await mdzUtils.genOrDecompressMdz(filePath, filePathArray.join(path.sep), "decompress", "", password);
      if (process.platform === "win32") {
        await exec(`attrib +h "${realDirPathInMdz}"`);
      }
      let fileContent = await fs.promises.readFile(realFilePathInMdz, "utf8");
      setOpenedFileHistory(sqliteMan, fileName, filePath, getNow());
      return { success: true, content: fileContent, name: fileName, path: filePath, encrypted: true };
    } catch (e) {
      if (e.message.includes("A password is required but none was provided") || e.message.includes("wrong password")) {
        return { success: false, message: "WRONG_PASSWORD_ERROR" };
      }
      return { success: false, message: e.name + ": " + e.message };
    }
  });
  electron.ipcMain.handle("load-file-content", async (event, filePath, content) => {
    let filePathArray = filePath.split("/");
    let fileName = filePathArray.pop();
    let fileNameArray = fileName.split(".");
    let extensionTail = fileNameArray.pop();
    let pureFileName = fileNameArray.join(".");
    if (extensionTail === "md" || extensionTail === "txt") {
      try {
        let fileContent = await fs.promises.readFile(filePath, "utf8");
        setOpenedFileHistory(sqliteMan, fileName, filePath, getNow());
        return { success: true, content: fileContent, name: fileName, path: filePath, encrypted: false };
      } catch (e) {
        return { success: false, message: e.name + ": " + e.message };
      }
    } else if (extensionTail === "mdz") {
      let realFilePathInMdz = path.join(filePathArray.join(path.sep), `._mdz_content.${pureFileName}`, "mdz_contents", `${pureFileName}.md`);
      let realDirPathInMdz = path.join(filePathArray.join(path.sep), `._mdz_content.${pureFileName}`);
      try {
        await mdzUtils.genOrDecompressMdz(filePath, filePathArray.join(path.sep), "decompress", "", "");
        if (process.platform === "win32") {
          await exec(`attrib +h "${realDirPathInMdz}"`);
        }
        let fileContent = await fs.promises.readFile(realFilePathInMdz, "utf8");
        setOpenedFileHistory(sqliteMan, fileName, filePath, getNow());
        return { success: true, content: fileContent, name: fileName, path: filePath, encrypted: false };
      } catch (e) {
        if (e.message.includes("password is required but none was provided") || e.message.includes("wrong password")) {
          return { success: false, message: "PASSWORD_REQUIRED", encMdzPath: filePath };
        }
        if (e.message.includes("No such file or directory")) {
          return { success: false, message: "FILE_NOT_FOUND", encMdzPath: filePath };
        }
        return { success: false, message: e.name + ": " + e.message };
      }
    } else {
      return { success: false, message: content };
    }
  });
  electron.ipcMain.handle("make-mdz-directory", async (event, purePath, pureFileName) => {
    try {
      await fs.promises.mkdir(purePath + path.sep + "._mdz_content." + pureFileName + path.sep + "mdz_contents" + path.sep + "media_src", { recursive: true });
      if (process.platform === "win32") {
        await exec(`attrib +h "${purePath + path.sep + "._mdz_content." + pureFileName}"`);
      }
      return { "success": true, "message": "创建文件夹成功" };
    } catch (e) {
      return { "success": false, message: `${e.name}: ${e.message}` };
    }
  });
  electron.ipcMain.handle("make-md-media-directory", async (event, purePath, pureFileName) => {
    try {
      await fs.promises.mkdir(purePath + path.sep + pureFileName + ".media_dir", { recursive: true });
      return { "success": true, "message": "创建文件夹成功" };
    } catch (e) {
      return { "success": false, message: `${e.name}: ${e.message}` };
    }
  });
  electron.ipcMain.handle("copy-mdz-media-files", async (event, filePathArray) => {
    for (let i = 0; i < filePathArray.length; i++) {
      try {
        if (process.platform === "openharmony") {
          await copyOnHarmony(decodeURI(filePathArray[i][0]), decodeURI(filePathArray[i][1]));
        } else {
          await fs.promises.copyFile(decodeURI(filePathArray[i][0]), decodeURI(filePathArray[i][1]));
        }
      } catch (e) {
        if (!e.message.includes("ENOENT: no such file or directory, copyfile")) {
          return { "success": false, message: `${e.name}: ${e.message}` };
        }
      }
    }
    return { "success": true, "message": "拷贝媒体成功" };
  });
  electron.ipcMain.handle("clean-mdz-folder", async (event, cleanPath) => {
    try {
      await promises.rm(cleanPath, { recursive: true, force: true });
      return { "success": true, "message": "清理成功" };
    } catch (e) {
      return { "success": false, message: `${e.name}: ${e.message}` };
    }
  });
  electron.ipcMain.handle("save-file-content", async (event, purePath, pureFileName, content, ext) => {
    try {
      if (ext === "mdz") {
        await fs.promises.writeFile(purePath + path.sep + "._mdz_content." + pureFileName + path.sep + "mdz_contents" + path.sep + pureFileName + ".md", content, "utf8");
      } else if (ext === "md" || ext === "txt") {
        await fs.promises.writeFile(purePath + path.sep + pureFileName + `.${ext}`, content, "utf8");
      }
      return { "success": true, "message": "写入文件成功" };
    } catch (e) {
      return { "success": false, message: `${e.name}: ${e.message}` };
    }
  });
  electron.ipcMain.handle("compress-to-mdz", async (event, purePath, pureFileName, password) => {
    try {
      await promises.rm(purePath + path.sep + pureFileName + ".mdz", { recursive: true, force: true });
      await mdzUtils.genOrDecompressMdz(
        purePath + path.sep + "._mdz_content." + pureFileName,
        purePath + path.sep + pureFileName + ".mdz",
        "compress",
        password,
        ""
      );
      return { "success": true, "message": "保存成功" };
    } catch (e) {
      return { "success": false, message: `${e.name}: ${e.message}` };
    }
  });
  electron.ipcMain.on("save-file-in-mdz", async (event, title, filePath) => {
    filePath = decodeURI(filePath.replace("file://", ""));
    let fileName = filePath.split("/").pop();
    let savePath = dialogs.saveMediaDialog(title, os.homedir() + path.sep + fileName);
    if (savePath) {
      try {
        if (process.platform === "openharmony") {
          await copyOnHarmony(filePath, savePath);
        } else {
          await fs.promises.copyFile(filePath, savePath);
        }
        electron.dialog.showMessageBoxSync({
          type: "info",
          message: "保存成功 Save successfully!",
          buttons: ["OK"],
          defaultId: 0
        });
        return 0;
      } catch (err) {
        electron.dialog.showMessageBoxSync({
          type: "error",
          message: "保存失败 Save failed!",
          buttons: ["OK"],
          defaultId: 0
        });
        return -1;
      }
    } else {
      electron.dialog.showMessageBoxSync({
        type: "warning",
        message: "用户取消保存 User save canceled!",
        buttons: ["OK"],
        defaultId: 0
      });
      return -1;
    }
  });
  electron.ipcMain.handle("get-file-buffer", (event, path2, isXlsx) => {
    const bufferSize = 64 * 1024;
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(path2, { highWaterMark: bufferSize });
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (!isXlsx) {
          resolve(buffer);
        } else {
          const workbook = XLSX.read(buffer);
          resolve(stox(workbook));
        }
      });
      stream.on("error", reject);
    });
  });
  electron.ipcMain.handle("get-file-as-txt", async (event, path2) => {
    try {
      let fileContent = await fs.promises.readFile(path2, "utf8");
      return { "success": true, "message": fileContent.substring(0, 1e4) };
    } catch (e) {
      return { "success": false, "message": e };
    }
  });
  electron.ipcMain.handle("doc-loader", async (event, fileName) => {
    const filePath = docRootPath + path.sep + fileName + ".md";
    try {
      let docContent = await fs.promises.readFile(filePath, "utf8");
      return { success: true, content: docContent, root: docRootPath + path.sep + "media" };
    } catch (e) {
      return { success: false, message: e.name + ": " + e.message };
    }
  });
  electron.ipcMain.handle("media-paster", async (event) => {
    const formats = electron.clipboard.availableFormats();
    let fileURLs, type;
    const videoExts = ["mp4", "mov", "webm", "avi", "wmv", "flv", "mkv", "m4v", "mpeg", "ts"];
    const audioExts = ["mp3", "wav", "flac", "ogg", "wma", "aac", "m4a"];
    const imageExts = ["jpg", "jpeg", "tif", "tiff", "gif", "bmp", "svg", "png"];
    const isFile = formats.some(
      (format) => format === "text/uri-list" || // Windows & HarmonyOS
      format === "public.file-url"
      // macOS
    ) || electron.clipboard.read("x-special/gnome-copied-files").includes("file://");
    if (isFile) {
      if (process.platform === "win32") {
        const buffer = electron.clipboard.readBuffer("FileNameW");
        const raw = buffer.toString("ucs2").replaceAll("\\", "/");
        fileURLs = raw.split("\0").filter((p) => p.length > 0);
      } else if (process.platform === "darwin") {
        const raw = electron.clipboard.read("public.file-url");
        fileURLs = raw.split("\n").map((url) => url.trim()).filter((url) => url.startsWith("file://")).map((url) => {
          return url.replace("file://", "");
        });
      } else if (process.platform === "linux") {
        const raw = electron.clipboard.read("x-special/gnome-copied-files");
        fileURLs = raw.split("\n").map((url) => url.trim()).filter((url) => url.startsWith("file://")).map((url) => {
          return url.replace("file://", "");
        });
      } else if (process.platform === "openharmony") {
        const raw = electron.clipboard.read("text/uri-list");
        fileURLs = raw.split("\n").map((url) => url.trim()).map((url) => {
          return url.replace("file://", "");
        });
      }
      let result = "";
      for (let i = 0; i < fileURLs.length; i++) {
        let fileURL = encodeURI(fileURLs[i]);
        let ext = fileURL.split(".").pop().toLowerCase();
        if (videoExts.includes(ext)) {
          type = "${video}:";
        } else if (audioExts.includes(ext)) {
          type = "${audio}:";
        } else if (imageExts.includes(ext)) {
          type = "";
        } else {
          type = "${file}:";
        }
        result = result + ("![" + type + "](" + fileURL + ")\n");
      }
      return result;
    } else {
      const isImage = formats.some((format) => format.includes("image"));
      if (isImage) {
        const image = electron.clipboard.readImage();
        const imageURL = image.toDataURL();
        return `![](${imageURL})`;
      }
    }
  });
  electron.ipcMain.handle("get-media-list-in-mdz", async (event, mediaHomePath) => {
    try {
      let mediaList = await fs.promises.readdir(mediaHomePath);
      return { "success": true, "message": { "homeDir": mediaHomePath, "nameList": mediaList } };
    } catch (e) {
      return { "success": false, "message": e };
    }
  });
  electron.ipcMain.handle("import-media-into-mdz", async (event, title, destinationPath) => {
    let mediaFilePaths = dialogs.openFileDialog(title, true);
    if (!mediaFilePaths) {
      return { "success": false, "message": ["用户已取消导入媒体/User Canceled"] };
    }
    let mediaFilePath = decodeURI(mediaFilePaths[0]);
    let mediaFileName = mediaFilePath.split(path.sep).pop();
    try {
      if (process.platform === "openharmony") {
        await copyOnHarmony(mediaFilePath, `${destinationPath}/${mediaFileName}`);
      } else {
        await fs.promises.copyFile(mediaFilePath, `${destinationPath}/${mediaFileName}`);
      }
      return {
        "success": true,
        "message": ["媒体导入成功/Successfully Imported", mediaFileName]
      };
    } catch (e) {
      return { "success": false, "message": [e.name] };
    }
  });
  electron.ipcMain.handle("delete-media-in-mdz", async (event, mediaPath) => {
    try {
      await promises.rm(mediaPath, { recursive: true, force: true });
      return { "success": true, "message": "删除成功/Delete Successfully" };
    } catch (e) {
      return { "success": false, "message": "删除失败/Delete Failed" };
    }
  });
  electron.ipcMain.on("open-url", (event, url) => {
    electron.shell.openExternal(url);
  });
  electron.ipcMain.handle("get-system-lang", (event) => {
    let locale = process.platform === "openharmony" ? electron.app.getPreferredSystemLanguages()[0] : electron.app.getLocale();
    if (["zh-CN", "zh", "zh-Hans"].includes(locale)) {
      return "zh-CN";
    } else if (["zh-TW", "zh-HK", "zh-MO", "zh-Hant"].includes(locale)) {
      return "zh-TW";
    } else if (locale.startsWith("en")) {
      return "en";
    } else {
      return "en";
    }
  });
  sqliteIpc(Sqlite32, dbPath);
  harmonyPermissionIpc();
};
const isMac = process.platform === "darwin";
const menu = () => {
  return electron.Menu.setApplicationMenu(
    electron.Menu.buildFromTemplate([
      ...isMac ? [{
        label: electron.app.name
      }] : []
    ])
  );
};
const icon = "data:image/png;base64,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ioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAIKAKKgCKgCCgCioAioAgoAoqAIqAItBgE/h9tnqRD9MwfYgAAAABJRU5ErkJggg==";
const packedRoot = path.join(process.resourcesPath, "app.asar");
const mainWindow = (sqlite3, dbPath) => {
  const sqliteMan = new SqliteMan(sqlite3, dbPath);
  let windowProps = sqliteMan.getLastExitWhAndPos()[0];
  const main2 = new electron.BrowserWindow({
    width: windowProps.w,
    height: windowProps.h,
    x: windowProps.x,
    y: windowProps.y,
    minWidth: 800,
    minHeight: 660,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: !electron.app.isPackaged ? path.join(__dirname, `..${path.sep}..${path.sep}out${path.sep}preload${path.sep}index.js`) : process.platform === "openharmony" ? path.join(__dirname, `..${path.sep}..${path.sep}out${path.sep}preload${path.sep}index.js`) : path.join(packedRoot, `out${path.sep}preload${path.sep}index.js`),
      sandbox: false,
      contextIsolation: true,
      // 允许从 file:// 协议加载本地资源
      webSecurity: false,
      // 允许跨域
      allowRunningInsecureContent: true
    }
  });
  // main2.webContents.openDevTools({ mode: "right" });
  main2.on("ready-to-show", () => {
    main2.show();
  });
  main2.on("close", (event) => {
    event.preventDefault();
    main2.webContents.send("ask-for-close");
  });
  electron.ipcMain.on("confirm-close", (event, canClose, mdzPaths) => {
    if (canClose) {
      for (let i = 0; i < mdzPaths.length; i++) {
        if (fs.existsSync(mdzPaths[i])) {
          fs.rmSync(mdzPaths[i], { recursive: true, force: true });
        }
      }
      main2.destroy();
    }
  });
  electron.ipcMain.on("try-close", (event) => {
    main2.close();
  });
  electron.ipcMain.handle("get-window-wh-and-pos", (event) => {
    let wh = main2.getSize();
    let xy = main2.getPosition();
    return wh.concat(xy);
  });
  electron.ipcMain.on("set-window-wh-and-pos", (event, whXyArray) => {
    sqliteMan.setLastExitWhAndPos(whXyArray);
  });
  main2.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (!electron.app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    main2.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    main2.loadFile(
      !electron.app.isPackaged ? path.join(__dirname, `..${path.sep}..${path.sep}out${path.sep}renderer${path.sep}index.html`) : process.platform === "openharmony" ? path.join(__dirname, `..${path.sep}..${path.sep}out${path.sep}renderer${path.sep}index.html`) : path.join(packedRoot, `out${path.sep}renderer${path.sep}index.html`)
    );
  }
  return main2;
};
let Sqlite3;
if (!electron.app.isPackaged) {
  Sqlite3 = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}node_modules${path.sep}better-sqlite3`)) : require("better-sqlite3");
} else {
  const unpackedRoot = path.join(process.resourcesPath, "app.asar.unpacked");
  Sqlite3 = process.platform === "openharmony" ? require(path.join(__dirname, `..${path.sep}..${path.sep}node_modules${path.sep}better-sqlite3`)) : require(path.join(unpackedRoot, `node_modules${path.sep}better-sqlite3`));
}
let main;
let globalFilePath;
if (process.platform === "darwin") {
  electron.app.on("open-file", (event, filePath) => {
    event.preventDefault();
    if (main && main.webContents) {
      main.webContents.send("default-open-file", filePath);
    } else {
      globalFilePath = filePath;
    }
  });
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (event, commandLine) => {
    let fPath;
    for (let i = 0; i < commandLine.length; i++) {
      let arg = commandLine[i];
      if (arg.indexOf("--direct-open-file=") !== -1) {
        fPath = arg.replace("--direct-open-file=", "").replaceAll("\\", "/");
        break;
      }
    }
    if (fPath && main) {
      if (main.isMinimized()) {
        main.restore();
      }
      main.focus();
      main.webContents.send("default-open-file", fPath);
    }
  });
  electron.app.whenReady().then(() => {
    console.log("when ready");
    const unpackedRoot = path.join(process.resourcesPath, "app.asar.unpacked");
    let pngPath = process.platform === "openharmony" ? path.join(__dirname, `..${path.sep}..${path.sep}resources${path.sep}icon.png`) : !electron.app.isPackaged ? path.join(__dirname, `..${path.sep}..${path.sep}resources${path.sep}icon.png`) : path.join(unpackedRoot, `resources`, `icon.png`);
    console.log(pngPath);
    let tray = new electron.Tray(pngPath);
    console.log("tray", tray);
    let settings_dir_path = process.platform === "openharmony" ? path.join(electron.app.getPath("appData"), ".ame_conf") : path.join(os.homedir(), ".ame_conf");
    try {
      const stats = fs.statSync(settings_dir_path);
      if (!stats.isDirectory()) {
        electron.dialog.showMessageBox({
          type: "error",
          // 图标类型: info, error, question, none
          title: "AME启动出错",
          message: `路径“${os.homedir()}”内有“.ame_conf”文件残留，请将它删除，否则AME无法启动！`,
          // 主内容
          buttons: ["退出AME"]
          // 按钮文字数组
        }).then((result) => {
          if (result.response === 0) {
            electron.app.quit();
          }
        });
      }
    } catch (e) {
      fs.mkdirSync(settings_dir_path, { recursive: true });
    }
    menu();
    ipc(Sqlite3, path.join(settings_dir_path, "ame.sqlite"));
    let args = process.argv;
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      if (arg.indexOf("--direct-open-file=") !== -1) {
        globalFilePath = arg.replace("--direct-open-file=", "");
        break;
      }
    }
    main = mainWindow(Sqlite3, path.join(settings_dir_path, "ame.sqlite"));
    main.webContents.on("did-finish-load", () => {
      if (globalFilePath) {
        main.webContents.send("default-open-file", globalFilePath.replaceAll("\\", "/"));
        globalFilePath = null;
      }
    });
  });
}
electron.app.on("window-all-closed", () => {
  electron.app.quit();
});

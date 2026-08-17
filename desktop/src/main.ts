import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

const DEV_SERVER_URL = "http://localhost:3000";
const INDEX_HTML = path.join(__dirname, "../renderer/index.html");
const ICON_PATH = path.join(__dirname, "../build/icon.ico");

function createWindow(): void {
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 960,
        minHeight: 600,
        autoHideMenuBar: true,
        icon: ICON_PATH,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http")) {
            shell.openExternal(url);
        }
        return { action: "deny" };
    });

    // file:// 下没有服务器端 SPA rewrite（对应生产部署 nginx.conf 的 try_files），
    // 停在某个画布子路径时 reload 会 404，这里回退加载 index.html。
    win.webContents.on("did-fail-load", (_event, errorCode, _description, validatedURL) => {
        if (errorCode === -6 && !validatedURL.endsWith("index.html")) {
            win.loadFile(INDEX_HTML);
        }
    });

    if (app.isPackaged) {
        win.loadFile(INDEX_HTML);
    } else {
        win.loadURL(DEV_SERVER_URL);
    }
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", () => {
        const [win] = BrowserWindow.getAllWindows();
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    app.whenReady().then(createWindow);

    app.on("window-all-closed", () => {
        app.quit();
    });
}

"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import getLocalFolders from "./fs_test";
import MegajsStorage from "./mega_test";
import { app, BrowserWindow, Notification } from "electron";

const isDevelopment = process.env.NODE_ENV !== "production";

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null;

function notify(title:string, message:string){
    const notification:Electron.NotificationConstructorOptions = {
        title: title,
        body: message
    }
    new Notification(notification).show();
}

async function logFolders(){
    console.log(await getLocalFolders());
    let storage=new MegajsStorage();
    await storage.connect();
    storage.onChange(message => notify("Changes on MEGA drive", message));
    console.log(storage.getFolders());
}

function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
    });

    logFolders();

    if (isDevelopment) {
        window.webContents.openDevTools();
    }

    if (isDevelopment) {
        window.loadURL(
            `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
        );
    } else {
        window.loadURL(
            formatUrl({
                pathname: join(__dirname, "index.html"),
                protocol: "file",
                slashes: true,
            })
        );
    }

    window.on("closed", () => {
        mainWindow = null;
    });

    window.webContents.on("devtools-opened", () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        });
    });

    return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow();
    }
});

// create main BrowserWindow when electron is ready
app.on("ready", () => {
    mainWindow = createMainWindow();
});
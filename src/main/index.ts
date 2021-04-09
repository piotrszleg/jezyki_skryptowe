"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import FsStorage from "./fs_storage";
import MegajsStorage from "./mega_storage";
import Storage from "./storage_";
import { app, BrowserWindow, Notification, ipcMain } from "electron";
import { FilesStructure } from "./file_commons";
import { createDisplayedFolders, DisplayedFilesStructure } from "./displayed_folders";

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

async function handleStorage(storage:Storage, showNotifications:Boolean=true):Promise<FilesStructure>{
    await storage.connect();
    if(showNotifications){
        storage.onChange(message => notify("Changes on MEGA drive", message));
    }
    const folders=await storage.getFolders();
    console.log(folders);
    return folders;
}

async function handleStorages():Promise<DisplayedFilesStructure> {
    const [localFiles, remoteFiles] = 
        await Promise.all(
        [handleStorage(new FsStorage(), false),
        handleStorage(new MegajsStorage()) ]);

    const displayedFiles=await createDisplayedFolders(localFiles, remoteFiles);
    console.log(displayedFiles);
    return displayedFiles;
}

function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
    });
    
    ipcMain.on("requestFolders", (event, arg)=>handleStorages().then(event.reply.bind(undefined, "folders")));

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
"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import FsStorage from "./fs_storage";
import MegajsStorage from "./mega_storage";
import Storage from "./storage_";
import { app, BrowserWindow, Notification, ipcMain, IpcMainEvent } from "electron";
import { FilesStructure } from "./file_commons";
import { createDisplayedFolders, DisplayedFilesStructure } from "./displayed_folders";
import Settings from "./settings";
import promiseIpc from 'electron-promise-ipc';

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

async function main() {
    ipcMain.on("loadSettings", (event, arg)=>{
        const settings = new Settings();
        if(settings.databaseExists()) {
            event.reply("requestPassword");
            ipcMain.on("password", (event, password)=>{
                try {
                    settings.connectToDatabase(password);
                    event.reply("connectedToSettingsDatabase");
                } catch(e) {
                    event.reply("requestPasswordAgain");
                }
            });
        } else {
            event.reply("requestNewPassword");
            ipcMain.on("newPassword", (event, password)=>{
                settings.connectToDatabase(password);
                event.reply("connectedToSettingsDatabase");
            });
        }
    });
    ipcMain.on("loadFolders", (event, arg)=>{
        // connect to mega
        // loop:
            // if failed request new mega credentials and save them if specified
        // send folders
    });
}

function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
    });
    

// ask for folders
// if there's no database file ask for password and create it 
// try with empty db password
// if it worked 
// if password is incorrect ask for another one (different message)

    promiseIpc.on("requestFolders", ()=>handleStorages());

    /*ipcMain.on("requestFolders", (event, arg)=>event.reply);
    ipcMain.on("requestFoldersWithMegaCredentials", ))
    */
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
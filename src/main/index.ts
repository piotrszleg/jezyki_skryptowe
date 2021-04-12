"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import FsStorage from "./fs_storage";
import MegajsStorage from "./mega_storage";
import Storage from "./storage_";
import { app, BrowserWindow, Notification, IpcMainEvent } from "electron";
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
    if(showNotifications){
        storage.onChange(message => notify("Changes on drive", message));
    }
    const folders=await storage.getFolders();
    console.log(folders);
    return folders;
}

async function handleStorages():Promise<DisplayedFilesStructure> {
    const megaStorage=new MegajsStorage();

    await megaStorage.connect()
    promiseIpc.on("action", async (folder:unknown, name:unknown, action:unknown, event?: IpcMainEvent)=>{
            console.log(`Received action ${action} for '${folder}/${name}'`);
            if(action=="Upload"){
                await megaStorage.upload(<string>folder, <string>name);
                return true;
            } else if (action=="Download"){
                await megaStorage.download(<string>folder, <string>name);
                return true;
            } else {
                return false;
            }
    });

    const fsStorage=new FsStorage();
    await fsStorage.connect();

    const [localFiles, remoteFiles] = 
        await Promise.all(
        [handleStorage(fsStorage, false),
        handleStorage(megaStorage) ]);

    const displayedFiles=await createDisplayedFolders(localFiles, remoteFiles);
    console.log(displayedFiles);
    return displayedFiles;
}

async function main(webContents:Electron.WebContents) {

    const settings = new Settings();
    promiseIpc.on("loadSettings", (event?: IpcMainEvent)=>{
        if(settings.databaseExists()) {
            console.log("Requesting database password.");
            promiseIpc.on("password", (password:unknown, event?: IpcMainEvent)=>{
                try {
                    settings.connectToDatabase(<string>password);
                    console.log("Password is valid.");
                    promiseIpc.send("connectedToSettingsDatabase", webContents);
                } catch(e) {
                    console.log(e);
                    console.log("Password is invalid.");
                    promiseIpc.send("requestPasswordAgain", webContents);
                }
            });
            promiseIpc.send("requestPassword", webContents);
        } else {
            console.log("There is no database, requesting new password.");
            promiseIpc.on("newPassword", (password:unknown, event?: IpcMainEvent)=>{
                console.log("Changing database password to one provided.");
                settings.connectToDatabase(<string>password);
                promiseIpc.send("connectedToSettingsDatabase", webContents);
            });
            promiseIpc.send("requestNewPassword", webContents);
        }
    });
    promiseIpc.on("connectToMega", async (event?:IpcMainEvent)=>{
        const megaStorage=new MegajsStorage();
        let firstTry=true;

        interface Credentials {
            email:string;
            password:string;
        }

        async function connectToMegaUsingCredentials(credentials:Credentials|null){
            try {
                if(credentials){
                    settings.megaEmail=credentials.email;
                    settings.megaPassword=credentials.password;
                }
                await megaStorage.connect();
                console.log("Connecting to Mega succeeded.");
            } catch(e){ 
                console.log(e);
                promiseIpc.send(firstTry ? "requestMegaCredentials" : "requestMegaCredentialsAgain", webContents);
                firstTry=false;
                console.log("Connecting to Mega failed.");
            }
        }
        console.log("Trying to connect to mega using saved credentials.");
        connectToMegaUsingCredentials(null);
        promiseIpc.on("megaCredentials", (credentials:any, event?:IpcMainEvent)=>connectToMegaUsingCredentials(credentials));
    });

    promiseIpc.on("requestFolders", async ()=>{
        const displayedFiles=await handleStorages();
        promiseIpc.on("action", (folder:unknown, name:unknown, action:unknown, event?: IpcMainEvent)=>{
            console.log(`Received action ${action} for '${folder}/${name}'`);
        });

        return displayedFiles;
    });
    
    
}

function createMainWindow(): BrowserWindow {
    const window = new BrowserWindow({
        webPreferences: { nodeIntegration: true },
    });

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
        ["loadSettings", "password", "newPassword", "connectToMega", "megaCredentials"].map(e=>
            promiseIpc.off(e));
    });

    window.webContents.on("devtools-opened", () => {
        window.focus();
        setImmediate(() => {
            window.focus();
        });
    });
    
    main(window.webContents);

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
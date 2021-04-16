"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import FsStorage from "./fs_storage";
import {MegajsStorage, MegaJsStorageCredentials} from "./mega_storage";
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

async function handleStorage(storage:Storage<any>, showNotifications:Boolean=true):Promise<FilesStructure>{
    if(showNotifications){
        storage.onChange(message => notify("Changes on drive", message));
    }
    promiseIpc.on("action", (folder:unknown, name:unknown, action:unknown, event?: IpcMainEvent)=>{
        console.log(`Received action ${action} for '${folder}/${name}'`);
        return storage.handleAction(<string>action, <string>folder, <string>name);
    });
    const folders=await storage.getFolders();
    console.log(folders);
    return folders;
}

async function handleStorages(fsStorage:FsStorage, megaStorage:MegajsStorage):Promise<DisplayedFilesStructure> {
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

    promiseIpc.on("password", async (password:unknown, event?: IpcMainEvent)=>{
        try {
            await settings.connectToDatabase(<string>password);
            console.log("Password is valid.");
            return true;
        } catch(e) {
            console.log(e);
            console.log("Password is invalid.");
            return false;
        }
    });

    promiseIpc.on("newPassword", async (password:unknown, event?: IpcMainEvent)=>{
        console.log(`Changing database password to one provided: "${<string>password}"`);
        await settings.createDatabase(<string>password);
        return true;
    });

    interface CredentialsFormData {
        email:string;
        password:string;
        save:boolean;
    }

    const megaStorage=new MegajsStorage();
    const fsStorage=new FsStorage();
    fsStorage.connect();

    async function connectToRemote(formData:CredentialsFormData|null){
        const credentials=new MegaJsStorageCredentials("", "");
        if(formData){
            console.log("Trying to connect to mega using sent credentials.");
            if(formData.save){
                settings.megaEmail=formData.email;
                settings.megaPassword=formData.password;
            }
            credentials.email=formData.email;
            credentials.password=formData.password;
        } else {
            console.log("Trying to connect to mega using saved credentials.");
            credentials.email=settings.megaEmail;
            credentials.password=settings.megaPassword;
        }

        try {
            await megaStorage.connect(new MegaJsStorageCredentials(credentials.email, credentials.password));
            console.log("Connecting to Mega succeeded.");

            promiseIpc.on("requestFolders", async ()=>{
                const displayedFiles=await handleStorages(fsStorage, megaStorage);
        
                return displayedFiles;
            });

            return true;
        } catch(err){
            console.log("Connecting to Mega failed.");
            console.log(err);
            return false;
        }
    }
    promiseIpc.on("connectToRemote", (credentials:any, event?:IpcMainEvent)=>connectToRemote(credentials));
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
    // promiseIpc.on("requestFolders", handleStorages);

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
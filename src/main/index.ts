"use strict";

import { join } from "path";
import { format as formatUrl } from "url";
import FsStorage, { FsStorageConfiguration } from "./fs_storage";
import {MegajsStorage, MegaJsStorageConfiguration} from "./mega_storage";
import Storage from "./storage_";
import { app, BrowserWindow, Notification, IpcMainEvent, dialog } from "electron";
import { createDisplayedFolders, DisplayedFilesStructure } from "./displayed_folders";
import Settings from "./settings";
import promiseIpc from 'electron-promise-ipc';
import ScriptExecutor from "./ScriptExecutor";

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
    console.log(`${title}\n${content}`);
};

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

function addStorageHooks(storage:Storage<any>, changeCallback:()=>void, showNotifications:Boolean=false) {
    if(showNotifications){
        storage.onChange(message => notify("Changes on drive", message));
    }
    storage.onChange(changeCallback);
}

async function loadAndMergeFolders(fsStorage:FsStorage, megaStorage:MegajsStorage):Promise<DisplayedFilesStructure> {
    const [localFiles, remoteFiles] = 
        await Promise.all(
        [fsStorage.getFolders(),
        megaStorage.getFolders() ]);

    const displayedFiles=createDisplayedFolders(localFiles, remoteFiles);
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

    promiseIpc.on("getSettings", ()=>settings.getRaw());
    promiseIpc.on("setSettings", (value:any)=>settings.update(value));
    promiseIpc.on("resetSettings", (value:any)=>settings.reset());
    promiseIpc.on("relaunch", (value:any)=>{
        if(app.isPackaged){
            app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
            app.exit(0);
        } else {
            console.log("Relaunch isn't available in dev mode.")
        }
    });

    interface CredentialsFormData {
        email:string;
        password:string;
        remotePath:string;
        save:boolean;
    }

    const megaStorage=new MegajsStorage();
    const fsStorage=new FsStorage();
    const scriptExecutor=new ScriptExecutor(settings, d=>promiseIpc.send("scriptOutput", webContents, d));

    async function connectToRemote(formData:CredentialsFormData|null){
        function confirmationDialog(message:string):Promise<boolean> {
            if(settings.askBeforeDownloadingBigFiles){
                return <Promise<boolean>>promiseIpc.send("confirmation", webContents, message);
            } else {
                return (async (message:string)=>true)(message);
            }
        }
        const credentials=new MegaJsStorageConfiguration("", "", settings.localPath, settings.remotePath, ()=>settings.askBeforeDownloadingBigFiles, confirmationDialog, 
            (category:string, file:string, action:string)=><Promise<void>>promiseIpc.send("eventAction", webContents, category, file, action));

        if(formData){
            console.log("Trying to connect to mega using sent credentials.");
            if(formData.save){
                settings.megaEmail=formData.email;
                settings.megaPassword=formData.password;
                settings.remotePath=formData.remotePath;
            }
            credentials.email=formData.email;
            credentials.password=formData.password;
            credentials.remoteFolder=formData.remotePath;
        } else {
            if(!settings.autoLogin){
                console.log("Rejecting auto login.");
                return false;
            }
            console.log("Trying to connect to mega using saved credentials.");
            credentials.email=settings.megaEmail;
            credentials.password=settings.megaPassword;
        }

        try {
            await megaStorage.connect(credentials);
            fsStorage.connect(new FsStorageConfiguration(settings.localPath, scriptExecutor));
            console.log("Connecting to Mega succeeded.");

            async function sendFolders(){
                return promiseIpc.send("folders", webContents, await loadAndMergeFolders(fsStorage, megaStorage));
            }

            addStorageHooks(fsStorage, sendFolders),
            addStorageHooks(megaStorage, sendFolders);
            promiseIpc.on("action", async (folder:unknown, name:unknown, action:unknown, args:unknown, event?: IpcMainEvent)=>{
                console.log(`Received action ${action} for '${folder}/${name}'`);
                if(await fsStorage.handleAction(<string>action, <string>folder, <string>name, args)
                    || await megaStorage.handleAction(<string>action, <string>folder, <string>name, args)){
                    sendFolders();
                }
            });

            promiseIpc.on("requestFolders", ()=>loadAndMergeFolders(fsStorage, megaStorage));

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
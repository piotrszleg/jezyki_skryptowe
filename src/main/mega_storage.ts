import credentials from "./mega_credentials";
import { Storage as MegajsPackageStorage, File, MutableFile } from 'megajs';
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import {basename, extname} from "path";
import {EventEmitter} from "events";
import Storage from "./storage_";
import { LOCAL_PATH } from "./fs_storage";
import { join } from "path";
import fs from "fs";

const ROOT_FOLDER_ID="MOp01QxZ";

export default class MegajsStorage implements Storage {
    storage: MegajsPackageStorage|null=null;
    rootFolder: MutableFile|null=null;
    categories:Map<string, MutableFile>=new Map<string, MutableFile>();
    
    download(category:string, file:string):Promise<void>{
        return new Promise<void>((resolve, reject) =>{
            const folder=this.categories.get(category);
            if(!folder){
                throw new Error("There is no folder to download from.");
            }
            const megaFile=folder.children.find(megaFile=>megaFile.name==file);
            if(!megaFile){
                throw new Error("There is no file that was supposed to be downloaded.");
            }
            megaFile.download().pipe(fs.createWriteStream(join(LOCAL_PATH, category, file))).on('finish', resolve);
        });
    }

    async upload(category:string, file:string){
        return new Promise<void>((resolve, reject) =>{
            if(this.rootFolder==null){
                throw new Error("You must call connect before upload.");
            }
            let folder=this.categories.get(category);
            if(!folder){
                // if category folder does not exist create it
                this.rootFolder.mkdir(category);
                folder=<MutableFile>this.rootFolder.children.find(f=>f.name==category);
                this.categories.set(category, folder);
            }
            const megaFile=folder?.children.find(megaFile=>megaFile.name==file);
            if(megaFile){
                // delete previous file 
                (<MutableFile>megaFile).delete(true, (error)=>{throw error});
            }
            // upload current file 
            fs.createReadStream(join(LOCAL_PATH, category, file)).pipe(folder.upload(file)).on('finish', resolve);
        });
    }

    connect():Promise<void>{
        return new Promise((resolve, reject)=>{
            try {
                this.storage = new MegajsPackageStorage(credentials, ()=>{
                    const rootFolder=this.storage?.root.children.find(f=>f.nodeId==ROOT_FOLDER_ID);
                    this.rootFolder=<MutableFile>rootFolder;
                    resolve();
                });
            } catch(err) {
                reject(err);
            }
        });
    }
    onChange(callback: (messege : string)=>void){
        if(this.storage==null){
            throw new Error("You must call connect before onChange.");
        } else {
            const emitter=<EventEmitter><unknown>this.storage;
            emitter.addListener("add", file=>callback(`File or folder "${file.name}" was added`));
            emitter.addListener("move", (file, oldFolder)=>callback(`File or folder "${file.name}" was moved from "${oldFolder.name}"`));
            emitter.addListener("delete", file=>callback(`File or folder "${file.name}" was deleted`));
            emitter.addListener("update", file=>callback(`File or folder "${file.name}" was updated`));
        }
    }
    getFolders():Promise<FilesStructure>{
        return new Promise<FilesStructure>( (resolve, reject)=>{
            if(this.storage==null){
                reject("You must call connect before getFolders.");
            } else {
                const rootFolder=this.rootFolder;
                if(rootFolder!=undefined){
                    const result=new Map<string, FileOrFolder[]>();

                    CATEGORIES.forEach(category=>{
                        const category_folder=rootFolder.children.find(f=>f.name==category);
                        this.categories.set(category, <MutableFile>category_folder);

                        if(category_folder!=undefined && category_folder.children!=undefined){
                            result.set(category, category_folder.children.map(
                                f=>new FileOrFolder(
                                    f.name, 
                                    "https://mega.nz/fm/"+f.nodeId, 
                                    new Date(f.timestamp*1000))));
                        } else {
                            result.set(category, []);
                        }
                    })
                    resolve(result);
                } else {
                    reject("Configured root folder doesn't exist.")
                }
            }
        });
    }
}
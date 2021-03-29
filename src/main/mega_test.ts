import credentials from "./mega_credentials";
import { MutableFile, Storage } from 'megajs';
import {CATEGORIES, FileOrFolder} from "./file_commons";
import {basename, extname} from "path";
import {EventEmitter} from "events";

const ROOT_FOLDER_ID="MOp01QxZ";

export default class MegajsStorage {
    storage: Storage|null=null;
    
    connect():Promise<void>{
        return new Promise((resolve, reject)=>{
            try {
                this.storage = new Storage(credentials, resolve);
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
    getFolders():Map<string, FileOrFolder[]>{
        if(this.storage==null){
            throw new Error("You must call connect before getFolders.");
        } else {
            const rootFolder=this.storage.root.children.find(f=>f.nodeId==ROOT_FOLDER_ID);
            if(rootFolder!=undefined){
                const result=new Map<string, FileOrFolder[]>();

                CATEGORIES.forEach(category=>{
                    const category_folder=rootFolder.children.find(f=>f.name==category);

                    if(category_folder!=undefined && category_folder.children!=undefined){
                        result.set(category, category_folder.children.map(
                            f=>new FileOrFolder(
                                basename(f.name, extname(f.name)), 
                                "https://mega.nz/fm/"+f.nodeId, 
                                new Date(f.timestamp*1000))));
                    } else {
                        result.set(category, []);
                    }
                })
                return result;
            } else {
                throw new Error("Configured root folder doesn't exist.");
            }
        }
    }
}
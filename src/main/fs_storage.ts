import * as fs from "fs";
import {promisify} from "util";
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";

export const LOCAL_PATH = "E:/jezyki_skryptowe";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

export default class FsStorage implements Storage<void> {
    async handleAction(action:string){
        return false;
    }
    connect():Promise<void>{
        return new Promise((resolve, reject)=>resolve());
    }
    onChange(callback: (messege : string)=>void){
        // event is either change or rename
        fs.watch(LOCAL_PATH, {recursive: true}, (event, filename)=>callback(`File or folder "${filename}" was `+event+"d"));
    }
    getFolders():Promise<FilesStructure>{
        return new Promise<FilesStructure>( (resolve, reject)=>{
            const result=new Map<string, FileOrFolder[]>();
            Promise.all(CATEGORIES.map(
                async category=>{
                    const categoryPath=join(LOCAL_PATH, category)
                    const files=await readdirPromise(categoryPath);
                    const filesData:FileOrFolder[]=<FileOrFolder[]>(await Promise.all(files.map(async (file:string)=>{
                        const fullFileName=join(categoryPath, file);
                        let stats;
                        try {
                            stats=await statPromise(fullFileName);
                        } catch(err){
                            // stat error, print it and skip file
                            console.log(err);
                            return null;
                        }
                        if(stats.isDirectory()){
                            // list only directories
                            return new FileOrFolder(file, fullFileName, stats.mtime);
                        } else {
                            return null;
                        }
                    }))).filter(e=>e!=null);
                    result.set(category, filesData);
                }
            )).then(()=>resolve(result));
        });
    }
}
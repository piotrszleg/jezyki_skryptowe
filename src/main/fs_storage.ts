import * as fs from "fs";
import {promisify} from "util";
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

export default class FsStorage implements Storage<string> {
    path:string|null=null;
    async handleAction(action:string){
        return false;
    }
    connect(path:string):Promise<void>{
        this.path = path;
        return new Promise((resolve, reject)=>resolve());
    }
    onChange(callback: (messege : string)=>void){
        if(!this.path){
            throw new Error("You must call connect before onChange.");
        }
        // event is either change or rename
        fs.watch(this.path, {recursive: true}, (event, filename)=>callback(`File or folder "${filename}" was `+event+"d"));
    }
    getFolders():Promise<FilesStructure>{
        return new Promise<FilesStructure>( (resolve, reject)=>{
            if(!this.path){
                reject("You must call connect before getFolders.");
            }
            const result=new Map<string, FileOrFolder[]>();
            Promise.all(CATEGORIES.map(
                async category=>{
                    const categoryPath=join(<string>this.path, category)
                    const files=await readdirPromise(categoryPath);
                    const filesData:FileOrFolder[]=<FileOrFolder[]>(await Promise.all(files.map(async (file:string)=>{
                        const fullFileName=join(categoryPath, file);
                        let stats;
                        try {
                            stats=await statPromise(fullFileName);
                        } catch(err){
                            // stat error, the file was deleted in the process of scanning, skip file
                            // console.log(err);
                            return null;
                        }
                        if(stats.isDirectory()){
                            // list only directories
                            return new FileOrFolder("asad", file, fullFileName, stats.mtime);
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
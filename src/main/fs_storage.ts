import * as fs from "fs";
import {promisify} from "util";
import {basename, extname} from "path";
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";

export const LOCAL_PATH = "E:/jezyki_skryptowe";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

export default class FsStorage implements Storage {
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
                    const filesData:FileOrFolder[]=await Promise.all(files.map(async (file:string)=>{
                        const fullFileName=join(categoryPath, file);
                        try {
                            const date=(await statPromise(fullFileName)).mtime;
                            return new FileOrFolder(file, fullFileName, date);
                        } catch(err){
                            // stat error, print it and use current Date
                            console.log(err);
                            return new FileOrFolder(file, fullFileName, new Date());
                        }
                    }));
                    result.set(category, filesData);
                }
            )).then(()=>resolve(result));
        });
    }
}
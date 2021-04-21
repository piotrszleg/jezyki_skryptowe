import * as fs from "fs";
import {promisify} from "util";
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";
import crypto from "crypto";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

function readFileInParts<D>(path: string, callback: (data:D) => void){
    return new Promise((resolve, reject) =>{
        const stream = fs.createReadStream(path);

        stream.on('data', data=>callback(data));

        stream.on('end', resolve);
    });
}

async function directoryChecksum(path: string){
    const result= crypto.createHash('md5');

    async function inner(visitedPath: string){
        const files = await readdirPromise(visitedPath);
        for(let file of files){
            const filePath=join(visitedPath, file);
            
            if((await statPromise(filePath)).isFile()){
                await readFileInParts(filePath, 
                    (data:string)=>result.update(data, 'utf8'));
            } else {
                // recursively checksum files in subdirectories
                await inner(filePath);
            }
        }
    }
    inner(path);

    return result.digest('hex');
}

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
                            // stat error, print it and skip file
                            console.log(err);
                            return null;
                        }
                        if(stats.isDirectory()){
                            // list only directories
                            return new FileOrFolder(await directoryChecksum(file), file, fullFileName, stats.mtime);
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
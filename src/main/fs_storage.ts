import * as fs from "fs";
import {promisify} from "util";
import {CATEGORIES, FileOrFolder, FilesStructure, base64Encode, FileMetadata} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";
import YAML from "yaml";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

function getMetadata(file:string) {
    const path = file+".yaml";
    if(fs.existsSync(path) && fs.statSync(path).isFile()){
        try {
            return <FileMetadata>YAML.parse(fs.readFileSync(path).toString());
        } catch (e) {
            console.log(`Error while parsing metadata of file ${file}`);
            console.log(e);
        }
    }
    const newMetadata = new FileMetadata();
    fs.writeFileSync(path, YAML.stringify(newMetadata));
    return newMetadata;
}

async function getThumbnail(file:string){
    return (await Promise.all([".png", ".jpeg", ".jpg"]
        // try encoding the image to base64
        .map(async ext=>{
            const path=file+ext;
            if(fs.existsSync(path) && fs.statSync(path).isFile()){
                return await base64Encode(fs.readFileSync(path));
            } else {
                return null;
            }
        })))
        // return first success
        .reduce((prev, curr)=>curr ? curr : prev) || "";
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
                        const filePath=join(categoryPath, file);
                        let stats;
                        try {
                            stats=await statPromise(filePath);
                        } catch(err){
                            // stat error, the file was deleted in the process of scanning, skip file
                            // console.log(err);
                            return null;
                        }
                        if(stats.isDirectory()){
                            // list only directories
                            return new FileOrFolder(file, filePath, stats.mtime, await getThumbnail(filePath), getMetadata(filePath));
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
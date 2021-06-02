import * as fs from "fs";
import {promisify} from "util";
import {CATEGORIES, FileOrFolder, FilesStructure, base64Encode, FileMetadata} from "./file_commons";
import { join } from "path";
import Storage from "./storage_";
import YAML from "yaml";
import ScriptExecutor from "./ScriptExecutor";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);
const mkdirPromise = promisify(fs.mkdir);

export function getMetadata(file:string) {
    const path = file+".yaml";
    if(fs.existsSync(path) && fs.statSync(path).isFile()){
        try {
            return <FileMetadata>YAML.parse(fs.readFileSync(path).toString());
        } catch (e) {
            console.log(`Error while parsing metadata of file ${file}`);
            console.log(e);
        }
    }
    return null;
}

function getOrCreateMetadata(file:string){
    const metadata = getMetadata(file);
    if(metadata){
        return metadata;
    } else {
        const path = file+".yaml";
        const newMetadata = new FileMetadata();
        fs.writeFileSync(path, YAML.stringify(newMetadata));
        return newMetadata;
    }
}

function setMetadata(file:string, newMetadata:FileMetadata) {
    const path = file+".yaml";
    fs.writeFileSync(path, YAML.stringify(newMetadata));
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


export class FsStorageConfiguration {
    path:string;
    scriptExecutor:ScriptExecutor;

    constructor(path:string, scriptExecutor:ScriptExecutor){
        this.path=path;
        this.scriptExecutor=scriptExecutor;
    }
};

async function folderLastModification(folder:string){
    const files = await readdirPromise(folder);
    let lastModified=(await statPromise(folder)).mtime;
    await Promise.all(files.map(async file=>{
        file=join(folder, file);
        const fileLastModified = (await statPromise(file)).mtime;
        if(fileLastModified>lastModified){
            lastModified=fileLastModified;
        }
        if((await statPromise(file)).isDirectory()){
            const folderLastModified=await folderLastModification(file);
            if(folderLastModified>lastModified){
                lastModified=fileLastModified;
            }
        }
    }));
    return lastModified;
}

async function optionallyCreateFolder(path:string){
    try {
        await mkdirPromise(path, {recursive: true});
    } catch(err){}
}

export default class FsStorage implements Storage<FsStorageConfiguration> {
    path:string | undefined;
    scriptExecutor:ScriptExecutor | undefined;
    async handleAction(action:string, folder:string, name:string, args:unknown){
        if(["addAction", "editAction", "deleteAction", "runAction", "editDescription"].includes(action) && this.path){
            const casted_args=<string[]>args;
            const path=join(this.path, folder, name);
            let metadata=getMetadata(path);

            if(!metadata){
                metadata=new FileMetadata();
            }
            if(action=="addAction" || action=="editAction"){
                metadata.actions[(<string[]>args)[0]]= (<string[]>args)[1];
                setMetadata(path, metadata);
            } else if(action=="deleteAction"){
                delete metadata.actions[casted_args[0]];
                setMetadata(path, metadata);
            }
            if(action=="runAction" && this.scriptExecutor){
                const actionName=casted_args[0];
                const actionCode=<string|undefined>casted_args[1];
                if(actionCode){
                    metadata.actions[actionName]=actionCode;
                    setMetadata(path, metadata);
                }
                this.scriptExecutor.execute(metadata.actions[actionName] || "", [
                    {name: "name", value:name},
                    {name: "path", value:path},
                    {name: "action", value:actionName}
                ]);
            }
            if(action=="editDescription") {
                metadata.description=casted_args[0];
                setMetadata(path, metadata);
            }
            return true;
        }
        else return false;
    }
    connect(configuration:FsStorageConfiguration):Promise<void>{
        this.path = configuration.path;
        this.scriptExecutor=configuration.scriptExecutor;
        return new Promise((resolve, reject)=>resolve());
    }
    onChange(callback: (messege : string)=>void){
        if(!this.path){
            throw new Error("You must call connect before onChange.");
        }
        // event is either change or rename
        fs.watch(this.path, {recursive: true}, (event, filename)=>callback(`File or folder "${filename}" was `+event+"d"));
    }
    async getFolders():Promise<FilesStructure>{
        if(!this.path){
            throw new Error("You must call connect before getFolders.");
        }
        const result=new Map<string, FileOrFolder[]>();
        const path=<string>this.path;
        await optionallyCreateFolder(path);
        await Promise.all(CATEGORIES.map(
            async category=>{
                const categoryPath=join(path, category);
                await optionallyCreateFolder(categoryPath);
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
                        return new FileOrFolder(file, filePath, await folderLastModification(filePath), await getThumbnail(filePath), getOrCreateMetadata(filePath));
                    } else {
                        return null;
                    }
                }))).filter(e=>e!=null);
                result.set(category, filesData);
            }
        ));
        return result;
    }
}
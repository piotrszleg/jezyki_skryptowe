import { Storage as MegajsPackageStorage, MutableFile } from 'megajs';
import {CATEGORIES, FileOrFolder, FilesStructure} from "./file_commons";
import {EventEmitter} from "events";
import Storage from "./storage_";
import { LOCAL_PATH } from "./fs_storage";
import { join } from "path";
import fs from "fs";
import archiver from "archiver";
import unzipper from "unzipper";

const ROOT_FOLDER_ID="MOp01QxZ";

export class MegaJsStorageCredentials {
    email:string;
    password:string;
    constructor(email:string, password:string){
        this.email = email;
        this.password=password;
    }
};

function mapFilter<S, R>(collection:readonly S[], f:(element:S)=>(R|null)){
    const result=[];
    for(const element of collection){
        const fResult=f(element);
        if(fResult!=null){
            result.push(fResult);
        }
    }
    return result;
}

const throwIfError=(error:any)=>{if(error){throw error;}};

class Resolver {
    counter=0;
    callback:()=>void;
    resolve:()=>void;
    borrow(){
        this.counter++;
    }
    finishBorrowing(){
        if(this.counter<=0){
            this.resolve();
        }
    }
    constructor(resolve:()=>void){
        this.resolve=resolve;
        this.callback=()=>{
            this.counter--;
            if(this.counter<=0){
                this.resolve();
            }
        }
    }
}

export class MegajsStorage implements Storage<MegaJsStorageCredentials> {
    storage: MegajsPackageStorage|null=null;
    rootFolder: MutableFile|null=null;
    categories:Map<string, MutableFile>=new Map<string, MutableFile>();

    async handleAction(action:string, folder:string, name:string){
        if(action=="Upload"){
            await this.upload(<string>folder, <string>name);
            return true;
        } else if (action=="Download"){
            await this.download(<string>folder, <string>name);
            return true;
        } else {
            return false;
        }
    }

    connect(credentials:MegaJsStorageCredentials):Promise<void>{
        return new Promise((resolve, reject)=>{
            try {
                this.storage = new MegajsPackageStorage(credentials, (error:string|null)=>{
                    if(error){
                        reject(error);
                    }
                    if(!this.storage?.root?.children){
                        reject("There is no storage root.");
                    }
                    const rootFolder=this.storage?.root?.children.find(f=>f.nodeId==ROOT_FOLDER_ID);
                    if(!rootFolder){
                        reject("Root folder id must be invalid.");
                    }
                    this.rootFolder=<MutableFile>rootFolder;
                    resolve();
                });
            } catch(err) {
                reject(err);
            }
        });
    }
    
    download(category:string, file:string):Promise<void>{
        return new Promise<void>((resolve, reject) =>{
            const folder=this.categories.get(category);
            if(!folder){
                throw new Error("There is no folder to download from.");
            }
            const megaFile=folder.children.find(megaFile=>megaFile.name==file+".zip");
            if(!megaFile){
                throw new Error("There is no file that was supposed to be downloaded.");
            }

            const localPath=join(LOCAL_PATH, category, file);

            function deleteOldFiles(resolver:Resolver){
                console.log("Started deleting old files");
                function deleteLocalFile(file:string){
                    if(fs.existsSync(file)){
                        resolver.borrow();
                        fs.unlink(file, resolver.callback);
                    }
                }
                if(fs.existsSync(localPath)){
                    resolver.borrow();
                    fs.rmdir(localPath, { recursive: true }, resolver.callback);
                }
                deleteLocalFile(localPath+".txt");
                deleteLocalFile(localPath+".png");
                deleteLocalFile(localPath+".jpeg");
                deleteLocalFile(localPath+".jpg");
                resolver.finishBorrowing();
            }

            const deleteResolver=new Resolver(()=>{
                console.log("Finished deleting old files");
                
                const zipPath=localPath+".zip";

                const resolver=new Resolver(()=>{
                    console.log("Finished downloading "+file);
                    resolve();
                });

                resolver.borrow();
                megaFile.download().pipe(fs.createWriteStream(zipPath)).on('finish', ()=>{
                    console.log("Finished writing to temp zip file "+zipPath);
                    fs.createReadStream(zipPath)
                        .pipe(unzipper.Extract({ path: localPath })).on('finish', ()=>{
                            fs.unlink(zipPath, throwIfError);
                            resolver.callback();
                        });
                });

                function downloadFile(file:string){
                    const megaFile=folder?.children.find(megaFile=>megaFile.name==file);
                    if(megaFile){
                        resolver.borrow();
                        megaFile.download().pipe(fs.createWriteStream(join(LOCAL_PATH, category, file))).on('finish', resolver.callback);
                    }
                }
                
                downloadFile(file+".txt");
                downloadFile(file+".png");
                downloadFile(file+".jpeg");
                downloadFile(file+".jpg");
                resolver.finishBorrowing();
            });

            deleteOldFiles(deleteResolver);
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

            const resolver=new Resolver(()=>{
                console.log("Finished uploading "+file);
                resolve();
            });

            function deleteRemoteFile(file:string){
                const megaFile=folder?.children.find(megaFile=>megaFile.name==file);
                if(megaFile){
                    resolver.borrow();
                    // delete previous file 
                    (<MutableFile>megaFile).delete(true, resolver.callback);
                }
            }
            deleteRemoteFile(file+".zip");
            deleteRemoteFile(file+".txt");
            deleteRemoteFile(file+".png");
            deleteRemoteFile(file+".jpeg");
            deleteRemoteFile(file+".jpg");
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            
            // upload current zipped directory 
            resolver.borrow();
            const tempFileName = join(__dirname, 'temp.zip');
            const output = fs.createWriteStream(tempFileName);
            archive.on("error", throwIfError);
            archive.directory(join(LOCAL_PATH, category, file), false);
            archive.pipe(output).on('finish', ()=>{
                if(folder){// this check is only for typechecker
                    fs.createReadStream(tempFileName).pipe(folder.upload(file+".zip")).on('finish', resolver.callback);
                    fs.unlink(tempFileName, throwIfError);
                }
            });
            archive.finalize();
            
            // upload thumbnail 
            function uploadFileIfExists(file:string){
                const path=join(LOCAL_PATH, category, file);
                if(folder && fs.existsSync(path)){
                    resolver.borrow();
                    fs.createReadStream(path).pipe(folder.upload(file)).on('finish', resolver.callback);
                }
            }
            uploadFileIfExists(file+".txt");
            uploadFileIfExists(file+".png");
            uploadFileIfExists(file+".jpeg");
            uploadFileIfExists(file+".jpg");
            resolver.finishBorrowing();
        });
    }
    onChange(callback: (message : string)=>void){
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
                        
                        const zipExtension=".zip";
                        if(category_folder!=undefined && category_folder.children!=undefined){
                            result.set(category, mapFilter(category_folder.children,
                                f=>f.name.endsWith(zipExtension)
                                    ? new FileOrFolder(
                                    f.name.substring(0, f.name.length-zipExtension.length), 
                                    "https://mega.nz/fm/"+f.nodeId, 
                                    new Date(f.timestamp*1000))
                                    : null
                                ));
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
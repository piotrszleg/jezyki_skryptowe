import { Storage as MegajsPackageStorage, MutableFile, File as MFile } from 'megajs';
import {CATEGORIES, FileOrFolder, FilesStructure, base64Encode, FileMetadata} from "./file_commons";
import {EventEmitter} from "events";
import Storage from "./storage_";
import { join } from "path";
import fs from "fs";
import archiver from "archiver";
import unzipper from "unzipper";
import YAML from "yaml";
import {getMetadata as getLocalMetadata} from "./fs_storage";

const BIG_FILE_SIZE=3000000;

const THUMBNAIL_EXTENSIONS = [".png",".jpeg", ".jpg"];
const ADDITIONAL_FILES_EXTENSIONS = THUMBNAIL_EXTENSIONS.concat([".yaml"]);
function forAdditionalFiles(basePath:string, callback:(file:string)=>void){
    ADDITIONAL_FILES_EXTENSIONS.forEach(ext=>callback(basePath+ext));
}

function extractMegaID(url:string){
    const splitted=url.split("/");
    return splitted[splitted.length-1];
}

type Confirmation = (message:string)=>Promise<boolean>;
type EventAction = (category:string, file:string, action:string)=>Promise<void>

export class MegaJsStorageConfiguration {
    email:string;
    password:string;
    remoteFolder:string;
    localFolder:string;
    askBeforeDownloadingBigFiles:()=>boolean;
    confirmationDialog:Confirmation;
    eventAction:EventAction;
    constructor(email:string, password:string, localFolder:string, remoteFolder:string, 
        askBeforeDownloadingBigFiles:()=>boolean, confirmationDialog:Confirmation, eventAction:EventAction){
        this.email = email;
        this.password=password;
        this.localFolder = localFolder;
        this.remoteFolder=remoteFolder;
        this.askBeforeDownloadingBigFiles=askBeforeDownloadingBigFiles;
        this.confirmationDialog=confirmationDialog;
        this.eventAction=eventAction;
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

        const savedThis=this;
        this.callback=()=>{
            savedThis.counter--;
            if(savedThis.counter<=0){
                savedThis.resolve();
            }
        }
    }
}

function getThumbnail(folder:MFile, basename:string){
    return new Promise<string>((resolve, reject) =>{
        const file=folder.children.find(f=>f.name.includes(basename) && THUMBNAIL_EXTENSIONS.some(e=>f.name.endsWith(e)));
        if(file){
            const stream=file.download();
            var bufs:Buffer[] = [];
            stream.on('data', function(d){ bufs.push(d); });
            stream.on('end', function(){
                var buf = Buffer.concat(bufs);
                base64Encode(buf).then(value=>value ? resolve(value) : resolve(""));
            });
        } else {
            resolve("");
        }
    })
}

function getMetadata(folder:MFile, basename:string){
    return new Promise<FileMetadata|null>((resolve, reject) =>{
        const file=folder.children.find(f=>f.name==basename+".yaml");
        if(file){
            const stream=file.download();
            var bufs:Buffer[] = [];
            stream.on('data', function(d){ bufs.push(d); });
            stream.on('end', function(){
                try {
                    var buf = Buffer.concat(bufs);
                    resolve(<FileMetadata>YAML.parse(buf.toString()));
                } catch (e) {
                    console.log(`Error while parsing metadata of file ${basename}`);
                    console.log(e);
                    resolve(null);
                }
            });
        }else {
            resolve(null);
        }
    })
}

export class MegajsStorage implements Storage<MegaJsStorageConfiguration> {
    storage: MegajsPackageStorage|null=null;
    rootFolder: MutableFile|null=null;
    categories:Map<string, MutableFile>=new Map<string, MutableFile>();
    localFolder:string="";
    askBeforeDownloadingBigFiles:()=>boolean=()=>true;
    confirmationDialog:Confirmation=async ()=>true;
    eventAction:EventAction=async ()=>{};

    async handleAction(action:string, folder:string, name:string, args:unknown){
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

    connect(configuration:MegaJsStorageConfiguration):Promise<void>{
        this.localFolder=configuration.localFolder;
        this.confirmationDialog=configuration.confirmationDialog;
        this.askBeforeDownloadingBigFiles=configuration.askBeforeDownloadingBigFiles;
        this.eventAction=configuration.eventAction;
        return new Promise((resolve, reject)=>{
            try {
                const credentials={email:configuration.email, password:configuration.password};
                this.storage = new MegajsPackageStorage(credentials, (error:string|null)=>{
                    if(error){
                        reject(error);
                    }
                    if(!this.storage?.root?.children){
                        reject("There is no storage root.");
                    }
                    const rootFolderID=extractMegaID(configuration.remoteFolder);
                    const rootFolder=this.storage?.root?.children.find(f=>f.nodeId==rootFolderID);
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

    deleteOldFiles(localPath:string){
        return new Promise<void>((resolve, reject)=>{
            const resolver=new Resolver(resolve);
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
            forAdditionalFiles(localPath, deleteLocalFile);
            resolver.finishBorrowing();
        });
    }

    downloadNewFiles(localPath:string, file:string, category:string, folder:MutableFile, megaFile:MutableFile){
        return new Promise<void>((resolve, reject)=>{
                
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

                const localFolder=this.localFolder;
                function downloadFile(file:string){
                    const megaFile=folder?.children.find(megaFile=>megaFile.name==file);
                    if(megaFile){
                        resolver.borrow();
                        megaFile.download().pipe(fs.createWriteStream(join(localFolder, category, file))).on('finish', resolver.callback);
                    }
                }
                
                forAdditionalFiles(file, downloadFile);
                resolver.finishBorrowing();
            });
    }
    
    async download(category:string, file:string):Promise<void>{
            const folder=this.categories.get(category);
            if(!folder){
                throw new Error("There is no folder to download from.");
            }
            const megaFile=folder.children.find(megaFile=>megaFile.name==file+".zip");
            if(!megaFile){
                throw new Error("There is no file that was supposed to be downloaded.");
            }

            const localPath=join(this.localFolder, category, file);

            const remoteMetadata=await getMetadata(folder, file);
            const localMetadata=getLocalMetadata(localPath);
            if(localMetadata?.actions["onBeforeDownload"] && localMetadata?.actions["onBeforeDownload"]!=""){
                await this.eventAction(category, file, "onBeforeUpload");
            }
            if(remoteMetadata && localMetadata && remoteMetadata.uuid!=localMetadata.uuid){
                if(! await this.confirmationDialog("The local file has different UUID than downloaded, are you sure you want to override it?")){
                    console.log("User cancelled download");
                    // user decided not to download this file
                    return;
                } else {
                    console.log("User proceeded with download");
                }
            }

            if(megaFile.size>=BIG_FILE_SIZE && this.askBeforeDownloadingBigFiles()){
                if(! await this.confirmationDialog(`Are you sure you want to download a file of size ${megaFile.size}B`)){
                    console.log("User cancelled download");
                    // user decided not to download this file
                    return;
                } else {
                    console.log("User proceeded with download");
                }
            }

            await this.deleteOldFiles(localPath);
            
            console.log("Finished deleting old files");

            await this.downloadNewFiles(localPath, file, category, folder, <MutableFile>megaFile);
    }

    uploadNewFiles(folder:MutableFile, category:string, file:string){
        return new Promise<void>((resolve, reject) =>{
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
            forAdditionalFiles(file, deleteRemoteFile);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            
            // upload current zipped directory 
            resolver.borrow();
            const tempFileName = join(this.localFolder, category, 'temp.zip');
            const output = fs.createWriteStream(tempFileName);
            archive.on("error", throwIfError);
            archive.directory(join(this.localFolder, category, file), false);
            archive.pipe(output).on('finish', ()=>{
                if(folder){// this check is only for typechecker
                    fs.createReadStream(tempFileName).pipe(folder.upload(file+".zip").on('error', reject).on("complete", resolver.callback));
                    fs.unlink(tempFileName, throwIfError);
                } else {
                    resolver.callback();
                }
            });
            archive.finalize();
            
            const localFolder=this.localFolder;
            // upload thumbnail 
            function uploadFileIfExists(file:string){
                const path=join(localFolder, category, file);
                if(folder && fs.existsSync(path)){
                    resolver.borrow();
                    fs.createReadStream(path).pipe(folder.upload(file, undefined, resolver.callback));
                }
            }
            forAdditionalFiles(file, uploadFileIfExists);
            resolver.finishBorrowing();
        });
    }

    async upload(category:string, file:string){
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
        const remoteMetadata=await getMetadata(folder, file);
        const localMetadata=getLocalMetadata(join(this.localFolder, category, file));
        if(localMetadata?.actions["onBeforeUpload"] && localMetadata?.actions["onBeforeUpload"]!=""){
            await this.eventAction(category, file, "onBeforeUpload");
        }
        if(remoteMetadata && localMetadata && remoteMetadata.uuid!=localMetadata.uuid){
            if(! await this.confirmationDialog("The remote file has different UUID than uploaded, are you sure you want to override it?")){
                console.log("User cancelled upload");
                // user decided not to download this file
                return;
            } else {
                console.log("User proceeded with download");
            }
        }
        await this.uploadNewFiles(folder, category, file);
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
            const awaited:Promise<any>[]=[];
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
                                f=>{
                                    if(f.name.endsWith(zipExtension)){
                                        const basename=f.name.substring(0, f.name.length-zipExtension.length);
                                        const thumbnail=getThumbnail(category_folder, basename);
                                        awaited.push(thumbnail);
                                        const metadata=getMetadata(category_folder, basename);
                                        awaited.push(metadata);
                                        const result = new FileOrFolder(
                                            basename,
                                            "https://mega.nz/fm/"+f.nodeId, 
                                            new Date(f.timestamp*1000),
                                            "",new FileMetadata());
                                        thumbnail.then(v=>result.image=v);
                                        metadata.then(v=>result.metadata=v|| new FileMetadata());
                                        return result;
                                    } 
                                    else return null;
                                }));
                        } else {
                            result.set(category, []);
                        }
                    })
                    Promise.all(awaited).then(_=>resolve(result));
                } else {
                    reject("Configured root folder doesn't exist.")
                }
            }
        });
    }
}
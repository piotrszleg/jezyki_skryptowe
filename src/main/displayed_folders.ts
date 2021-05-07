import {FilesStructure, CATEGORIES} from "./file_commons";
import fs from "fs";
import Jimp from "Jimp";
import YAML from "yaml";
import { v4 as uuid } from 'uuid';

type Action = "Train" | "Upload" | "Download";

export class FileMetadata {
    uuid: string = uuid();
    description: string = "";
    actions:Map<string, string> = new Map<string, string>(
        ["Train",
        "onAfterDownload",
        "onApplicationStarts",
        "onBeforeUpload",
        "onBeforeShown"]
        .map(e=>[e, ""])
    );
}

class DisplayedFile {
    name:string;
    mdate:Date;
    description:string;
    image:string;
    actions:Action[];
    metadata:FileMetadata;

    constructor(name:string, image:string, mdate:Date, actions:Action[], metadata:FileMetadata){
        this.name = name;
        this.description = metadata.description;
        this.image = image;
        this.mdate = mdate;
        this.actions = actions;
        this.metadata = metadata;
    }
}

export type DisplayedFilesStructure = Map<string, DisplayedFile[]>;

async function base64Encode(file:string) {
    try {
        if(fs.existsSync(file) && fs.statSync(file).isFile()){
            const image = await Jimp.read(fs.readFileSync(file));
            await image.resize(100, 100);
            await image.quality(0.5);
            
            return await image.getBase64Async(Jimp.MIME_PNG);
        }
    } catch(err){
        console.log("Error while processing image %s:\n%s", file, err);
    }
    return null;
}

async function getThumbnail(file:string){
    return <string>(await Promise.all([".png", ".jpeg", ".jpg"]
        // try encoding the image to base64
        .map(async ext=>await base64Encode(file+ext))))
        // return first success
        .reduce((prev, curr)=>curr ? curr : prev);
}

function getMetadata(file:string) {
    const path = file+".yaml";
    if(fs.existsSync(path) && fs.statSync(path).isFile()){
        try {
            return <FileMetadata>YAML.parse(fs.readFileSync(path).toString());
        } catch (e) {
            console.log(e);
        }
    }
    const newMetadata = new FileMetadata();
    fs.writeFileSync(path, YAML.stringify(newMetadata));
    return newMetadata;
}

// https://www.w3resource.com/javascript-exercises/javascript-date-exercise-44.php
function diffMinutes(dt2:Date, dt1:Date) {
    const diff = (dt2.getTime() - dt1.getTime()) / 1000 / 60;
    return Math.abs(Math.round(diff));
 }

export async function createDisplayedFolders(localFiles: FilesStructure, remoteFiles: FilesStructure) : Promise<DisplayedFilesStructure> {
    const result=new Map<string, DisplayedFile[]>();
    const promises:Promise<any>[]=[];

    for(let category of CATEGORIES){
        const categoryMap = new Map<string, DisplayedFile>();

        const localCategoryFiles=localFiles.get(category);
        if(localCategoryFiles!=undefined){
            for(let file of localCategoryFiles){
                // file is in local storage
                const displayedFile=new DisplayedFile(file.name, "", file.mdate, ["Train", "Upload"], getMetadata(file.path));
                promises.push(getThumbnail(file.path).then(encodedImage=>displayedFile.image=encodedImage));
                categoryMap.set(file.name, displayedFile);
            }
        }

        const remoteCategoryFiles=remoteFiles.get(category);
        if(remoteCategoryFiles!=undefined){
            for(let file of remoteCategoryFiles){
                let displayedFile=categoryMap.get(file.name);
                if(displayedFile!=undefined) {
                    // remove upload option if folders' dates are close
                    // 30 minutes here is arbitrary, maybe it could be moved to config
                    if(diffMinutes(displayedFile.mdate, file.mdate)<=30){
                        displayedFile.actions=displayedFile.actions.filter(a=>a!="Upload");
                    } else if(displayedFile.mdate<file.mdate){
                        // remote has newer version of the file 
                        displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Train", "Download"], displayedFile.metadata);
                        categoryMap.set(file.name, displayedFile);
                    }
                } else {
                    // file is only on remote 
                    displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Download"], new FileMetadata());
                    categoryMap.set(file.name, displayedFile);
                }
            }
        }
        
        result.set(category, [...categoryMap.values()]);
    }
    await Promise.all(promises);

    return result;
}
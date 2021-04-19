import {FilesStructure, CATEGORIES} from "./file_commons";
import fs from "fs";
import Jimp from "Jimp";


type Action = "Train" | "Upload" | "Download";

class DisplayedFile {
    name:string;
    mdate:Date;
    description:string;
    image:string;
    actions:Action[];

    constructor(name:string, description:string, image:string, mdate:Date, actions:Action[]){
        this.name = name;
        this.description = description;
        this.image = image;
        this.mdate = mdate;
        this.actions = actions;
    }
}

export type DisplayedFilesStructure = Map<string, DisplayedFile[]>;

async function base64Encode(file:string) {
    try {
        if(fs.statSync(file).isFile()){
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
    return <string>(await Promise.all([".png", ".jpeg", "jpg"]
        // try encoding the image to base64
        .map(async ext=>await base64Encode(file+ext))))
        // return first success
        .reduce((prev, curr)=>curr ? curr : prev);
}

function getDescription(file:string) {
    const path = file+".txt";
    if(fs.existsSync(path) && fs.statSync(path).isFile()){
        return fs.readFileSync(path).toString();
    } else {
        return "";
    }
}

// https://www.w3resource.com/javascript-exercises/javascript-date-exercise-44.php
function diff_minutes(dt2:Date, dt1:Date) {
    const diff =(dt2.getTime() - dt1.getTime()) / 1000;
    return Math.abs(Math.round(diff/60));
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
                const displayedFile=new DisplayedFile(file.name, getDescription(file.path), "", file.mdate, ["Train", "Upload"]);
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
                    // 5 minutes here is arbitrary, maybe it could be moved to config
                    if(diff_minutes(displayedFile.mdate, file.mdate)<=5){
                        displayedFile.actions=displayedFile.actions.filter(a=>a!="Upload");
                    } else if(displayedFile.mdate<file.mdate){
                        // remote has newer version of the file 
                        const displayedFile=new DisplayedFile(file.name, "", "", file.mdate, ["Train", "Download"]);
                        categoryMap.set(file.name, displayedFile);
                    }
                } else {
                    // file is only on remote 
                    displayedFile=new DisplayedFile(file.name, "", "", file.mdate, ["Download"]);
                    categoryMap.set(file.name, displayedFile);
                }
            }
        }
        
        result.set(category, [...categoryMap.values()]);
    }
    await Promise.all(promises);

    return result;
}
import {FilesStructure, CATEGORIES} from "./file_commons";
import fs from "fs";
import Jimp from "Jimp";

class DisplayedFile {
    name:string;
    mdate:Date;
    description:string;
    image:string;
    allowTrain:boolean=false;
    allowUpload:boolean=false;
    allowDownload:boolean=false;

    constructor(name:string, description:string, image:string, mdate:Date){
        this.name = name;
        this.description = description;
        this.image = image;
        this.mdate = mdate;
    }
}

export type DisplayedFilesStructure = Map<string, DisplayedFile[]>;

async function base64_encode(file:string) {
    try {
        if(fs.statSync(file).isFile()){
            const image = await Jimp.read(fs.readFileSync(new Buffer(file)));
            await image.resize(100, 100);
            await image.quality(0.5);
            
            return await image.getBase64Async(Jimp.MIME_JPEG);
        }
    } catch(err){
        console.log("Error while processing image %s:\n%s", file, err);
    }
    return "";
}


export async function createDisplayedFolders(localFiles: FilesStructure, remoteFiles: FilesStructure) : Promise<DisplayedFilesStructure> {
    const result=new Map<string, DisplayedFile[]>();

    for(let category of CATEGORIES){
        const categoryMap = new Map<string, DisplayedFile>();

        const localCategoryFiles=localFiles.get(category);
        if(localCategoryFiles!=undefined){
            for(let file of localCategoryFiles){
                // file is in local storage 
                const displayedFile=new DisplayedFile(file.name, "", "", file.mdate);
                displayedFile.allowTrain=true;
                displayedFile.allowUpload=true;
                categoryMap.set(file.name, displayedFile);
            }
        }

        const remoteCategoryFiles=remoteFiles.get(category);
        if(remoteCategoryFiles!=undefined){
            for(let file of remoteCategoryFiles){
                let displayedFile=categoryMap.get(file.name);
                if(displayedFile!=undefined) {
                    if(displayedFile.mdate<file.mdate){
                        // remote has newer version of the file 
                        const displayedFile=new DisplayedFile(file.name, "", "", file.mdate);
                        displayedFile.allowDownload=true;
                        categoryMap.set(file.name, displayedFile);
                    }
                } else {
                    // file is only on remote 
                    displayedFile=new DisplayedFile(file.name, "", "", file.mdate);
                    displayedFile.allowDownload=true;
                    categoryMap.set(file.name, displayedFile);
                }
            }
        }

        result.set(category, [...categoryMap.values()]);
    }

    return result;
}
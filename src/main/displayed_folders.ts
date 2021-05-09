import {FilesStructure, CATEGORIES} from "./file_commons";
import fs from "fs";
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

export function createDisplayedFolders(localFiles: FilesStructure, remoteFiles: FilesStructure) : DisplayedFilesStructure {
    const result=new Map<string, DisplayedFile[]>();
    
    for(let category of CATEGORIES){
        const categoryMap = new Map<string, DisplayedFile>();

        const localCategoryFiles=localFiles.get(category);
        if(localCategoryFiles!=undefined){
            for(let file of localCategoryFiles){
                // file is in local storage
                const displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Train", "Upload"], getMetadata(file.path));
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

    return result;
}
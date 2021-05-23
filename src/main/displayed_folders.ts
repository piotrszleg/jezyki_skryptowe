import {FilesStructure, CATEGORIES, FileMetadata} from "./file_commons";

type Action = "Train" | "Upload" | "Download";

class DisplayedFile {
    name:string;
    mdate:Date;
    description:string;
    image:string;
    actions:Action[];
    metadata:FileMetadata;
    local:boolean;

    constructor(name:string, image:string, mdate:Date, actions:Action[], metadata:FileMetadata, local:boolean) {
        this.name = name;
        this.description = metadata.description;
        this.image = image;
        this.mdate = mdate;
        this.actions = actions;
        this.metadata = metadata;
        this.local=local;
    }
}

export type DisplayedFilesStructure = Map<string, DisplayedFile[]>;

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
                const displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Train", "Upload"], file.metadata, true);
                categoryMap.set(file.name, displayedFile);
            }
        }

        const remoteCategoryFiles=remoteFiles.get(category);
        if(remoteCategoryFiles!=undefined){
            for(let file of remoteCategoryFiles){
                let displayedFile=categoryMap.get(file.name);
                if(displayedFile!=undefined) {
                    // remove upload option if folders' dates are close
                    // 1 minute here is arbitrary, maybe it could be moved to config
                    if(diffMinutes(displayedFile.mdate, file.mdate)<=2){
                        displayedFile.actions=displayedFile.actions.filter(a=>a!="Upload");
                    } else if(displayedFile.mdate<file.mdate){
                        // remote has newer version of the file 
                        displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Train", "Download"], displayedFile.metadata, true);
                        categoryMap.set(file.name, displayedFile);
                    }
                } else {
                    // file is only on remote 
                    displayedFile=new DisplayedFile(file.name, file.image, file.mdate, ["Download"], file.metadata, false);
                    categoryMap.set(file.name, displayedFile);
                }
            }
        }
        
        result.set(category, [...categoryMap.values()]);
    }

    return result;
}
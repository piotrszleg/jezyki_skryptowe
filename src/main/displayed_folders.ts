import {FilesStructure, CATEGORIES} from "./file_commons";

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

function createDisplayedFolders(localFiles: FilesStructure, remoteFiles: FilesStructure) : DisplayedFilesStructure {
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

        const remoteCategoryFiles=localFiles.get(category);
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
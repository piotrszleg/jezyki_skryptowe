import Jimp from "Jimp";
import { v4 as uuid } from 'uuid';

export const CATEGORIES=[
    "datasets",
    "models",
    "generators",
    "programs",
];

type Actions = {
    [key: string]: string;
  };

export class FileMetadata {
    uuid: string = uuid();
    description: string = "";
    actions:Actions ={
        "Train":"",
        "onAfterDownload":"",
        "onApplicationStarts":"",
        "onBeforeUpload":"",
        "onBeforeShown":""
    }
}

export class FileOrFolder {
    name: string;
    path:string;
    mdate:Date;
    image:string;
    metadata:FileMetadata;

    constructor(name:string, path:string, mdate:Date, image:string, metadata:FileMetadata){
        this.name=name;
        this.path=path;
        this.mdate=mdate;
        this.image=image;
        this.metadata=metadata;
    }
}

export async function base64Encode(buffer:Buffer) {
    try {
        const image = await Jimp.read(buffer);
        await image.resize(100, 100);
        await image.quality(0.5);
            
        const encoded=await image.getBase64Async(Jimp.MIME_PNG);
        return encoded;
    } catch(err){
        console.log("Error while processing image:\n%s", err);
        return null;
    }
}

export type FilesStructure = Map<string, FileOrFolder[]>;
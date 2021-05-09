import Jimp from "Jimp";

export const CATEGORIES=[
    "datasets",
    "models",
    "generators",
    "programs",
];

export class FileOrFolder {
    checksum: string;
    name: string;
    path:string;
    mdate:Date;
    image:string;

    constructor(checksum:string, name:string, path:string, mdate:Date, image:string){
        this.checksum=checksum;
        this.name=name;
        this.path=path;
        this.mdate=mdate;
        this.image=image;
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
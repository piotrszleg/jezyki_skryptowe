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

export type FilesStructure = Map<string, FileOrFolder[]>;
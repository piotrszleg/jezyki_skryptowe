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
    constructor(checksum:string, name:string, path:string, mdate:Date){
        this.checksum=checksum;
        this.name=name;
        this.path=path;
        this.mdate=mdate;
    }
}

export type FilesStructure = Map<string, FileOrFolder[]>;
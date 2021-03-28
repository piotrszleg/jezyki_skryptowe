export const CATEGORIES=[
    "datasets",
    "models",
    "generators",
    "programs",
];

export class FileOrFolder {
    name: string;
    path:string;
    mdate:Date;
    constructor(name:string, path:string, mdate:Date){
        this.name=name;
        this.path=path;
        this.mdate=mdate;
    }
}
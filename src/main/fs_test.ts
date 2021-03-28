import * as fs from "fs";
import {promisify} from "util";
import {basename, extname} from "path";

const LOCAL_PATH = "E:/jezyki_skryptowe";
const CATEGORIES=[
    "datasets",
    "models",
    "generators",
    "programs",
];

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

class FileOrFolder {
    name: string;
    path:string;
    mdate:Date;
    constructor(name:string, path:string, mdate:Date){
        this.name=name;
        this.path=path;
        this.mdate=mdate;
    }
}


export default async function print_local_files(){
    const result=new Map<string, FileOrFolder[]>();
    try {
        await Promise.all(CATEGORIES.map(async category=>{
            const categoryPath=LOCAL_PATH+"/"+category
            const files=await readdirPromise(categoryPath);
            const filesData:FileOrFolder[]=await Promise.all(files.map(async (file:string)=>{
                const fullFileName=categoryPath+"/"+file;
                try {
                    const date=(await statPromise(fullFileName)).mtime;
                    return new FileOrFolder(basename(file, extname(file)), fullFileName, date);
                } catch(err){
                    // stat error, print it and use current Date
                    console.log(err);
                    return new FileOrFolder(basename(file, extname(file)), fullFileName, new Date());
                }
            }));
            result.set(category, filesData);
        }));
        console.log(result);
    } catch(error){
        console.log(error);
    }
}
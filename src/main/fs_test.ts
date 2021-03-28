import * as fs from "fs";
import {promisify} from "util";
import {basename, extname} from "path";
import {CATEGORIES, FileOrFolder} from "./file_commons";

const LOCAL_PATH = "E:/jezyki_skryptowe";

const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);

export default async function print_local_files(){
    const result=new Map<string, FileOrFolder[]>();
    try {
        await Promise.all(CATEGORIES.map(
        async category=>{
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
import credentials from "./mega_credentials";
import { Storage } from 'megajs';
import {CATEGORIES, FileOrFolder} from "./file_commons";
import {basename, extname} from "path";

const ROOT_FOLDER_ID="MOp01QxZ";

export default async function print_remote_files(){
    let storage = new Storage(credentials, ()=>{
        const rootFolder=storage.root.children.find(f=>f.nodeId==ROOT_FOLDER_ID);
        if(rootFolder!=undefined){
            console.log(rootFolder.children.map(e=>e.name));
            const result=new Map<string, FileOrFolder[]>();
            CATEGORIES.forEach(category=>{
                const category_folder=rootFolder.children.find(f=>f.name==category);
                if(category_folder!=undefined && category_folder.children!=undefined){
                    result.set(category, category_folder.children.map(
                        f=>new FileOrFolder(basename(f.name, extname(f.name)), "https://mega.nz/fm/"+f.nodeId, new Date(f.timestamp*1000))));
                } else {
                    result.set(category, []);
                }
            })
            console.log(result);
        }
    });
}
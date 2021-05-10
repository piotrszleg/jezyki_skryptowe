import {FilesStructure} from "./file_commons";

export default interface Storage<Configuration> {
    connect(configuration:Configuration):Promise<void>;
    onChange(callback: (messege : string)=>void):void;
    getFolders():Promise<FilesStructure>;
    handleAction(action:string, folder:string, name:string, args:unknown):Promise<boolean>;
}
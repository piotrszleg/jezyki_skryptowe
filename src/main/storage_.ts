import {FilesStructure} from "./file_commons";

export default interface Storage<Credentials> {
    connect(credentials:Credentials):Promise<void>;
    onChange(callback: (messege : string)=>void):void;
    getFolders():Promise<FilesStructure>;
    handleAction(action:string, folder:string, name:string):Promise<boolean>;
}
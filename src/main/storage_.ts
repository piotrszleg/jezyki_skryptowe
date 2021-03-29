import {FileOrFolder} from "./file_commons";

export default interface Storage {
    connect():Promise<void>;
    onChange(callback: (messege : string)=>void):void;
    getFolders():Promise<Map<string, FileOrFolder[]>>;
}
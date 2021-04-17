import path from "path";
const Datastore = require("nedb");
import crypto from "crypto";
import { app } from "electron";
import fs from "fs";

const DB_PATH = path.join(app.getPath("appData"), "settings.db");

function connectToDatabase(secret: string) {
    let algorithm = "aes-256-cbc";
    let key = crypto
        .createHash("sha256")
        .update(String(secret))
        .digest("base64")
        .substr(0, 32);

    return new Promise((resolve, reject) => {
        const db= new Datastore({
            filename: DB_PATH,
            autoload: true,
            onload: (error:string|null) => (error ? reject(error) : resolve(db)),
            afterSerialization(plaintext: string) {
                const iv = crypto.randomBytes(16);
                const aes = crypto.createCipheriv(algorithm, key, iv);
                let ciphertext = aes.update(plaintext);
                ciphertext = Buffer.concat([iv, ciphertext, aes.final()]);
                return ciphertext.toString("base64");
            },
            beforeDeserialization(ciphertext: string) {
                const ciphertextBytes = Buffer.from(ciphertext, "base64");
                const iv = ciphertextBytes.slice(0, 16);
                const data = ciphertextBytes.slice(16);
                const aes = crypto.createDecipheriv(algorithm, key, iv);
                let plaintextBytes = Buffer.from(aes.update(data));
                plaintextBytes = Buffer.concat([plaintextBytes, aes.final()]);
                return plaintextBytes.toString();
            },
        });
    });
}

function promisify(fThis:any, f:any){
    return function(...args: any[]){
        return new Promise((resolve, reject)=>{
            f.call(fThis, ...args, (error:string, value:any)=>{
                if(error){
                    reject(error);
                } else {
                    resolve(value);
                }
            });
        })
    }
}

export default class Settings {
    db: typeof Datastore;
    document: any;
    async connectToDatabase(password: string) {
        try {
            this.db = await connectToDatabase(password);
            this.document = await promisify(this.db, this.db.findOne)({ type: "settings" });
            if (this.document == null) {
                throw new Error("Incorrect password.");
            }
        } catch(e){
            throw new Error("Incorrect password.");
        }
    }

    async createDatabase(password: string) {
        if(this.databaseExists()){
            fs.unlinkSync(DB_PATH);
        }
        this.db = await connectToDatabase(password);
        this.document = await (promisify(this.db, this.db.insert.bind)({ type: "settings" }));
    }
    databaseExists() {
        return fs.existsSync(DB_PATH);
    }
    async save(){
        this.db.update({ type: "settings" }, this.document);
        console.log("Settings updated, current state:");
        console.log(await promisify(this.db, this.db.findOne)({ type: "settings" }));
    }
    get megaEmail() {
        return this.document.megaEmail;
    }
    set megaEmail(email) {
        this.document.megaEmail = email;
        this.save();
    }
    get megaPassword() {
        return this.document.megaPassword;
    }
    set megaPassword(password) {
        this.document.password = password;
        this.save();
    }
}

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

    return new Datastore({
        filename: DB_PATH,
        autoload: true,
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
}

export default class Settings {
    db: typeof Datastore;
    document: any;
    async connectToDatabase(password: string) {
        this.db = connectToDatabase(password);
        this.document = await this.db.findOne({ type: "settings" });
        if (this.document == null) {
            this.document = await this.db.insert({ type: "settings" });
        }
    }
    databaseExists() {
        return fs.existsSync(DB_PATH);
    }
    get megaEmail() {
        return this.document.megaEmail;
    }
    set megaEmail(email) {
        this.document.megaEmail = email;
        this.db.update({ type: "settings" }, this.document);
    }
    get megaPassword() {
        return this.document.megaPassword;
    }
    set megaPassword(password) {
        this.document.password = password;
        this.db.update({ type: "settings" }, this.document);
    }
}

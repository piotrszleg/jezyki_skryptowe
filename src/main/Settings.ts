import path from "path";
const Datastore = require("nedb");
import crypto from "crypto";
import { app } from "electron";
import fs from "fs";

const DEFAULT_SETTINGS = {
    megaEmail: "",
    megaPassword: "",
    localPath: "E:/jezyki_skryptowe",
    remotePath: "https://mega.nz/fm/MOp01QxZ",
    autoLogin: false,
    askBeforeDownloadingBigFiles: false,
    trainScript: "python3 {yolo_path} {model} {dataset}",
    generateScript: "python3 {generator} {data_path}",
    runScript: "python3 -m {program}",
    shell: "/bin/sh",
    scriptDefines: [{ name: "data_path", value: "/usr/nnm/data/generated" }],
};

type SettingsContent = typeof DEFAULT_SETTINGS;

const DB_PATH = path.join(app.getPath("appData"), "settings.db");

function connectToDatabase(secret: string) {
    let algorithm = "aes-256-cbc";
    let key = crypto
        .createHash("sha256")
        .update(String(secret))
        .digest("base64")
        .substr(0, 32);

    return new Promise((resolve, reject) => {
        const db = new Datastore({
            filename: DB_PATH,
            autoload: true,
            onload: (error: string | null) =>
                error ? reject(error) : resolve(db),
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

function promisify(fThis: any, f: any) {
    return function (...args: any[]) {
        return new Promise((resolve, reject) => {
            f.call(fThis, ...args, (error: string, value: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(value);
                }
            });
        });
    };
}

export default class Settings {
    db: typeof Datastore;
    document: SettingsContent | null = null;
    async connectToDatabase(password: string) {
        try {
            this.db = await connectToDatabase(password);
            this.document = <SettingsContent>(
                await promisify(this.db, this.db.findOne)({ type: "settings" })
            );
            if (this.document == null) {
                throw new Error("Incorrect password.");
            }
        } catch (e) {
            throw new Error("Incorrect password.");
        }
    }

    async createDatabase(password: string) {
        if (this.databaseExists()) {
            fs.unlinkSync(DB_PATH);
        }
        this.db = await connectToDatabase(password);
        this.document = <SettingsContent>(
            await promisify(
                this.db,
                this.db.insert
            )({ type: "settings", ...DEFAULT_SETTINGS })
        );
    }
    databaseExists() {
        return fs.existsSync(DB_PATH);
    }
    getRaw(): SettingsContent {
        return this.document || DEFAULT_SETTINGS;
    }
    async update(settings: any) {
        this.document = { ...this.document, ...settings };
        await this.save();
    }
    async save() {
        await promisify(this.db, this.db.update)(
            { type: "settings" },
            this.document
        );
    }
    async reset() {
        this.document = { ...this.document, ...DEFAULT_SETTINGS };
        this.save();
    }
    get megaEmail() {
        return this.document?.megaEmail || DEFAULT_SETTINGS.megaEmail;
    }
    set megaEmail(email) {
        if (this.document) {
            this.document.megaEmail = email;
            this.save();
        }
    }
    get megaPassword() {
        return this.document?.megaPassword || DEFAULT_SETTINGS.megaPassword;
    }
    set megaPassword(megaPassword) {
        if (this.document) {
            this.document.megaPassword = megaPassword;
            this.save();
        }
    }
    get remotePath() {
        return this.document?.remotePath || DEFAULT_SETTINGS.remotePath;
    }
    get localPath() {
        return this.document?.localPath || DEFAULT_SETTINGS.localPath;
    }
    get askBeforeDownloadingBigFiles() {
        return this.document?.askBeforeDownloadingBigFiles || DEFAULT_SETTINGS.askBeforeDownloadingBigFiles;
    }
    get autoLogin() {
        return this.document?.autoLogin || DEFAULT_SETTINGS.autoLogin;
    }
}

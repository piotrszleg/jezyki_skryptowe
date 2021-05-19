import Settings from "./Settings";
const { spawn } = require("child_process");

type Defines = {
    name: string;
    value: string;
}[];

export default class ScriptExecutor {
    settings: Settings;
    dataCallback:(output:string)=>void;
    constructor(settings:Settings, dataCallback:(output:string)=>void){
        this.settings = settings;
        this.dataCallback=dataCallback;
    }

    applyDefines(script:string, defines:Defines){
        for(let {name, value} of defines){
            script=script.replace("{"+name+"}", value);
        }
        return script;
    }

    execute(script:string, additionDefines:Defines){
        if(!this.settings.shell.includes(" ")){
            this.dataCallback(`Variable "shell" in settings is not correct, it should be shell name with command argument, for example "powershell /c" or "/bin/sh -c"`);
            return;
        }
        const [shell, argument]=this.settings.shell.split(" ");
        const process = spawn(shell, [argument, this.applyDefines(script, this.settings.scriptDefines.concat(additionDefines))]);
        process.stdout.on("data", (data:Buffer) => {
            this.dataCallback(data.toString());
        });
        process.stderr.on('error', (error:Buffer) => {
            this.dataCallback(error.toString());
        });
        process.on("close", (code:string) => {
            this.dataCallback(`child process exited with code ${code}`);
        });
    }
}
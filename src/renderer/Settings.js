import React from "react";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import promiseIpc from 'electron-promise-ipc';
import { app } from 'electron';

const DEFAULT_SCRIPT_DEFINE={name:"name", value:"value"};

export default class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            megaEmail:"",
            megaPassword:"",
            localPath:"~/nnm/data/",
            remotePath:"https://mega.nz/fm/example",
            autoLogin:false,
            askBeforeDownloadingBigFiles:false,
            trainScript:"python3 {yolo_path} {model} {dataset}",
            generateScript:"python3 {generator} {data_path}",
            runScript:"",
            shell:"/bin/sh",
            scriptDefines:[{name:"data_path", value:"/usr/nnm/data/generated"}]
        }
    }

    componentDidMount(){
        this.syncWithRemote();
    }

    async syncWithRemote(){
        const remoteSettings=await promiseIpc.send("getSettings");
        this.setState(state=>({...state, ...remoteSettings}));
    }

    updateRemoteSettings(state){
        promiseIpc.send("setSettings", state);
    }

    changeHandler(stateFieldName, eventFieldName){
        return event=>this.setState((state) =>{
            const newState={ ...state, [stateFieldName]: event.target[eventFieldName] };
            this.updateRemoteSettings(newState);
            return newState;
        });
    }

    textChangeHandler(stateFieldName){
        return this.changeHandler(stateFieldName, "value");
    }

    checkboxChangeHandler(stateFieldName){
        return this.changeHandler(stateFieldName, "checked");
    }

    relaunch(){
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
        app.exit(0);
    }

    async reset(){
        await promiseIpc.send("resetSettings");
        this.syncWithRemote();
    }

    addScriptDefine(){
        this.setState(state=>({...state, scriptDefines:[...state.scriptDefines, DEFAULT_SCRIPT_DEFINE]}));
    }

    scriptDefineChangeHandler(field, index){
        return event=>this.setState(
            state=>({...state, scriptDefines:state.scriptDefines.map(
                // change field in element at given index
                (element, i)=>i==index 
                              ? {...element, [field]:event.target.value}
                              : element
            // remove empty defines
            ).filter(({name, value})=>!(name=="" && value==""))
            }));
    }

    render(){
    return (
        <form noValidate autoComplete="off">
            <h3>Login data *</h3>
            <div>
                <TextField label="Email" 
                    value={this.state.megaEmail} 
                    onChange={this.textChangeHandler("megaEmail")} 
                />
                <br />
                <br />
                <TextField label="Password" label="Password" type="password" 
                    value={this.state.megaPassword} 
                    onChange={this.textChangeHandler("megaPassword")}
                />
                <br />
                <br />
            </div>
            <h3>Paths *</h3>
            <br />
            <div>
                <TextField
                    fullWidth
                    label="Local Path"
                    value={this.state.localPath} 
                    onChange={this.textChangeHandler("localPath")} 
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Remote Path"
                    value={this.state.remotePath} 
                    onChange={this.textChangeHandler("remotePath")} 
                />
                <br />
                <br />
                <TextField 
                    fullWidth 
                    label="Shell" 
                    value={this.state.shell} 
                    onChange={this.textChangeHandler("shell")} 
                />
                <br />
                <br />
            </div>
            <h3>Script defines</h3>
            {this.state.scriptDefines.map(({name, value}, index) =>
                <div key={index}>
                    <TextField label="Name" value={name||""} onChange={this.scriptDefineChangeHandler("name", index)} />
                    <TextField label="Value" value={value||""} onChange={this.scriptDefineChangeHandler("value", index)} />
                    <br />
                    <br />
                </div>)
            }
            <Button variant="outlined" color="primary" onClick={this.addScriptDefine.bind(this)}>
                Add
            </Button>
            <br />
            <br />
            <h3>Default Scripts</h3>
            <br />
            <div>
                <TextField
                    fullWidth
                    label="Train"
                    value={this.state.trainScript} 
                    onChange={this.textChangeHandler("trainScript")} 
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Generate"
                    value={this.state.generateScript} 
                    onChange={this.textChangeHandler("generateScript")} 
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Run"
                    value={this.state.runScript} 
                    onChange={this.textChangeHandler("runScript")} 
                />
                <br />
                <br />
            </div>
            <h3>Extra options</h3>
            <div>
                <FormControl component="fieldset">
                    <FormGroup>
                        <FormControlLabel
                            
                            control={
                                <Checkbox name="autoLogin"
                                checked={this.state.autoLogin}
                                onChange={this.checkboxChangeHandler("autoLogin")}
                            />}
                            label="Auto login"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox name="antoine" 
                                checked={this.state.askBeforeDownloadingBigFiles}
                                onChange={this.checkboxChangeHandler("askBeforeDownloadingBigFiles")}
                            />}
                            label="Ask before downloading big files"
                        />
                    </FormGroup>
                </FormControl>
            </div>
            <br />
            <Button variant="contained" color="primary" onClick={this.reset.bind(this)}>
                Reset settings
            </Button>
            <h3>* Marked settings can only be applied after app relaunch.</h3>
            <Button variant="contained" color="primary" onClick={this.relaunch.bind(this)}>
                Relaunch App
            </Button>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
        </form>
    );
    }
}

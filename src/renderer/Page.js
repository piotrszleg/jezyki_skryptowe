import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import Thumbnails from "./Thumbnails.js";
import Topbar from "./Topbar.js";
import Sidebar from "./Sidebar.js";
import Settings from "./Settings.js";
import { styles } from "./style.js";
import Toolbar from "@material-ui/core/Toolbar";
import LoginDialog from "./LoginDialog.js";
import PasswordDialog from "./PasswordDialog.js";
import SetPasswordDialog from "./SetPasswordDialog.js";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';
import promiseIpc from 'electron-promise-ipc';

class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            folders:null,
            selectedFolder:"datasets",
            classes:{}
        }
        this.passwordDialog=React.createRef();
        this.setPasswordDialog=React.createRef();
        this.loginDialog=React.createRef();
        this.thumbnails=React.createRef();
    }

    componentDidMount(){
        this.goThroughLoginProcess();
    }

    setSelectedFolder(index) {
        this.setState(state=>({...state, selectedFolder:index}));
    }

    async goThroughLoginProcess() {
        this.passwordDialog.current.open();
        this.loadFolders();
        /* promiseIpc.on("requestPassword", ()=>this.passwordDialog.current.open());
        promiseIpc.on("requestPasswordAgain", ()=>this.passwordDialog.current.open(true));
        
        promiseIpc.on("requestNewPassword", ()=>);

        promiseIpc.on("requestMegaCredentials", ()=>this.loginDialog.current.open());
        promiseIpc.on("requestMegaCredentialsAgain", ()=>this.loginDialog.current.open(true));

        console.log("Requesting settings loading.");
        await promiseIpc.send("loadSettings", 1);
        console.log("Requesting connecting to mega.");
        await promiseIpc.send("connectToMega", 1);
        this.loadFolders(); */
    }

    async loadFolders(){
        console.log("Requesting folders.");
        const folders=await promiseIpc.send("requestFolders");
        console.log(folders);
        this.setFolders(folders);
    }

    setFolders(folders){
        this.setState(state=>({...state, folders:folders}))
    }

    getItemsList(){
        if(this.state.folders && this.state.folders.has(this.state.selectedFolder)){
            return this.state.folders.get(this.state.selectedFolder);
        } else {
            return [];
        }
    }

    async sendAction(folder, name, action){
        console.log(`Requested action ${action} for '${folder}/${name}'`);
        if(await promiseIpc.send("action", folder, name, action)){
            console.log("Action returned true.");
            this.loadFolders();
        }
    }

    switchToSettingPassword(){
        this.passwordDialog.current.close();
        this.setPasswordDialog.current.open();
    }

    async onPasswordInput(password){
        if(await promiseIpc.send("password", password)){
            this.passwordDialog.current.close();
        } else {
            this.passwordDialog.current.setError();
        }
    }
    
    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <CssBaseline />
                <Topbar />
                <PasswordDialog 
                    ref={this.passwordDialog} 
                    callback={this.onPasswordInput.bind(this)} 
                    changeCallback={this.switchToSettingPassword.bind(this)} />
                <SetPasswordDialog 
                    ref={this.setPasswordDialog} 
                    callback={password=>promiseIpc.send("newPassword", password)} />
                <LoginDialog ref={this.loginDialog} callback={credentials=>promiseIpc.send("megaCredentials", credentials)} />
                <Sidebar callback={this.setSelectedFolder.bind(this)} selectedFolder={this.state.selectedFolder} />
                <main className={classes.content}>
                    <Toolbar />
                    {1 
                    ? <Thumbnails folders={this.getItemsList()} actionCallback={(name, action)=>this.sendAction(this.state.selectedFolder, name, action)} />
                    : <Settings />}
                </main>
            </div>
        );
    }
}

Page.propTypes = {
    classes: PropTypes.object.isRequired,
};
  
export default withStyles(styles)(Page);
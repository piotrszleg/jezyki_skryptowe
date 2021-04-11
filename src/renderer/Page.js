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
            folders:[],
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

    async goThroughLoginProcess() {
        promiseIpc.on("requestPassword", ()=>this.passwordDialog.current.open());
        promiseIpc.on("requestPasswordAgain", ()=>this.passwordDialog.current.open(true));
        
        promiseIpc.on("requestNewPassword", ()=>this.setPasswordDialog.current.open());

        promiseIpc.on("requestMegaCredentials", ()=>this.loginDialog.current.open());
        promiseIpc.on("requestMegaCredentialsAgain", ()=>this.loginDialog.current.open(true));

        console.log("Requesting settings loading.");
        await promiseIpc.send("loadSettings", 1);
        console.log("Requesting connecting to mega.");
        await promiseIpc.send("connectToMega", 1);
        console.log("Requesting folders.");
        const folders=await promiseIpc.send("requestFolders");
        console.log(folders);
        this.setFolders(folders["datasets"]);
    }

    setFolders(folders){
        this.setState(state=>({...state, folders:folders}))
    }

    componentWillUnmount(){
    }
    
    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <CssBaseline />
                <Topbar />
                <PasswordDialog ref={this.passwordDialog} callback={credentials=>promiseIpc.send("password", credentials)} />
                <SetPasswordDialog ref={this.setPasswordDialog} callback={credentials=>promiseIpc.send("newPassword", credentials)} />
                <LoginDialog ref={this.loginDialog} callback={credentials=>promiseIpc.send("megaCredentials", credentials)} />
                <Sidebar />
                <main className={classes.content}>
                    <Toolbar />
                    {1 
                    ? <Thumbnails folders={this.state.folders} />
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
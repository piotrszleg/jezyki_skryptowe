import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import Thumbnails from "./Thumbnails.js";
import Topbar from "./Topbar.js";
import Sidebar from "./Sidebar.js";
import Settings from "./Settings.js";
import { styles } from "./style.js";
import Toolbar from "@material-ui/core/Toolbar";
import LoginDialog from "./LoginDialog.js";
import { ipcRenderer } from "electron";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';

class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            folders:[],
            classes:{}
        }
        this.loginDialog=React.createRef();
        this.thumbnails=React.createRef();   
    }

    componentDidMount(){
        ipcRenderer.on("folders", (event, folders)=>{
            console.log(folders);
            console.log(this.thumbnails);
            this.setFolders(folders.get("datasets"));
        });
        ipcRenderer.send("requestFolders");
    }

    setFolders(folders){
        this.setState(state=>({...state, folders:folders}))
    }

    componentWillUnmount(){
        ipcRenderer.removeAllListeners("folders");
    }
    
    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <CssBaseline />
                <LoginDialog ref={this.loginDialog} reason="There's no saved login data." callback={e=>console.log(e)} />
                <Topbar />
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
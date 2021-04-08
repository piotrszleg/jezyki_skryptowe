import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import Thumbnails from "./Thumbnails.js";
import Topbar from "./Topbar.js";
import Sidebar from "./Sidebar.js";
import Settings from "./Settings.js";
import {getClasses} from "./style.js";
import Toolbar from "@material-ui/core/Toolbar";
import LoginDialog from "./LoginDialog.js";

export default function Page() {
    const classes = getClasses();
    return (
        <div className={classes.root}>
            <CssBaseline />
            <LoginDialog reason="There's no saved login data." callback={e=>console.log(e)} />
            <Topbar />
            <Sidebar />
            <main className={classes.content}>
                <Toolbar />
                {1 
                ? <Thumbnails />
                : <Settings />}
            </main>
        </div>
    );
}

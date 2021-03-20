import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import Thumbnails from "./Thumbnails.js";
import Topbar from "./Topbar.js";
import Sidebar from "./Sidebar.js";
import {getClasses} from "./style.js";
import Toolbar from "@material-ui/core/Toolbar";

export default function Page() {
    const classes = getClasses();
    return (
        <div className={classes.root}>
            <CssBaseline />
            <Topbar />
            <Sidebar />
            <main className={classes.content}>
                <Toolbar />
                <Thumbnails />
            </main>
        </div>
    );
}

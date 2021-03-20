import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import {getClasses} from "./style.js";
import { styled } from '@material-ui/core/styles';

const TopBar = styled(AppBar)({
    zIndex: 1000000,
})

export default function Topbar() {
    const classes = getClasses();
    return (
    <TopBar position="fixed" className={classes.appBar}>
        <Toolbar>
            <Typography variant="h6" noWrap>
                Neural Networks Manager
            </Typography>
        </Toolbar>
    </TopBar>);
}
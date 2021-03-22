import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import { getClasses } from "./style.js";
import { styled } from "@material-ui/core/styles";
import TimelineIcon from "@material-ui/icons/Timeline";

const TopBar = styled(AppBar)({
    zIndex: 1000000,
    '& hr': {
      margin: 10,
    },
});

export default function Topbar() {
    const classes = getClasses();
    return (
        <TopBar position="fixed" className={classes.appBar}>
            <Toolbar>
                <Grid container alignItems="center" className={classes.root}>
                    <TimelineIcon />
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="h6" noWrap>
                        Neural Networks Manager
                    </Typography>
                </Grid>
            </Toolbar>
        </TopBar>
    );
}

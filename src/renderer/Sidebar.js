import React from "react";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ImageIcon from "@material-ui/icons/Image";
import TimelineIcon from "@material-ui/icons/Timeline";
import EmojiNatureIcon from "@material-ui/icons/EmojiNature";
import AddAPhotoIcon from "@material-ui/icons/AddAPhoto";
import SettingsIcon from "@material-ui/icons/Settings";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import { getClasses } from "./style.js";
import Toolbar from "@material-ui/core/Toolbar";

export default function Sidebar() {
    const classes = getClasses();
    return (
        <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <Toolbar />
            <div className={classes.drawerContainer}>
                <List>
                    <ListItem button>
                        <ListItemIcon>
                            <ImageIcon />
                        </ListItemIcon>
                        <ListItemText primary="Datasets" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText primary="Models" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <AddAPhotoIcon />
                        </ListItemIcon>
                        <ListItemText primary="Generators" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <EmojiNatureIcon />
                        </ListItemIcon>
                        <ListItemText primary="Programs" />
                    </ListItem>
                </List>
                <Divider />
                <List>
                <ListItem button>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <HelpOutlineIcon />
                        </ListItemIcon>
                        <ListItemText primary="About" />
                    </ListItem>
                </List>
            </div>
        </Drawer>
    );
}

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

export default function Sidebar(props) {
    const classes = getClasses();

    const items=[
        ["Datasets", ()=><ImageIcon />], 
        ["Models", ()=><TimelineIcon />], 
        ["Generators", ()=><AddAPhotoIcon />], 
        ["Programs", ()=><EmojiNatureIcon />]];

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
                    {items.map(([name, icon], index)=>
                    <ListItem button 
                            key={index}
                            selected={props.selectedFolder==index} 
                            onClick={() => props.callback(name.toLowerCase())}>
                        <ListItemIcon>
                            {icon()}
                        </ListItemIcon>
                        <ListItemText primary={name} />
                    </ListItem>)
                    }
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

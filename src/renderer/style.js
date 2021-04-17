import { makeStyles } from "@material-ui/core/styles";

const drawerWidth = 240;

export const styles =  ({
    root: {
        display: "flex",
    },
    appBar: {
        zIndex:   1,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        zIndex:  1000,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerContainer: {
        overflow: "auto",
    },
    content: {
        flexGrow: 1,
        padding: 10,
    },
});

export const getClasses = makeStyles((theme) => styles);
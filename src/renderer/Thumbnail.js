import React from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import {getClasses} from "./style.js";

export default function Thumbnail(props) {
    const classes = getClasses();
    return (
        <Card className={classes.thumbnail}>
            <CardActionArea>
                <CardMedia
                    component="img"
                    alt={props.file.name}
                    height="140"
                    image={
                        props.file.image
                        ||"https://user-images.githubusercontent.com/16499460/96162648-12445800-0f19-11eb-8139-bfdf3aa8bdc6.png"}
                    title={props.file.name}
                />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {props.file.name}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        component="p"
                    >
                        {props.file.description}
                    </Typography>
                </CardContent>
            </CardActionArea>
            <CardActions>
                {props.file.allowTrain &&
                <Button size="small" color="primary">
                    Train On
                </Button>}
                {props.file.allowUpload &&
                <Button size="small" color="primary">
                    Upload
                </Button>}
                {props.file.allowDownload && 
                <Button size="small" color="primary">
                    Download
                </Button>}
            </CardActions>
        </Card>
    );
}

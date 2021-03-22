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
                    alt="MNIST"
                    height="140"
                    image={props.image}
                    title="MNIST"
                />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                        {props.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        component="p"
                    >
                        Labeled hand written numbers.
                    </Typography>
                </CardContent>
            </CardActionArea>
            <CardActions>
                {(props.downloaded || props.local) && 
                <Button size="small" color="primary">
                    Train On
                </Button>}
                {props.local && 
                <Button size="small" color="primary">
                    Upload
                </Button>}
                {!props.downloaded && 
                <Button size="small" color="primary">
                    Download
                </Button>}
            </CardActions>
        </Card>
    );
}

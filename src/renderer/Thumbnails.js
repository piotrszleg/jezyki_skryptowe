import React from "react";
import Thumbnail from "./Thumbnail.js";
import Grid from "@material-ui/core/Grid";

export default class Thumbnails extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <Grid container spacing={3} justify="flex-start">
                {this.props.folders.map((file, index) => (
                    <Grid item xs={3} key={index}>
                        <Thumbnail
                            file={file}
                            actionCallback={this.props.actionCallback}
                        />
                    </Grid>
                ))}
            </Grid>
        );
    }
}

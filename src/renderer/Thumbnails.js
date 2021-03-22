import React from "react";
import Thumbnail from "./Thumbnail.js";
import Grid from "@material-ui/core/Grid";
import {range} from "lodash";

export default function Thumbnails() {
    return (
        <Grid container spacing={3} justify="space-evenly">
            {range(24).map(i=>
                <Grid item xs={3} key={i}>
                    <Thumbnail 
                        local={i%5==0}
                        downloaded={i%5==0 || i%5==2}
                    />
                </Grid>
            )}
        </Grid>
    );
}

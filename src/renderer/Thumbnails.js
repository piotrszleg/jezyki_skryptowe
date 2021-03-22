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
                        title={[
                            "Basen",
                            "SAUVC",
                            "Basen bez Światła"
                        ][i%3]}
                        image={[
                            "https://user-images.githubusercontent.com/16499460/96162648-12445800-0f19-11eb-8139-bfdf3aa8bdc6.png",
                            "https://user-images.githubusercontent.com/16499460/96162674-196b6600-0f19-11eb-85df-6e91b94ef77a.png",
                            "https://user-images.githubusercontent.com/16499460/96162687-1ec8b080-0f19-11eb-9c69-a60646bafad4.png"
                        ][i%3]}
                    />
                </Grid>
            )}
        </Grid>
    );
}

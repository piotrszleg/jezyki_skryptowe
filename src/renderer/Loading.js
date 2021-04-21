import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import Box from "@material-ui/core/Box";

export default function Loading(){
    return (
        <Box alignItems="center"
            justifyContent="center"
            top={0}
            left={0}
            bottom={0}
            right={0}
            position="absolute"
            display="flex">
        <CircularProgress />
        </Box>);
}
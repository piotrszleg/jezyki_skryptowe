import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Slide from "@material-ui/core/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default class ConfirmationDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            message: "",
            callback:null
        }
    }

    open(message, callback) {
        this.setState(state => ({
            ...state,
            open: true,
            message: message,
            callback: callback
        }));
    }

    onAnswer(answer){
        this.state.callback(answer);
        this.setState(state=>({...state, open:false}));
    }

    render() {
        return (
            <Dialog
                open={this.state.open}
                aria-labelledby="form-dialog-title"
                TransitionComponent={Transition}
                keepMounted
            >
                <DialogTitle id="form-dialog-title">{this.state.message}</DialogTitle>
                <DialogActions>
                    <Button
                        onClick={()=>this.onAnswer(true)}
                        color="primary"
                    >
                        Yes
                    </Button>
                    <Button
                        onClick={()=>this.onAnswer(false)}
                        color="primary"
                    >
                        No
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
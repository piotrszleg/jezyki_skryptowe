import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Slide from "@material-ui/core/Slide";
import promiseIpc from "electron-promise-ipc";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default class ScriptOutput extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.START_STATE = {
            open: false,
            scriptName: "Clean",
            output: "",
        };
        promiseIpc.on("scriptOutput", output=>{
            this.setState((state) => ({
                ...state,
                output: state.output+output,
            }));
        });
    }

    open(scriptName) {
        this.setState((state) => ({
            ...state,
            open: true,
            scriptName: scriptName,
            output: "",
        }));
    }

    close() {
        this.setState((state) => ({
            ...state,
            open: false,
        }));
    }

    render() {
        return (
            <Dialog
            fontFamily="Monospace"
                open={this.state.open}
                aria-labelledby="form-dialog-title"
                TransitionComponent={Transition}
                keepMounted
                fullWidth={true}
                maxWidth={"md"}
            >
                <DialogTitle id="form-dialog-title">
                    Output of action "{this.state.scriptName}"
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.props.reason}</DialogContentText>
                    <TextField
                        margin="dense"
                        id="output"
                        label="Output"
                        multiline
                        rows={24}
                        value={this.state.output || " "}
                        fullWidth
                        readOnly
                        disabled
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close.bind(this)} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

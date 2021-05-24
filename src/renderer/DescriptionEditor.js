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

export default class DescriptionEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            name: "",
            description: "",
            actionSender: null,
        };
    }

    open(name, description, actionSender) {
        this.setState((state) => ({
            ...state,
            open: true,
            name: name,
            description: description,
            actionSender: actionSender,
        }));
    }

    close() {
        this.setState((state) => ({
            ...state,
            open: false,
        }));
    }

    onSave() {
        this.state.actionSender("editDescription", [this.state.description]);
        this.close();
    }

    setDescription(event) {
        this.setState((state) => ({
            ...state,
            description: event.target.value,
        }));
    }

    render() {
        return (
            <Dialog
                open={this.state.open}
                aria-labelledby="form-dialog-title"
                TransitionComponent={Transition}
                keepMounted
                fullWidth={true}
                maxWidth={"md"}
            >
                <DialogTitle id="form-dialog-title">
                    Edit description of "{this.state.name}"
                </DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        id="code"
                        label="Code"
                        multiline
                        rows={24}
                        value={this.state.description}
                        onChange={this.setDescription.bind(this)}
                        fullWidth
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.close.bind(this)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={this.onSave.bind(this)} color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

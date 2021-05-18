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

export default class CodeEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.START_STATE = {
            open: false,
            action: "Clean",
            code: "rm *.temp",
            isNew: true,
            actionSender: null,
        };
    }

    openNew(actionSender) {
        this.setState((state) => ({
            ...state,
            action: this.START_STATE.action,
            code: this.START_STATE.code,
            isNew: true,
            open: true,
            actionSender: actionSender,
        }));
    }

    openForEdit(action, code, actionSender) {
        this.setState((state) => ({
            ...state,
            action: action,
            code: code,
            isNew: false,
            open: true,
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
        this.state.actionSender(this.state.isNew ? "addAction" : "editAction", [
            this.state.action,
            this.state.code,
        ]);
        this.close();
    }

    onRun() {
        this.state.actionSender("runAction", [
            this.state.action,
            this.state.code,
        ]);
        this.close();
    }

    onDelete() {
        this.state.actionSender("deleteAction", [this.state.action]);
        this.close();
    }

    setCode(event) {
        this.setState((state) => ({ ...state, code: event.target.value }));
    }

    setName(event) {
        this.setState((state) => ({ ...state, action: event.target.value }));
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
                <DialogTitle hidden={this.state.isNew} id="form-dialog-title">
                    Code of action "{this.state.action}"
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.props.reason}</DialogContentText>
                    {this.state.isNew ? (
                        <TextField
                            margin="dense"
                            id="action"
                            label="Action Name"
                            value={this.state.action}
                            onChange={this.setName.bind(this)}
                            fullWidth
                            variant="outlined"
                        />
                    ) : null}
                    <TextField
                        margin="dense"
                        id="code"
                        label="Code"
                        multiline
                        rows={24}
                        value={this.state.code}
                        onChange={this.setCode.bind(this)}
                        fullWidth
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    {this.state.isNew ? (
                        <Button
                            onClick={this.close.bind(this)}
                            color="primary"
                        >
                            Cancel Adding
                        </Button>
                    ) : (
                        <Button
                            onClick={this.onDelete.bind(this)}
                            color="primary"
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        onClick={this.onSave.bind(this)}
                        color="primary"
                    >
                        Save and close
                    </Button>
                    {!this.state.isNew ? (
                        <Button
                            onClick={this.onRun.bind(this)}
                            color="primary"
                        >
                            Run
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>
        );
    }
}

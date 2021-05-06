import React from "react";
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

export default class CodeEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            name: "Clean",
            code: "rm *.temp",
            isNew: false,
        };
    }

    open() {
        this.setState((state) => ({
            ...state,
            open: true,
        }));
    }

    close() {
        this.setState((state) => ({
            ...state,
            open: false,
        }));
    }

    setCode(event) {
        this.setState((state) => ({ ...state, code: event.target.value }));
    }

    setName(event) {
        this.setState((state) => ({ ...state, name: event.target.value }));
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
                    Code of action "Clean"
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.props.reason}</DialogContentText>
                    {this.state.isNew ? (
                        <TextField
                            hidden={!this.state.isNew}
                            margin="dense"
                            id="name"
                            label="Action Name"
                            value={this.state.name}
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
                    <Button onClick={this.close.bind(this)} color="primary">
                        {this.state.isNew ? "Cancel Adding" : "Delete"}
                    </Button>
                    <Button onClick={this.close.bind(this)} color="primary">
                        Save and close
                    </Button>
                    {!this.state.isNew ? (
                        <Button onClick={this.close.bind(this)} color="primary">
                            Run
                        </Button>
                    ) : null}
                </DialogActions>
            </Dialog>
        );
    }
}

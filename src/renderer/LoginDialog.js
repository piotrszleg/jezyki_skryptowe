import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Slide from "@material-ui/core/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default class FormDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            email: "",
            password: "",
            save: false,
        };
    }

    handleClose() {
        this.props.callback(this.state);
        this.setState(state => ({
            ...state,
            open: false,
        }));
    }

    setEmail(event) {
        this.setState((state) => ({ ...state, email: event.target.value }));
    }

    setPassword(event) {
        this.setState((state) => ({ ...state, password: event.target.value }));
    }

    setSave(event) {
        this.setState((state) => ({ ...state, save: event.target.checked }));
    }

    render() {
        return (
            <Dialog
                open={this.state.open}
                aria-labelledby="form-dialog-title"
                TransitionComponent={Transition}
                keepMounted
            >
                <DialogTitle id="form-dialog-title">Login</DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.props.reason}</DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Email Address"
                        type="email"
                        value={this.state.email}
                        onChange={this.setEmail.bind(this)}
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        value={this.state.password}
                        onChange={this.setPassword.bind(this)}
                        fullWidth
                    />
                    <br />
                    <br />
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="save"
                                checked={this.state.save}
                                onChange={this.setSave.bind(this)}
                            />
                        }
                        label="Save login data"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.handleClose.bind(this)}
                        color="primary"
                    >
                        Login
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

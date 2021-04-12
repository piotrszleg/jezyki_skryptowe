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

export default class PasswordDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            password: "",
            error:false
        };
    }

    open() {
        this.setState(state => ({
            ...state,
            open: true
        }));
    }

    close() {
        this.setState(state => ({
            ...state,
            open: false
        }));
    }

    setPassword(event) {
        this.setState((state) => ({ ...state, password: event.target.value }));
    }

    setError(){
        this.setState((state) => ({ ...state, error : true }));
    }

    render() {
        return (
            <Dialog
                open={this.state.open}
                aria-labelledby="form-dialog-title"
                TransitionComponent={Transition}
                keepMounted
            >
                <DialogTitle id="form-dialog-title">Enter your local database password</DialogTitle>
                <DialogContent>
                    <DialogContentText>{this.props.reason}</DialogContentText>
                    <TextField
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        value={this.state.password}
                        onChange={this.setPassword.bind(this)}
                        fullWidth
                        error={this.state.error}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={this.props.changeCallback}
                        color="primary"
                    >
                        Reset settings and password
                    </Button>
                    <Button
                        onClick={()=>this.props.callback(this.state.password)}
                        color="primary"
                    >
                        Enter
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

import React from "react";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";

export default function Settings() {
    return (
        <form noValidate autoComplete="off">
            <h3>Login data</h3>
            <div>
                <TextField label="Email" />
                <br />
                <br />
                <TextField label="Password" label="Password" type="password" />
                <br />
                <br />
            </div>
            <h3>Paths</h3>
            <br />
            <div>
                <TextField
                    fullWidth
                    label="Local Path"
                    defaultValue="~/nnm/data/"
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Online Path"
                    defaultValue="https://mega.nz/fm/example"
                />
                <br />
                <br />
                <TextField fullWidth label="Shell" defaultValue="/bin/sh" />
                <br />
                <br />
            </div>
            <h3>Script defines</h3>
            <div>
                <TextField label="Name" />
                <TextField label="Value" />
                <br />
                <br />
            </div>
            <Button variant="outlined" color="primary">
                Add
            </Button>
            <br />
            <br />
            <h3>Default Scripts</h3>
            <br />
            <div>
                <TextField
                    fullWidth
                    label="Train"
                    defaultValue="python3 {yolo_path} {model} {dataset}"
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Generate"
                    defaultValue="python3 {generator} {data_path}"
                />
                <br />
                <br />
                <TextField
                    fullWidth
                    label="Run"
                    defaultValue="python3 {program} {model}"
                />
                <br />
                <br />
            </div>
            <h3>Extra options</h3>
            <div>
                <FormControl component="fieldset">
                    <FormGroup>
                        <FormControlLabel
                            checked={true}
                            control={<Checkbox name="gilad" />}
                            label="Auto update"
                        />
                        <FormControlLabel
                            checked={true}
                            control={<Checkbox name="jason" />}
                            label="Save login data"
                        />
                        <FormControlLabel
                            control={<Checkbox name="antoine" />}
                            label="Ask before downloading big files"
                        />
                    </FormGroup>
                </FormControl>
            </div>
            <br />
            <Button variant="contained" color="primary">
                Reset settings
            </Button>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
        </form>
    );
}

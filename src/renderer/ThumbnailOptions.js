import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Popover from "@material-ui/core/Popover";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";

const useStyles = makeStyles((theme) => ({
    typography: {
        padding: theme.spacing(2),
    },
}));

export default class ThumbnailOptions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            anchor: null,
        };
    }

    switchOpen(anchor) {
        this.setState((state) => ({ anchor: state.anchor ? null : anchor }));
    }

    close(){
        this.setState((state) => ({ anchor: null }));
    }

    render() {
        const open = Boolean(this.state.anchor);
        const id = open ? "simple-popover" : undefined;

        return (
            <div>
                <Popover
                    id={id}
                    open={open}
                    onClose={this.switchOpen.bind(this)}
                    anchorEl={this.state.anchor}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "center",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                >
                    <ButtonGroup
                        orientation="vertical"
                        color="primary"
                        aria-label="vertical contained primary button group"
                        variant="text"
                    >
                        <Button disabled={!this.props.active} onClick={()=>{this.props.editDescriptionCallback(); this.close();} }>Edit Description</Button>
                        {this.props.elements.map((e, i)=>
                            <Button disabled={!this.props.active} key={i} onClick={()=>{console.log(e); this.props.editActionCallback(e); this.close(); }} >{e}</Button>
                        )}
                        <Button disabled={!this.props.active} onClick={()=>{this.props.addActionCallback(); this.close();} }>Add action</Button>
                    </ButtonGroup>
                </Popover>
            </div>
        );
    }
}

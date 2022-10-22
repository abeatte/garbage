/**
 * 
 */

import React from 'react';
import {
    Text,
} from 'react-native';

export const COLORS = ["darkorange", "cyan", "aquamarine", "brown", "darkorchid"];

class Combatant extends React.Component {
    constructor({color}) {
        super();

        this.state = {
            color,
        };
    }

    render() {
        return (<Text style={{fontWeight: "bold", color: this.state.color}}>{"X"}</Text>);
    }
}

export default Combatant;
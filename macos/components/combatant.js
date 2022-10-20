/**
 * 
 */

import React from 'react';
import {
    Text,
} from 'react-native';

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
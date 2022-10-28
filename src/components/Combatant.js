/**
 * 
 */

import React from 'react';

export const COLORS = ["magenta", "olive", "lime", "blueviolet", "crimson"];
export const MIN_HEALTH = -500;

class Combatant extends React.Component {
    constructor({color}) {
        super();

        this.state = {
            color,
        };
    }

    render() {
        return (<text style={{fontWeight: "bold", color: this.state.color}}>{"X"}</text>);
    }
}

export default Combatant;
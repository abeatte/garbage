/**
 * 
 */

import React from 'react';
import '../css/Combatant.css'
import Bunny from '../images/combatants/bunny.png'
import Turtle from '../images/combatants/turtle.png'
import Elephant from '../images/combatants/lil_eli.png'

export const CHARACTORS = {
    Bunny: {
        team: "magenta",
        sheet: Bunny,
        height: "25px",
        width: "25px",
        marginLeft: "0px",
        marginTop: "0px",
        placement: "-70px -10px",
        transformScale: 0.9
    },
    olive: {
        team: "olive",
    },
    Turtle: {
        team: "lime",
        sheet: Turtle,
        height: "50px",
        width: "50px",
        marginLeft: "-8px",
        marginTop: "-12px",
        placement: "90px 2105px",
        transformScale: 0.7
    },
    blueviolet: {
        team: "blueviolet",
    },
    Elephant: {
        team: "crimson",
        sheet: Elephant,
        height: "45px",
        width: "45px",
        marginLeft: "-10px",
        marginTop: "-8px",
        placement: "0px -5px",
        transformScale: 0.5
    }
};
export const MIN_HEALTH = -500;

const getCharacter = (team) => {
    const character = Object.values(CHARACTORS).find((cha) => cha.team === team);
    return character;
}

class Combatant extends React.Component {
    constructor({team}) {
        super();

        const character = getCharacter(team);

        this.state = {
            character,
        };
    }

    render() {
        const char = this.state.character;
        if (!this.state.character.sheet) {
            return (<text style={{fontWeight: "bold", marginLeft: "5px", color: this.state.character.team}}>{"X"}</text>);
        } else {
            return (<div className="Sprite" style={
                {
                    background: `url(${this.state.character.sheet}) ${this.state.character.placement}`,
                    transform: `scale(${this.state.character.transformScale})`,
                    width: char.width,
                    height: char.height, 
                    marginLeft: char.marginLeft,
                    marginTop: char.marginTop,
                }
            }></div>);
        }
    }
}

export default Combatant;
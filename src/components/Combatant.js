/**
 * 
 */

import React from 'react';
import '../css/Combatant.css';
import Bunny from '../images/combatants/bunny.png';
import Turtle from '../images/combatants/turtle.png';
import Elephant from '../images/combatants/lil_eli.png';
import Lizard from '../images/combatants/lizard.png';

export const CHARACTORS = {
    Bunny: {
        team: "Bunny",
        color: "magenta",
        sheet: Bunny,
        height: "25px",
        width: "25px",
        marginLeft: "0px",
        marginTop: "0px",
        placement: "-70px -10px",
        transformScale: 0.9
    },
    Turtle: {
        team: "Turtle",
        color: "olive",
        sheet: Turtle,
        height: "50px",
        width: "50px",
        marginLeft: "-8px",
        marginTop: "-12px",
        placement: "90px 2105px",
        transformScale: 0.7
    },
    Lizard: {
        team: "Lizard",
        color: "lime",
        sheet: Lizard,
        height: "20px",
        width: "20px",
        marginLeft: "0px",
        marginTop: "0px",
        placement: "40px 0px",
        transformScale: 1.1
    },
    Elephant: {
        team: "Elephant",
        color: "crimson",
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
    const character = CHARACTORS[team]; // Object.values(CHARACTORS).find((cha) => cha.team === team);
    return character;
}

class Combatant extends React.Component {
    constructor({combatant}) {
        super();

        this.state = {
            combatant,
        };
    }

    render() {
        const team = this.state.combatant.team;
        const char = getCharacter(team);
        if (!char.sheet) {
            return (<text style={{fontWeight: "bold", marginLeft: "5px", color: char.color}}>{"X"}</text>);
        } else {
            return (<div className="Sprite" style={
                {
                    background: `url(${char.sheet}) ${char.placement}`,
                    transform: `scale(${char.transformScale})`,
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
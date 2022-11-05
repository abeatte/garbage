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
        margin: "2px 0px 0px 1px",
        placement: "-70px -10px",
        transformScale: 0.9,
        detail: {
            transformScale: 7.2,
            margin: "10px -15px -10px 15px",
        }
    },
    Turtle: {
        team: "Turtle",
        color: "olive",
        sheet: Turtle,
        height: "50px",
        width: "50px",
        margin: "-0px -2px 0px -6px",
        placement: "90px 2105px",
        transformScale: 0.7,
        detail: {
            transformScale: 5.6,
            margin: "0px -35px 0px 35px",
        }
    },
    Lizard: {
        team: "Lizard",
        color: "lime",
        sheet: Lizard,
        height: "20px",
        width: "20px",
        margin: "0px 0px 0px 0px",
        placement: "40px 0px",
        transformScale: 1.1,
        detail: {
            transformScale: 8.8,
            margin: "-10px 5px 10px -5px",
        }
    },
    Elephant: {
        team: "Elephant",
        color: "crimson",
        sheet: Elephant,
        height: "45px",
        width: "45px",
        margin: "0px -8px 0px -8px",
        placement: "-5px -2px",
        transformScale: 0.5,
        detail: {
            transformScale: 4,
            margin: "-2px -15px 2px 15px",
        }
    }
};
export const MIN_HEALTH = -500;

const getCharacter = (team) => {
    const character = CHARACTORS[team];
    return character;
}

class Combatant extends React.Component {
    render() {
        const char = getCharacter(this.props.team);
        const for_detail_view = this.props.detail;
        if (!char.sheet) {
            return (<text style={{fontWeight: "bold", marginLeft: "5px", color: char.color}}>{"X"}</text>);
        } else {
            return (<div className="Sprite" style={
                {
                    background: `url(${char.sheet}) ${char.placement}`,
                    transform: `scale(${for_detail_view ? char.detail.transformScale : char.transformScale})`,
                    width: char.width,
                    height: char.height, 
                    margin: for_detail_view ? char.detail.margin : char.margin,
                }
            }></div>);
        }
    }
}

export default Combatant;
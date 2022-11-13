/**
 * 
 */

import React from 'react';
import '../css/Combatant.css';
// @ts-ignore
import Bunny from '../images/combatants/bunny.png';
// @ts-ignore
import Turtle from '../images/combatants/turtle.png';
// @ts-ignore
import Elephant from '../images/combatants/lil_eli.png';
// @ts-ignore
import Lizard from '../images/combatants/lizard.png';

export enum Character {Bunny = "Bunny", Turtle = "Turtle", Lizard = "Lizard", Elephant = "Elephant"};
interface CharacterType {
    team: keyof typeof Character,
    color: string,
    sheet?: any, 
    height: string, 
    width: string, 
    margin: string,
    placement: string,
    transformScale: number,
    detail: {
        transformScale: number,
        placement: string,
        height: string,
        width: string,
        margin: string,
    }
}
const Characters: {[key in Character]: CharacterType} = {
    Bunny: {
        team: Character.Bunny,
        color: "magenta",
        sheet: Bunny,
        height: "25px",
        width: "25px",
        margin: "2px 0px 0px 1px",
        placement: "-70px -10px",
        transformScale: 0.9,
        detail: {
            transformScale: 7.2,
            placement: "-68px -9px",
            height: "25px",
            width: "25px",
            margin: "0px",
        }
    },
    Turtle: {
        team: Character.Turtle,
        color: "olive",
        sheet: Turtle,
        height: "50px",
        width: "50px",
        margin: "-0px -2px 0px -6px",
        placement: "90px 2105px",
        transformScale: 0.7,
        detail: {
            transformScale: 5.6,
            placement: "84px 2478px",
            height: "30px",
            width: "24px",
            margin: "0px",
        }
    },
    Lizard: {
        team: Character.Lizard,
        color: "lime",
        sheet: Lizard,
        height: "20px",
        width: "20px",
        margin: "0px 0px 0px 0px",
        placement: "40px 0px",
        transformScale: 1.1,
        detail: {
            transformScale: 8.8,
            placement: "40px -2px",
            height: "20px",
            width: "20px",
            margin: "0px",
        }
    },
    Elephant: {
        team: Character.Elephant,
        color: "crimson",
        sheet: Elephant,
        height: "45px",
        width: "45px",
        margin: "0px -8px 0px -8px",
        placement: "-5px -2px",
        transformScale: 0.5,
        detail: {
            transformScale: 4,
            placement: "-1px -2px",
            height: "45px",
            width: "45px",
            margin: "0px",
        }
    }
};

const getCharacter = (team: keyof typeof Character) => {
    const character = Characters[team];
    return character;
}

const Combatant = (props: {team: keyof typeof Character, detail?: boolean}) => {
    const char = getCharacter(props.team);
    const for_detail_view = props.detail;
    if (!char.sheet) {
        return (<text style={{fontWeight: "bold", marginLeft: "5px", color: char.color}}>{"X"}</text>);
    } else {
        return (<div className="Sprite" style={
            {
                background: `url(${char.sheet}) ${for_detail_view ? char.detail.placement : char.placement}`,
                transform: `scale(${for_detail_view ? char.detail.transformScale : char.transformScale})`,
                width: for_detail_view ? char.detail.width : char.width,
                height: for_detail_view ? char.detail.height : char.height, 
                margin: for_detail_view ? char.detail.margin : char.margin,
            }
        }></div>);
    }
}

export default Combatant;

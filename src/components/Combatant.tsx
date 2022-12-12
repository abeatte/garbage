import React from 'react';
import '../css/Combatant.css';
import { Character } from '../models/CombatantModel';
const Bunny = require('../images/combatants/bunny.png');
const Turtle = require('../images/combatants/turtle.png');
const Elephant = require('../images/combatants/lil_eli.png');
const Lizard = require('../images/combatants/lizard.png');
const DogAndCat = require('../images/combatants/dog_and_cat.png');

interface CharacterType {
    team: Character,
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
    },
    Dog: {
        team: Character.Dog,
        color: "brown",
        sheet: DogAndCat,
        height: "35px",
        width: "35px",
        margin: "0px -3px 0px -3px",
        placement: "-338px -47px",
        transformScale: 0.6,
        detail: {
            transformScale: 5,
            placement: "-336px -46px",
            height: "35px",
            width: "35px",
            margin: "0px",
        }
    },
    Cat: {
        team: Character.Dog,
        color: "brown",
        sheet: DogAndCat,
        height: "35px",
        width: "35px",
        margin: "0px -3px 0px -3px",
        placement: "-338px -334px",
        transformScale: 0.6,
        detail: {
            transformScale: 4.9,
            placement: "-336px -334px",
            height: "35px",
            width: "35px",
            margin: "0px",
        }
    }
};

const getCharacter = (team: Character) => {
    const character = Characters[team];
    return character;
}

const Combatant = (props: {team: Character, draggable?: boolean, detail?: boolean}) => {
    const char = getCharacter(props.team);
    const for_detail_view = props.detail;
    if (!char.sheet) {
        return (<span style={{fontWeight: "bold", marginLeft: "5px", color: char.color}}>{"X"}</span>);
    } else {
        return (<div 
            className="Sprite" 
            draggable={props.draggable}
            style={
                {
                    background: `url(${char.sheet}) ${for_detail_view ? char.detail.placement : char.placement}`,
                    transform: `scale(${for_detail_view ? char.detail.transformScale : char.transformScale})`,
                    width: for_detail_view ? char.detail.width : char.width,
                    height: for_detail_view ? char.detail.height : char.height, 
                    margin: for_detail_view ? char.detail.margin : char.margin,
                }
            }
        ></div>);
    }
}

export default Combatant;

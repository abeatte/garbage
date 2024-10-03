import React from 'react';
import '../css/Combatant.css';
import { Character, State } from '../models/CombatantModel';
import classNames from 'classnames';
import { Purpose } from '../objects/Entity';
const Bunny = require('../images/combatants/bunny.png');
const Turtle = require('../images/combatants/turtle.png');
const Elephant = require('../images/combatants/lil_eli.png');
const Lizard = require('../images/combatants/lizard.png');
const DogAndCat = require('../images/combatants/dog_and_cat.png');
const Unicorn = require('../images/combatants/unicorn.png');

interface CharacterType {
    species: Character,
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
    },
    paint: {
        transformScale: number,
        height: string,
        width: string,
        margin: string,
    }
}
const Characters: { [key in Character]: CharacterType } = {
    Bunny: {
        species: Character.Bunny,
        color: "magenta",
        sheet: Bunny,
        height: "25px",
        width: "25px",
        margin: "0px -5px -2px 2px",
        placement: "-70px -10px",
        transformScale: 0.9,
        detail: {
            transformScale: 7.2,
            placement: "-68px -9px",
            height: "25px",
            width: "25px",
            margin: "0px",
        },
        paint: {
            transformScale: 1.35,
            width: '25px',
            height: '25px',
            margin: '0px -5px -5px 0px',
        }
    },
    Turtle: {
        species: Character.Turtle,
        color: "olive",
        sheet: Turtle,
        height: "50px",
        width: "50px",
        margin: "-13px -2px -13px -5px",
        placement: "90px 2105px",
        transformScale: 0.7,
        detail: {
            transformScale: 5.6,
            placement: "84px 2478px",
            height: "30px",
            width: "24px",
            margin: "0px",
        },
        paint: {
            transformScale: 1.05,
            width: '50px',
            height: '50px',
            margin: '0px -15px 0px 0px',
        },
    },
    Lizard: {
        species: Character.Lizard,
        color: "lime",
        sheet: Lizard,
        height: "20px",
        width: "20px",
        margin: "1px 0px 2px 2px",
        placement: "40px 0px",
        transformScale: 1.1,
        detail: {
            transformScale: 8.8,
            placement: "40px -2px",
            height: "20px",
            width: "20px",
            margin: "0px",
        },
        paint: {
            transformScale: 1.65,
            width: '20px',
            height: '20px',
            margin: '0px',
        },
    },
    Elephant: {
        species: Character.Elephant,
        color: "crimson",
        sheet: Elephant,
        height: "45px",
        width: "45px",
        margin: "-10px -8px -10px -8px",
        placement: "-5px -2px",
        transformScale: 0.5,
        detail: {
            transformScale: 4,
            placement: "-1px -2px",
            height: "45px",
            width: "45px",
            margin: "0px",
        },
        paint: {
            transformScale: 0.75,
            width: '45px',
            height: '45px',
            margin: '0px -5px 0px 0px',
        }
    },
    Dog: {
        species: Character.Dog,
        color: "brown",
        sheet: DogAndCat,
        height: "35px",
        width: "35px",
        margin: "-3px -3px -6px -3px",
        placement: "-338px -47px",
        transformScale: 0.6,
        detail: {
            transformScale: 5,
            placement: "-336px -46px",
            height: "35px",
            width: "35px",
            margin: "0px",
        },
        paint: {
            transformScale: 0.9,
            width: '35px',
            height: '35px',
            margin: '0px -4px -4px -0px',
        },
    },
    Cat: {
        species: Character.Dog,
        color: "brown",
        sheet: DogAndCat,
        height: "35px",
        width: "35px",
        margin: "-5px -3px -5px -3px",
        placement: "-338px -334px",
        transformScale: 0.6,
        detail: {
            transformScale: 4.9,
            placement: "-336px -334px",
            height: "35px",
            width: "35px",
            margin: "0px",
        },
        paint: {
            transformScale: 0.9,
            width: '35px',
            height: '35px',
            margin: '0px -3px 0px -3px',
        }
    },
    Unicorn: {
        species: Character.Unicorn,
        color: "purple",
        sheet: Unicorn,
        height: "50px",
        width: "50px",
        margin: "-13px",
        placement: "-4px -48px",
        transformScale: 0.4,
        detail: {
            transformScale: 3,
            placement: "-4px -48px",
            height: "50px",
            width: "50px",
            margin: "0px",
        },
        paint: {
            transformScale: 0.6,
            width: '50px',
            height: '50px',
            margin: '-5px -15px -5px -15px',
        },
    }
};

const getCharacter = (species: Character) => {
    const character = Characters[species];
    return character;
}

const Combatant = (props: { species: Character, state: State, purpose?: Purpose, draggable?: boolean }) => {
    const char = getCharacter(props.species);
    const for_detail_view = props.purpose === Purpose.Detail;
    const for_paint_view = props.purpose === Purpose.Paint;
    if (!char.sheet) {
        return (<span style={{ fontWeight: "bold", marginLeft: "5px", color: char.color }}>{"X"}</span>);
    } else {
        return (<div
            className={classNames({ "Sprite": true, "Dead": props.state === State.Dead })}
            draggable={props.draggable}
            style={
                {
                    background: `url(${char.sheet}) ${for_detail_view ? char.detail.placement : char.placement}`,
                    transform: `scale(${for_detail_view ? char.detail.transformScale : for_paint_view ? char.paint.transformScale : char.transformScale})`,
                    width: for_detail_view ? char.detail.width : for_paint_view ? char.paint.width : char.width,
                    height: for_detail_view ? char.detail.height : for_paint_view ? char.paint.height : char.height,
                    margin: for_detail_view ? char.detail.margin : for_paint_view ? char.paint.margin : char.margin,
                }
            }
        ></div>);
    }
}

export default Combatant;

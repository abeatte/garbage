import { faBasketball, faBomb, faExplosion, faMedkit, faSpider } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { ItemModel, Type as ItemType } from "../models/ItemModel";

const getIcon = (type: ItemType) => {
    switch(type) {
        case ItemType.Bomb:
            return faBomb;
        case ItemType.PokemonBall:
            return faBasketball;
        case ItemType.MedPack:
            return faMedkit;
        case ItemType.Spider:
            return faSpider;
    }
}

const getEndIcon = (type: ItemType) => {
    switch(type) {
        case ItemType.Bomb:
            return faExplosion;
        case ItemType.PokemonBall:
            return faExplosion;
        case ItemType.MedPack:
            return faMedkit;
        case ItemType.Spider:
            return faSpider;
    }
}

const Item = ({item, detail}: {item: ItemModel, detail?: boolean}) => {

    return (
        <span style={{position: "absolute"}}>
            <FontAwesomeIcon 
                className="Clickable" 
                icon={item.fuse_length - item.tick > 0 ? getIcon(item.type) : getEndIcon(item.type)}
                color='dark' 
                size={detail ? '10x' : 'lg'} 
                style={{alignSelf: 'center', margin: '4px 0px 4px 0px'}}
                
            />
        </span>
    );
};

export default Item;

import { faBasketball, faBomb, faExplosion, faMedkit, faSpider } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Purpose } from "../models/EntityModel";
import { ItemModel, Type as ItemType } from "../models/ItemModel";

const getIcon = (type: ItemType) => {
    switch (type) {
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
    switch (type) {
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

const Item = ({ item, purpose }: { item: ItemModel, purpose: Purpose }) => {
    const is_for_detail = purpose === Purpose.Detail;
    const is_for_tile = purpose === Purpose.Tile;
    const is_for_paint = purpose === Purpose.Paint;

    return (
        <span style={{
            position: is_for_paint ? 'absolute' : 'unset',
            margin: is_for_tile ? '0px 0px -12px 0px' : '0px 4px',
            transform: is_for_tile ? 'scale(0.7)' : 'unset',
        }}>
            <FontAwesomeIcon
                className="Clickable"
                icon={item.fuse_length - item.tick > 0 ? getIcon(item.type) : getEndIcon(item.type)}
                color='dark'
                size={is_for_detail ? '2x' : is_for_tile ? '2xs' : 'lg'}
                style={{ alignSelf: 'center', margin: is_for_tile ? 'unset' : '4px 0px 4px 0px' }}

            />
        </span>
    );
};

export default Item;

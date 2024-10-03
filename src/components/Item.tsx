import { faBasketball, faBomb, faExplosion, faMedkit, faSpider } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { ItemType, SpiderType, ItemModel, Type } from "../objects/items/Item";
import { Purpose } from "../objects/Entity";

const getIcon = (type: ItemType) => {
    switch (type) {
        case Type.Bomb:
            return faBomb;
        case Type.PokemonBall:
            return faBasketball;
        case Type.MedPack:
            return faMedkit;
        case SpiderType.FireSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.GrassSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.RockSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.SandSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.WaterSpider:
            return faSpider;
    }
}

const getEndIcon = (type: ItemType) => {
    switch (type) {
        case Type.Bomb:
            return faExplosion;
        case Type.PokemonBall:
            return faExplosion;
        case Type.MedPack:
            return faMedkit;
        case SpiderType.FireSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.GrassSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.RockSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.SandSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.WaterSpider:
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

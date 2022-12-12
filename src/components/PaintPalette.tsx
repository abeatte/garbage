import { faCrosshairs, faPaintRoller } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import '../css/PaintPalette.css';
import { select } from "../data/boardSlice";
import { setIsHudActionable } from "../data/hudSlice";
import { setSelectedPaint } from "../data/paintPaletteSlice";
import { AppState } from "../data/store";
import { createItemModel, Type as ItemType } from "../models/ItemModel";
import { createTileModel, Type as TileType } from "../models/TileModel";
import Item from "./Item";
import Tile from "./Tile";

const PaintPalette = () => {
    const board = useSelector((state: AppState) => state.board);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);
    const dispatch = useDispatch()

    const target = (
        <Tile
            tile={createTileModel({index: -1, type: TileType.Void})}
            showRealTileImages={board.show_real_tile_images}
            className={classNames("Clickable")}
            onClick={() => {
                dispatch(setSelectedPaint(TileType.Void));
                dispatch(select({}));
                dispatch(setIsHudActionable(false));
            }} 
            isSelected={paintPalette.selected === TileType.Void}
            key={`paint_target`}
        >
            <FontAwesomeIcon 
                className="Clickable" 
                icon={faCrosshairs} 
                color='red' 
                size='lg' 
                style={{alignSelf: 'center'}}
            />
        </Tile>
    );

    const tiles = Object.keys(TileType).map((k, idx) => {
        const tile = createTileModel({index: -1, type: TileType[k as keyof typeof TileType]});

        if (tile.type === TileType.Void) {
            return undefined;
        }

        return (
            <Tile 
                id={idx}
                tile={tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    dispatch(setSelectedPaint(tile.type));
                    dispatch(select({}));
                    dispatch(setIsHudActionable(false));
                }} 
                isSelected={paintPalette.selected === tile.type}
                key={`paint_tile_${idx}`}
            />
        )
    })

    const background_tile = createTileModel({index: -1, type: TileType.Sand});
    const items = Object.keys(ItemType).map((k, idx) => {
        const item = createItemModel({position: -1, type: ItemType[k as keyof typeof ItemType]});
        return (
            <Tile 
                id={idx}
                tile={background_tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    dispatch(setSelectedPaint(item.type));
                    dispatch(select({}));
                    dispatch(setIsHudActionable(false));
                }} 
                isSelected={paintPalette.selected === item.type}
                key={`paint_item_${idx}`}
            >
                <Item item={item}/>
            </Tile>
        )
    })

    return (
        <div className="Paint_palette">
            <div style={{display: 'flex', marginRight: '8px'}}>
                <FontAwesomeIcon 
                    id="paint_roller"
                    icon={faPaintRoller} 
                    color='dark' 
                    size='lg' 
                    style={{alignSelf: 'center', margin: '0px 0px 8px 8px'}}
                />
            </div>
            <div className="Items_container">
                <div className="Items_row">
                    {target}
                </div>
                <div className="Items_row">
                    {tiles}
                </div>
                <div className="Items_row">
                    {items}
                </div>
            </div>
        </div>
    );
};

export default PaintPalette;

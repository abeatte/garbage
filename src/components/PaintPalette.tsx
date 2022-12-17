import { faCrosshairs, faPaintRoller, faSkullCrossbones } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import '../css/PaintPalette.css';
import { select } from "../data/boardSlice";
import { HudPanel, setActiveHudPanel } from "../data/hudSlice";
import { setSelectedPaint, togglePalettsDisplayed } from "../data/paintPaletteSlice";
import { AppState } from "../data/store";
import { Character } from "../models/CombatantModel";
import { createItemModel, Type as ItemType } from "../models/ItemModel";
import { Pointer } from "../models/PointerModel";
import { createTileModel, Type as TileType } from "../models/TileModel";
import Combatant, { Purpose } from "./Combatant";
import Item from "./Item";
import Tile from "./Tile";

const PaintPalette = () => {
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);
    const dispatch = useDispatch();

    const target = (
        <Tile
            tile={createTileModel({index: -1, type: TileType.Void})}
            showRealTileImages={board.show_real_tile_images}
            className={classNames("Clickable")}
            onClick={() => {
                dispatch(setSelectedPaint(Pointer.Target));
                dispatch(select({}));
                dispatch(setActiveHudPanel(HudPanel.NONE));
            }} 
            isSelected={paintPalette.selected === Pointer.Target}
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

    const kill = (
        <Tile
            tile={createTileModel({index: -1, type: TileType.Void})}
            showRealTileImages={board.show_real_tile_images}
            className={classNames("Clickable")}
            onClick={() => {
                dispatch(setSelectedPaint(Pointer.Kill));
                dispatch(select({}));
                dispatch(setActiveHudPanel(HudPanel.NONE));
            }} 
            isSelected={paintPalette.selected === Pointer.Kill}
            key={`paint_target`}
        >
            <FontAwesomeIcon 
                className="Clickable" 
                icon={faSkullCrossbones} 
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
                    dispatch(setActiveHudPanel(HudPanel.NONE));
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
                    dispatch(setActiveHudPanel(HudPanel.NONE));
                }} 
                isSelected={paintPalette.selected === item.type}
                key={`paint_item_${idx}`}
            >
                <Item item={item}/>
            </Tile>
        )
    })

    const characters = Object.keys(Character).map((k, idx) => {
        const character = Character[k as keyof typeof Character];
        return (
            <Tile 
                id={idx}
                tile={background_tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    dispatch(setSelectedPaint(character));
                    dispatch(select({}));
                    if (hud.activeHudPanel === HudPanel.DETAILS) {
                        dispatch(setActiveHudPanel(HudPanel.NONE));
                    }
                }} 
                isSelected={paintPalette.selected === character}
                key={`paint_item_${idx}`}
            >
                <Combatant species={character} purpose={Purpose.Paint}/>
            </Tile>
        )
    })

    return (
        <div className={classNames({
            "Paint_palette": true,
            "Flyout_panel": true,
            "Left": true,
            "Bottom": true,
        })}>
            <div style={{display: 'flex', marginRight: '8px', marginTop: '8px'}}>
                <FontAwesomeIcon 
                    id="paint_roller"
                    onClick={() => dispatch(togglePalettsDisplayed())}
                    icon={faPaintRoller} 
                    color='dark' 
                    size='lg' 
                    style={{alignSelf: 'center', margin: '0px 0px 8px 8px'}}
                />
            </div>
            {
                paintPalette.palette_displayed && (
                    <div className='Exit_button_container'>
                        <button 
                            className={classNames("Clickable", "Exit")} 
                            onClick={() => {
                                dispatch(togglePalettsDisplayed());
                            }}
                        >
                        <span>{"X"}</span>
                        </button>
                    </div>
                )
            }
            {
                paintPalette.palette_displayed && (
                    <div className="Items_container">
                        <div className="Items_row">
                            {target}
                        </div>
                        <div className="Items_row">
                            {tiles}
                        </div>
                        <div className="Items_row">
                            {[kill, ...characters]}
                        </div>
                        <div className="Items_row">
                            {items}
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default PaintPalette;

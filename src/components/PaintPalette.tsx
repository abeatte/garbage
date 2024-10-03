import { faCrosshairs, faPaintRoller, faSkullCrossbones } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Analytics from "../analytics";
import '../css/PaintPalette.css';
import { select } from "../data/slices/boardSlice";
import { HudPanel, setActiveHudPanel } from "../data/slices/hudSlice";
import { setSelectedPaint, togglePalettsDisplayed } from "../data/slices/paintPaletteSlice";
import { AppState } from "../data/store";
import { Character, State } from "../models/CombatantModel";
import { Pointer } from "../models/PointerModel";
import { createTileModel, Type as TileType } from "../models/TileModel";
import Combatant from "./Combatant";
import Item from "./Item";
import Tile from "./Tile";
import { GetItem } from "../data/utils/ItemUtils";
import Spider from "../objects/items/Spider";
import { SpiderType, Type } from "../objects/items/Item";
import { Purpose } from "../objects/Entity";

const PaintPalette = () => {
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);
    const dispatch = useDispatch();

    const target = (
        <Tile
            tile={createTileModel({ index: -1, type: TileType.Void })}
            showRealTileImages={board.show_real_tile_images}
            className={classNames("Clickable")}
            onClick={() => {
                Analytics.logEvent('button_clicked: Paint Palette Target selected');
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
                style={{ alignSelf: 'center' }}
            />
        </Tile>
    );

    const kill = (
        <Tile
            tile={createTileModel({ index: -1, type: TileType.Void })}
            showRealTileImages={board.show_real_tile_images}
            className={classNames("Clickable")}
            onClick={() => {
                Analytics.logEvent('button_clicked: Paint Palette Kill selected');
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
                style={{ alignSelf: 'center' }}
            />
        </Tile>
    );


    const tiles = Object.keys(TileType).map((k, idx) => {
        const tile = createTileModel({ index: -1, type: TileType[k as keyof typeof TileType] });
        return (
            <Tile
                id={idx}
                tile={tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    Analytics.logEvent(`button_clicked: Paint Palette tile type ${tile.type} selected`);
                    dispatch(setSelectedPaint(tile.type));
                    dispatch(select({}));
                    dispatch(setActiveHudPanel(HudPanel.NONE));
                }}
                isSelected={paintPalette.selected === tile.type}
                key={`paint_tile_${idx}`}
            />
        )
    })

    const background_tile = createTileModel({ index: -1, type: TileType.Sand });

    const items = Object.values(Type).map((k, idx) => {
        const item = GetItem({ type: Type[k] });
        return (
            <Tile
                id={idx}
                tile={background_tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    Analytics.logEvent(`button_clicked: Paint Palette item type ${item.getType()} selected`);
                    dispatch(setSelectedPaint(item.getType()));
                    dispatch(select({}));
                    dispatch(setActiveHudPanel(HudPanel.NONE));
                }}
                isSelected={paintPalette.selected === item.getType()}
                key={`paint_item_${idx}`}
            >
                <Item item={item.toModel()} purpose={Purpose.Paint} />
            </Tile>
        )
    });

    const spiders = Object.values(SpiderType).map((k, idx) => {
        const spider = GetItem({ type: k }) as Spider;
        const tile = createTileModel({ index: -1, type: spider.getActionType() });
        return (
            <Tile
                id={idx}
                tile={tile}
                showRealTileImages={board.show_real_tile_images}
                className={classNames("Clickable")}
                onClick={() => {
                    Analytics.logEvent('button_clicked: Paint Palette spider selected');
                    dispatch(setSelectedPaint(spider.getType()));
                    dispatch(select({}));
                    dispatch(setActiveHudPanel(HudPanel.NONE));
                }}
                isSelected={paintPalette.selected === spider.getType()}
                key={`paint_item_${idx}`}
            >
                <Item item={spider.toModel()} purpose={Purpose.Paint} />
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
                    Analytics.logEvent(`'button_clicked: Paint Palette ${character} selected`);
                    dispatch(setSelectedPaint(character));
                    dispatch(select({}));
                    if (hud.activeHudPanel === HudPanel.DETAILS) {
                        dispatch(setActiveHudPanel(HudPanel.NONE));
                    }
                }}
                isSelected={paintPalette.selected === character}
                key={`paint_item_${idx}`}
            >
                <Combatant species={character} state={State.Alive} purpose={Purpose.Paint} />
            </Tile>
        )
    });

    return (
        <div className={classNames({
            "Paint_palette": true,
            "Flyout_panel": true,
            "Left": true,
            "Bottom": true,
        })}>
            <div className="Control_button" style={{ alignSelf: "center" }}
                onClick={() => {
                    Analytics.logEvent('button_clicked: Paint Palette display toggled');
                    dispatch(togglePalettsDisplayed())
                }}>
                <FontAwesomeIcon id="paint_roller" icon={faPaintRoller} color='dark' size='lg' />
            </div>
            {
                paintPalette.palette_displayed && (
                    <div className='Exit_button_container'>
                        <button
                            className={classNames("Clickable", "Exit")}
                            onClick={() => {
                                Analytics.logEvent('button_clicked: Paint Palette\'s "X"');
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
                        <div className="Items_row">
                            {spiders}
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default PaintPalette;

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
import { createTileModel, Type as TileType } from "../models/TileModel";
import Tile from "./Tile";

const PaintPalette = () => {
    const board = useSelector((state: AppState) => state.board);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);
    const dispatch = useDispatch()

    const tiles = Object.keys(TileType).map((k, idx) => {
        const tile = createTileModel({index: -1, type: TileType[k as keyof typeof TileType]});
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
                isSelected={paintPalette.selected_paint === tile.type}
                key={`paint_${idx}`}
            >
                {idx === 0 ? (<FontAwesomeIcon 
                                className="Clickable" 
                                icon={faCrosshairs} 
                                color='red' 
                                size='lg' 
                                style={{alignSelf: 'center'}}
                            />) : undefined
                }
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
            {tiles}
        </div>
    );
};

export default PaintPalette;

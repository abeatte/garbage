import classNames from "classnames";
import React from "react";
import { AppState } from "../data/store";
import { useSelector } from "react-redux";
import { Purpose } from "../data/utils/CombatantUtils";
import { getCombatantAtTarget } from "../data/utils/TargetingUtils";
import Combatant from "./Combatant";
import Item from "./Item";
import Tile from "./Tile";
import { Type as TileType } from "../models/TileModel";

const Map = (props: { view_port: { start: number, width: number, height: number }, purpose?: Purpose, selectedPosition?: number | undefined, onTileClick?: (idx: number, contains_combatant: boolean) => void, onTileDragEnter?: (idx: number) => void }) => {
    const board = useSelector((state: AppState) => state.board);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);

    const selected_paint = paintPalette.selected;
    const shouldHighlightPlayer =
        board.player_highlight_count > 0 &&
        board.player_highlight_count % 2 === 0;

    const tiles = [] as JSX.Element[];
    for (let row = 0; row < props.view_port.height; row++) {
        for (let col = 0; col < props.view_port.width; col++) {
            const idx = row * board.arena.width + col + props.view_port.start;
            const tile = board.tiles.t[idx];
            const maybe_combatant = getCombatantAtTarget({ target: idx, player: board.player, combatants: board.combatants });
            const is_player_tile = maybe_combatant?.is_player;
            const maybe_items = board.items.i[idx];
            const is_selected = props.selectedPosition === idx;

            const maybe_combatant_view = maybe_combatant ? (<Combatant
                key={is_player_tile ? 'player' : 'combatant'}
                draggable={Object.keys(TileType).includes(selected_paint)}
                species={maybe_combatant.species}
                state={maybe_combatant.state}
                purpose={props.purpose}
            />) : undefined;
            const maybe_items_view: JSX.Element[] = [];
            const maybe_items_view_2: JSX.Element[] = [];
            maybe_items?.forEach((item, idx) => {
                const view = (<Item
                    key={`item_${idx}`}
                    item={item}
                    purpose={Purpose.Tile}
                />);
                if (idx < 2) {
                    maybe_items_view.push(view);
                } else {
                    maybe_items_view_2.push(view);
                }
            });

            const maybe_items_container_view = maybe_items_view.length > 0 &&
                (<div className="Items_container_container">
                    {maybe_items_view.length < 1 ? undefined : (
                        <div className="Items_container">{maybe_items_view}</div>
                    )}
                    {maybe_items_view_2.length < 1 ? undefined : (
                        <div className="Items_container">{maybe_items_view_2}</div>
                    )}
                </div>);

            const child_view_container = (
                <div style={{ display: "flex", width: "inherit", height: "inherit", alignItems: "flex-end" }}>
                    {maybe_combatant_view}
                    {maybe_items_container_view}
                </div>
            );

            tiles.push(
                <div className="Tile_container"
                    key={`${idx}_${tile}_${maybe_combatant?.id ?? 0}_${maybe_items?.length ?? 0}`}
                    onClick={() => props.onTileClick && props.onTileClick(idx, maybe_combatant !== undefined)}
                    onDragEnter={() => props.onTileDragEnter && props.onTileDragEnter(idx)}>
                    <Tile
                        id={idx}
                        tile={tile}
                        playerSpecies={board.player?.species}
                        showPotential={board.show_tile_potentials}
                        showRealTileImages={board.show_real_tile_images}
                        highlight={is_player_tile && shouldHighlightPlayer}
                        className={classNames({ "Clickable": maybe_combatant || (maybe_items?.length ?? 0) > 0 })}
                        isSelected={is_selected}
                    >
                        {child_view_container}
                    </Tile>
                </div>
            );
        };
    };

    return (
        <div className={classNames({ "Arena": true, "Map": props.purpose === Purpose.Map })} style={{ gridTemplateColumns: `${"auto ".repeat(props.view_port.width)}` }}>
            {tiles}
        </div>
    );

};

export default Map;

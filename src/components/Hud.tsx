/**
 * 
 */

 import React, { ReactElement, useEffect, useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { Type as TileType } from './Tile';
import Combatant, { Character } from './Combatant';
import { 
    updateSelectedCombatant, 
    updateSelectedTile, 
    killSelected,
    spawnAtSelected,
    select 
} from '../data/boardSlice'
import { pause } from '../data/tickerSlice'
import classNames from 'classnames';
import { MIN_HEALTH } from '../data/CombatantUtils';
import { HudDisplayMode, setIsHudActionable } from '../data/hudSlice';
import { AppState } from '../data/store';

function getEditableField(
    args: {
        editing_value: string | undefined, 
        enabled?: boolean, 
        editing_type?: string, 
        options?: ReactElement[] | undefined 
        label: ReactElement, 
        display: ReactElement, 
        edit?: () => void, 
        update: (input: {target: {value: string}}) => void, 
        done?: () => void | undefined,
    }
) {
    const {editing_value, enabled, editing_type, options, label, display, edit, update, done} = args;

    const edit_field = !!options ?
        (<select 
            value={editing_value} 
            disabled={enabled ?? false}
            onChange={(e) => {
                update(e);
                if (!!done) {
                    done();
                }
            }}
        >
            {options}
        </select>
        ) :
        (<input
            type={editing_type} 
            onChange={update} 
            value={editing_value}
            autoFocus/>);

    const edit_done = !!options ?
        (<></>) :
        (<button 
            className="Clickable" 
            onClick={done}
            >
            <text>{"OK"}</text>
        </button>);

    return editing_value === undefined ? 
    (<view 
        className={classNames('Clickable', 'Editable_row')}
        onClick={edit}
    >
        <view>{label}{display}</view>
    </view>) :
    (<view className='Editing_row'>
        {label}
        {edit_field}
        {edit_done}
    </view>)
};

interface EditingObject {name: string | undefined, fitness: string | undefined};

 const Hud = () => {
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const dispatch = useDispatch()

    const [editing, setEditing] = useState({} as EditingObject);

    const selected_position = board.selected_position;
    const combatant = !!selected_position ? board.combatants[selected_position] : undefined;
    const tile = !!selected_position ? board.tiles[selected_position]: undefined;
    const isFullScreen = hud.hudDisplayMode === HudDisplayMode.FULL_SCREEN;

    useEffect(() => {
        setEditing({} as EditingObject);
    }, [selected_position]);

    useEffect(() => {
        if (Object.values(editing).length > 0 && !isFullScreen) {
            dispatch(pause());
        }
    }, [editing, dispatch, isFullScreen])

    const edited_name = editing['name'];
    const edited_fitness = editing['fitness'];

    const escape_button = isFullScreen && (
        <view className='Escape_container'>
            <button 
                className={classNames("Clickable", "Exit")} 
                onClick={() => {
                    dispatch(setIsHudActionable(false));
                }}
            >
            <text>{"X"}</text>
            </button>
        </view>
    );

    return (
      <view className='Hud'>
        {escape_button}
        <view style={{width: "200px"}}>
            <view className='Badge'>
                <Tile type={tile ?? TileType.Void}>
                    {combatant ? (<Combatant detail={true} team={combatant.team}/>) : undefined}
                </Tile>
                <view className='Below_image'>
                    {getEditableField(
                        {
                            editing_value: tile as string, 
                            enabled: !tile,
                            options: Object.keys(TileType).map(
                                t => t !== TileType.Void ? (<option key={`${t}`} value={t}>{t}</option>) : (<></>)),
                            label: (<text className={'Label'}>{'Tile: '}</text>),
                            display: (<text>{tile ?? ""}</text>),
                            update: input => {
                                dispatch(updateSelectedTile({field: 'type', value: input.target.value as TileType}));
                            },
                        }
                    )}
                </view>
                {
                    !!combatant && 
                    <view className='Below_image'>
                        <text className={'Label'}>{'ID: '}</text><text>{combatant?.id ?? ""}</text>
                    </view>
                }
            </view>
        </view> 
        <view className='Info_container'>
            <view className='Details_container'>
            { !!combatant && (
                <view className="Details">
                    <view className='Meta_data_toggles'>
                        <input 
                            className='Checkbox' 
                            type="checkbox" 
                            disabled={combatant.fitness <= MIN_HEALTH} 
                            checked={board.follow_selected_combatant}
                            onChange={(input) => {
                                dispatch(select({position: selected_position, follow_combatant: input.target.checked}));
                            }}
                        />
                        <text className={'Label'}>{'Lock on Combatant'}</text>
                    </view>
                    {getEditableField(
                        {
                            editing_value: edited_name,
                            editing_type: 'text',
                            label: (<text className={'Label'}>{'Name: '}</text>),
                            display: (<text>{combatant?.name ?? ""}</text>),
                            edit: () => setEditing({...editing, name: combatant?.name}),
                            update: input => setEditing({...editing, name: input.target.value}),
                            done: () => {
                                dispatch(updateSelectedCombatant({field: 'name', value: edited_name}));
                                setEditing({...editing, name: undefined})
                            }
                        }
                    )}
                    {getEditableField(
                        {
                            editing_value: combatant?.immortal ? undefined : edited_fitness,
                            editing_type: 'number',
                            label: (<text className={'Label'}>{'Fitness: '}</text>),
                            display: (<text>{combatant?.immortal ? Infinity : combatant?.fitness ?? ""}</text>), 
                            edit: () => setEditing({...editing, fitness: combatant?.fitness?.toString()}),
                            update: input => setEditing({...editing, fitness: input.target.value}),
                            done: () => {
                                dispatch(updateSelectedCombatant({field: 'fitness', value: parseInt(edited_fitness as string)}));
                                setEditing({...editing, fitness: undefined})
                            }
                        }
                    )}
                    {getEditableField(
                        {
                            editing_value: combatant?.team, 
                            options: Object.values(Character).map(
                                c => (<option key={`${c}`}>{c}</option>)),
                            label: (<text className={'Label'}>{'Team: '}</text>),
                            display: (<text>{combatant?.team ?? ""}</text>),
                            update: input => dispatch(updateSelectedCombatant({field: 'team', value: input.target.value})),
                        }
                    )}
                    <view>
                        <text className={'Label'}>{'Tick: '}</text><text>{combatant?.tick ?? ""}</text>
                    </view>
                    <view className='Toggles'>
                        <view>
                            <input 
                                className='Checkbox' 
                                type="checkbox" 
                                checked={combatant?.immortal ?? false} 
                                disabled={combatant?.fitness <= MIN_HEALTH} 
                                onChange={(input) => {
                                    dispatch(updateSelectedCombatant({field: 'immortal', value: input.target.checked}));
                                    setEditing({...editing, fitness: undefined});
                                }}
                            />
                            <text className={'Label'}>{'Immortal'}</text>
                        </view>
                    </view>
                </view>
                )
            }
            {!!combatant && (
                <view className='Life_buttons_container'>
                    <button 
                    className={classNames('Clickable', 'Kill_button')}
                    onClick={() => dispatch(killSelected())}
                    >
                        <text>{"Kill"}</text>
                    </button>
                </view>
                )
            }
            {!combatant && selected_position !== undefined && (
                <view className='Life_buttons_container'>
                    <button 
                    className={classNames('Clickable', 'Spawn_button')}
                    onClick={() => dispatch(spawnAtSelected())}
                    >
                        <text>{"Spawn"}</text>
                    </button>
                </view>
                )
            }
            </view>
        </view>
      </view>
    );
 }; 
 
 export default Hud;

/**
 * 
 */

 import React, { ReactElement, useEffect, useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import { Type as TileType } from '../models/TileModel';
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
import Tile from './Tile';

function getEditableField(
    args: {
        editing_value: string | undefined, 
        enabled?: boolean, 
        editing_type?: string, 
        options?: (ReactElement | undefined)[] | undefined 
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
            <span>{"OK"}</span>
        </button>);

    return editing_value === undefined ? 
    (<div 
        className={classNames('Clickable', 'Editable_row')}
        onClick={edit}
    >
        <div>{label}{display}</div>
    </div>) :
    (<div className='Editing_row'>
        {label}
        {edit_field}
        {edit_done}
    </div>)
};

interface EditingObject {name: string | undefined, fitness: string | undefined};

 const Hud = () => {
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const dispatch = useDispatch()

    const [editing, setEditing] = useState({} as EditingObject);

    const selected_position = board.selected_position ?? -1;
    const combatant = selected_position > -1 ? board.combatants[selected_position] : undefined;
    const tile = selected_position > -1 ? board.tiles[selected_position]: undefined;
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
        <div className='Escape_container'>
            <button 
                className={classNames("Clickable", "Exit")} 
                onClick={() => {
                    dispatch(setIsHudActionable(false));
                }}
            >
            <span>{"X"}</span>
            </button>
        </div>
    );

    return (
      <div className='Hud'>
        <div style={{width: "200px"}}>
            <div className='Badge'>
                <Tile tile={tile}>
                    {combatant ? (<Combatant detail={true} team={combatant.team}/>) : undefined}
                </Tile>
                {
                    !!tile &&
                    <div className='Below_image'>
                        {getEditableField(
                            {
                                editing_value: tile?.type as string, 
                                enabled: !tile,
                                options: Object.keys(TileType).map(
                                    t => t !== TileType.Void ? (<option key={`${t}`} value={t}>{t}</option>) : undefined),
                                label: (<span className={'Label'}>{'Tile: '}</span>),
                                display: (<span>{tile?.type ?? ""}</span>),
                                update: input => {
                                    dispatch(updateSelectedTile({field: 'type', value: input.target.value as TileType}));
                                },
                            }
                        )}
                        <div style={{paddingLeft: "8px"}} >
                            <span>{`( ${Math.round(tile.score_potential)} )`}</span>
                        </div>
                    </div>
                }
                {
                    !!combatant && 
                    <div className='Below_image'>
                        <span className={'Label'}>{'ID: '}</span><span>{combatant?.id ?? ""}</span>
                    </div>
                }
            </div>
        </div> 
        {escape_button}
        <div className='Info_container'>
            <div className='Details_container'>
            { !!combatant && (
                <div className="Details">
                    <div className='Meta_data_toggles'>
                        <input 
                            className='Checkbox' 
                            type="checkbox" 
                            disabled={combatant.fitness <= MIN_HEALTH} 
                            checked={board.follow_selected_combatant}
                            onChange={(input) => {
                                dispatch(select({position: selected_position, follow_combatant: input.target.checked}));
                            }}
                        />
                        <span className={'Label'}>{'Lock on Combatant'}</span>
                    </div>
                    {getEditableField(
                        {
                            editing_value: edited_name,
                            editing_type: 'text',
                            label: (<span className={'Label'}>{'Name: '}</span>),
                            display: (<span>{combatant?.name ?? ""}</span>),
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
                            label: (<span className={'Label'}>{'Fitness: '}</span>),
                            display: (<span>{combatant?.immortal ? Infinity : combatant?.fitness ?? ""}</span>), 
                            edit: () => setEditing({...editing, fitness: combatant?.fitness?.toString()}),
                            update: input => setEditing({...editing, fitness: input.target.value}),
                            done: () => {
                                dispatch(updateSelectedCombatant({field: 'fitness', value: parseInt(edited_fitness as string)}));
                                setEditing({...editing, fitness: undefined})
                            }
                        }
                    )}
                    <div className='Non_editable_row'>
                        <span className={'Label'}>{'Strength: '}</span><span>{combatant?.strength}</span>
                    </div>
                    {getEditableField(
                        {
                            editing_value: combatant?.team, 
                            options: Object.values(Character).map(
                                c => (<option key={`${c}`}>{c}</option>)),
                            label: (<span className={'Label'}>{'Team: '}</span>),
                            display: (<span>{combatant?.team ?? ""}</span>),
                            update: input => dispatch(updateSelectedCombatant({field: 'team', value: input.target.value})),
                        }
                    )}
                    <div className='Non_editable_row'>
                        <span className={'Label'}>{'Age: '}</span><span>{combatant?.tick ?? ""}</span>
                    </div>
                    <div className='Non_editable_row'>
                        <span className={'Label'}>{'Children: '}</span><span>{combatant?.children ?? ""}</span>
                    </div>
                    <div className='Toggles'>
                        <div>
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
                            <span className={'Label'}>{'Immortal'}</span>
                        </div>
                    </div>
                </div>
                )
            }
            {!!combatant && (
                <div className='Life_buttons_container'>
                    <button 
                    className={classNames('Clickable', 'Kill_button')}
                    onClick={() => dispatch(killSelected())}
                    >
                        <span>{"Kill"}</span>
                    </button>
                </div>
                )
            }
            {!combatant && selected_position !== undefined && (
                <div className='Life_buttons_container'>
                    <button 
                    className={classNames('Clickable', 'Spawn_button')}
                    onClick={() => dispatch(spawnAtSelected())}
                    >
                        <span>{"Spawn"}</span>
                    </button>
                </div>
                )
            }
            </div>
        </div>
      </div>
    );
 }; 
 
 export default Hud;

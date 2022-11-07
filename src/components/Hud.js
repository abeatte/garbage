/**
 * 
 */

 import React, { useEffect, useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { TYPE } from './Tile';
import Combatant, { CHARACTORS } from './Combatant';
import { updateSelectedCombatant, killSelected , select } from '../data/boardSlice'
import classNames from 'classnames';
import { MIN_HEALTH } from '../data/CombatantUtils';

function getEditableField({editing_value, editing_type, options, label, display, edit, update, done}) {
    const edit_field = !!options ?
        (<select value={editing_value} onChange={(e) => {
            update(e);
            if (!!done) {
                done();
            }
        }}>
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

 const Hud = () => {
    const board = useSelector((state) => state.board);
    const dispatch = useDispatch()

    const [editing, setEditing] = useState({});

    const selected_position = board.selected_position;
    const combatant = board.combatants[selected_position];
    const tile = board.tiles[selected_position];

    useEffect(() => {
        setEditing({});
    }, [selected_position]);

    const edited_name = editing['name'];
    const edited_fitness = editing['fitness'];

    return (
      <view className='Hud'>
        <view style={{width: "200px"}}>
            <view className='Badge'>
                <Tile type={tile ?? TYPE.void}>
                    {combatant ? (<Combatant detail={true} team={combatant.team}/>) : null}
                </Tile>
                {
                    !!combatant && 
                    <view className='Below_image'><text className={'Label'}>{'ID: '}</text><text>{combatant?.id ?? ""}</text></view>
                }
                <view className='Below_image'><text className={'Label'}>{'Tile: '}</text><text>{Object.keys(TYPE)[tile] ?? ""}</text></view>

            </view>
        </view> 
        {
            !!combatant && 
            <view className="Details">
                <view className='Meta_data_toggles'>
                    <input className='Checkbox' type="checkbox" disabled={combatant.fitness <= MIN_HEALTH} checked={board.follow_selected_combatant} value={board.follow_selected_combatant} onChange={(input) => {
                        dispatch(select({position: selected_position, follow_combatant: input.target.checked}));
                    }}/>
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
                            delete editing.name;
                            setEditing(editing)
                        }
                    }
                )}
                {getEditableField(
                    {
                        editing_value: combatant?.immortal ? undefined : edited_fitness,
                        editing_type: 'number',
                        label: (<text className={'Label'}>{'Fitness: '}</text>),
                        display: (<text>{combatant?.immortal ? Infinity : combatant?.fitness ?? ""}</text>), 
                        edit: () => setEditing({...editing, fitness: combatant?.fitness}),
                        update: input => setEditing({...editing, fitness: input.target.value}),
                        done: () => {
                            dispatch(updateSelectedCombatant({field: 'fitness', value: parseInt(edited_fitness)}));
                            delete editing.fitness;
                            setEditing(editing)
                        }
                    }
                )}
                {getEditableField(
                    {
                        editing_value: combatant?.team, 
                        options: Object.values(CHARACTORS).map(c => (<option key={`${c.team}`} name={c.team}>{c.team}</option>)),
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
                        <input className='Checkbox' type="checkbox" checked={combatant?.immortal ?? false} value={combatant?.immortal ?? false} disabled={!combatant} onChange={(input) => {
                            dispatch(updateSelectedCombatant({field: 'immortal', value: input.target.checked}));
                            delete editing.fitness;
                            setEditing(editing);
                        }}/>
                        <text className={'Label'}>{'Immortal'}</text>
                    </view>
                </view>
            </view>
        }
        {
            !!combatant && 
            <view className='Kill_button_container'>
                <button 
                className={classNames('Clickable', 'Kill_button')}
                onClick={() => dispatch(killSelected())}
                >
                    <text>{"Kill"}</text>
                </button>
            </view>
        }
      </view>
    );
 }; 
 
 export default Hud;

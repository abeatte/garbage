/**
 * 
 */

 import React, { useEffect, useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { TYPE } from './Tile';
import Combatant, { CHARACTORS } from './Combatant';
import { updateSelected, killSelected } from '../data/boardSlice'
import classNames from 'classnames';

function getEditableField({editing_value, editing_type, options, label, display, edit, update, done}) {
    const edit_field = !!options ?
        (<select value={editing_value} onChange={(e) => {
            update(e);
            done();
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

    useEffect(() => {
        setEditing({});
    }, [board.selected]);

    const selected = board.selected;

    const edited_name = editing['name'];
    const edited_fitness = editing['fitness'];

    return (
      <view className='Hud'>
        <view style={{width: "200px"}}>
            <view className='Badge'>
                <Tile type={TYPE.void}>
                    {selected ? (<Combatant detail={true} team={selected.team}/>) : null}
                </Tile>
                <view className='Id'><text className={'Label'}>{'ID: '}</text><text>{selected?.id ?? ""}</text></view>
            </view>
        </view> 
        <view className="Details">
            {getEditableField(
                {
                    editing_value: edited_name,
                    editing_type: 'text',
                    label: (<text className={'Label'}>{'Name: '}</text>),
                    display: (<text>{selected?.name ?? ""}</text>),
                    edit: () => setEditing({...editing, name: selected?.name}),
                    update: input => setEditing({...editing, name: input.target.value}),
                    done: () => {
                        dispatch(updateSelected({field: 'name', value: edited_name}));
                        setEditing({...editing, name: undefined})
                    }
                }
            )}
            {getEditableField(
                {
                    editing_value: selected?.immortal ? undefined : edited_fitness,
                    editing_type: 'number',
                    label: (<text className={'Label'}>{'Fitness: '}</text>),
                    display: (<text>{selected?.immortal ? Infinity : selected?.fitness ?? ""}</text>), 
                    edit: () => setEditing({...editing, fitness: selected?.fitness}),
                    update: input => setEditing({...editing, fitness: input.target.value}),
                    done: () => {
                        dispatch(updateSelected({field: 'fitness', value: parseInt(edited_fitness)}));
                        setEditing({...editing, fitness: undefined})
                    }
                }
            )}
            {getEditableField(
                {
                    editing_value: selected?.team, 
                    options: Object.values(CHARACTORS).map(c => (<option key={`${c.team}`} name={c.team}>{c.team}</option>)),
                    label: (<text className={'Label'}>{'Team: '}</text>),
                    display: (<text>{selected?.team ?? ""}</text>),
                    update: input => dispatch(updateSelected({field: 'team', value: input.target.value})),
                }
            )}
            <view>
                <text className={'Label'}>{'Tick: '}</text><text>{selected?.tick ?? ""}</text>
            </view>
            <view className='Toggles'>
                <view>
                    <input type="checkbox" value={selected?.immortal} disabled={!selected} onChange={(input) => {
                        dispatch(updateSelected({field: 'immortal', value: input.target.checked}));
                        setEditing({...editing, fitness: undefined});
                    }}/>
                    <text className={'Label'}>{'Immortal'}</text>
                </view>
            </view>
        </view>
        {
            !!selected && 
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

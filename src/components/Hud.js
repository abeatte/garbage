/**
 * 
 */

 import React, { useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { TYPE } from './Tile';
import Combatant, { CHARACTORS } from './Combatant';
import { updateSelected } from '../data/boardSlice'

function getEditableField({editing_value, editing_type, options, display, edit, update, done}) {
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
            value={editing_value}/>);

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
        className='Clickable' 
        onClick={edit}
    >
        {display}
    </view>) :
    (<view>
        {edit_field}
        {edit_done}
    </view>)
};

 const Hud = () => {
    const board = useSelector((state) => state.board);
    const dispatch = useDispatch()

    const [editing, setEditing] = useState({});

    const selected = board.selected;

    const edited_name = editing['name'];
    const edited_fitness = editing['fitness'];

    return (
      <view className='Hud'>
        <view style={{width: "200px"}}>
            <Tile type={TYPE.void}>
                {selected ? (<Combatant detail={true} team={selected.team}/>) : null}
            </Tile>
            <view>{`ID:${selected?.id}`}</view> 
        </view> 
        <view className="Details">
            {getEditableField(
                {
                    editing_value: edited_name,
                    editing_type: 'text',
                    display: `Name:${selected?.name ?? ""}`, 
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
                    editing_value: edited_fitness,
                    editing_type: 'number',
                    display: `Fitness:${selected?.fitness ?? ""}`, 
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
                    options: Object.values(CHARACTORS).map(c => (<option name={c.team}>{c.team}</option>)),
                    display: `Team:${selected?.team ?? ""}`,
                    update: input => dispatch(updateSelected({field: 'team', value: input.target.value})),
                }
            )}
            <view>{`Tick:${selected?.tick ?? ""}`}</view>
        </view>
        </view>
    );
 }; 
 
 export default Hud;

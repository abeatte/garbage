/**
 * 
 */

 import React, { useState } from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { TYPE } from './Tile';
import Combatant from './Combatant';
import { updateSelected } from '../data/boardSlice'

function getEditableField({editing_value, display, edit, update, done}) {
    return editing_value !== undefined ? 
    (<view>
        <input 
            type='text' 
            onChange={update} 
            value={editing_value}/>
        <button 
            className="Clickable" 
            onClick={done}
            >
            <text>{"OK"}</text>
        </button>
    </view>) : 
    (<view 
        className='Clickable' 
        onClick={edit}
    >
        {display}
    </view>)
};

 const Hud = () => {
    const board = useSelector((state) => state.board);
    const dispatch = useDispatch()

    const [editing, setEditing] = useState({});

    const selected = board.selected;

    const edited_name = editing['name'];

    return (
      <view className='Hud'>
        <Tile type={TYPE.void}>
            {selected ? (<Combatant detail={true} team={selected.team}/>) : null}
        </Tile>   
        <view className="Details">
            <view>{`ID:${selected?.id}`}</view>
            {getEditableField(
                {
                    editing_value: edited_name, 
                    display: `Name:${selected?.name}`, 
                    edit: () => setEditing({...editing, name: selected?.name}),
                    update: input => setEditing({...editing, name: input.target.value}),
                    done: () => {
                        dispatch(updateSelected({field: 'name', value: edited_name}));
                        setEditing({...editing, name: undefined})
                    }
                }
            )}
            <view>{`Fitness:${selected?.fitness}`}</view>
            <view>{`Team:${selected?.team}`}</view>
            <view>{`Tick:${selected?.tick}`}</view>
        </view>
        </view>
    );
 }; 
 
 export default Hud;

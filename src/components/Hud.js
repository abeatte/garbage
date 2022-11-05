/**
 * 
 */

 import React from 'react';
import '../css/Hud.css';
import { useSelector, useDispatch } from 'react-redux'
import Tile, { TYPE } from './Tile';
import Combatant from './Combatant';

 const Hud = () => {
    const hud = useSelector((state) => state.hud);
    const dispatch = useDispatch()

    const selected = hud.selected;

    return (
      <view className='Hud'>
        <Tile type={TYPE.void}>
            {selected ? (<Combatant detail={true} team={selected.team}/>) : null}
        </Tile>   
        <view className="Details">   
            <view>{`Id:${selected?.id}`}</view>
            <view>{`Fitness:${selected?.fitnes}`}</view>
            <view>{`Team:${selected?.team}`}</view>
            <view>{`Tick:${selected?.tick}`}</view>
        </view>
        </view>
    );
 }; 
 
 export default Hud;
 
/**
 * 
 */

 import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';

export const TYPE = {"void": 0, "water": 1, "fire": 2, "rock": 3, "sand": 4, "grass": 5};

 const Tile = ({children, className, type, isSelected, onClick}) => {
  let style;
  switch(type) {
    case TYPE.grass: 
      style = 'Grass';
      break;
    case TYPE.water:
      style = 'Water';
      break;
    case TYPE.fire:
      style = 'Fire';
      break;
    case TYPE.rock:
      style = 'Rock';
      break;
    case TYPE.sand:
      style = 'Sand';
      break;
    case TYPE.void:
      // falthrough
      // eslint-disable-next-line no-fallthrough
    default:
      style = 'Void';
  }
  
    return (
      <view className={classNames('Tile', style, className, {"Selected" : isSelected})} onClick={onClick} >{children}</view>
    );
 }; 
 
 export default Tile;
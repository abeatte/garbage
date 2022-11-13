/**
 * 
 */

import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';

export enum Type {Void = "Void", Water = "Water", Fire = "Fire", Rock = "Rock", Sand = "Sand", Grass ="Grass"};

 const Tile = (
  args: {
    children?: JSX.Element, 
    className?: string, 
    type: Type, 
    isSelected?: boolean, 
    onClick?: () => void
  }
) => {
  const {children, className, type, isSelected, onClick} = args;
    return (
      <view className={classNames('Tile', type, className, {"Selected" : isSelected})} onClick={onClick} >{children}</view>
    );
 }; 
 
 export default Tile;
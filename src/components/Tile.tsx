/**
 * 
 */

import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';
import { Type as TileType } from '../models/TileModel';

 const Tile = (
  args: {
    id?: number,
    children?: JSX.Element, 
    className?: string, 
    type: TileType, 
    isSelected?: boolean, 
    onClick?: () => void
  }
) => {
  const {id, children, className, type, isSelected, onClick} = args;
    return (
      <view id={id?.toString()} className={classNames('Tile', type, className, {"Selected" : isSelected})} onClick={onClick} >{children}</view>
    );
 }; 
 
 export default Tile;
 
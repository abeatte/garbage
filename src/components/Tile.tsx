/**
 * 
 */

import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';
import { TileModel, Type as TileType } from '../models/TileModel';

 const Tile = (
  args: {
    id?: number,
    children?: JSX.Element, 
    className?: string, 
    tile: TileModel | undefined, 
    isSelected?: boolean, 
    showPotential?: boolean,
    onClick?: () => void
  }
) => {
  const {id, children, className, tile, isSelected, showPotential,  onClick} = args;
    return (
      <view id={id?.toString()} className={classNames('Tile', tile?.type ?? TileType.Void, className, {"Selected" : isSelected})} onClick={onClick} >
        {
          showPotential && tile && !children &&
          <text className='Tile_potential'>
            {Math.round(tile.score_potential)}
          </text>
        }
        {children}
      </view>
    );
 }; 
 
 export default Tile;
 
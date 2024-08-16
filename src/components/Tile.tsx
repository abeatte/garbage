/**
 * 
 */

import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';
import { TileModel, Type as TileType } from '../models/TileModel';
import { getMapTileEffect } from '../models/CombatantModel';
const Water = require('../images/terrain/water.png');
const Trees = require('../images/terrain/trees.png');
const Sand = require('../images/terrain/sand.png');
const Lava = require('../images/terrain/lava.png');
const Stone = require('../images/terrain/stone.png');

const TileImages: {[key in TileType]: any} = {
  Void: undefined,
  Fire: Lava,
  Grass: Trees,
  Rock: Stone,
  Sand: Sand,
  Water: Water,
};

const getImage = (tileType: TileType) => {
  const tileImage = TileImages[tileType];
  return tileImage;
}

const Tile = (
  {id, children, className, tile, highlight, isSelected, showPotential, showRealTileImages, onClick, onDragEnter}: {
    id?: number,
    children?: JSX.Element, 
    className?: string, 
    tile: TileModel | undefined, 
    highlight?: boolean,
    isSelected?: boolean, 
    showPotential?: boolean,
    showRealTileImages?: boolean,
    onClick?: () => void,
    onDragEnter?: () => void,
  }
) => {
    const paintRoller = document.getElementById('paint_roller') as HTMLElement;
    const image = tile?.type && getImage(tile.type);
    const typeClass = tile?.type ?? TileType.Void;
    return (
      <div style={{position: "relative"}}>
        <div
          id={id?.toString()} 
          className={classNames('Tile', highlight ? 'Highlight' : typeClass, className, {"Selected" : isSelected})} 
          onClick={onClick}
          onDragEnter={onDragEnter}
          onDragStart={(event) => event.dataTransfer.setDragImage(paintRoller, 8, 8)}
        >
          {
            image && showRealTileImages && !highlight &&
            <img 
              style={{position: "absolute"}} 
              className={classNames('Tile', {"Selected": isSelected})} 
              src={image}
              alt={tile.type}
            />
          }
          {/* TODO: show tile potential for each species (since they are different now.) */}
          {
            showPotential && tile && !children &&
            <span style={{position: "absolute", color: !showRealTileImages ? "black" : "red"}} className='Tile_potential'>
              {getMapTileEffect({species: undefined, tileType: tile.type})}
            </span>
          }
          {children}
        </div>
      </div>
    );
 }; 
 
 export default Tile;
 
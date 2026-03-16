/**
 * 
 */

import React from 'react';
import '../css/Tile.css';
import classNames from 'classnames';
import { TileModel, Type as TileType } from '../models/TileModel';
import { Character, getMapTileEffect } from '../models/CombatantModel';
// New generated realistic images (shown when "Show Real Tiles" is unchecked)
const Water = require('../images/terrain/water.png');
const Trees = require('../images/terrain/trees.png');
const Sand = require('../images/terrain/sand.png');
const Lava = require('../images/terrain/lava.png');
const Stone = require('../images/terrain/stone.png');

// Original classic images (shown when "Show Real Tiles" is checked)
const WaterClassic = require('../images/terrain/water_classic.png');
const TreesClassic = require('../images/terrain/trees_classic.png');
const SandClassic = require('../images/terrain/sand_classic.png');
const LavaClassic = require('../images/terrain/lava_classic.png');
const StoneClassic = require('../images/terrain/stone_classic.png');

export const TILE_SIZE = 25;

const TileImages: { [key in TileType]: any } = {
  Void: undefined,
  Fire: Lava,
  Grass: Trees,
  Rock: Stone,
  Sand: Sand,
  Water: Water,
};

const ClassicTileImages: { [key in TileType]: any } = {
  Void: undefined,
  Fire: LavaClassic,
  Grass: TreesClassic,
  Rock: StoneClassic,
  Sand: SandClassic,
  Water: WaterClassic,
};

const getImage = (tileType: TileType, useClassic: boolean) => {
  return useClassic ? ClassicTileImages[tileType] : TileImages[tileType];
}

const Tile = (
  { id, children, className, tile, highlight, isSelected, playerSpecies, showPotential, showRealTileImages, onClick, onDragEnter }: {
    id?: number,
    children?: JSX.Element,
    className?: string,
    tile: TileModel | undefined,
    highlight?: boolean,
    isSelected?: boolean,
    playerSpecies?: Character,
    showPotential?: boolean,
    showRealTileImages?: boolean,
    onClick?: () => void,
    onDragEnter?: () => void,
  }
) => {
  const paintRoller = document.getElementById('paint_roller') as HTMLElement;
  const image = tile?.type && getImage(tile.type, !showRealTileImages);
  const typeClass = tile?.type;

  return (
    <div style={{ position: "relative" }}>
      <div
        id={id?.toString()}
        className={classNames('Tile', highlight ? 'Highlight' : typeClass, className, { "Selected": isSelected })}
        onClick={onClick}
        onDragEnter={onDragEnter}
        onDragStart={(event) => event.dataTransfer.setDragImage(paintRoller, 8, 8)}
      >
        {
          image && !highlight &&
          <img
            style={{ position: "absolute" }}
            className={classNames('Tile', { "Selected": isSelected })}
            src={image}
            alt={tile.type}
          />
        }
        {
          showPotential && tile && tile.type !== TileType.Void &&
          <span style={{ position: "absolute", color: !showRealTileImages ? "black" : "red" }} className='Tile_potential'>
            {playerSpecies ? tile.score_potential[playerSpecies] : getMapTileEffect({ species: undefined, tileType: tile.type })}
          </span>
        }
        {children}
      </div>
    </div>
  );
};

export default Tile;

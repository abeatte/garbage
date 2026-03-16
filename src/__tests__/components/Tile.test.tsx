import React from 'react';
import { render, screen } from '@testing-library/react';
import Tile from '../../components/Tile';
import { createTileModel, Type as TileType } from '../../models/TileModel';
import { Character } from '../../models/CombatantModel';

// Mock image requires
jest.mock('../../images/terrain/water.png', () => 'water.png');
jest.mock('../../images/terrain/trees.png', () => 'trees.png');
jest.mock('../../images/terrain/sand.png', () => 'sand.png');
jest.mock('../../images/terrain/lava.png', () => 'lava.png');
jest.mock('../../images/terrain/stone.png', () => 'stone.png');
jest.mock('../../images/terrain/water_classic.png', () => 'water_classic.png');
jest.mock('../../images/terrain/trees_classic.png', () => 'trees_classic.png');
jest.mock('../../images/terrain/sand_classic.png', () => 'sand_classic.png');
jest.mock('../../images/terrain/lava_classic.png', () => 'lava_classic.png');
jest.mock('../../images/terrain/stone_classic.png', () => 'stone_classic.png');

describe('Tile', () => {
  it('renders without crashing for undefined tile', () => {
    const { container } = render(<Tile tile={undefined} />);
    expect(container.querySelector('.Tile')).toBeInTheDocument();
  });

  it('applies tile type class', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    const { container } = render(<Tile tile={tile} />);
    expect(container.querySelector('.Grass')).toBeInTheDocument();
  });

  it('applies Selected class when isSelected', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    const { container } = render(<Tile tile={tile} isSelected />);
    expect(container.querySelector('.Selected')).toBeInTheDocument();
  });

  it('applies Highlight class when highlight is true', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    const { container } = render(<Tile tile={tile} highlight />);
    expect(container.querySelector('.Highlight')).toBeInTheDocument();
  });

  it('renders tile image when showRealTileImages is true', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    render(<Tile tile={tile} showRealTileImages />);
    expect(screen.getByAltText(TileType.Grass)).toBeInTheDocument();
  });

  it('renders classic image when showRealTileImages is false', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    render(<Tile tile={tile} showRealTileImages={false} />);
    expect(screen.getByAltText(TileType.Grass)).toBeInTheDocument();
  });

  it('renders score potential when showPotential is true', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    tile.score_potential[Character.Bunny] = 5;
    render(<Tile tile={tile} showPotential playerSpecies={Character.Bunny} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    const { container } = render(<Tile tile={tile} onClick={onClick} />);
    container.querySelector('.Tile')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders children', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    render(<Tile tile={tile}><div data-testid="child">child</div></Tile>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

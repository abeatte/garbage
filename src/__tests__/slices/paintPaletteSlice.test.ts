import paintPaletteReducer, {
  togglePalettsDisplayed,
  setSelectedPaint,
} from '../../data/slices/paintPaletteSlice';
import { Pointer } from '../../models/PointerModel';
import { Type as TileType } from '../../models/TileModel';
import { Character } from '../../models/CombatantModel';

const initialState = { palette_displayed: false, selected: Pointer.Target };

describe('paintPaletteSlice', () => {
  it('has correct initial state', () => {
    expect(paintPaletteReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('togglePalettsDisplayed flips palette_displayed', () => {
    const on = paintPaletteReducer(initialState, togglePalettsDisplayed());
    expect(on.palette_displayed).toBe(true);
    const off = paintPaletteReducer(on, togglePalettsDisplayed());
    expect(off.palette_displayed).toBe(false);
  });

  it('setSelectedPaint sets a TileType', () => {
    const state = paintPaletteReducer(initialState, setSelectedPaint(TileType.Fire));
    expect(state.selected).toBe(TileType.Fire);
  });

  it('setSelectedPaint sets a Character', () => {
    const state = paintPaletteReducer(initialState, setSelectedPaint(Character.Bunny));
    expect(state.selected).toBe(Character.Bunny);
  });

  it('setSelectedPaint resets to Pointer', () => {
    const withFire = paintPaletteReducer(initialState, setSelectedPaint(TileType.Fire));
    const reset = paintPaletteReducer(withFire, setSelectedPaint(Pointer.Target));
    expect(reset.selected).toBe(Pointer.Target);
  });
});

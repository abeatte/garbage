# Comprehensive Test Suite Bugfix Design

## Overview

The Garbage game project has 14 critical test coverage gaps across game entities, items, utilities, Redux slices, and models. The "bug" is the absence of automated verification for these modules — any code change to untested functions can silently break game behavior without detection by the pre-commit hook or `test:ci` deploy gate. The fix is to add targeted test files that cover each gap, following the existing Jest + RTL patterns established in `src/__tests__/`.

## Glossary

- **Bug_Condition (C)**: A module or function has zero dedicated test coverage, meaning regressions go undetected
- **Property (P)**: Each untested module SHALL have a dedicated test file that exercises its public API, edge cases, and state transitions
- **Preservation**: All existing tests (14 files across components, models, slices, utils, integration) must continue to pass unchanged
- **GetCombatant**: Factory function in `CombatantUtils.ts` that reconstructs Player/Seeker/NPC from models
- **GetItem**: Factory function in `ItemUtils.ts` that reconstructs Bomb/MedPack/PokemonBall/Spider from models
- **viewSurroundings**: Function in `SightUtils.ts` that computes a 9-cell neighborhood `Sight` object
- **processBoardTick**: Function in `TurnProcessingUtils.ts` that advances the entire game state by one tick

## Bug Details

### Bug Condition

The bug manifests when a developer modifies any of the 14 untested modules and the change introduces a regression. Because no tests exist for these modules, the pre-commit hook and CI gate pass successfully despite broken behavior.

**Formal Specification:**
```
FUNCTION isBugCondition(module)
  INPUT: module of type SourceModule
  OUTPUT: boolean

  RETURN module.hasPublicAPI()
         AND module.isReferencedByGameLoop()
         AND module.dedicatedTestCount() == 0
END FUNCTION
```

### Examples

- **Gap 1 (Player)**: `Player.requestMove()` returns `this._model.position` when waypoint is invalid, but no test verifies this fallback — a change to the validity check could silently break player movement
- **Gap 4 (Bomb)**: `Bomb.tap()` kills surrounding combatants and destroys items on fuse-up, but no test verifies the explosion radius or spent-state transition
- **Gap 8 (SightUtils)**: `viewSurroundings()` computes 9-cell neighborhoods with boundary clamping, but no test verifies corner/edge positions return correct `undefined` surroundings
- **Gap 11 (boardSlice resize)**: `shrinkWidth`/`growWidth` trigger `handleResize` which regenerates tiles and repositions combatants, but no test verifies combatant survival or coordinate translation

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All 14 existing test files must continue to pass with identical assertions
- Existing `GetCombatant` factory tests (Player, Seeker, NPC identification) remain unchanged
- Existing `killAndCopy`, `addItemToBoard`, `Combatant` object tests remain unchanged
- Existing `processBoardTick` tests (empty board, single combatant, fire damage) remain unchanged
- Existing `GetItem` factory tests remain unchanged
- Existing `getStrengthRating` tests remain unchanged
- Existing boardSlice, tickerSlice, hudSlice, paintPaletteSlice tests remain unchanged
- Existing component tests (App, Tile, TitleScreen) remain unchanged
- Existing integration tests (game loop) remain unchanged

**Scope:**
All new tests are additive — no existing test file is modified. New test files are created in `src/__tests__/` following the established directory structure.

## Hypothesized Root Cause

The coverage gaps exist because:

1. **Incremental Development**: Game entity classes (Player, NPC, Seeker) were built incrementally with behavior tested manually in-browser rather than via automated tests
2. **Complex Dependencies**: Item `tap()` methods require `Sight`, `Items`, `Combatants`, and `Tiles` objects, making test setup non-trivial — this discouraged test creation
3. **Utility Complexity**: `SightUtils.viewSurroundings()` has complex boundary logic with tile creation side effects that are hard to isolate
4. **Slice Size**: `boardSlice` is very large (~400 lines) with many reducers; only the most commonly used ones were tested initially

## Correctness Properties

Property 1: Bug Condition - Coverage Gap Elimination

_For any_ module where the bug condition holds (isBugCondition returns true — the module has public API, is referenced by the game loop, and has zero dedicated tests), the fix SHALL add a dedicated test file that exercises the module's public functions, edge cases, and state transitions, achieving meaningful coverage of the untested code paths.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14**

Property 2: Preservation - Existing Test Stability

_For any_ existing test file where the bug condition does NOT hold (the module already has dedicated tests), the fix SHALL not modify, remove, or break any existing test assertions, preserving all current regression detection capabilities.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14**

## Fix Implementation

### Changes Required

All changes are additive — new test files only. No source code modifications.


**New Test Files (10 files covering 14 gaps):**

**File 1**: `src/__tests__/objects/Player.test.ts`
- **Covers**: Gap 1 (Requirements 2.1)
- **Tests**: `Player.IsOf()` returns true for `is_player: true` models, false otherwise; `Player.requestMove()` returns shifted waypoint when valid, returns current position when waypoint is invalid; constructor sets `is_player = true`

**File 2**: `src/__tests__/objects/Seeker.test.ts`
- **Covers**: Gap 2 (Requirements 2.2)
- **Tests**: `Seeker.IsOf()` returns true for `decision_type: Seeker` models; `Seeker.beBorn()` sets state to Alive and pushes position to waypoints; `Seeker.getSpawnDecisionType()` always returns Seeker; `Seeker.requestMoveImpl()` delegates to `basic()` which follows target waypoints or picks random destination

**File 3**: `src/__tests__/objects/NPC.test.ts`
- **Covers**: Gap 3 (Requirements 2.3)
- **Tests**: `NPC.IsOf()` returns true when `position !== undefined`, false when position is undefined; NPC is the catch-all in `GetCombatant` factory ordering

**File 4**: `src/__tests__/objects/items/Bomb.test.ts`
- **Covers**: Gap 4 (Requirements 2.4)
- **Tests**: `Bomb.IsOf()` identification; `Bomb.tap()` before fuse-up adds self to board and ticks; `Bomb.tap()` on fuse-up kills surrounding combatants, clears surrounding items, marks self as Spent; fuse_length is 3

**File 5**: `src/__tests__/objects/items/MedPack.test.ts`
- **Covers**: Gap 5 (Requirements 2.5)
- **Tests**: `MedPack.IsOf()` identification; `MedPack.tap()` heals occupant by `MIN_HEALTH` (negative affectFitness); `MedPack.tap()` persists (addItemToBoard) when no occupant; `MedPack.tap()` no-ops on invalid tile; fuse_length is -1 (never fuses up)

**File 6**: `src/__tests__/objects/items/PokemonBall.test.ts`
- **Covers**: Gap 6 (Requirements 2.6)
- **Tests**: `PokemonBall.IsOf()` identification; before fuse-up captures surrounding combatants (sets state Captured); on fuse-up releases captives with `releaseFromCaptivity(fuse_length)`; released captives fight occupants if tile is occupied; fuse_length is 25

**File 7**: `src/__tests__/objects/items/Spider.test.ts`
- **Covers**: Gap 7 (Requirements 2.7)
- **Tests**: `Spider.IsOf()` for all SpiderType values; `Spider.getActionType()` maps each SpiderType to correct TileType; `Spider.tap()` before fuse-up paints tile and moves to new position; `Spider.tap()` on fuse-up does not paint or persist; fuse_length is 25

**File 8**: `src/__tests__/utils/SightUtils.test.ts`
- **Covers**: Gap 8 (Requirements 2.8)
- **Tests**: `viewSurroundings()` returns 9-element surroundings array; center tile at middle of grid has all 8 neighbors defined; corner position (top-left) has tl/t/tr/l undefined; edge position has correct undefined neighbors; occupant detection populates `surrounding.occupant`; `getNewRandomPosition()` returns valid position from legal moves; boundary clamping for positions at grid edges

**File 9**: `src/__tests__/models/CombatantModel.test.ts`
- **Covers**: Gap 9 (Requirements 2.9)
- **Tests**: `getNewPositionFromArrowKey()` for all four ArrowKey directions; boundary clamping (left edge stays put on ARROWLEFT, top edge stays put on ARROWUP, etc.); `getRandomSpecies()` returns valid Character enum value; `getMapTileEffect()` complete species-terrain matrix (all 7 species × 6 tile types + undefined)

**File 10**: `src/__tests__/objects/Combatant.test.ts`
- **Covers**: Gap 10 (Requirements 2.10)
- **Tests**: `canMateWith()` returns false when either combatant age ≤ MAX_YOUNGLING_TICK; `canMateWith()` returns false when same gender and use_genders is true; `canMateWith()` returns true when different gender or use_genders is false; `releaseFromCaptivity()` transitions from Captured to Alive and increases age; `releaseFromCaptivity()` no-ops when not Captured; `birthSpawn()` aborts when >1 enemy nearby; `birthSpawn()` places spawn at empty position; `requestMoveImpl()` priority: target > mate > open > random; Wanderer skips visited positions

### Additions to Existing Test Files

**File 11**: `src/__tests__/slices/boardSlice.test.ts` (append new describe blocks)
- **Covers**: Gap 11 (Requirements 2.11)
- **Tests**: `setGameMode` to Adventure sets initial_num_combatants to 0, creates player, sets map to Adventure; `setGameMode` to God restores defaults; `reset` reinitializes combatants and tiles; `setInitialNumCombatants` caps at 20× default (1000); `shrinkWidth`/`growWidth` update tiles.width and reposition combatants; `shrinkHeight`/`growHeight` update tiles.height; `setMap` regenerates tiles; `setViewPortSize` updates viewport dimensions

**File 12**: `src/__tests__/utils/CombatantUtils.test.ts` (append new describe blocks)
- **Covers**: Gap 12 (Requirements 2.12)
- **Tests**: `initCombatantStartingPos()` returns valid position avoiding occupied tiles and void tiles; returns -1 when no valid position found (all tiles occupied or void); `updateCombatantsPositionsAfterResize()` translates coordinates correctly when width changes; combatants on invalid positions after resize are dropped (deaths counted)

**File 13**: `src/__tests__/utils/ItemUtils.test.ts` (append new describe blocks)
- **Covers**: Gap 13 (Requirements 2.13)
- **Tests**: `updateItemsAfterResize()` repositions items to valid coordinates; items on positions that become invalid are dropped; item count is correct after resize

**File 14**: `src/__tests__/models/TileModel.test.ts` (append new describe blocks)
- **Covers**: Gap 14 (Requirements 2.14)
- **Tests**: `getMapTileScorePotentials()` computes per-species scores based on surrounding tiles; caching works (second call returns cached values); `clearMapTileScorePotentials()` resets cache for center and adjacent tiles

### Shared Test Helpers

A shared helper module `src/__tests__/helpers/testFactories.ts` will provide:
- `makeGrassTiles(width, height)` — creates a Tiles object filled with Grass tiles
- `makeCombatantModel(overrides)` — creates a full CombatantModel with sensible defaults
- `makeItemModel(type, overrides)` — creates an ItemModel with defaults
- `emptyCombatants()` / `emptyItems()` — empty collection factories
- `makeSight(overrides)` — creates a minimal Sight object for item tap tests

These helpers reduce duplication across the 10+ new test files and match patterns already used in existing tests (e.g., `makeGrassTiles` in TurnProcessingUtils.test.ts, `makeCombatant` in TargetingUtils.test.ts).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, confirm that the coverage gaps exist by observing that no tests exercise the untested code paths, then add tests that exercise those paths and verify they pass.

### Exploratory Bug Condition Checking

**Goal**: Confirm that the 14 coverage gaps are real by verifying no existing test exercises the untested functions.

**Test Plan**: Run `npm run test:ci -- --coverage` on the unfixed codebase and verify that the following functions/files show 0% or near-0% coverage:
1. `src/objects/combatants/Player.ts` — `requestMove`, `IsOf` (will show uncovered)
2. `src/objects/combatants/Seeker.ts` — `requestMoveImpl`, `basic`, `beBorn` (will show uncovered)
3. `src/objects/combatants/NPC.ts` — `IsOf` (will show uncovered as standalone)
4. `src/objects/items/Bomb.ts` — `tap` (will show uncovered)
5. `src/objects/items/MedPack.ts` — `tap` (will show uncovered)
6. `src/objects/items/PokemonBall.ts` — `tap` (will show uncovered)
7. `src/objects/items/Spider.ts` — `tap`, `getActionType` (will show uncovered)
8. `src/data/utils/SightUtils.ts` — `viewSurroundings` (will show uncovered)
9. `src/models/CombatantModel.ts` — `getNewPositionFromArrowKey`, `getRandomSpecies` (will show uncovered)
10. `src/objects/combatants/Combatant.ts` — `canMateWith`, `birthSpawn`, `requestMoveImpl` (will show uncovered)

**Expected Counterexamples**:
- Coverage report will show 0% line coverage for Player.ts, Seeker.ts, NPC.ts, Bomb.ts, MedPack.ts, PokemonBall.ts, Spider.ts
- SightUtils.ts may show partial coverage (called indirectly by processBoardTick tests) but `viewSurroundings` boundary logic will be uncovered
- CombatantModel.ts will show `getNewPositionFromArrowKey` and `getRandomSpecies` as uncovered

### Fix Checking

**Goal**: Verify that for all coverage gaps, the new test files exercise the untested code paths and all assertions pass.

**Pseudocode:**
```
FOR ALL module WHERE isBugCondition(module) DO
  testFile := createTestFile(module)
  result := runTests(testFile)
  ASSERT result.allPassed == true
  ASSERT result.coverageForModule > 0
END FOR
```

### Preservation Checking

**Goal**: Verify that all existing tests continue to pass unchanged after adding new test files.

**Pseudocode:**
```
FOR ALL existingTest WHERE NOT isBugCondition(existingTest.module) DO
  ASSERT runTests(existingTest).allPassed == true
  ASSERT existingTest.fileContent == originalFileContent
END FOR
```

**Testing Approach**: Run `npm run test:ci` after adding all new test files. All 14 existing test files plus the new test files must pass. No existing test file is modified.

**Test Cases**:
1. **Existing Factory Tests**: Verify `GetCombatant` and `GetItem` tests still pass
2. **Existing Combatant Object Tests**: Verify kill, affectFitness, fightWith, tick, capture tests still pass
3. **Existing Slice Tests**: Verify all boardSlice, tickerSlice, hudSlice, paintPaletteSlice tests still pass
4. **Existing Integration Tests**: Verify game loop tests still pass

### Unit Tests

- Player: waypoint movement, IsOf identification, constructor is_player flag
- Seeker: basic movement, beBorn initialization, IsOf identification, spawn decision type
- NPC: IsOf catch-all identification
- Bomb: tap explosion mechanics, fuse timing, spent state
- MedPack: tap healing, persistence, tile validity
- PokemonBall: capture, release, captivity duration, fight-on-release
- Spider: tile painting, type mapping, movement, fuse behavior
- SightUtils: 9-cell grid, boundary clamping, occupant detection, random position
- CombatantModel: arrow key movement, boundary clamping, random species, terrain effects matrix
- Combatant: mating eligibility, spawn placement, movement decision priority
- boardSlice: game mode switching, reset, resize, viewport, initial combatant count
- CombatantUtils: starting position, resize repositioning
- ItemUtils: resize repositioning
- TileModel: score potentials, cache invalidation

### Property-Based Tests

Not applicable for this bugfix — the coverage gaps are addressed with deterministic unit tests that exercise specific code paths. The existing codebase uses Jest without a property-based testing library, and adding one would violate the "No additional test libraries beyond Jest + RTL" coding standard.

### Integration Tests

- Verify that after adding all new test files, `npm run test:ci` passes with zero failures
- Verify that the pre-commit hook (Husky) continues to gate on test results
- Verify that new tests integrate with the existing test runner configuration (no jest.config changes needed since CRA auto-discovers `*.test.ts` files)

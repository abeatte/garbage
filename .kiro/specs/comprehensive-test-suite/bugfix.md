# Bugfix Requirements Document

## Introduction

The Garbage game project has insufficient test coverage across critical game systems. The existing 14 test files cover only a fraction of the codebase — key game entity classes (Player, NPC, Seeker, all Item subclasses), utility functions (SightUtils, GameUtils, CombatantModel helpers), several component interactions, and important Redux slice edge cases have no dedicated tests. This gap means regressions can slip through the pre-commit hook and the `test:ci` deploy gate undetected. The "bug" is the absence of a safety net: code changes to untested modules have no automated verification, risking silent breakage at deployment.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a developer modifies `Player.requestMove()` or `Player.IsOf()` logic THEN the system has no tests to detect regressions in player movement or identification

1.2 WHEN a developer modifies `Seeker.requestMoveImpl()`, `Seeker.basic()`, or `Seeker.beBorn()` logic THEN the system has no tests to detect regressions in seeker pathfinding or spawning behavior

1.3 WHEN a developer modifies `NPC.IsOf()` THEN the system has no tests to verify the NPC catch-all identification still works correctly

1.4 WHEN a developer modifies `Bomb.tap()` explosion logic (killing combatants, destroying items, fuse behavior) THEN the system has no tests to detect regressions in bomb detonation effects

1.5 WHEN a developer modifies `MedPack.tap()` healing logic THEN the system has no tests to detect regressions in medpack healing or persistence behavior

1.6 WHEN a developer modifies `PokemonBall.tap()` capture/release logic THEN the system has no tests to detect regressions in combatant capture, captivity duration, or release mechanics

1.7 WHEN a developer modifies `Spider.tap()` or `Spider.getActionType()` terrain-painting logic THEN the system has no tests to detect regressions in spider tile modification behavior

1.8 WHEN a developer modifies `SightUtils.viewSurroundings()` neighborhood calculation THEN the system has no tests to detect regressions in the 9-cell sight grid, boundary handling, or random position generation

1.9 WHEN a developer modifies `CombatantModel.getMapTileEffect()` species-terrain interaction values THEN the system has only partial coverage (TileModel.test.ts) and no tests for all species/terrain combinations or the `getNewPositionFromArrowKey()` / `getRandomSpecies()` functions

1.10 WHEN a developer modifies `Combatant.canMateWith()`, `Combatant.mateWith()`, `Combatant.birthSpawn()`, or `Combatant.requestMove()` decision logic THEN the system has no tests to detect regressions in mating eligibility, spawn creation, or movement decision-making

1.11 WHEN a developer modifies `boardSlice` reducers for `setGameMode`, `reset`, `setInitialNumCombatants`, `shrinkWidth`, `growWidth`, `shrinkHeight`, `growHeight`, `setMap`, or `setViewPortSize` THEN the system has no tests to detect regressions in map resizing, game mode switching, or viewport management

1.12 WHEN a developer modifies `CombatantUtils.initCombatantStartingPos()` or `updateCombatantsPositionsAfterResize()` THEN the system has no tests to detect regressions in combatant placement or resize repositioning logic

1.13 WHEN a developer modifies `ItemUtils.updateItemsAfterResize()` THEN the system has no tests to detect regressions in item repositioning during map resize

1.14 WHEN a developer modifies `TileModel.getMapTileScorePotentials()` or `clearMapTileScorePotentials()` THEN the system has no tests to detect regressions in tile score potential calculation or cache invalidation

### Expected Behavior (Correct)

2.1 WHEN a developer modifies `Player.requestMove()` or `Player.IsOf()` logic THEN the system SHALL have tests that verify player waypoint-based movement, `IsOf` identification, and the `is_player` flag enforcement

2.2 WHEN a developer modifies `Seeker.requestMoveImpl()`, `Seeker.basic()`, or `Seeker.beBorn()` logic THEN the system SHALL have tests that verify seeker target waypoint movement, `IsOf` identification, spawn decision type, and born-state initialization

2.3 WHEN a developer modifies `NPC.IsOf()` THEN the system SHALL have tests that verify NPC identification returns true for position-bearing models and the catch-all behavior

2.4 WHEN a developer modifies `Bomb.tap()` explosion logic THEN the system SHALL have tests that verify bombs tick correctly, kill surrounding combatants on fuse-up, destroy surrounding items on fuse-up, persist before fuse-up, and mark as spent after detonation

2.5 WHEN a developer modifies `MedPack.tap()` healing logic THEN the system SHALL have tests that verify medpacks heal occupants by `-MIN_HEALTH` amount, persist when no occupant is present, and respect tile validity

2.6 WHEN a developer modifies `PokemonBall.tap()` capture/release logic THEN the system SHALL have tests that verify pokeballs capture surrounding combatants, release captives on fuse-up, apply captivity duration to released combatants, and handle fights when releasing onto occupied tiles

2.7 WHEN a developer modifies `Spider.tap()` or `Spider.getActionType()` terrain-painting logic THEN the system SHALL have tests that verify spiders paint tiles to their corresponding terrain type, move to new positions, persist before fuse-up, and correctly map SpiderType to TileType

2.8 WHEN a developer modifies `SightUtils.viewSurroundings()` neighborhood calculation THEN the system SHALL have tests that verify correct 9-cell surrounding positions, boundary clamping (corners, edges), occupant detection, and `getNewRandomPosition()` returning valid positions

2.9 WHEN a developer modifies `CombatantModel` helper functions THEN the system SHALL have tests that verify `getNewPositionFromArrowKey()` for all four arrow directions plus boundary clamping, `getRandomSpecies()` returning valid Character enum values, and complete species-terrain effect combinations in `getMapTileEffect()`

2.10 WHEN a developer modifies `Combatant` mating and movement decision logic THEN the system SHALL have tests that verify `canMateWith()` age and gender checks, `releaseFromCaptivity()` state transitions, `birthSpawn()` spawn placement and enemy-danger abortion, and `requestMoveImpl()` decision priority (target > mate > open > random)

2.11 WHEN a developer modifies `boardSlice` map/mode/resize reducers THEN the system SHALL have tests that verify `setGameMode` switches between God and Adventure mode correctly, `reset` reinitializes state, `setInitialNumCombatants` respects the 20x cap, and width/height grow/shrink update tiles and combatant positions

2.12 WHEN a developer modifies `CombatantUtils.initCombatantStartingPos()` or `updateCombatantsPositionsAfterResize()` THEN the system SHALL have tests that verify starting position avoids occupied tiles and void tiles, and resize repositioning translates coordinates correctly

2.13 WHEN a developer modifies `ItemUtils.updateItemsAfterResize()` THEN the system SHALL have tests that verify items are repositioned to valid coordinates after resize and items on invalid positions are dropped

2.14 WHEN a developer modifies `TileModel.getMapTileScorePotentials()` or `clearMapTileScorePotentials()` THEN the system SHALL have tests that verify score potentials are computed per-species based on surrounding tiles, caching works correctly, and `clearMapTileScorePotentials` resets the cache for affected tiles

### Unchanged Behavior (Regression Prevention)

3.1 WHEN existing `GetCombatant` factory tests run THEN the system SHALL CONTINUE TO correctly identify Player, Seeker, and NPC types and throw for unrecognized models

3.2 WHEN existing `killAndCopy` and `addItemToBoard` tests run THEN the system SHALL CONTINUE TO correctly remove combatants by position and cap items per tile at `MAX_TILE_ITEM_COUNT`

3.3 WHEN existing `Combatant` object tests run (kill, affectFitness, fightWith, tick, capture, setImmortal) THEN the system SHALL CONTINUE TO produce correct state transitions and fitness calculations

3.4 WHEN existing `isTileValidCombatantPosition` and `isValidCombatantPosition` tests run THEN the system SHALL CONTINUE TO correctly validate tile types and position bounds

3.5 WHEN existing `processBoardTick` tests run (empty board, single combatant, fire damage deaths) THEN the system SHALL CONTINUE TO process ticks without errors and track deaths correctly

3.6 WHEN existing `GetItem` factory tests run THEN the system SHALL CONTINUE TO return correct Item subclass instances and throw for unknown types

3.7 WHEN existing `getStrengthRating` tests run THEN the system SHALL CONTINUE TO return correct Strength ratings based on fitness thresholds and immortal flag

3.8 WHEN existing `boardSlice` tests run (settings toggles, game state, select, paintTile, spawn/kill, updateSelectedCombatant) THEN the system SHALL CONTINUE TO produce correct state mutations

3.9 WHEN existing `tickerSlice` tests run (tick, reset, pause/unpause, speedChange, toggleMaxTickSpeed) THEN the system SHALL CONTINUE TO manage tick speed and pause state correctly

3.10 WHEN existing `hudSlice` tests run (setScreenSize, setActiveHudPanel, display mode calculation) THEN the system SHALL CONTINUE TO calculate HUD display modes correctly

3.11 WHEN existing `paintPaletteSlice` tests run (togglePalettsDisplayed, setSelectedPaint) THEN the system SHALL CONTINUE TO manage paint palette state correctly

3.12 WHEN existing `getCombatantAtTarget` tests run THEN the system SHALL CONTINUE TO resolve targets to the correct combatant or player

3.13 WHEN existing integration tests run (game loop start, tick processing, spawn/kill lifecycle, dead combatant cleanup) THEN the system SHALL CONTINUE TO maintain game state integrity across multi-step operations

3.14 WHEN existing component tests run (App, Tile, TitleScreen) THEN the system SHALL CONTINUE TO render correctly

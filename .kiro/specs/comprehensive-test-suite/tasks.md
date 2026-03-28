# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Coverage Gap Verification
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the coverage gaps exist
  - **Scoped PBT Approach**: For each of the 14 coverage gaps, verify that no dedicated test file exists for the untested module
  - Write a test in `src/__tests__/coverage/coverageGaps.test.ts` that imports and calls key untested functions (Player.IsOf, Seeker.IsOf, NPC.IsOf, Bomb.tap, MedPack.tap, PokemonBall.tap, Spider.tap, viewSurroundings boundary cases, getNewPositionFromArrowKey, Combatant.canMateWith, boardSlice resize reducers, initCombatantStartingPos, updateItemsAfterResize, getMapTileScorePotentials)
  - Each test case asserts the expected correct behavior from the design document's Expected Behavior section
  - Run test on UNFIXED code - expect FAILURE because the test file references new helper factories from `src/__tests__/helpers/testFactories.ts` which don't exist yet, confirming the infrastructure gap
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the coverage gap exists and the test infrastructure is missing)
  - Document counterexamples found: modules with 0% dedicated test coverage
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Test Suite Stability
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Run `npm run test:ci` on unfixed code and confirm all 14 existing test files pass
  - Observe: `src/__tests__/utils/CombatantUtils.test.ts` — GetCombatant, killAndCopy, addItemToBoard, Combatant object tests all pass
  - Observe: `src/__tests__/utils/TurnProcessingUtils.test.ts` — isTileValidCombatantPosition, isValidCombatantPosition, processBoardTick tests all pass
  - Observe: `src/__tests__/utils/ItemUtils.test.ts` — GetItem factory tests all pass
  - Observe: `src/__tests__/slices/boardSlice.test.ts` — settings, game state, select, paintTile, spawn/kill tests all pass
  - Observe: `src/__tests__/models/TileModel.test.ts` — createTileModel, getMapTileEffect tests all pass
  - Observe: `src/__tests__/models/GlobalCombatantStatsModel.test.ts` — getStrengthRating tests all pass
  - Observe: `src/__tests__/slices/tickerSlice.test.ts`, `hudSlice.test.ts`, `paintPaletteSlice.test.ts` all pass
  - Observe: `src/__tests__/utils/TargetingUtils.test.ts` — getCombatantAtTarget tests all pass
  - Observe: `src/__tests__/integration/gameLoop.test.ts` — game loop tests all pass
  - Observe: `src/__tests__/components/App.test.tsx`, `Tile.test.tsx`, `TitleScreen.test.tsx` all pass
  - Write a preservation verification script that runs `npm run test:ci` and asserts zero failures across all existing test files
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when existing test suite is verified passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_


- [x] 3. Create shared test helper module

  - [x] 3.1 Create `src/__tests__/helpers/testFactories.ts` with shared test factories
    - `makeGrassTiles(width, height)` — creates a Tiles object filled with Grass tiles (extract from TurnProcessingUtils.test.ts pattern)
    - `makeCombatantModel(overrides?: Partial<CombatantModel>)` — creates a full CombatantModel with sensible defaults (id, position at TILE_START, State.Alive, Strength.Average, DecisionType.Neutral, Character.Bunny, Gender.Male, fitness 0, tick 0)
    - `makeItemModel(type: ItemType, overrides?)` — creates an ItemModel with DEFAULT_ITEM base plus type and position
    - `emptyCombatants()` — returns `{ size: 0, c: {} }`
    - `emptyItems()` — returns `{ size: 0, i: {} }`
    - `makeSight(overrides?: Partial<Sight>)` — creates a minimal Sight object with 9-element surroundings array, center, min/max potential, and getNewRandomPosition stub
    - Follow existing patterns from TurnProcessingUtils.test.ts and TargetingUtils.test.ts
    - _Bug_Condition: isBugCondition(module) where module has no dedicated tests AND test setup is duplicated across files_
    - _Expected_Behavior: Shared factories reduce duplication and provide consistent test data across all new test files_
    - _Preservation: No existing test files are modified — factories are new additions only_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_


- [x] 4. Create new test files for game entity classes

  - [x] 4.1 Create `src/__tests__/objects/Player.test.ts`
    - Test `Player.IsOf()` returns true for `{ is_player: true }`, false for `{ is_player: false }` and `{}`
    - Test Player constructor sets `is_player = true` on the model
    - Test `Player.requestMove()` returns shifted waypoint position when valid (within tile bounds)
    - Test `Player.requestMove()` returns current position when waypoint is invalid (out of bounds or undefined)
    - Test `Player.requestMove()` returns current position when no waypoints queued
    - Use `makeGrassTiles()` and `makeCombatantModel()` from testFactories
    - _Requirements: 2.1_

  - [x] 4.2 Create `src/__tests__/objects/Seeker.test.ts`
    - Test `Seeker.IsOf()` returns true for `{ decision_type: DecisionType.Seeker }`, false for other decision types
    - Test `Seeker.beBorn()` sets state to Alive and pushes position to `target_waypoints`
    - Test `Seeker.getSpawnDecisionType()` always returns `DecisionType.Seeker`
    - Test `Seeker.requestMoveImpl()` follows target waypoints toward destination
    - Test Seeker picks new random target when current target is reached or invalid
    - Use `makeGrassTiles()` and `makeCombatantModel()` from testFactories
    - _Requirements: 2.2_

  - [x] 4.3 Create `src/__tests__/objects/NPC.test.ts`
    - Test `NPC.IsOf()` returns true when `position !== undefined`
    - Test `NPC.IsOf()` returns false when position is undefined
    - Test NPC is the catch-all in `GetCombatant` factory ordering (non-player, non-seeker model with position returns NPC)
    - _Requirements: 2.3_

  - [x] 4.4 Create `src/__tests__/objects/Combatant.test.ts`
    - Test `canMateWith()` returns false when either combatant age ≤ MAX_YOUNGLING_TICK
    - Test `canMateWith()` returns false when same gender and `use_genders` is true
    - Test `canMateWith()` returns true when different gender and both old enough
    - Test `canMateWith()` returns true regardless of gender when `use_genders` is false
    - Test `releaseFromCaptivity()` transitions from Captured to Alive and increases age by duration
    - Test `releaseFromCaptivity()` no-ops when state is not Captured
    - Test `birthSpawn()` aborts spawn (returns undefined) when >1 enemy nearby
    - Test `birthSpawn()` places spawn at empty position when safe
    - Test `birthSpawn()` sets parent state back to Alive and increments children count
    - Test `requestMoveImpl()` decision priority: best_target_position > best_mate_position > best_open_position > new_random_position
    - Test Wanderer decision type skips visited positions
    - Use NPC as concrete subclass for testing abstract Combatant behavior
    - _Requirements: 2.10_


- [x] 5. Create new test files for item classes

  - [x] 5.1 Create `src/__tests__/objects/items/Bomb.test.ts`
    - Test `Bomb.IsOf()` returns true for `{ type: Type.Bomb }`, false for other types
    - Test `Bomb.tap()` before fuse-up: adds self to board via `addItemToBoard` and ticks
    - Test `Bomb.tap()` on fuse-up (tick >= 3): kills surrounding combatants, clears surrounding items, marks self as `ItemState.Spent`
    - Test fuse_length is 3 for Bomb
    - Use `makeSight()`, `emptyCombatants()`, `emptyItems()`, `makeGrassTiles()` from testFactories
    - _Requirements: 2.4_

  - [x] 5.2 Create `src/__tests__/objects/items/MedPack.test.ts`
    - Test `MedPack.IsOf()` returns true for `{ type: Type.MedPack }`, false for other types
    - Test `MedPack.tap()` heals center occupant by `-MIN_HEALTH` amount (calls `affectFitness(-MIN_HEALTH)`)
    - Test `MedPack.tap()` persists on board (calls `addItemToBoard`) when no occupant at center
    - Test `MedPack.tap()` no-ops when center tile is undefined or invalid (Void)
    - Test fuse_length is -1 (never fuses up)
    - _Requirements: 2.5_

  - [x] 5.3 Create `src/__tests__/objects/items/PokemonBall.test.ts`
    - Test `PokemonBall.IsOf()` returns true for `{ type: Type.PokemonBall }`, false for other types
    - Test before fuse-up: captures surrounding combatants (sets state to Captured, adds to `_model.captured`)
    - Test before fuse-up: respects capacity limit (only captures up to number of valid surrounding tiles)
    - Test on fuse-up (tick >= 25): releases captives with `releaseFromCaptivity(fuse_length)`
    - Test on fuse-up: released captives fight occupants if tile is occupied, winner stays
    - Test on fuse-up: released captives placed at empty surrounding positions
    - Test fuse_length is 25 for PokemonBall
    - _Requirements: 2.6_

  - [x] 5.4 Create `src/__tests__/objects/items/Spider.test.ts`
    - Test `Spider.IsOf()` returns true for all SpiderType values (WaterSpider, FireSpider, RockSpider, SandSpider, GrassSpider)
    - Test `Spider.IsOf()` returns false for non-spider types (Bomb, MedPack, PokemonBall)
    - Test `Spider.getActionType()` maps each SpiderType to correct TileType (WaterSpider→Water, FireSpider→Fire, RockSpider→Rock, SandSpider→Sand, GrassSpider→Grass)
    - Test `Spider.tap()` before fuse-up: paints current tile to spider's terrain type and moves to new position
    - Test `Spider.tap()` on fuse-up: does not paint or persist (just ticks)
    - Test fuse_length is 25 for all spider types
    - _Requirements: 2.7_


- [x] 6. Create new test files for utilities and models

  - [x] 6.1 Create `src/__tests__/utils/SightUtils.test.ts`
    - Test `viewSurroundings()` returns 9-element surroundings array
    - Test center tile at middle of grid (e.g., position TILE_START+12 on 5×5) has all 8 neighbors defined
    - Test corner position (top-left, TILE_START) has tl/t/tr/l undefined (only c, r, b, br, bl available based on grid)
    - Test edge position (top row middle) has tl/t/tr undefined
    - Test occupant detection: combatant at neighboring position populates `surrounding.occupant`
    - Test `getNewRandomPosition()` returns a valid position from LegalMoves
    - Test boundary clamping for positions at grid edges (bottom-right corner)
    - Use `makeGrassTiles()` and `makeCombatantModel()` from testFactories
    - _Requirements: 2.8_

  - [x] 6.2 Create `src/__tests__/models/CombatantModel.test.ts`
    - Test `getNewPositionFromArrowKey()` for ARROWLEFT: decrements position by 1 when not at left edge
    - Test `getNewPositionFromArrowKey()` for ARROWRIGHT: increments position by 1 when not at right edge
    - Test `getNewPositionFromArrowKey()` for ARROWUP: decrements position by width when not at top edge
    - Test `getNewPositionFromArrowKey()` for ARROWDOWN: increments position by width when not at bottom edge
    - Test boundary clamping: left edge stays put on ARROWLEFT, top edge stays put on ARROWUP, right edge stays put on ARROWRIGHT, bottom edge stays put on ARROWDOWN
    - Test `getRandomSpecies()` returns a valid Character enum value
    - Test `getMapTileEffect()` complete species-terrain matrix: all 7 Character values × all TileType values (Void, Water, Fire, Rock, Sand, Grass) plus undefined tileType
    - Verify Turtle gets Water bonus (+10) and extra Fire penalty (-10)
    - Verify Lizard gets Fire reduction (+5) and Sand bonus (+5)
    - _Requirements: 2.9_


- [x] 7. Add tests to existing test files

  - [x] 7.1 Add new describe blocks to `src/__tests__/slices/boardSlice.test.ts`
    - Test `setGameMode` to Adventure: sets initial_num_combatants to 0, creates player, sets map to 'Adventure', sets tiles.height to 3
    - Test `setGameMode` to God: restores default initial_num_combatants (50), clears player, restores default map if was 'Adventure'
    - Test `setGameMode` no-ops when already in the target mode
    - Test `reset` reinitializes combatants and tiles (combatants.size matches initial_num_combatants, tiles regenerated)
    - Test `setInitialNumCombatants` updates combatant count and caps at 20× default (1000)
    - Test `shrinkWidth` decreases tiles.width by 1 and repositions combatants
    - Test `growWidth` increases tiles.width by 1 and repositions combatants
    - Test `shrinkHeight` decreases tiles.height by 1
    - Test `growHeight` increases tiles.height by 1
    - Test `shrinkWidth` no-ops when width is 0
    - Test `shrinkHeight` no-ops when height is 0
    - Test `setMap` regenerates tiles with new map and reinitializes combatants
    - Test `setViewPortSize` updates viewport width/height measurements
    - _Requirements: 2.11_

  - [x] 7.2 Add new describe blocks to `src/__tests__/utils/CombatantUtils.test.ts`
    - Test `initCombatantStartingPos()` returns a valid position (>= tiles.start, <= tiles.end) on a non-void tile
    - Test `initCombatantStartingPos()` avoids occupied tiles (position not in combatants.c)
    - Test `initCombatantStartingPos()` avoids player position
    - Test `initCombatantStartingPos()` returns -1 when no valid position found (all tiles void or occupied)
    - Test `updateCombatantsPositionsAfterResize()` translates coordinates correctly when width increases by 1
    - Test `updateCombatantsPositionsAfterResize()` translates coordinates correctly when width decreases by 1
    - Test `updateCombatantsPositionsAfterResize()` counts deaths for combatants on invalid positions after resize
    - Test `updateCombatantsPositionsAfterResize()` handles fight when two combatants land on same position
    - _Requirements: 2.12_

  - [x] 7.3 Add new describe blocks to `src/__tests__/utils/ItemUtils.test.ts`
    - Test `updateItemsAfterResize()` repositions items to valid coordinates after width change
    - Test `updateItemsAfterResize()` drops items on positions that become invalid after resize
    - Test `updateItemsAfterResize()` returns correct item count (size) after resize
    - Test `updateItemsAfterResize()` handles empty items collection
    - _Requirements: 2.13_

  - [x] 7.4 Add new describe blocks to `src/__tests__/models/TileModel.test.ts`
    - Test `getMapTileScorePotentials()` computes per-species scores based on surrounding tile types
    - Test `getMapTileScorePotentials()` caching: second call returns same cached values without recomputation
    - Test `getMapTileScorePotentials()` returns empty object for undefined tile
    - Test `clearMapTileScorePotentials()` resets score_potential to `{}` for center tile and adjacent tiles (left, right, up, down)
    - Test `clearMapTileScorePotentials()` respects boundary conditions (doesn't clear tiles outside grid)
    - _Requirements: 2.14_


- [x] 8. Verify fix and preservation

  - [x] 8.1 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Coverage Gap Elimination
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior for all 14 coverage gaps
    - When this test passes, it confirms all coverage gaps have been filled
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms all 14 modules now have dedicated test coverage)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [x] 8.2 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Test Suite Stability
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run `npm run test:ci` and confirm all 14 original test files still pass with zero failures
    - Confirm no existing test file was modified (all changes are additive new files/describe blocks)
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_

- [x] 9. Checkpoint - Ensure all tests pass
  - Run `npm run test:ci` and verify all tests pass (both new and existing)
  - Verify new test files are auto-discovered by CRA's Jest configuration (no jest.config changes needed)
  - Verify pre-commit hook (Husky) still gates on test results
  - Ensure all tests pass, ask the user if questions arise.

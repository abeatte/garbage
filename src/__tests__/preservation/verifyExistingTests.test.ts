/**
 * Preservation Property Test — Existing Test Suite Stability
 *
 * Property 2: For any existing test file where the bug condition does NOT hold
 * (the module already has dedicated tests), the fix SHALL not modify, remove,
 * or break any existing test assertions, preserving all current regression
 * detection capabilities.
 *
 * This test verifies that all 14 original test files pass by running the
 * test suite programmatically and asserting zero failures.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9,
 *            3.10, 3.11, 3.12, 3.13, 3.14
 */

import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// The 14 original test files that must remain passing
const ORIGINAL_TEST_FILES = [
  'src/__tests__/utils/CombatantUtils.test.ts',
  'src/__tests__/utils/TurnProcessingUtils.test.ts',
  'src/__tests__/utils/ItemUtils.test.ts',
  'src/__tests__/slices/boardSlice.test.ts',
  'src/__tests__/models/TileModel.test.ts',
  'src/__tests__/models/GlobalCombatantStatsModel.test.ts',
  'src/__tests__/slices/tickerSlice.test.ts',
  'src/__tests__/slices/hudSlice.test.ts',
  'src/__tests__/slices/paintPaletteSlice.test.ts',
  'src/__tests__/utils/TargetingUtils.test.ts',
  'src/__tests__/integration/gameLoop.test.ts',
  'src/__tests__/components/App.test.tsx',
  'src/__tests__/components/Tile.test.tsx',
  'src/__tests__/components/TitleScreen.test.tsx',
];

describe('Preservation — Existing Test Suite Stability', () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8,
   *              3.9, 3.10, 3.11, 3.12, 3.13, 3.14**
   *
   * Runs the original 14 test files via react-scripts test and asserts:
   * - Exit code is 0 (all tests pass)
   * - All 14 test suites pass
   * - Zero individual tests fail
   */
  it('all 14 original test files pass with zero failures', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    // Build a regex pattern that matches only the 14 original test file paths
    const testPattern = ORIGINAL_TEST_FILES
      .map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    // Use the local react-scripts binary directly for reliable execution
    const reactScriptsBin = path.resolve(
      projectRoot, 'node_modules', '.bin', 'react-scripts'
    );

    const result = spawnSync(
      reactScriptsBin,
      [
        'test',
        '--watchAll=false',
        '--forceExit',
        '--verbose=false',
        `--testPathPattern=${testPattern}`,
      ],
      {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 120000,
        env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
      }
    );

    // Combine stdout + stderr since Jest writes summary to stderr
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const combined = stdout + stderr;

    // Primary assertion: exit code 0 means all tests passed
    if (result.status !== 0) {
      // Include output for debugging
      throw new Error(
        `Test runner exited with code ${result.status}.\n` +
        `stdout length: ${stdout.length}, stderr length: ${stderr.length}\n` +
        `Last 1000 chars of combined output:\n${combined.slice(-1000)}`
      );
    }

    // Parse "Test Suites: X passed, Y total" from combined output
    const suitesMatch = combined.match(
      /Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/
    );

    if (suitesMatch) {
      const suitesPassed = parseInt(suitesMatch[1], 10);
      const suitesTotal = parseInt(suitesMatch[2], 10);
      expect(suitesTotal).toBe(14);
      expect(suitesPassed).toBe(14);
    }

    // Parse "Tests: X passed, Y total"
    const testsMatch = combined.match(
      /Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/
    );

    if (testsMatch) {
      const testsPassed = parseInt(testsMatch[1], 10);
      const testsTotal = parseInt(testsMatch[2], 10);
      expect(testsPassed).toBe(testsTotal);
    }

    // Verify no "FAIL" lines appear in output
    const failLines = combined
      .split('\n')
      .filter(line => /^\s*FAIL\s/.test(line));
    expect(failLines).toHaveLength(0);
  }, 120000);

  /**
   * Validates that each of the 14 original test files exists on disk.
   * This ensures no test file was accidentally deleted.
   */
  it('all 14 original test files exist on disk', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');

    for (const testFile of ORIGINAL_TEST_FILES) {
      const fullPath = path.join(projectRoot, testFile);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});

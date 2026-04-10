import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_MODES,
  TARGET_SUM,
  analyzeSelection,
  applySelection,
  countClearedCells,
  createBoard,
  createGameState,
  endRound,
  normalizeSelection,
  tick,
} from "../src/sum-ten-game.js";

test("board is created with 17 columns, 10 rows, and digits between 1 and 9", () => {
  const board = createBoard(() => 0.5);

  assert.equal(board.length, 10);
  assert.equal(board[0].length, 17);
  assert.equal(board[3][4].value, 5);
});

test("selection is normalized into a rectangle", () => {
  const selection = normalizeSelection({ row: 5, column: 8 }, { row: 2, column: 3 });

  assert.deepEqual(selection, {
    startRow: 2,
    endRow: 5,
    startColumn: 3,
    endColumn: 8,
  });
});

test("selection is valid only when active cells sum to ten", () => {
  const board = createBoard(() => 0);
  board[0][0].value = 2;
  board[0][1].value = 8;

  const analysis = analyzeSelection(board, {
    startRow: 0,
    endRow: 0,
    startColumn: 0,
    endColumn: 1,
  });

  assert.equal(analysis.sum, TARGET_SUM);
  assert.equal(analysis.isValid, true);
});

test("valid selection clears cells and increments score by cleared count", () => {
  const state = createGameState(GAME_MODES.TIMED, () => 0);
  state.board[0][0].value = 1;
  state.board[0][1].value = 4;
  state.board[0][2].value = 5;

  const next = applySelection(state, {
    startRow: 0,
    endRow: 0,
    startColumn: 0,
    endColumn: 2,
  });

  assert.equal(next.score, 3);
  assert.equal(next.board[0][0].cleared, true);
  assert.equal(next.board[0][1].cleared, true);
  assert.equal(next.board[0][2].cleared, true);
});

test("selection can pass through cleared cells and still clear active cells", () => {
  const state = createGameState(GAME_MODES.TIMED, () => 0);
  state.board[0][0].value = 3;
  state.board[0][1].cleared = true;
  state.board[0][2].value = 7;

  const next = applySelection(state, {
    startRow: 0,
    endRow: 0,
    startColumn: 0,
    endColumn: 2,
  });

  assert.equal(next.score, 2);
  assert.equal(next.board[0][0].cleared, true);
  assert.equal(next.board[0][2].cleared, true);
  assert.equal(countClearedCells(next.board), 3);
});

test("timed mode counts down and ends at zero", () => {
  const state = {
    ...createGameState(GAME_MODES.TIMED, () => 0),
    timeLeft: 1,
  };

  const next = tick(state);

  assert.equal(next.timeLeft, 0);
  assert.equal(next.isRoundOver, true);
});

test("practice mode does not tick down and can end manually", () => {
  const state = createGameState(GAME_MODES.PRACTICE, () => 0);

  const afterTick = tick(state);
  const afterEnd = endRound(afterTick);

  assert.equal(afterTick.timeLeft, null);
  assert.equal(afterTick.isRoundOver, false);
  assert.equal(afterEnd.isRoundOver, true);
});

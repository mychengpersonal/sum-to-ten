export const BOARD_COLUMNS = 17;
export const BOARD_ROWS = 10;
export const TARGET_SUM = 10;
export const TIMED_DURATION_SECONDS = 90;
export const GAME_MODES = {
  TIMED: "timed",
  PRACTICE: "practice",
};

export function createBoard(random = Math.random) {
  return Array.from({ length: BOARD_ROWS }, (_, row) =>
    Array.from({ length: BOARD_COLUMNS }, (_, column) => ({
      id: `${row}-${column}`,
      row,
      column,
      value: randomDigit(random),
      cleared: false,
    })),
  );
}

export function createGameState(mode = GAME_MODES.TIMED, random = Math.random) {
  return {
    mode,
    board: createBoard(random),
    score: 0,
    timeLeft: mode === GAME_MODES.TIMED ? TIMED_DURATION_SECONDS : null,
    isRoundOver: false,
  };
}

export function normalizeSelection(startCell, endCell) {
  if (!startCell || !endCell) {
    return null;
  }

  return {
    startRow: Math.min(startCell.row, endCell.row),
    endRow: Math.max(startCell.row, endCell.row),
    startColumn: Math.min(startCell.column, endCell.column),
    endColumn: Math.max(startCell.column, endCell.column),
  };
}

export function getCellsInSelection(board, selection) {
  if (!selection) {
    return [];
  }

  const cells = [];
  for (let row = selection.startRow; row <= selection.endRow; row += 1) {
    for (let column = selection.startColumn; column <= selection.endColumn; column += 1) {
      cells.push(board[row][column]);
    }
  }

  return cells;
}

export function analyzeSelection(board, selection) {
  const cells = getCellsInSelection(board, selection);
  const activeCells = cells.filter((cell) => !cell.cleared);
  const sum = activeCells.reduce((total, cell) => total + cell.value, 0);
  const clearedCellCount = cells.length - activeCells.length;

  return {
    cells,
    activeCells,
    cellCount: activeCells.length,
    sum,
    clearedCellCount,
    isValid: activeCells.length > 0 && sum === TARGET_SUM,
  };
}

export function applySelection(state, selection) {
  if (state.isRoundOver) {
    return state;
  }

  const analysis = analyzeSelection(state.board, selection);
  if (!analysis.isValid) {
    return state;
  }

  const nextBoard = state.board.map((row) => row.map((cell) => ({ ...cell })));
  analysis.activeCells.forEach((cell) => {
    nextBoard[cell.row][cell.column].cleared = true;
  });

  return {
    ...state,
    board: nextBoard,
    score: state.score + analysis.activeCells.length,
  };
}

export function hasAnyValidSelection(board) {
  const prefix = buildPrefixSum(board);

  for (let startRow = 0; startRow < BOARD_ROWS; startRow += 1) {
    for (let endRow = startRow; endRow < BOARD_ROWS; endRow += 1) {
      for (let startColumn = 0; startColumn < BOARD_COLUMNS; startColumn += 1) {
        for (let endColumn = startColumn; endColumn < BOARD_COLUMNS; endColumn += 1) {
          if (getRectangleSum(prefix, startRow, endRow, startColumn, endColumn) === TARGET_SUM) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

export function tick(state) {
  if (state.isRoundOver || state.mode !== GAME_MODES.TIMED) {
    return state;
  }

  const nextTimeLeft = Math.max(0, state.timeLeft - 1);
  return {
    ...state,
    timeLeft: nextTimeLeft,
    isRoundOver: nextTimeLeft === 0,
  };
}

export function endRound(state) {
  if (state.isRoundOver) {
    return state;
  }

  return {
    ...state,
    isRoundOver: true,
  };
}

export function countClearedCells(board) {
  return board.flat().filter((cell) => cell.cleared).length;
}

export function getCellFromPoint(boardElement, clientX, clientY) {
  const rect = boardElement.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return null;
  }

  const column = Math.min(
    BOARD_COLUMNS - 1,
    Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * BOARD_COLUMNS)),
  );
  const row = Math.min(
    BOARD_ROWS - 1,
    Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * BOARD_ROWS)),
  );

  return { row, column };
}

function randomDigit(random) {
  return Math.floor(random() * 9) + 1;
}

function buildPrefixSum(board) {
  const prefix = Array.from({ length: BOARD_ROWS + 1 }, () =>
    Array(BOARD_COLUMNS + 1).fill(0),
  );

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      const value = board[row][column].cleared ? 0 : board[row][column].value;
      prefix[row + 1][column + 1] =
        value +
        prefix[row][column + 1] +
        prefix[row + 1][column] -
        prefix[row][column];
    }
  }

  return prefix;
}

function getRectangleSum(prefix, startRow, endRow, startColumn, endColumn) {
  return (
    prefix[endRow + 1][endColumn + 1] -
    prefix[startRow][endColumn + 1] -
    prefix[endRow + 1][startColumn] +
    prefix[startRow][startColumn]
  );
}

import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  GAME_MODES,
  TARGET_SUM,
  analyzeSelection,
  applySelection,
  countClearedCells,
  createGameState,
  endRound,
  getCellFromPoint,
  normalizeSelection,
  tick,
} from "./sum-ten-game.js";

const STORAGE_KEYS = {
  nickname: "sum10-nickname",
  leaderboard: "sum10-personal-leaderboard",
};
const LEADERBOARD_LIMIT = 10;
const DEFAULT_HELP_TEXT = "輸入完成後即可進入首頁，之後打開會自動帶入。";

const nicknameModal = document.getElementById("nickname-modal");
const nicknameConfirmButton = document.getElementById("nickname-confirm-button");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");
const startButton = document.getElementById("start-button");
const playAgainButton = document.getElementById("play-again-button");
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const selectionSummaryElement = document.getElementById("selection-summary");
const gameTitleElement = document.getElementById("game-title");
const homeButton = document.getElementById("home-button");
const endButton = document.getElementById("end-button");
const restartRunButton = document.getElementById("restart-run-button");
const finalScoreElement = document.getElementById("final-score");
const modeButtons = document.querySelectorAll("[data-mode-option]");
const nicknameInputs = document.querySelectorAll("[data-nickname-input]");
const nicknameHelpElement = document.getElementById("nickname-help");
const leaderboardModeButtons = document.querySelectorAll("[data-leaderboard-mode]");
const leaderboardLists = document.querySelectorAll("[data-leaderboard-list]");

let selectedMode = GAME_MODES.TIMED;
let selectedLeaderboardMode = GAME_MODES.TIMED;
let state = null;
let currentSelection = null;
let pointerStartCell = null;
let activePointerId = null;
let roundTimerId = null;
let nickname = readNickname();
let personalLeaderboard = readLeaderboard();

createBoardDom();
syncNicknameInputs();
syncModeButtons();
syncLeaderboardModeButtons();
renderLeaderboard();
boot();

startButton.addEventListener("click", () => {
  startRound();
});

playAgainButton.addEventListener("click", () => {
  startRound();
});

restartRunButton.addEventListener("click", () => {
  saveInterruptedRun();
  startRound(selectedMode);
});

homeButton.addEventListener("click", (event) => {
  event.preventDefault();
  saveInterruptedRun();
  window.location.href = homeButton.href;
});

nicknameConfirmButton.addEventListener("click", () => {
  confirmNickname();
});

nicknameInputs.forEach((input) => {
  input.addEventListener("input", () => {
    nickname = input.value.slice(0, 20);
    persistNickname();
    syncNicknameInputs(input);
    clearNicknameError();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmNickname();
    }
  });
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.getAttribute("data-mode-option");
    syncModeButtons();
    if (showingGameScreen() && state && state.mode !== selectedMode) {
      startRound(selectedMode);
    }
  });
});

leaderboardModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedLeaderboardMode = button.getAttribute("data-leaderboard-mode");
    syncLeaderboardModeButtons();
    renderLeaderboard();
  });
});

endButton.addEventListener("click", () => {
  finishRound();
});

boardElement.addEventListener("pointerdown", (event) => {
  if (!state || state.isRoundOver) {
    return;
  }

  const cell = getCellFromPoint(boardElement, event.clientX, event.clientY);
  if (!cell) {
    return;
  }

  event.preventDefault();
  activePointerId = event.pointerId;
  pointerStartCell = cell;
  currentSelection = normalizeSelection(cell, cell);
  boardElement.setPointerCapture(event.pointerId);
  render();
});

boardElement.addEventListener("pointermove", (event) => {
  if (
    !pointerStartCell ||
    !state ||
    state.isRoundOver ||
    event.pointerId !== activePointerId
  ) {
    return;
  }

  event.preventDefault();
  const cell = getCellFromPoint(boardElement, event.clientX, event.clientY) ?? pointerStartCell;
  currentSelection = normalizeSelection(pointerStartCell, cell);
  render();
});

boardElement.addEventListener("pointerup", (event) => {
  if (!pointerStartCell || !state || event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  const cell = getCellFromPoint(boardElement, event.clientX, event.clientY) ?? pointerStartCell;
  currentSelection = normalizeSelection(pointerStartCell, cell);
  state = applySelection(state, currentSelection);
  activePointerId = null;
  pointerStartCell = null;
  currentSelection = null;
  boardElement.releasePointerCapture(event.pointerId);
  render();
});

boardElement.addEventListener("pointercancel", (event) => {
  if (activePointerId !== null && event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;
  pointerStartCell = null;
  currentSelection = null;
  render();
});

["touchstart", "touchmove", "touchend"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    (event) => {
      if (event.touches && event.touches.length > 1) {
        event.preventDefault();
        return;
      }

      if (
        event.target === boardElement ||
        boardElement.contains(event.target) ||
        (showingGameScreen() && event.cancelable)
      ) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
});

function createBoardDom() {
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      cell.setAttribute("role", "gridcell");
      fragment.appendChild(cell);
    }
  }

  boardElement.appendChild(fragment);
}

function boot() {
  if (nickname.trim()) {
    closeNicknameModal();
    showScreen("start");
    return;
  }

  showNicknameModal();
  nicknameInputs[0]?.focus();
}

function startRound(mode = selectedMode) {
  selectedMode = mode;
  state = createGameState(mode);
  state.playerName = nickname.trim();
  state.leaderboardSaved = false;
  currentSelection = null;
  pointerStartCell = null;
  activePointerId = null;
  clearRoundTimer();
  if (mode === GAME_MODES.TIMED) {
    roundTimerId = window.setInterval(() => {
      state = tick(state);
      render();
      if (state.isRoundOver) {
        finishRound();
      }
    }, 1000);
  }

  showScreen("game");
  render();
}

function finishRound() {
  clearRoundTimer();
  if (state) {
    maybeSavePersonalScore();
    state = endRound(state);
  }
  renderResult();
  renderLeaderboard();
  showScreen("result");
}

function clearRoundTimer() {
  if (roundTimerId !== null) {
    window.clearInterval(roundTimerId);
    roundTimerId = null;
  }
}

function saveInterruptedRun() {
  if (!state || state.isRoundOver) {
    return;
  }

  clearRoundTimer();
  maybeSavePersonalScore();
  renderLeaderboard();
}

function render() {
  if (!state) {
    return;
  }

  scoreElement.textContent = String(state.score);
  timerElement.textContent =
    state.mode === GAME_MODES.TIMED ? String(state.timeLeft) : "∞";
  gameTitleElement.textContent =
    state.mode === GAME_MODES.TIMED ? "計時模式" : "練習模式";
  endButton.hidden = state.mode !== GAME_MODES.PRACTICE;

  const analysis = analyzeSelection(state.board, currentSelection);
  renderBoard(analysis);
  renderSelectionSummary(analysis);
}

function renderBoard(analysis) {
  const selectedIds = new Set(analysis.cells.map((cell) => cell.id));
  const boardCells = boardElement.children;

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      const cell = state.board[row][column];
      const element = boardCells[row * BOARD_COLUMNS + column];
      element.textContent = cell.cleared ? "" : String(cell.value);
      element.classList.toggle("is-cleared", cell.cleared);
      element.classList.toggle("is-selected", selectedIds.has(cell.id) && !analysis.isValid);
      element.classList.toggle("is-valid", selectedIds.has(cell.id) && analysis.isValid);
    }
  }
}

function renderSelectionSummary(analysis) {
  if (!currentSelection) {
    selectionSummaryElement.textContent = `按住並拖曳框選矩形區塊。空格可以跨越，讓剩下數字總和剛好等於 ${TARGET_SUM}。`;
    return;
  }

  if (analysis.cellCount === 0) {
    selectionSummaryElement.textContent = "請至少框選 1 格。";
    return;
  }

  if (analysis.isValid) {
    const bridgeText =
      analysis.clearedCellCount > 0
        ? `，中間跨過 ${analysis.clearedCellCount} 個空格`
        : "";
    selectionSummaryElement.textContent = `剛好 ${TARGET_SUM}！放開就會消掉 ${analysis.cellCount} 格${bridgeText}。`;
    return;
  }

  const clearedHint =
    analysis.clearedCellCount > 0
      ? `，已跨過 ${analysis.clearedCellCount} 個空格`
      : "";
  selectionSummaryElement.textContent = `目前剩餘數字總和 ${analysis.sum}${clearedHint}，還沒湊到 ${TARGET_SUM}。`;
}

function renderResult() {
  finalScoreElement.textContent = String(state.score);
}

function syncNicknameInputs(sourceInput = null) {
  nicknameInputs.forEach((input) => {
    if (input !== sourceInput) {
      input.value = nickname;
    }
  });
}

function syncModeButtons() {
  modeButtons.forEach((button) => {
    const isSelected = button.getAttribute("data-mode-option") === selectedMode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function syncLeaderboardModeButtons() {
  leaderboardModeButtons.forEach((button) => {
    const isSelected =
      button.getAttribute("data-leaderboard-mode") === selectedLeaderboardMode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderLeaderboard() {
  const entries = personalLeaderboard[selectedLeaderboardMode] ?? [];
  leaderboardLists.forEach((list) => {
    list.innerHTML = "";
    if (entries.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "leaderboard-empty";
      emptyItem.textContent = "還沒有紀錄，先來玩一場吧。";
      list.appendChild(emptyItem);
      return;
    }

    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "leaderboard-item";
      item.innerHTML = `
        <div class="leaderboard-row">
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${escapeHtml(entry.nickname)}</span>
          <span class="leaderboard-score">${entry.score} 分</span>
        </div>
        <p class="leaderboard-meta">${entry.createdAtLabel}</p>
      `;
      list.appendChild(item);
    });
  });
}

function showScreen(screenName) {
  startScreen.hidden = screenName !== "start";
  gameScreen.hidden = screenName !== "game";
  resultScreen.hidden = screenName !== "result";
  syncModeButtons();
}

function showingGameScreen() {
  return !gameScreen.hidden;
}

function confirmNickname() {
  if (!ensureNickname()) {
    return;
  }

  closeNicknameModal();
  showScreen("start");
}

function ensureNickname() {
  nickname = nickname.trim();
  persistNickname();
  syncNicknameInputs();
  if (nickname) {
    clearNicknameError();
    return true;
  }

  nicknameHelpElement.textContent = "開始前請先輸入暱稱。";
  nicknameHelpElement.classList.add("is-error");
  nicknameInputs[0]?.focus();
  return false;
}

function clearNicknameError() {
  nicknameHelpElement.textContent = DEFAULT_HELP_TEXT;
  nicknameHelpElement.classList.remove("is-error");
}

function showNicknameModal() {
  nicknameModal.hidden = false;
}

function closeNicknameModal() {
  nicknameModal.hidden = true;
}

function persistNickname() {
  window.localStorage.setItem(STORAGE_KEYS.nickname, nickname.trim());
}

function readNickname() {
  return window.localStorage.getItem(STORAGE_KEYS.nickname) ?? "";
}

function maybeSavePersonalScore() {
  if (!state || state.leaderboardSaved) {
    return;
  }

  const playerName = state.playerName?.trim() || nickname.trim();
  if (!playerName) {
    return;
  }

  const nextEntry = {
    nickname: playerName,
    score: state.score,
    createdAt: new Date().toISOString(),
    createdAtLabel: formatTimestamp(new Date()),
  };

  const nextModeEntries = [...(personalLeaderboard[state.mode] ?? []), nextEntry]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })
    .slice(0, LEADERBOARD_LIMIT);

  personalLeaderboard = {
    ...personalLeaderboard,
    [state.mode]: nextModeEntries,
  };
  window.localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(personalLeaderboard));
  state.leaderboardSaved = true;
}

function readLeaderboard() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.leaderboard);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      [GAME_MODES.TIMED]: Array.isArray(parsed[GAME_MODES.TIMED])
        ? parsed[GAME_MODES.TIMED].slice(0, LEADERBOARD_LIMIT)
        : [],
      [GAME_MODES.PRACTICE]: Array.isArray(parsed[GAME_MODES.PRACTICE])
        ? parsed[GAME_MODES.PRACTICE].slice(0, LEADERBOARD_LIMIT)
        : [],
    };
  } catch {
    return {
      [GAME_MODES.TIMED]: [],
      [GAME_MODES.PRACTICE]: [],
    };
  }
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.addEventListener("beforeunload", () => {
  clearRoundTimer();
});

document.addEventListener(
  "gesturestart",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "gesturechange",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "gestureend",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "dblclick",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "gesturestart",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "dblclick",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "gesturechange",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "gestureend",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

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
  hasAnyValidSelection,
  normalizeSelection,
  tick,
} from "./sum-ten-game.js";

const STORAGE_KEYS = {
  nickname: "sum10-nickname",
  leaderboard: "sum10-personal-leaderboard",
  language: "sum10-language",
};
const LEADERBOARD_LIMIT = 10;
const LANGUAGES = ["zh-Hant", "en"];
const translations = {
  "zh-Hant": {
    documentTitle: "SUM TO TEN",
    modalEyebrow: "準備開始",
    modalTitle: "輸入暱稱，進入遊戲",
    modalIntro: "你的暱稱會顯示在個人排行榜上，並自動保存在這個瀏覽器裡。",
    nicknameLabel: "暱稱",
    nicknamePlaceholder: "請輸入你的暱稱",
    nicknameHelpDefault: "輸入完成後即可進入首頁，之後打開會自動帶入。",
    nicknameHelpError: "開始前請先輸入暱稱。",
    enterGame: "進入遊戲",
    startEyebrow: "MVP Demo",
    startIntro:
      "在 17 x 10 的數字方塊中，用滑鼠或手指框選一個矩形區塊。只要區塊內尚未消除的數字加總剛好等於 10，就能一起消掉並累積分數，已經變空的格子也可以直接跨過。",
    ruleScore: "每消掉 1 格得 1 分，滿分 170 分。",
    ruleTimed: "計時模式為 90 秒，時間到自動結算。",
    rulePractice: "練習模式不限時，需要手動結束。",
    modePickerLabel: "選擇遊戲模式",
    timedMode: "計時模式",
    practiceMode: "練習模式",
    startButton: "開始",
    leaderboardTitle: "個人排行榜",
    leaderboardNote: "每個模式只保留前 10 名",
    leaderboardModeLabel: "個人排行榜模式",
    currentMode: "目前模式",
    scoreLabel: "分數",
    timerLabel: "剩餘時間",
    boardLabel: "17 乘 10 數字棋盤",
    homeButton: "回首頁",
    endRoundButton: "結束本輪",
    restartRoundButton: "重新開始本輪",
    resultEyebrow: "本輪結算",
    resultTitle: "遊戲結束",
    resultScoreSuffix: " / 170 分",
    nextModeLabel: "選擇下一場模式",
    playAgainButton: "重新開始",
    selectionIdle: "按住並拖曳框選矩形區塊。空格可以跨越，讓剩下數字總和剛好等於 10。",
    selectionEmpty: "請至少框選 1 格。",
    selectionValid: "剛好 10！放開就會消掉 {count} 格{bridgeText}。",
    selectionValidBridge: "，中間跨過 {count} 個空格",
    selectionInvalid: "目前剩餘數字總和 {sum}{clearedHint}，還沒湊到 10。",
    selectionInvalidBridge: "，已跨過 {count} 個空格",
    leaderboardEmpty: "還沒有紀錄，先來玩一場吧。",
    leaderboardPoints: "{score} 分",
    modePracticeSummary: "練習模式",
    modeTimedSummary: "計時模式",
  },
  en: {
    documentTitle: "SUM TO TEN",
    modalEyebrow: "Ready to Play",
    modalTitle: "Enter a Nickname to Start",
    modalIntro: "Your nickname appears on the personal leaderboard and is saved in this browser.",
    nicknameLabel: "Nickname",
    nicknamePlaceholder: "Enter your nickname",
    nicknameHelpDefault: "Finish typing and enter the home screen. It will auto-fill next time.",
    nicknameHelpError: "Please enter a nickname before starting.",
    enterGame: "Enter Game",
    startEyebrow: "MVP Demo",
    startIntro:
      "On a 17 x 10 board, drag to select a rectangular area. If the remaining visible numbers inside the rectangle add up to exactly 10, they clear together. Empty cleared spaces can be crossed.",
    ruleScore: "Each cleared tile gives 1 point, up to 170 points.",
    ruleTimed: "Timed mode lasts 90 seconds and ends automatically.",
    rulePractice: "Practice mode has no timer and must be ended manually.",
    modePickerLabel: "Choose game mode",
    timedMode: "Timed",
    practiceMode: "Practice",
    startButton: "Start",
    leaderboardTitle: "Personal Leaderboard",
    leaderboardNote: "Top 10 only for each mode",
    leaderboardModeLabel: "Leaderboard mode",
    currentMode: "Current Mode",
    scoreLabel: "Score",
    timerLabel: "Time Left",
    boardLabel: "17 by 10 number grid",
    homeButton: "Home",
    endRoundButton: "End Round",
    restartRoundButton: "Restart Round",
    resultEyebrow: "Round Summary",
    resultTitle: "Game Over",
    resultScoreSuffix: " / 170 pts",
    nextModeLabel: "Choose the next mode",
    playAgainButton: "Play Again",
    selectionIdle: "Press and drag to select a rectangle. Empty spaces can be crossed as long as the visible numbers total 10.",
    selectionEmpty: "Select at least 1 tile.",
    selectionValid: "Exactly 10! Release to clear {count} tile(s){bridgeText}.",
    selectionValidBridge: ", crossing {count} empty tile(s)",
    selectionInvalid: "Current visible total is {sum}{clearedHint}; it is not 10 yet.",
    selectionInvalidBridge: ", crossing {count} empty tile(s)",
    leaderboardEmpty: "No records yet. Play a round first.",
    leaderboardPoints: "{score} pts",
    modePracticeSummary: "Practice",
    modeTimedSummary: "Timed",
  },
};

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
const languageButtons = document.querySelectorAll("[data-language-option]");
const translatableElements = document.querySelectorAll("[data-i18n]");
const translatableAriaElements = document.querySelectorAll("[data-i18n-aria-label]");
const translatablePlaceholderElements = document.querySelectorAll("[data-i18n-placeholder]");
const resultScoreSuffixElement = document.getElementById("result-score-suffix");

let selectedMode = GAME_MODES.TIMED;
let selectedLeaderboardMode = GAME_MODES.TIMED;
let currentLanguage = readLanguage();
let state = null;
let currentSelection = null;
let pointerStartCell = null;
let activePointerId = null;
let roundTimerId = null;
let nickname = readNickname();
let personalLeaderboard = readLeaderboard();

createBoardDom();
syncNicknameInputs();
syncLanguageButtons();
syncModeButtons();
syncLeaderboardModeButtons();
applyTranslations();
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

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextLanguage = button.getAttribute("data-language-option");
    if (!LANGUAGES.includes(nextLanguage) || nextLanguage === currentLanguage) {
      return;
    }

    currentLanguage = nextLanguage;
    window.localStorage.setItem(STORAGE_KEYS.language, currentLanguage);
    syncLanguageButtons();
    applyTranslations();
    render();
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
  if (maybeAutoFinishPracticeRound()) {
    return;
  }
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

      const isBoardInteraction =
        event.target === boardElement || boardElement.contains(event.target);
      const isActiveBoardDrag =
        activePointerId !== null &&
        event.cancelable &&
        showingGameScreen();

      if (isBoardInteraction || isActiveBoardDrag) {
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
    state.mode === GAME_MODES.TIMED ? t("timedMode") : t("practiceMode");
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
    selectionSummaryElement.textContent = t("selectionIdle");
    return;
  }

  if (analysis.cellCount === 0) {
    selectionSummaryElement.textContent = t("selectionEmpty");
    return;
  }

  if (analysis.isValid) {
    const bridgeText =
      analysis.clearedCellCount > 0
        ? formatText(t("selectionValidBridge"), { count: analysis.clearedCellCount })
        : "";
    selectionSummaryElement.textContent = formatText(t("selectionValid"), {
      count: analysis.cellCount,
      bridgeText,
    });
    return;
  }

  const clearedHint =
    analysis.clearedCellCount > 0
      ? formatText(t("selectionInvalidBridge"), { count: analysis.clearedCellCount })
      : "";
  selectionSummaryElement.textContent = formatText(t("selectionInvalid"), {
    sum: analysis.sum,
    clearedHint,
  });
}

function renderResult() {
  finalScoreElement.textContent = String(state.score);
  resultScoreSuffixElement.textContent = t("resultScoreSuffix");
}

function maybeAutoFinishPracticeRound() {
  if (!state || state.mode !== GAME_MODES.PRACTICE || state.isRoundOver) {
    return false;
  }

  if (hasAnyValidSelection(state.board)) {
    return false;
  }

  finishRound();
  return true;
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
    button.textContent =
      button.getAttribute("data-mode-option") === GAME_MODES.TIMED
        ? t("timedMode")
        : t("practiceMode");
  });
}

function syncLeaderboardModeButtons() {
  leaderboardModeButtons.forEach((button) => {
    const isSelected =
      button.getAttribute("data-leaderboard-mode") === selectedLeaderboardMode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
    button.textContent =
      button.getAttribute("data-leaderboard-mode") === GAME_MODES.TIMED
        ? t("timedMode")
        : t("practiceMode");
  });
}

function syncLanguageButtons() {
  languageButtons.forEach((button) => {
    const isSelected = button.getAttribute("data-language-option") === currentLanguage;
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
      emptyItem.textContent = t("leaderboardEmpty");
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
          <span class="leaderboard-score">${formatText(t("leaderboardPoints"), { score: entry.score })}</span>
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

  nicknameHelpElement.textContent = t("nicknameHelpError");
  nicknameHelpElement.classList.add("is-error");
  nicknameInputs[0]?.focus();
  return false;
}

function clearNicknameError() {
  nicknameHelpElement.textContent = t("nicknameHelpDefault");
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

function readLanguage() {
  const saved = window.localStorage.getItem(STORAGE_KEYS.language);
  return LANGUAGES.includes(saved) ? saved : "zh-Hant";
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
  return new Intl.DateTimeFormat(currentLanguage === "en" ? "en-US" : "zh-Hant", {
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

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.title = t("documentTitle");

  translatableElements.forEach((element) => {
    element.textContent = t(element.getAttribute("data-i18n"));
  });

  translatableAriaElements.forEach((element) => {
    element.setAttribute("aria-label", t(element.getAttribute("data-i18n-aria-label")));
  });

  translatablePlaceholderElements.forEach((element) => {
    element.setAttribute("placeholder", t(element.getAttribute("data-i18n-placeholder")));
  });

  syncModeButtons();
  syncLeaderboardModeButtons();
  clearNicknameError();
  renderResultIfNeeded();
}

function renderResultIfNeeded() {
  if (state) {
    renderResult();
  } else {
    resultScoreSuffixElement.textContent = t("resultScoreSuffix");
  }
}

function t(key) {
  return translations[currentLanguage][key] ?? translations["zh-Hant"][key] ?? key;
}

function formatText(template, values) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
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

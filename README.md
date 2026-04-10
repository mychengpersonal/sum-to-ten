# SUM TO TEN

Dependency-free browser game for clearing number tiles whose remaining sum inside a rectangle equals `10`.

## Files

- `sum-ten.html`: game entry page
- `sum-ten.css`: styles
- `src/sum-ten-main.js`: UI and screen flow
- `src/sum-ten-game.js`: game rules and state helpers
- `tests/sum-ten-game.test.js`: basic logic tests

## Run

1. Open a terminal in this folder.
2. Start a local server:
   `python3 -m http.server 4173`
3. Open:
   `http://localhost:4173/sum-ten.html`

## Test

If Node is available locally:

`npm test`

## MVP Rules

- Board size is `17 x 10`
- Each cell starts with a random integer from `1` to `9`
- Select a rectangle; if the remaining visible numbers inside it sum to `10`, they are cleared
- Cleared empty spaces can be crossed by later selections
- Each cleared cell gives `1` point, up to `170`
- `計時模式` lasts `90` seconds and ends automatically
- `練習模式` has no timer and ends with the in-game finish button
- Nickname is stored locally in the browser and auto-filled next time
- Personal leaderboard keeps top `10` scores separately for each mode

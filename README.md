# My Grid — Technical README

Overview
--------
My Grid is a touch-first, Phaser-based puzzle game where the player connects adjacent dots on a 10×10 board to form lines. When four edges complete a 1×1 square, that square becomes claimed (filled). The game is implemented as a small plugin-based app using a lightweight plugin builder and Phaser for rendering and input.

Goals
-----
- Mobile-first layout for phone and tablet
- Intuitive touch controls: tap to select and connect, drag to pan, pinch to zoom
- Clean, minimal visual style to demonstrate mechanics

Technology
----------
- Runtime: JavaScript (ES6+)
- Engine: Phaser 3 (packaged via `phaser` npm dependency)
- Bundler: webpack (configured in `webpack.config.js`)
- Plugin system: `@bmatusiak/rectify` (used to wire the small plugins)

Project Structure
-----------------
- `src/index.js` — app entry that builds and starts the plugin app
- `src/phaser/index.js` — exposes Phaser as a plugin
- `src/main/index.js` — app bootstrap; listens for `start` and calls `game.init()`
- `src/game/index.js` — main Phaser scene and game implementation (grid rendering, input, camera)
- `src/index.html` — HTML template used by HtmlWebpackPlugin

Key Implementation Details
-------------------------
- Grid model:
  - Dots are addressed by `r_c` keys produced by `dotKey(r,c)`.
  - Horizontal edges use keys `h_r_c` between `(r,c)` and `(r,c+1)`.
  - Vertical edges use keys `v_r_c` between `(r,c)` and `(r+1,c)`.
  - Cells use `cell_r_c` keys for claimed squares.

- Rendering:
  - Dots are drawn with `Phaser.GameObjects.Circle` (small visible dot) and a larger invisible hit circle for reliable touch targets.
  - Lines are drawn into a `Graphics` object when an edge is placed.
  - Claimed cells are filled rectangles drawn into a separate `Graphics` object.

- Input & Controls:
  - Tap: touch/click a dot to select; tap an adjacent dot to create an edge.
  - Drag pan: single-finger drag pans the camera when no dot is selected.
  - Pinch-to-zoom: two-finger pinch adjusts camera zoom while keeping midpoint stable.
  - A preview line is drawn while dragging from a selected dot to the current pointer.

- Camera & Viewport:
  - The canvas uses `Phaser.Scale.RESIZE` so it fills the browser window.
  - Camera bounds cover the full grid size allowing panning over the board.
  - The scene restarts on resize to recompute layout.

How to Run Locally
-------------------
1. Install dependencies:

```bash
npm install
```

2. Start a dev server (hot-reload):

```bash
npm run dev
```

3. For a production build:

```bash
npm run build
```

Notes on Testing on Mobile
-------------------------
- `npm run dev` starts webpack-dev-server; access the dev server URL from your phone on the same network (e.g., `http://192.168.x.y:8080`).
- Rotate device and test responsive layout and touch gestures (pinch/drag/tap).

Developer Notes & Next Steps
---------------------------
- Visual feedback: add animations and highlight effects when a cell is claimed.
- Scoring/turn logic: support multiplayer turns or single-player scoring and AI.
- Persistence: save board state to localStorage or backend so players can resume.
- Accessibility: provide contrast options and alternative controls for non-touch users.
- Tests: add unit tests for the grid logic (edge/cell detection) and small integration tests for scene startup.

Important Files
---------------
- `src/game/index.js` — core game implementation
- `webpack.config.js` — build and dev server settings
- `src/index.html` — HTML template

If you want, I can:
- Add animated claim effects and a score/turn UI.
- Add a minimap overlay to show the viewport on larger tablets.
- Wire save/load for the board state.

Created: `README.md` — edit as needed.

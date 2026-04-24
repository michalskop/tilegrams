# Tilegrams 2.0 — Implementation Plan

> Step-by-step build plan. Copy to the new repo root alongside TILEGRAMS2-SPEC.md.
> Each phase produces a working (if incomplete) app — never a broken state.

---

## Pre-work — Manual setup (done once before any code)

### Step 1 — Archive the v1 repo on GitHub

1. Go to **github.com → your tilegrams v1 repo → Settings → General → Danger Zone**
2. Click **Archive this repository** — marks it read-only, signals it is superseded.
   - Do this *after* Step 3 below so the v1 README can point to the new repo first.

### Step 2 — Update the v1 README

Add a notice at the top of the current `README.md`:

```markdown
> **This is Tilegrams v1 (archived).** Development continues in
> [tilegrams2](https://github.com/YOUR_ORG/tilegrams2).
```

Commit and push while the v1 repo is still writable.

### Step 3 — Create the new GitHub repo

1. On GitHub: **New repository** → name `tilegrams2` (or `tilegrams` if you want to reclaim the name after archiving v1)
2. Set visibility (public recommended — matches v1)
3. **Do not** initialise with README, .gitignore, or licence — Vite will create these

### Step 4 — Copy planning documents into the new repo root

After `npm create vite` (Phase 0, step 1) and before the first commit, copy these files from the v1 repo into the new repo root:

| File | Purpose |
|---|---|
| `TILEGRAMS2-SPEC.md` → `SPEC.md` | Product specification |
| `TILEGRAMS2-PLAN.md` → `PLAN.md` | This file |
| `DESIGN-TOKENS.md` | Design system reference |

Rename them (drop the `TILEGRAMS2-` prefix) since they now live in their own repo.
Also create a `CLAUDE.md` stub for Claude Code guidance (can be filled out as the build progresses).

### Step 5 — Connect local repo to GitHub

```bash
cd tilegrams2          # the directory Vite just created
git init               # Vite does not run git init automatically
git remote add origin git@github.com:YOUR_ORG/tilegrams2.git
```

The planning documents + initial scaffold become the first commit:

```bash
git add .
git commit -m "init: scaffold + planning docs"
git push -u origin main
```

---

## Phase 0 — Project scaffold

**Goal:** `npm run dev` opens a blank page with correct fonts and background colour.

1. `npm create vite@latest tilegrams2 -- --template react-ts`
2. Install core deps:
   ```
   npm i d3-geo topojson-client topojson-server papaparse
   npm i -D tailwindcss @tailwindcss/vite vitest
   ```
3. Configure Tailwind:
   - Add `@tailwindcss/vite` plugin to `vite.config.ts`
   - Replace `index.css` with `@import "tailwindcss"`
   - Create `tailwind.config.ts` extending the default theme with design tokens from `DESIGN-TOKENS.md`:
     - `newsprint: '#fdfbf7'`, `crimson: '#de1743'`
     - Font family `sans: ['Work Sans', 'sans-serif']`
4. Add Work Sans via Google Fonts `<link>` in `index.html`.
5. Set `document.body` background to `newsprint` in global CSS.
6. Delete Vite boilerplate (counter, svg, etc.); render `<App />` returning `<div>Tilegrams 2</div>`.
7. **Verify:** `npm run dev` → page background is `#fdfbf7`, text is in Work Sans.
8. Commit: *"scaffold: vite + react-ts + tailwind"*

---

## Phase 1 — File System layer

**Goal:** user can open a folder; app lists geography sub-folders; user can open individual files as fallback.

### 1.1 Browser capability detection

Create `src/fs/capabilities.ts`:
```ts
export const hasFSA = 'showDirectoryPicker' in window
```

### 1.2 FSA directory adapter

Create `src/fs/FsaAdapter.ts`:
- `openDirectory(): Promise<FileSystemDirectoryHandle>`
- `listSubdirectories(dir): Promise<string[]>`
- `readFile(dir, relativePath): Promise<string>` — reads text
- `readBinaryFile(dir, relativePath): Promise<ArrayBuffer>`
- `writeFile(dir, relativePath, content: string): Promise<void>` — creates parents if needed
- `fileExists(dir, relativePath): Promise<boolean>`

### 1.3 Fallback adapter

Create `src/fs/FallbackAdapter.ts`:
- `openFiles(accept): Promise<File[]>` — wraps `<input type="file" multiple>`
- `downloadFile(filename, content, mimeType): void` — `<a download>`
- Matches same interface shape but throws `NotSupported` for directory listing

### 1.4 Adapter factory

`src/fs/index.ts` — exports `fsAdapter` (FSA or fallback based on capability check).

### 1.5 Root store

Create `src/store/RootStore.ts` (plain class, no external state lib):
```ts
class RootStore {
  directoryHandle: FileSystemDirectoryHandle | null = null
  geographies: GeographyMeta[] = []
}
```
Expose as React context via `src/store/context.tsx`.

### 1.6 Open folder UI

In `App.tsx` — if `directoryHandle === null`, render `<WelcomeScreen />`:
- "Open folder" button → calls `openDirectory()` → stores handle → triggers geography scan
- Browser notice banner if `!hasFSA`

### 1.7 Geography scanner

`src/geographies/scanner.ts`:
- Reads `geographies/` subdirectory listing
- For each subfolder, checks for `*.geojson` or `*.topo.json`
- Reads `meta.json` if present, applies defaults otherwise
- Returns `GeographyMeta[]`

### 1.8 Built-in examples

- Place 7 bundled geographies under `public/examples/` (copied from the current repo's `maps/` and `data/` as appropriate)
- Scanner also loads these (read via `fetch('/examples/...')`)
- Bundled items are read-only (no write-back for meta.json)

**Verify:** open a folder containing a `geographies/netherlands/` subfolder → geography list shows "Netherlands". In Firefox/Safari: banner appears, file picker opens instead.

Commit: *"feat: file system layer + geography scanner"*

---

## Phase 2 — Geography rendering

**Goal:** selecting a geography renders its outline on screen.

### 2.1 Projection builder

`src/geographies/projection.ts` — mirrors current `GeographyResource.buildProjection`:
- Supports `mercator`, `albersUsa`, `conicConformal`
- Uses `fitExtent` with 10% margin
- Reads `meta.json` for `projection` / `projectionOptions`

### 2.2 Map feature loader

`src/geographies/MapFeatureLoader.ts`:
- Accepts a `GeographyMeta` + directory handle
- Loads TopoJSON (from file or bundled), runs `topojson.feature()`
- Returns `GeoJSON.FeatureCollection`

### 2.3 Canvas setup

`src/canvas/CanvasManager.ts`:
- Creates `<canvas>` element at `devicePixelRatio` resolution
- Exposes `ctx`, `cssWidth`, `cssHeight`
- Handles `resize` events — emits `onResize` callback
- Pan (middle-mouse / Space+drag) and zoom (wheel) — identical to current implementation

### 2.4 Map outline renderer

`src/canvas/MapOutlineRenderer.ts`:
- Given projection + feature collection → draws outlines on canvas
- Called once after geography load; re-drawn on resize

### 2.5 Geography selector UI

`src/components/GeographySelector.tsx`:
- Groups geographies by `meta.displayName` prefix (or explicit `group` field)
- Dropdown → selecting geography triggers load + render

**Verify:** select Netherlands → grey outline fills canvas with ~10% empty margin on all sides. Scroll to zoom, middle-mouse to pan.

Commit: *"feat: geography rendering"*

---

## Phase 3 — Hex grid

**Goal:** hex grid appears over the map outline; grid size matches data values.

### 3.1 GridGeometry port

`src/geometry/GridGeometry.ts` — TypeScript port of current `GridGeometry.js`:
- `setTileEdgeFromArea(area)`
- `getTileCounts()`, `getTileEdge()`
- `tileCenterPoint({x, y})`, `getPointsAround(center)`
- `forEachTilePosition(callback)`
- `resize()` — recomputes grid to fill canvas

### 3.2 Background grid renderer

`src/canvas/GridRenderer.ts`:
- Renders empty hex grid into offscreen canvas (baked once per resize/edge-change)
- Main render loop draws offscreen canvas then overlays coloured tiles

### 3.3 Metrics store

`src/store/MetricsStore.ts`:
- `sumMetrics`, `metricPerTile`
- `idealHexArea` getter: `(cartogramArea * metricPerTile) / sumMetrics`

**Verify (unit):** `npx vitest run` — `GridGeometry` tests: `tileCenterPoint`, `getPointsAround`, `setTileEdgeFromArea` return correct values for known inputs.
**Verify (visual):** grey hex grid covers the canvas; zooming and panning keep the grid sharp.

Commit: *"feat: hex grid rendering"*

---

## Phase 4 — Cartogram engine

**Goal:** given a geography + CSV column, app runs the diffusion algorithm and fills the grid.

### 4.1 Topogram integration

`src/cartogram/CartogramEngine.ts`:
- Port of current `MapGraphic.js` core
- `init(featureCollection, projection)` → stores projected features
- `iterate(): { done: boolean; progress: number }` — one RAF step
- `getStateFeatures(): GeoJSON.Feature[]`
- NaN/degeneration rollback (same as current `iterateCartogram` fix)
- Does **not** recompute area during iterations (critical bug fix from v1)

### 4.2 Iteration loop

`src/cartogram/iterationLoop.ts`:
- `startIteration(engine, onProgress, onDone)`
- `cancelIteration()`
- Uses `requestAnimationFrame`

### 4.3 Tile populator

`src/cartogram/TilePopulator.ts` — port of current `GridGraphic.populateTiles`:
- Given state features + projection + grid geometry → returns `Tile[]`
- `Tile = { gridPos: {x,y}; geoId: string; }`

### 4.4 CSV loader

`src/data/CsvLoader.ts`:
- Uses PapaParse
- Returns `{ columns: string[]; rows: Record<string, string>[] }`
- Reads from file handle or bundled example

### 4.5 Dataset builder

`src/data/DatasetBuilder.ts`:
- Joins CSV rows to GeoJSON features by ID
- Returns `{ label; geography; column; data: [geoId, value][]; defaultResolution? }`

### 4.6 Progress bar

`src/canvas/ProgressOverlay.ts` — draws progress bar over canvas during iteration (port of current Canvas.js `_render` overlay).

### 4.7 Wire up Generate flow

In `App.tsx` or a `GenerateController`:
1. User selects geography → load features
2. User selects CSV + column → build dataset
3. "Generate" button → `CartogramEngine.init()` → `startIteration()`
4. On done → `TilePopulator` → `GridRenderer` shows coloured tiles

**Verify (unit):** `CsvLoader` test — parses a 3-row CSV and returns correct columns + rows. `DatasetBuilder` test — join produces correct `[geoId, value]` pairs and drops unmatched rows.
**Verify (visual):** generate Netherlands population → progress bar advances to 100% → coloured hex tiles appear inside the outline. No tiles outside the grid, no blank screen.

Commit: *"feat: cartogram generation"*

---

## Phase 5 — Tile editing

**Goal:** user can drag tiles, add tiles, delete tiles; undo/redo works.

### 5.1 Tile store

`src/store/TileStore.ts`:
- `tiles: Tile[]`
- `undoStack: Tile[][]`, `redoStack: Tile[][]`
- `applyEdit(newTiles)` — pushes to undo stack
- `undo()`, `redo()`

### 5.2 Drag editing

`src/canvas/TileEditHandler.ts` — port of current `GridGraphic` mouse handling:
- `onMouseDown`, `onMouseMove`, `onMouseUp`
- Hit-test tiles under cursor
- Drag: swap tile's `gridPos` with target position
- All edits go through `TileStore.applyEdit`

### 5.3 Add tile

- Sidebar panel lists geographic units not yet in the grid
- Clicking "add" → mouse enters "place mode" → next canvas click places tile at that position

### 5.4 Delete tile

- Select tile (click) → Delete/Backspace removes it
- Goes through `TileStore.applyEdit`

### 5.5 Undo/Redo UI

- Toolbar buttons + Ctrl+Z / Ctrl+Shift+Z
- Disabled when stack empty

### 5.6 Regime lock

When manual edits have been applied, resolution slider is locked; show notice:
*"Resolution locked — reset manual edits to unlock."*

**Verify:** drag a tile to a new position → Ctrl+Z moves it back → Ctrl+Shift+Z moves it forward again. Delete a tile with Backspace → it disappears → Ctrl+Z restores it. Resolution slider shows lock notice after first drag.

Commit: *"feat: tile editing + undo/redo"*

---

## Phase 6 — Resolution control

**Goal:** resolution slider updates tile count live; locked after manual edits.

### 6.1 Resolution slider component

`src/components/ResolutionSlider.tsx`:
- Shows current `metricPerTile`
- Disabled when regime is locked
- On change → `MetricsStore.metricPerTile = value` → `TilePopulator` reruns → `GridRenderer` updates

### 6.2 Regime state

`src/store/RegimeStore.ts`:
- `regime: 'generate' | 'load-project' | 'load-export'`
- `resolutionLocked: boolean` — set true on first manual tile edit
- `resetEdits()` — clears `TileStore` history + unlocks resolution

**Verify:** move slider → tile count updates live. Make a manual edit → slider locks. Click "Reset edits" → slider unlocks, tile count is editable again.

Commit: *"feat: resolution control + regime locking"*

---

## Phase 7 — Labeling

**Goal:** labels appear on tiles; toggleable per level.

### 7.1 Label source

- Dropdown: any GeoJSON property or any CSV column
- Stored in `LabelStore.ts`

### 7.2 Label renderer

`src/canvas/LabelRenderer.ts`:
- Draws text at tile center
- Respects `masterVisible`, `levelVisible[0..3]`
- Font size adjustable

### 7.3 Label UI

`src/components/LabelControls.tsx`:
- Master toggle
- Per-level toggles (0–3)
- Font size input
- Source column dropdown

**Verify:** toggle master label switch → labels appear/disappear. Turn off level-2 labels only → that level's labels hide while others stay. Adjust font size → text resizes without regenerating.

Commit: *"feat: labeling"*

---

## Phase 8 — Exports

**Goal:** all 6 output formats work and write to disk (or download in fallback).

### 8.1 Export engine

`src/export/ExportEngine.ts` with named functions:

| Function | Output |
|---|---|
| `toCartogramJson(state)` | `.cartogram.json` — full project file |
| `toTopoJson(tiles)` | `.topo.json` — hex polygons in pixel space |
| `toGeoJson(tiles, projection)` | `.geo.json` — lon/lat |
| `toFlourishGeoJson(tiles, geoBbox)` | Flourish-ready GeoJSON (linear remap to real bbox) |
| `toSvg(tiles, labels, labelState)` | SVG |
| `toPng(canvas)` | 2× raster via `canvas.toBlob` |

### 8.2 Flourish GeoJSON detail

- Compute bounding box of geography in lon/lat
- Compute bounding box of tile centroids in grid space
- Linearly map grid coords → lon/lat bbox
- All coords guaranteed within −180→180, −90→90

### 8.3 Write to disk

`src/export/ExportWriter.ts`:
- FSA mode: writes to `cartograms/` subfolder of opened directory
- Fallback: triggers download

### 8.4 Export UI

`src/components/ExportPanel.tsx`:
- One button per format
- Filename field (pre-filled from geography + column)

### 8.5 Save / Load project

- **Save project**: `toCartogramJson` → write `.cartogram.json`
- **Load project**: read `.cartogram.json` → restore `TileStore`, `MetricsStore`, label state, regime
- **Load export**: read `.topo.json` / `.geo.json` → import tiles (resolution locked)

**Verify (unit):** `ExportEngine` tests — `toTopoJson` round-trips through `topoJson.feature()` and returns the same tile count; `toFlourishGeoJson` output has all coordinates within −180→180, −90→90.
**Verify (visual):** export `.cartogram.json` → reload page → load that file → cartogram is identical, undo history preserved. Load the `.topo.json` export → tiles appear, resolution slider is locked.

Commit: *"feat: exports + project save/load"*

---

## Phase 9 — meta.json editing

**Goal:** user can edit geography metadata in the UI; changes persist to disk.

### 9.1 Meta editor component

`src/components/MetaEditor.tsx`:
- Fields: display name, projection type, projection options, hierarchy source, hierarchy field, default data column
- On save → `fsAdapter.writeFile(..., 'meta.json', JSON.stringify(meta, null, 2))`

### 9.2 Hierarchy precedence toggle

- Switch: `CSV wins` (default) vs `GeoJSON wins`
- Stored in `meta.json.hierarchySource`

**Verify:** change display name in the editor → save → reload page → dropdown shows new name. Toggle hierarchy precedence → regenerate → border styles reflect the new source.

Commit: *"feat: meta.json editor"*

---

## Phase 10 — World / small-value handling

**Goal:** "Include all" vs "Exclude below threshold" selector at generate time.

### 10.1 Small-value UI

`src/components/SmallValueOptions.tsx`:
- Radio: Include all / Exclude below threshold
- Threshold input (visible when exclude selected)

### 10.2 Dataset filter

`src/data/DatasetBuilder.ts` — add `applySmallValuePolicy(policy, threshold)`:
- Include all: `Math.max(value, 1)` for every unit
- Exclude: filter out units below threshold before passing to engine

**Verify:** generate World population with "Include all" → every country has ≥1 tile. Switch to "Exclude below 1 000 000" → micro-states disappear from the grid.

Commit: *"feat: world/small-value handling"*

---

## Phase 11 — Polish and mobile fallback

**Goal:** app is stable; Firefox/Safari fallback works; responsive layout for viewing on mobile.

1. **FSA fallback banner** — shown on load when `!hasFSA`
2. **Mobile layout** — sidebar collapses to bottom drawer on narrow screens; canvas fills screen
3. **Touch pan/zoom** — `touchstart`/`touchmove` for pan, pinch for zoom (no tile editing on touch)
4. **Keyboard shortcuts** — documented tooltip; R to reset viewport, Ctrl+Z/Shift+Z
5. **Error handling at system boundaries** — malformed TopoJSON, CSV parse failures, FS permission denial
6. **Loading states** — spinner while reading large files
7. **Empty state** — prompt to open folder if nothing loaded

**Verify:** open in Firefox → fallback banner visible, file picker works, export downloads a file. Open on a phone → sidebar collapses, canvas fills screen, pinch-to-zoom works.

Commit: *"feat: polish + mobile fallback"*

---

## Phase 12 — Built-in examples and bundling

**Goal:** app ships 7 example geographies that work without opening a folder.

1. Copy TopoJSON + example CSVs from the current repo into `public/examples/`
2. Each example has a `meta.json` committed alongside it
3. Welcome screen offers "Try an example" → loads without directory picker
4. Production build: `npm run build` → `dist/` is a static site deployable to any CDN

**Verify:** open welcome screen → click "Try Netherlands example" → cartogram generates without opening any folder. `npm run build` completes without errors; serve `dist/` locally and repeat the same check.

Commit: *"feat: bundled examples + production build"*

---

## Appendix — File structure

```
tilegrams2/
  public/
    examples/
      netherlands/
      czechia/
      ...
  src/
    canvas/        ← CanvasManager, renderers, event handlers
    cartogram/     ← CartogramEngine, TilePopulator, iteration loop
    components/    ← React UI components
    data/          ← CSV loader, dataset builder
    export/        ← ExportEngine, ExportWriter
    fs/            ← FsaAdapter, FallbackAdapter, capabilities
    geographies/   ← scanner, projection builder, MapFeatureLoader
    geometry/      ← GridGeometry
    store/         ← RootStore, TileStore, MetricsStore, RegimeStore, LabelStore
    App.tsx
    main.tsx
  TILEGRAMS2-SPEC.md
  TILEGRAMS2-PLAN.md
  DESIGN-TOKENS.md
  CLAUDE.md
```

---

## Sequence summary

| Phase | Deliverable |
|---|---|
| 0 | Blank app, correct design tokens |
| 1 | Open folder, list geographies |
| 2 | Geography outline on canvas |
| 3 | Hex grid |
| 4 | Cartogram generation |
| 5 | Tile editing + undo |
| 6 | Resolution control + regime |
| 7 | Labels |
| 8 | All 6 exports + project save/load |
| 9 | meta.json editor |
| 10 | World / small-value handling |
| 11 | Polish + mobile |
| 12 | Bundled examples + production build |

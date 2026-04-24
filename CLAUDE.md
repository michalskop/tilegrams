# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # install dependencies
npm start      # dev server at http://localhost:8080 (webpack-dev-server)
npm run build  # production build → dist/
npm run lint   # ESLint (Airbnb config)
```

There is no test suite configured.

## What this is

Tilegrams is a browser-based tool for building hexagonal cartograms — maps where geographic regions are represented as groups of equal-sized hexagons, scaled proportionally to a dataset value (e.g., electoral votes, population). Users pick a geography, pick a dataset, tune the resolution, then manually adjust tiles before exporting a `.json` tilegram file.

## Architecture

**Entry point:** `index.js` → mounts `<Ui />` onto the DOM, initialises Canvas.

**`source/Ui.js`** — top-level React component. Owns all application state: selected geography, active tilegram tiles, dataset, editing mode, modal/drawer visibility. All inter-component communication flows through callbacks defined here.

**`source/graphics/MapGraphic.js`** — cartogram engine. Uses the `topogram` library to iteratively redistribute TopoJSON features into proportional-area regions, then maps those regions onto hex tiles. Called by Ui when the user generates or re-generates the map.

**`source/graphics/GridGraphic.js`** — renders the live hex grid on the canvas after MapGraphic produces tiles; handles tile selection and drag-editing.

**`source/resources/DatasetResource.js`** — loads CSV files (one per geography, stored under `data/`) and exposes them as structured datasets. Adding a new geography requires registering its CSV here.

**`source/resources/GeographyResource.js`** — loads TopoJSON files (stored under `maps/`) for each supported geography. Same pattern: new geographies need registration here.

**`source/resources/TilegramResource.js`** — loads pre-made `.json` tilegram files from `tilegrams/` for the "Load existing" flow.

**`source/constants.js`** — global rendering constants (tile scale, canvas size, hex edge size range). Uses `dat.GUI` so properties can be tweaked live in the browser's GUI panel during development.

**`source/geometry/`** — `FlatTopHexagonShape` and `PointyTopHexagonShape` implement hex math (center-to-vertex transforms, neighbor lookup, etc.).

**`source/file/`** — `Exporter` serialises the current tilegram to JSON; `Importer` parses a loaded file back into tiles.

**`source/components/`** — stateless React UI components (selectors, sliders, metric displays, modals).

## Data files

| Directory | Contents |
|-----------|----------|
| `maps/<country>/` | TopoJSON source maps |
| `data/<country>/` | CSV datasets keyed to map features |
| `tilegrams/` | Pre-built `.json` tilegrams users can load |

## Adding a new geography

1. Place the TopoJSON under `maps/<name>/` and CSV data under `data/<name>/`.
2. Add one entry to the array in **`source/geographies.js`** — that's the only file to edit.

Each entry needs: `label`, `group` (dropdown heading), `projection` (`'mercator'`, `'albersUsa'`, or `'conicConformal'`), `topoJson`, `objectId` (key inside `topoJson.objects`), `nameHash` (id→name JSON), `datasets` array, and `tilegrams` array.

The projection scale and translate are **computed automatically** from the TopoJSON bounds via `d3-geo`'s `fitSize`. For `conicConformal`, also supply `projectionOptions: {parallels: [...], rotate: [...]}` — these define the projection's distortion characteristics, not the viewport.

## Stack notes

- React **15.3.1** (not modern React — no hooks, no concurrent features).
- Webpack **1.x** — config is in `webpack.config.js`; ES2015 + React via Babel 6.
- SCSS via `node-sass` (not Dart Sass).
- D3 is used à-la-carte (individual `d3-*` packages, not the monorepo bundle).
- `topogram` drives the cartogram diffusion algorithm; `topojson` handles geometry.

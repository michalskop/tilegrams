# Tilegrams 2.0 — Specification

> This document defines the scope and requirements for a full rewrite of the Tilegrams app.
> It lives here temporarily (in the Tilegrams 1 repo) and should be copied to the root of the new repo when it is created.

---

## Purpose

A modern browser tool for creating, editing, and exporting hexagonal cartograms for data journalism.
Primary users: Mahdalová & Skop.
Primary outputs: cartograms for publication in Flourish, SVG, and print.

---

## Stack

- **React 18 + TypeScript**
- **Tailwind CSS** with design tokens from `DESIGN-TOKENS.md`
- **Vite** (bundler + dev server)
- **d3-geo** for projections, **topojson** for geometry
- Same Gastner-Newman hex diffusion core as Tilegrams 1
- **File System Access API** for reading/writing local directories (no backend)

---

## Design system

Follows `DESIGN-TOKENS.md` (DataTimes / Mahdalová & Skop) exactly:

- Background: Newsprint `#fdfbf7`
- Primary font: **Work Sans** (data/technical tool context)
- Accent: Crimson Brand `#de1743` for primary actions
- Warm neutrals throughout — no cold grays
- Light mode only (dark variant not yet designed)

---

## Browser support

**Primary:** Chrome / Edge — File System Access API allows reading and writing a local directory natively.

**Fallback (Firefox, Safari):** Classic `<input type="file" multiple>` for opening files + standard `<a download>` for all exports.
Directory scanning is not available in fallback mode — user selects files individually.
The UI detects support on load and shows a small notice:
*"Your browser doesn't support directory access. Files will open and save individually."*

---

## Directory layout (user-managed, no repository)

The user opens a local folder via the File System Access API. The app reads and writes within that folder.

```
/my-cartograms/
  geographies/
    netherlands/
      netherlands.geojson       ← required
      netherlands.topo.json     ← optional
      meta.json                 ← projection, display name, hierarchy config
      population.csv
      elections-2023.csv
    world/
      world-countries.geojson
      meta.json
      population-2024.csv
  cartograms/                   ← saved projects and exports
    nl-population.cartogram.json
    nl-population.topo.json
    nl-population.svg
```

### `meta.json` per geography folder

Auto-created on first save; editable in the UI; written back to disk.

```json
{
  "displayName": "Netherlands – Municipalities",
  "projection": "mercator",
  "projectionOptions": { "parallels": [49, 52], "rotate": [-5, 0] },
  "hierarchySource": "geojson",
  "hierarchyField": "level",
  "defaultDataColumn": "population"
}
```

Fields:

| Field | Description |
|---|---|
| `displayName` | Human-readable name shown in UI |
| `projection` | `"mercator"` · `"albersUsa"` · `"conicConformal"` |
| `projectionOptions` | `parallels`, `rotate` — for conic projections |
| `hierarchySource` | `"geojson"` · `"csv"` · `"csv-over-geojson"` (default) |
| `hierarchyField` | Property/column name that holds the hierarchy level integer |
| `defaultDataColumn` | CSV column pre-selected when loading this geography |

**Geography registry:** generated at runtime by scanning `geographies/` — no hand-maintained index file.

---

## Built-in example geographies

7 geographies bundled as static assets in `public/examples/`, each with at least one example dataset:

- Netherlands
- Czechia
- Germany
- Austria
- Brazil
- India
- World

---

## Three application regimes

| Regime | Entry point | Resolution control | Undo available |
|---|---|---|---|
| **Generate** | Select geography + CSV column | Available until first manual tile edit | Yes (tile ops) |
| **Load project** | Open `.cartogram.json` | Available if no manual edits since load | Yes (tile ops) |
| **Load export** | Open `.topo.json` or `.geo.json` | Locked — baked at export time | Yes (tile ops) |

When resolution is locked due to manual edits, the UI shows:
*"Resolution locked — reset manual edits to unlock."*

---

## CSV format

- **Headers required** — row 1 is column names
- Multiple data columns allowed
- Column selection at load/generate time; switching columns triggers re-generation
- Minimum: one ID column (matching GeoJSON feature IDs) + one numeric value column
- Additional columns are carried through to exports

---

## Hierarchy & borders

Hierarchy level is an integer (0–3) attached to each geographic unit.

**Source of truth:** GeoJSON property field **or** CSV column.
When both are present, CSV wins by default.
A toggle in the UI lets the user flip precedence.
Setting is stored in `meta.json`.

| Level | Border style | Typical use |
|---|---|---|
| 0 | Hairline / none | Individual hex |
| 1 | Dashed thin | Subregion (district within a city) |
| 2 | Solid medium | Region (municipality, county) |
| 3 | Solid bold | Superregion (kraj, province, country) |

---

## Labeling

- **Source:** any GeoJSON property OR any CSV column (dropdown selector)
- **Visibility:** master on/off toggle + per-level toggles
- **Font size:** adjustable
- Exported SVG/PNG respects the current label visibility state

---

## World cartogram / small-value units

At generation time, the user chooses how to handle units with very small values (micro-states, small territories):

- **Include all** — force minimum 1 tile per unit regardless of value
- **Exclude below threshold** — set a minimum value; units below are excluded (handle manually)

Reference target: updated and improved version of the [Wikipedia global population cartogram](https://upload.wikimedia.org/wikipedia/commons/9/90/Global_population_cartogram.png).

---

## Editing

- **Drag** tiles to new positions
- **Add** tiles from a sidebar panel (by geographic unit)
- **Delete** tiles — Backspace / Delete key
- **Undo / Redo** — Ctrl+Z / Ctrl+Shift+Z + toolbar buttons; tile operations only
- **Pan** — middle-mouse drag or Space + drag
- **Zoom** — scroll wheel

---

## Outputs

All outputs are written to the `cartograms/` folder via File System Access API, or downloaded as a file in fallback mode.

| Format | Description |
|---|---|
| `.cartogram.json` | Full project file: tile positions, geography path, CSV column, resolution, label state, hierarchy settings, undo history. Used for resuming work. |
| `.topo.json` | Standard TopoJSON (hex polygons in pixel-space coordinates) |
| `.geo.json` | GeoJSON in original geographic coordinates (lon/lat) |
| **Flourish GeoJSON** | Hex polygons with coordinates linearly remapped so the grid bounding box maps to the geography's real lon/lat bounding box. All values within −180→180, −90→90. Loads directly as a custom map in Flourish and similar tools. |
| **SVG** | Vector export; labels included/excluded per current toggle state |
| **PNG** | 2× resolution raster of the current canvas view |

---

## Mobile

Desktop primary — the main editing workflow assumes a mouse and a large screen.
On touch devices: viewing and exporting work fully.
Tile drag-editing on mobile is a nice-to-have, not a requirement for v1.

---

## Out of scope for v1

- Dark mode
- Multi-user / collaboration
- Backend / server storage
- Undo for resolution or label changes (tile operations only)
- Mobile tile editing

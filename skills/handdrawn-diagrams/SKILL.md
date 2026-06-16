---
name: handdrawn-diagrams
description: Use when creating a diagram, architecture sketch, flowchart, or before/after comparison (for a blog post, README, or docs) and you want a hand-drawn / whiteboard / Excalidraw / sketchy look instead of Mermaid or clean SVG — any "draw a diagram" / "다이어그램 그려줘" request, or to avoid the generic AI-generated diagram look.
---

# Handdrawn Diagrams

## Overview

Make hand-drawn (Excalidraw-style) diagrams without any external app: **one HTML page drawn with rough.js + handwriting fonts**, captured to **PNG** by a headless browser. Avoids Mermaid's flat "AI-generated" look, and the source (HTML) stays around for re-editing anytime.

**Core principle: copy the template, fill in `draw()` only, and bake it with `render.mjs`.** The helpers (`box`, `arrow`, …) are all coordinate-based, so they're easy for an LLM to draw with. **Never rewrite the boilerplate (KIT / PALETTE / font-wait / `DIAGRAM-READY` flag)** — touching it breaks font loading or capture.

## When to use

- A blog post, README, or doc needs an architecture / flow / before-after / sequence diagram
- You want a hand-drawn / whiteboard / sketchy feel (instead of Mermaid / clean SVG)
- Any "draw a diagram" style request

**When NOT:** precise CAD drawings, data-driven bulk generation, or interactive charts.

## Workflow

1. **Copy** — copy the template into the project you're working in: `cp ~/.claude/skills/handdrawn-diagrams/template.html docs/images/mydiagram.html` (path is up to you).
2. **Draw** — set the top `<svg>` width/height/viewBox to your drawing's size (~40px margin, title around `y≈52` — see the example coords), then draw inside `draw()`, **only in the `replace below` block**, using coordinates. Don't touch KIT / PALETTE — leave the font-wait block alone too, but **if you use text larger than 40px, add a single `fonts.load(...)` line for that size** (see Common mistakes).
3. **Render** — `node ~/.claude/skills/handdrawn-diagrams/render.mjs docs/images/mydiagram.html` → `mydiagram.png` next to it. If you also need a dark version, append `--dark` → `mydiagram-dark.png`. The PNG is rasterized at **3× by default** (sharp on retina / when zoomed); pass `--scale 4` for print or very large zoom — it's a raster, so beyond its factor it pixelates (the SVG source stays infinitely re-editable).
4. **Check** — open the PNG and confirm it came out in the **handwriting font**. A flat sans means the font wait failed → redo.

Setup (once per project): `npm i -D playwright && npx playwright install chromium`.
`render.mjs` takes any path (relative or absolute) and opens it directly via `file://` to capture — no local server or MCP needed. playwright is resolved from the **node_modules of the project you run it in (cwd)**, so even though the skill lives in `~/.claude/skills`, installing it once in the project makes the call above work as-is.

## Helper quick reference

Coordinates are in pixels, origin = top-left. ⚠ **Anchors differ per helper** — `box` / `frame` / `cylinder` take the top-left `(x,y)`, while `diamond` / `ellipse` take the center `(cx,cy)` (the arg names in the table are the anchor). Colors: the `PALETTE.{yellow,blue,green,orange,red}` presets, or a hex directly.

| Helper | Use |
|---|---|
| `box(x,y,w,h,fill,[lines],o?)` | Rectangular node (multi-line label = array of strings) |
| `frame(x,y,w,h,{dash,stroke,sw})` | Unfilled group / layer border |
| `cylinder(x,y,w,h,fill,[lines])` | DB / storage |
| `diamond(cx,cy,w,h,fill,[lines])` | Branch / decision |
| `ellipse(cx,cy,w,h,fill,[lines]?)` | Node / circle |
| `arrow` / `biArrow(x1,y1,x2,y2,o?)` | One-way / two-way arrow |
| `line(x1,y1,x2,y2,{dash})` | Connector / divider with no arrowhead |
| `curveArrow([[x,y],…],o?)` | Curved arrow (self-loop / detour edge) |
| `txt(x,y,s,{size,color,anchor,rot})` | Free text |
| `xmark(cx,cy,r)` / `crossOut(x,y,w,h)` | Dot X / strike out a whole region (the "removed" side of a before/after) |

Common option `o`: `{stroke, sw, dash:[6,7], labelSize, labelColor}`.

## Layouts (copy-paste starting points)

- `examples/before-after.html` — left/right split, `crossOut` on the side being removed.
- `examples/layered-arch.html` — the typical web-app shape: `frame` layers + `box` + `cylinder` + `arrow`.

Both render directly with `node render.mjs examples/<name>.html`. For a new drawing, copy the closer one to start fast.

## Common mistakes

- **Font fallback (flat sans)** — you deleted the `document.fonts` wait block, or used text larger than 40px in `draw()` without adding a `fonts.load(...)` for that size. → Keep the font-wait block + add the large size. ⚠ Korean / CJK text renders **only** with `Nanum Pen Script` / `Gaegu` (Latin handwriting fonts like Caveat fall back to sans for CJK).
- **Drawing is cut off** — set the `<svg>` width/height/viewBox to the actual drawing size. `render.mjs` crops to the `#c` SVG region only.
- **Dark readability** — light text on hachure pastel has weak contrast. Usually one cream (light) sheet used for both light/dark is cleaner; only pull a second sheet with `--dark` when you really need it.
- **Render fails** — `playwright` not installed (setup command above) or you're offline (rough.js / fonts depend on a CDN). On an air-gapped network, fetch those two assets locally and swap the `<head>` paths.

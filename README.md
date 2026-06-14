# handdrawn-diagrams

**English** · [한국어](README.ko.md)

An **agent skill** for making hand-drawn (Excalidraw-style) diagrams without any external app.
It draws a single HTML page with `rough.js` + handwriting fonts and captures it to PNG with a headless
browser — avoiding Mermaid's flat "AI-generated" look, while keeping the source (HTML) for re-editing anytime.

This repository is both the single source and a Claude Code **plugin** (the root *is* the plugin, with the
skill itself under `skills/handdrawn-diagrams/`). The same `SKILL.md` works as-is in other agents.

## Preview

The two layouts in `examples/`, rendered as-is:

| before/after (struck through with `crossOut`) | layered architecture |
|---|---|
| ![before/after diagram](skills/handdrawn-diagrams/examples/before-after.png) | ![layered architecture diagram](skills/handdrawn-diagrams/examples/layered-arch.png) |

## Install

### Claude Code (plugin)

```
/plugin marketplace add ongjin/handdrawn-diagrams
/plugin install handdrawn-diagrams
```

Or symlink it as a personal skill (after cloning this repo):

```bash
git clone https://github.com/ongjin/handdrawn-diagrams.git
ln -s "$PWD/handdrawn-diagrams/skills/handdrawn-diagrams" ~/.claude/skills/handdrawn-diagrams
```

### Codex

```bash
ln -s "$PWD/handdrawn-diagrams/skills/handdrawn-diagrams" ~/.agents/skills/handdrawn-diagrams
```

### Others (Gemini CLI, etc.)

`SKILL.md` follows the common [agentskills.io](https://agentskills.io/specification) format.
Link or copy `skills/handdrawn-diagrams/` into each agent's skills directory.

## Usage

```bash
cd skills/handdrawn-diagrams
npm install && npx playwright install chromium   # first time only

cp template.html mydiagram.html                  # fill in draw() only
node render.mjs mydiagram.html                   # → mydiagram.png
node render.mjs mydiagram.html --dark            # → mydiagram-dark.png
```

For the full workflow, helpers, and pitfalls, see [`skills/handdrawn-diagrams/SKILL.md`](skills/handdrawn-diagrams/SKILL.md).

## License

[MIT](LICENSE)

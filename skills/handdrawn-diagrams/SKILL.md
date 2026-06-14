---
name: handdrawn-diagrams
description: Use when creating a diagram, architecture sketch, flowchart, or before/after comparison (for a blog post, README, or docs) and you want a hand-drawn / whiteboard / Excalidraw / sketchy look instead of Mermaid or clean SVG — any "draw a diagram" / "다이어그램 그려줘" request, or to avoid the generic AI-generated diagram look.
---

# Handdrawn Diagrams

## Overview

손글씨(Excalidraw 스타일) 다이어그램을 외부 앱 없이 만든다: **rough.js + 한글 손글씨 폰트로 그린 HTML 한 장**을 헤드리스 브라우저로 **PNG 캡처**. Mermaid 의 "AI가 그린" 밋밋함을 피하고, 소스(HTML)가 남아 언제든 재편집된다.

**핵심 원칙: 템플릿을 복사해 `draw()` 만 채우고 `render.mjs` 로 굽는다.** 헬퍼(`box`·`arrow`·…)가 전부 좌표 기반이라 LLM 이 그리기 쉽다. **보일러플레이트(KIT/PALETTE/폰트대기/`DIAGRAM-READY` 플래그)는 절대 다시 쓰지 말 것** — 손대면 폰트 폴백·캡처 실패로 깨진다.

## When to use

- 블로그·README·문서에 아키텍처 · 플로우 · before/after · 시퀀스 다이어그램이 필요할 때
- 손그림 · 화이트보드 · 스케치 느낌을 원할 때 (Mermaid · 깔끔한 SVG 대신)
- "다이어그램 그려줘" 류 요청 전반

**When NOT:** 정밀 CAD 도면, 데이터 기반 대량 자동생성, 인터랙티브 차트는 부적합.

## Workflow

1. **복사** — 템플릿을 작업 중인 프로젝트로 복사: `cp ~/.claude/skills/handdrawn-diagrams/template.html docs/images/mydiagram.html` (경로는 자유).
2. **그리기** — 상단 `<svg>` 의 width/height/viewBox 를 그림 크기에 맞추고(여백 ~40px, 제목은 `y≈52` 부터 — 예시 좌표 참고), `draw()` 안 **`여기부터 교체` 블록만** 좌표로 그린다. KIT·PALETTE 는 건드리지 않는다 — 폰트대기 블록도 그대로 두되, **40px 넘는 글씨를 쓰면 그 size 의 `fonts.load(...)` 한 줄만** 추가(아래 함정 참고).
3. **렌더** — `node ~/.claude/skills/handdrawn-diagrams/render.mjs docs/images/mydiagram.html` → 같은 자리에 `mydiagram.png`. 다크가 따로 필요하면 끝에 `--dark` → `mydiagram-dark.png`.
4. **확인** — PNG 를 열어 **손글씨 폰트로 나왔는지** 본다. 밋밋한 sans 면 폰트 대기 실패 → 다시.

준비(프로젝트마다 한 번): `npm i -D playwright && npx playwright install chromium`.
`render.mjs` 는 어느 경로든(상대·절대) 받아 `file://` 로 직접 열어 캡처한다 — 로컬 서버도 MCP 도 불필요. playwright 는 **실행한 프로젝트(cwd)의 node_modules** 에서 찾으므로, 스킬이 `~/.claude/skills` 에 있어도 프로젝트에서 한 번 설치해두면 위 호출이 그대로 작동한다.

## Helper quick reference

좌표는 픽셀, 원점 = 좌상단. ⚠ **앵커가 헬퍼마다 다름** — `box`·`frame`·`cylinder` 은 좌상단 `(x,y)`, `diamond`·`ellipse` 은 중심 `(cx,cy)` (표의 인자명이 곧 앵커). 색은 `PALETTE.{yellow,blue,green,orange,red}` 프리셋 또는 헥스 직접.

| 헬퍼 | 용도 |
|---|---|
| `box(x,y,w,h,fill,[lines],o?)` | 사각 노드 (여러 줄 라벨 = 문자열 배열) |
| `frame(x,y,w,h,{dash,stroke,sw})` | 채움 없는 그룹 · 레이어 테두리 |
| `cylinder(x,y,w,h,fill,[lines])` | DB · 스토리지 |
| `diamond(cx,cy,w,h,fill,[lines])` | 분기 · 판단 |
| `ellipse(cx,cy,w,h,fill,[lines]?)` | 노드 · 원 |
| `arrow` / `biArrow(x1,y1,x2,y2,o?)` | 단방향 / 양방향 화살표 |
| `line(x1,y1,x2,y2,{dash})` | 화살표 없는 연결선 · 구분선 |
| `curveArrow([[x,y],…],o?)` | 곡선 화살표 (셀프루프 · 우회 엣지) |
| `txt(x,y,s,{size,color,anchor,rot})` | 자유 텍스트 |
| `xmark(cx,cy,r)` / `crossOut(x,y,w,h)` | 점 X / 영역 통째 X (before/after 의 "걷어냄") |

공통 옵션 `o`: `{stroke, sw, dash:[6,7], labelSize, labelColor}`.

## Layouts (복붙 시작점)

- `examples/before-after.html` — 좌/우 분할, 걷어내는 쪽에 `crossOut`.
- `examples/layered-arch.html` — `frame` 레이어 + `box` + `cylinder` + `arrow` 의 전형적 웹앱 구조.

둘 다 `node render.mjs examples/<name>.html` 로 바로 렌더된다. 새 그림은 가까운 쪽을 복사해 시작하면 빠르다.

## Common mistakes

- **폰트 폴백(밋밋한 sans)** — `document.fonts` 대기 블록을 지웠거나, `draw()` 에서 40px 넘는 글씨를 쓰면서 그 size 의 `fonts.load(...)` 를 안 넣음. → 폰트대기 블록 유지 + 큰 글씨 size 추가. ⚠ 한글은 `Nanum Pen Script` / `Gaegu` 만 (Caveat 등 라틴 손글씨 폰트는 한글이 sans 로 폴백).
- **그림이 잘림** — `<svg>` 의 width/height/viewBox 를 실제 그림 크기에 맞춘다. `render.mjs` 는 `#c` SVG 영역만 잘라낸다.
- **다크 가독성** — hachure 파스텔 위 밝은 글씨는 대비가 약하다. 보통 크림(light) 한 장을 light/dark 공용으로 쓰는 게 깔끔하고, 정말 필요할 때만 `--dark` 로 두 번째 장을 뽑는다.
- **렌더가 안 됨** — `playwright` 미설치(위 준비 명령) 거나 오프라인(rough.js · 폰트가 CDN 의존). 폐쇄망이면 두 자산을 로컬로 받아 `<head>` 경로를 교체.

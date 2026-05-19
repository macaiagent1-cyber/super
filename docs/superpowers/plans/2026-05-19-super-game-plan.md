# Super — Final Game Plan

> **Single source of truth for building Super.** Wraps the spec, the M1 task plan, multi-agent assignments, install matrix, run book, and risk register into one navigable document.

**Date:** 2026-05-19
**Status:** **Awaiting final green-light** (you said "go" → I treated spec v0.2 as approved and defaulted §11 open questions to my recommendations — override any of them below before we start executing).
**Author:** Claude Opus 4.7, synthesizing Codex (gpt-5.5 @ high+fast) M1 task plan + spec v0.2 + 9 research artifacts + scaffolded engine state.
**Files referenced:**
- Spec: [`docs/superpowers/specs/2026-05-19-game-super-design.md`](../specs/2026-05-19-game-super-design.md) (v0.2)
- M1 task plan: [`docs/superpowers/plans/2026-05-19-super-m1.md`](2026-05-19-super-m1.md) (23 TDD tasks)
- Research: [`research/01-09-*.md`](../../../research/)

---

## 0. Executive Summary — what we're about to do

We are building **"Super,"** a 3D open-world flying-superhero browser game in Three.js r184+ + WebGPU (with WebGL2 fallback) + Vite, on a MacBook Air M5, targeting 60 FPS @ 1440×900 with AAA-ish web visuals. Personal project, not commercial.

**Phase 1 (now → green-light):** finalize this plan, confirm the spec answers, install missing tools.
**Phase 2 (M1, ~1-2 days):** execute Codex's 23-task M1 plan to ship the **vertical slice** — a placeholder caped hero flying over a 3×3 procedural-kit city, BOTH render backends working. Done = play it, feel it, iterate.
**Phase 3 (M2 → M5, weeks):** layer in GLB hero + Mixamo anims + cape, then combat, then AI + audio, then UI/save polish.
**Phase 4 (v1.1+):** WFC procgen, GPU compute cape, volumetric clouds, NPC barks via Ollama.

The game plan ahead is real, gated, and multi-agent. **You drive the milestone gates; I orchestrate the work.**

---

## 1. State snapshot — what exists right now

```
/Users/kdawg/Projects/super/
├── .git/                         ✅ initialized + initial commit (23 files)
├── .gitignore                    ✅ node_modules, dist, .vite, etc.
├── docs/superpowers/
│   ├── specs/2026-05-19-game-super-design.md      ✅ v0.2 (this plan treats as approved)
│   └── plans/
│       ├── 2026-05-19-super-m1.md                 ✅ Codex's 23-task TDD plan
│       └── 2026-05-19-super-game-plan.md          ← (this file)
├── research/01-09-*.md           ✅ 9 artifacts (audits, AAA techniques, repos, architecture, perf, Codex skeleton, Gemini deep research, enrichment, Ollama)
├── package.json                  ✅ three@^0.184.0, howler, meshoptimizer; vite + vitest dev
├── package-lock.json             ✅
├── vite.config.js                ✅ port 5173, no auto-open
├── index.html                    ✅ Codex-scaffolded canvas mount
├── public/                       (empty — assets go here in M2)
├── tests/                        (empty — first tests land in M1.Task02)
├── node_modules/                 ✅ 71 MB, three.js 0.184 verified
├── dist/                         (Codex pre-ran a build — fine to ignore)
└── src/
    ├── main.js                   ✅ bootstrap (will be polished in M1.Task01)
    ├── game.js                   ✅ Game class
    └── engine/
        ├── core/                 ✅ 8 modules (constants, clock, logger, event-bus, app-config, engine-loop, input-router, debug-flags)
        ├── render/               ⚠️ 4 modules (render-system, instancing-system, scene-roots, camera-rig) — render-system is WebGPU-only, M1.Task07 adds the WebGL2 fallback (spec §3 BLOCKER #1)
        ├── world/                ⚠️ 1 module (district-generator) — M1.Task15-18 add tile-grid, building-kit, instancing-system polish
        └── hero/                 ⚠️ 2 modules (hero-flight, hero-system) — flight math will be replaced with pure-function version + tests in M1.Task09
```

**Running:**
- `super-dev` Vite server at **http://127.0.0.1:5173** (serverId `a10571ab-f9b7-48a1-9ffd-a7a6e588cc82`). Browser may show import errors — that's expected; engine stubs are pre-scaffold, the M1 plan replaces/refines them with tests.

**Known issues to address in M1:**
- ⚠️ `npm install @vitest/ui playwright @playwright/test` errored earlier (peer-dep conflict on vitest 2.1) — **M1.Task01 will resolve by either bumping vitest to v3 or pinning compatible @vitest/ui v2 explicitly**
- ⚠️ Codex's pre-scaffolded `render-system.js` is WebGPU-only, no WebGL2 fallback — **M1.Task07 explicitly addresses this** (the spec BLOCKER #1 fix)
- ⚠️ No tests exist yet — **M1.Task02 onward is strict TDD: failing test first, then code**

---

## 2. Approvals received (implicit) + my picks for spec §11

You said **"go, prepare everything, show me the final draft."** I'm treating that as a green-light on **spec v0.2** and defaulting these §11 open questions to my recommendations. **Override any of them below before we start executing.**

| § | Question | My pick | Why |
|---|---|---|---|
| 11.Q1 | Renderer commitment | **WebGPU primary + WebGL2 fallback from day one** | 30-min cost for cross-tier insurance against [WebGPU perf regressions](https://discourse.threejs.org/t/webgpu-performance-issue/87939) |
| 11.Q2 | Physics scope at S1B | **Facade only (static AABB); Rapier lands in M3** | Avoid Rapier WASM until combat actually needs it; reduces M1 surface area |
| 11.Q3 | Combat scope at v1 | **Full — punch + heat-vision + grab-throw + dodge**, shipped in that order | Each is independently tunable; partial combat feels worse than no combat |
| 11.Q4 | City generation | **Deterministic grid kit-bash for v1; WFC spike in v1.1** | `three-wfc` is 2D-only per enrichment; full WFC port is a research project |
| 11.Q5 | Default visual preset | **`high`** | Best 60-FPS-stable look on fanless M5 Air; `ultra` is for screenshot moments |
| 11.lower | Hero asset | **CC0 Block Man for slice 1, upgrade to Meshy.ai if/when art bothers you** | Block Man is rigged, free, ships fast |
| 11.lower | Music license | **Kevin MacLeod CC-BY** (incompetech) | Single credit-roll line is trivial cost vs Soundcloud limits |
| 11.lower | Game shape at v1 | **Sandbox + ambient civilian-rescue events** | Emergent gameplay without writing mission triggers |

**If you want any of these changed, say so before we start. Otherwise these stand.**

---

## 3. Tech stack & install matrix

### Installed (✅ already in `node_modules`)

| Package | Version | Why |
|---|---|---|
| `three` | `^0.184.0` | 3D engine — r184 fixed WebGPU render-bundle reuse |
| `howler` | `^2.2.4` | Audio (carried from `fps-game` pattern) |
| `meshoptimizer` | `^0.21.0` | Geometry decoder + tooling for build pipeline |
| `vite` | `^5.0.0` | Dev server + bundler (M1 may bump to v6 for HMR perf) |
| `vitest` | `^2.1.0` | Unit-test runner |

### To install in M1 (added by Codex's plan tasks)

| Package | Version | Used by | Install command |
|---|---|---|---|
| `@vitest/ui` | `^2.1.0` (match vitest) | M1.Task01 test:ui script | `npm i -D @vitest/ui@^2.1.0` |
| `@playwright/test` | latest | M1.Task14 + Task22 (smoke tests) | `npm i -D @playwright/test && npx playwright install chromium` |
| `seedrandom` | `^3.0.5` | M1.Task03 deterministic RNG (or hand-rolled SFC32) | `npm i seedrandom` |

### To install later milestones (NOT in M1)

| Milestone | Package | Why |
|---|---|---|
| M2 | `@gltf-transform/cli` + `@gltf-transform/core` + `@gltf-transform/functions` | Asset pipeline scripts (`assets:optimize`) |
| M2 | `@nytimes/vite-plugin-gltf` (or NYT bundler plugins) | Build-time GLB optimization in Vite |
| M3 | `@dimforge/rapier3d-simd-compat` | Physics (combat + thrown cars + destructibles) |
| M3 | `@three.ez/instanced-mesh` | InstancedMesh2 — per-instance BVH/LOD/frustum cull for civilians+cars |
| M5 | `lil-gui` | Dev-tools scene-inspector tweakables |
| v1.1 | `ollama` (npm package) | NPC barks via local Ollama daemon |

### External CLIs (Homebrew or manual install — **you'll need to install these**)

| Tool | Why | Install command | Status |
|---|---|---|---|
| **KTX-Software** (`toktx`) | KTX2/Basis texture compression | `brew install --formula ktx` | ❓ not yet (needed in M2) |
| **gltf-transform** CLI | GLB optimization | `npm i -g @gltf-transform/cli` | ❓ not yet (M2) |
| **basisu** | Basis Universal transcoder | `brew install basis_universal` | ❓ not yet (M2 backup if toktx is finicky) |

### CLIs already present (verified)

| CLI | Version | Status |
|---|---|---|
| `node` | 24.15.0 | ✅ |
| `npm` | 11.12.1 | ✅ |
| `git` | (Apple) | ✅ |
| `python3` | 3.9.6 | ✅ |
| `codex` | 0.130.0 (aliased --dangerously-bypass-approvals-and-sandbox) | ✅ |
| `gemini` | 0.41.2 (aliased --yolo) | ✅ |
| `ollama` | 0.23.1 (daemon running on :11434) | ✅ |

---

## 4. External accounts & asset sources

**You'll need accounts / will need to download assets manually starting in M2.** None block M1.

| Source | What | Account needed? | License | When needed |
|---|---|---|---|---|
| [Mixamo](https://www.mixamo.com/) | Hero animations (`Flying Idle`, `Punching`, `Hard Landing`, etc.) | ✅ free Adobe ID | Free commercial, no attribution, no redistribution of raw files | M2 |
| [Kenney City Kit (Commercial/Industrial/Suburban/Roads)](https://kenney.nl/assets/category:3D?query=city) | Building, road, prop assets | No | CC0 | M2 |
| [Kenney Car Kit](https://kenney.nl/assets/car-kit) | Vehicle assets | No | CC0 | M3 |
| [Kenney Urban Kit](https://kenney.nl/assets/urban-kit) | Lampposts, hydrants, signs | No | CC0 | M3 |
| [Quaternius Ultimate Buildings](https://quaternius.com/packs/ultimatetexturedbuildings.html) | Building variety beyond Kenney | No | CC0 | M2 |
| [Quaternius Cars](https://quaternius.com/packs/cars.html) | Vehicle LOD2 + variety | No | CC0 | M3 |
| [Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html) | Civilian crowds | No | CC0 | M4 |
| [Kay Lousberg KayKit City Builder Bits](https://kaylousberg.itch.io/kaykit-city-builder-bits) | Vibrant stylized props | No | CC0 (free download) | M2 |
| [CC0 Block Man rigged humanoid](https://sketchfab.com/3d-models/cc0-block-man-auto-rigged-humanoid-55571b5d47614b4c9973e853fc6b6a72) | Hero placeholder (rigged, 25 bones) | Free Sketchfab account | CC0 | M2 |
| [Poly Haven HDRIs](https://polyhaven.com/hdris) | `belfast_sunset_puresky` + `cloud_layers` for IBL | No | CC0 | M2 |
| [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) | SFX bundles 2020-2024 | No (free download) | Royalty-free perpetual; **2026 update prohibits AI training** — fine for us | M4 |
| [incompetech.com](https://incompetech.com/) | 4 Kevin MacLeod tracks | No | CC-BY 4.0 (credit roll required) | M4 |
| [Meshy.ai](https://www.meshy.ai/) (optional) | Custom hero model | Paid $20/mo Hobbyist | Paid tier = full ownership | Only if you upgrade past Block Man |

---

## 5. Multi-agent roster — who does what

This game gets built by orchestrating six distinct compute resources. Below is the standing assignment matrix.

| Agent | Strengths | Best for | How invoked |
|---|---|---|---|
| **Claude Opus 4.7 (me)** | Synthesis, design judgement, multi-skill orchestration, careful single-file editing | Spec / plan writing, decision arbitration, code review of small changes, task list management | This conversation, every turn |
| **Codex** (`gpt-5.5` @ `priority`/fast + `high` reasoning) | Multi-file scaffolding, large refactors, long-form task plans, autonomous code generation | M1+M2 task implementations, multi-file refactors, anything CLI-shaped | `codex exec -c model_service_tier=priority -c model_reasoning_effort=high - < /tmp/prompt.md` (background) |
| **Gemini 3 Flash Preview** | Google grounding, fact-check, large-context analysis | Library/version verification, license check, "is X still the recommended approach?" | `gemini -m gemini-3-flash-preview -y -p "..."` (background) |
| **Opus subagents** (Agent tool) | Parallel focused work | Per-task code-explorer, parallel research, isolated tasks | `Agent({ subagent_type, model:"opus", prompt })` |
| **Ollama local** (`qwen3:4b`, `qwen2.5-coder:7b`) | Zero-cost, offline, sub-200 ms | v1.1 NPC barks at runtime (game-time, not dev-time) | `curl localhost:11434/api/chat` from browser via `ollama-js` |
| **You** | Playtest feel, asset acquisition, milestone gating | Tuning flight constants, downloading assets from Kenney/Mixamo/etc, deciding "this is fun enough to ship next milestone" | Browser + dev console + your time |

### Per-task category assignment table

| Task category | Primary agent | Skills used | Notes |
|---|---|---|---|
| Project scaffold (Vite, deps, folders) | Codex (already done in pre-scaffold) | `superpowers:writing-plans`, `anthropic-skills:dev-quality` | M1.Task01 cleans up |
| Pure-math modules (flight, damage, clock) | Codex writes + ME reviews | `superpowers:test-driven-development` | Strict TDD: failing test → minimal code → green |
| Render pipeline (WebGPU + WebGL2) | Codex writes; if confused, ME steps in | `superpowers:systematic-debugging` for renderer bugs | M1.Task07 is the WebGPU/WebGL2 tier split |
| Procgen (tile grid, building kit) | Codex writes; Gemini fact-checks any technique claims | `anthropic-skills:algorithmic-art` (procgen mindset) | M1.Task15-18 |
| Browser smoke tests | Codex writes; ME runs locally to verify; Playwright MCP also available | `anthropic-skills:playwright` | M1.Task14 + Task22 |
| Code review per task | `superpowers:code-reviewer` subagent (Opus) after each M1 task | `superpowers:requesting-code-review` | Two-stage review per `superpowers:subagent-driven-development` |
| Asset import & optimization | ME + you (manual download); Codex writes the `assets:*` scripts | n/a — manual | M2 |
| Combat tuning | You (playtest); Codex writes per spec | `superpowers:executing-plans` | M3 |
| Audio integration | Codex writes; you supply files; Ollama (optional) generates barks | n/a | M4 |
| UI polish | ME for small DOM bits; Codex for full menus | `anthropic-skills:impeccable-style` for anti-AI-slop discipline | M5 |
| NPC barks (v1.1) | Ollama daemon (game-time); ME wires `ollama-js` | n/a runtime | v1.1 |

---

## 6. Skills inventory — which superpowers/anthropic skills fire when

The skills I'll keep active throughout the build:

| Skill | When it fires | Notes |
|---|---|---|
| `superpowers:using-superpowers` | Every turn | Already active; the meta-rule |
| `superpowers:writing-plans` | Done (Codex wrote M1 plan; this game plan synthesizes) | One-shot per milestone |
| `superpowers:test-driven-development` | Every M1+ implementation task | TDD discipline: failing test first |
| `superpowers:subagent-driven-development` | M1 execution mode (recommended) | Fresh subagent per task with code review |
| `superpowers:executing-plans` | Alternative inline mode if you prefer in-thread | Less context-switching cost |
| `superpowers:requesting-code-review` | After every implementation task | Catches issues before they compound |
| `superpowers:receiving-code-review` | When reviewer flags an issue | Verify-don't-comply discipline |
| `superpowers:verification-before-completion` | End of each milestone gate | Actually play the slice, don't just assert it works |
| `superpowers:systematic-debugging` | When tests/renderer fails | Hypothesize → test → eliminate; no guessing |
| `superpowers:finishing-a-development-branch` | End of M1 (and each milestone) | Choose merge / PR / keep |
| `superpowers:using-git-worktrees` | When isolated experiments are needed (e.g. v1.1 WFC spike) | Spike branches without touching main |
| `anthropic-skills:agent-orchestration` | Multi-agent coordination decisions | Already loaded |
| `anthropic-skills:dev-quality` | TDD / debug / harness work | Already loaded |
| `anthropic-skills:dev-workflow` | Worktree setup, finish branch, execute plan | Already loaded |
| `anthropic-skills:superpowers-orchestrator` | Wide-domain task routing | Already loaded |
| `anthropic-skills:impeccable-style` | UI polish in M5 — anti-AI-slop critique | Loads in M5 |
| `anthropic-skills:algorithmic-art` | Procgen district generation | Loads if WFC v1.1 spike happens |
| `commit-commands:commit` | Every commit point in the M1 plan | Lightweight wrapper |

Skills explicitly NOT used (and why):
- `frontend-design`, `react-best-practices`, `nextjs`, `shadcn` — we have no React/Next/UI framework
- `anthropic-skills:docx`/`pptx`/`xlsx` — not making documents
- `searchfit-seo:*` — not an SEO project
- `vercel:ai-sdk`/`chat-sdk` — no chat UI
- `supabase:*`, `firebase:*` — no backend
- `sentry:*` — local-only error telemetry per spec §19

---

## 7. Milestone roadmap

```
M1 — Vertical slice (S1A + S1B) ── 1-2 days
   ├── S1A: capsule hero flying over 20 placeholder boxes, BOTH backends (2-3 h)
   └── S1B: deterministic 3×3 kit-bashed city, batched, forced-WebGL2 smoke green (1-2 d)
   ▾ DONE = you play it, both render tiers measured, perf budget validated
M2 — Hero polish ── 2-4 days
   ├── Asset pipeline: assets:import + optimize + ktx2 + manifest + validate scripts
   ├── GLB hero (Block Man or Meshy.ai) + Mixamo anim retarget
   ├── Bone-driven vertex-shader cape
   ├── Lighting: 3-cascade CSM + HDRI/PMREM IBL
   └── Sky + atmospheric fog + AgX tone polish
   ▾ DONE = real hero flies over real-asset city with believable lighting
M3 — Combat ── 3-5 days
   ├── @dimforge/rapier3d-simd-compat WASM physics
   ├── Hero capsule + camera collision
   ├── Punch (sphere-cast + impulse + impact VFX)
   ├── Heat vision (continuous ray + scorch decals + screen shimmer)
   ├── Grab + throw (pickup → kinematic → launch impulse)
   ├── Dodge (i-frame dash + motion trail)
   └── Destructibles (Kenney props with damage states)
   ▾ DONE = full combat loop in 3×3 city, hero feels strong
M4 — AI + Audio ── 3-5 days
   ├── Civilian AI (sidewalk wander, panic on threat, look-at-hero)
   ├── Traffic AI (lane following, intersection logic)
   ├── Threat AI (goons/drones with target → pursue → attack)
   ├── Spatial audio (howler.js Web Audio backend, 24 voices, voice-stealing)
   ├── Music director (calm / exploration / combat layers)
   └── Ambience system (city bed, wind at altitude, weather)
   ▾ DONE = world feels alive, combat has sound + reactions
M5 — UI + Save polish ── 2-3 days
   ├── HUD (health, energy, minimap, reticle)
   ├── Menu system + pause + settings (graphics/audio/input presets)
   ├── Save system (settings + progress + corruption recovery per spec §20)
   ├── Title screen
   ├── Pointer-lock UX (per spec §17) + Audio autoplay handling (spec §18)
   ├── Gamepad support (spec §21)
   └── Dev console hardening + perf-capture export (spec §19)
   ▾ DONE = v1 shippable; meets spec §16 done definition
v1.1 → onward — opt-in upgrades
   ├── WFC procgen city (marian42 port)
   ├── GPU compute Verlet cape via TSL
   ├── Volumetric clouds (raymarched)
   ├── GTAO + half-res SSR + TAA + motion blur (ultra preset)
   ├── Ollama NPC barks via qwen3:4b local model
   └── Multi-district streaming (only if scope grows past 3×3)
```

---

## 8. M1 detail — see the dedicated task plan

The 23 TDD tasks live in [`docs/superpowers/plans/2026-05-19-super-m1.md`](2026-05-19-super-m1.md). Highlights:

### S1A (Tasks 01-14)
1. Scaffold Vite + tests + folder layout (cleans up Codex's pre-scaffold)
2. `core/constants.js` + Vitest test
3. Deterministic RNG (seedrandom or SFC32)
4. Master `clock.js` (already exists; tests added)
5. Double-buffered `input-router.js` (already exists; rewrite to match fps-game pattern exactly)
6. `engine-loop.js` (already exists; tests added)
7. **Render backend selection — WebGPU + forced-WebGL2 (the spec BLOCKER #1 fix)**
8. Third-person `camera-rig.js` with spring follow
9. Pure-function hero flight math + unit tests
10. `hero-system.js` facade (orchestrates flight + state)
11. Perf HUD overlay
12. Dev console commands (`quality`, `seed`, `render backend`, `perf capture start|stop`)
13. S1A Vite entry (20 placeholder boxes + hero + HUD + console)
14. S1A Playwright smoke — both backends

### S1B (Tasks 15-22)
15. `world/tile-grid.js` — seeded 2D grid
16. `world/building-kit.js` — HSL-varied placeholder boxes
17. `world/district-generator.js` — 3×3 generation logic (already exists; refactored against tests)
18. `render/instancing-system.js` — BatchedMesh, ≤ 5 draws for buildings
19. `world/collision-world.js` — static AABB facade (Rapier deferred to M3)
20. Hero capsule collision tests
21. S1B Vite entry (`npm run dev:slice`)
22. S1B Playwright FPS gates (≥ 55 FPS WebGPU, ≥ 30 FPS forced-WebGL2)

### Final gate (Task 23)
23. Visual + perf + commit verification

**Recommended execution path:** `superpowers:subagent-driven-development` — fresh Opus subagent per task with code review between. Best quality, slightly more wall-clock time. Alternative: `superpowers:executing-plans` for inline batch.

---

## 9. M2-M5 high-level outlines

These will get their own detailed plans (one per milestone) when M1 completes — same pattern: spec → Codex high+fast writes detailed task plan → execute via subagent-driven mode.

### M2 — Hero polish & asset pipeline (after M1 sign-off)

```
T01-T05: Asset pipeline scripts
   assets:import      (FBX/GLB intake, Mixamo rig fix, cape socket)
   assets:optimize    (gltf-transform: meshopt + prune + dedup)
   assets:ktx2        (toktx UASTC normals + ETC1S color)
   assets:manifest    (JSON registry with stable IDs + license metadata)
   assets:validate    (bone count, anim names, texture format, decoder presence)
T06-T08: GLB hero
   Download Block Man or Meshy.ai output
   Run through pipeline
   Replace capsule with rigged GLB
T09-T10: Mixamo animation retarget
   Download Flying Idle / Flying Forward / Hard Landing / Punching / Throw / Dodge L+R
   Convert FBX → GLB, retarget to Block Man skeleton
T11-T13: Cape (bone-driven vertex shader)
   SkinnedMesh with 24-bone cape chain
   Vertex shader: wind vector + hero velocity coupling
   Distance LOD (freeze sim beyond 60 m)
T14-T17: Lighting + sky
   lighting-system.js (3-cascade CSM + IBL)
   sky-system.js (Sky addon + time-of-day)
   HDRI prefilter pipeline (Poly Haven HDRIs)
T18-T20: Postprocess polish
   AgX tone (already in M1) + Bloom TSL node + atmospheric fog
   Color management checklist (HDRI → bloom → tone → grade order)
T21: M2 verification — play & feel
```

### M3 — Combat

```
T01: Install @dimforge/rapier3d-simd-compat; verify WASM loads in both backends
T02: Replace AABB facade with Rapier physics-world
T03-T05: Hero capsule physics (sweeps, slope, snap-to-ground)
T06-T08: Camera collision (pull-in on wall contact)
T09-T11: Punch (sphere-cast + impulse + impact VFX + audio stub)
T12-T15: Heat vision (continuous ray + decal scorch + screen shimmer + DOT damage)
T16-T18: Grab + throw (pickup target → kinematic attach to pose socket → launch on release)
T19-T20: Dodge (i-frame dash + trail VFX)
T21-T23: Destructibles (Kenney props with damage states + debris pool)
T24: M3 verification — full combat loop in 3×3 city
```

### M4 — AI + Audio

```
T01-T03: nav-graph.js (sidewalk + rooftop navmesh from tile grid)
T04-T06: ai-director.js + behavior-budget.js (density manager, time-sliced updates)
T07-T08: civilian-ai.js (wander, panic, flee, look-at-hero)
T09-T10: traffic-ai.js (lane follow, intersections, panic brake)
T11-T13: threat-ai.js (perception, pursuit, attack windows)
T14-T16: audio-bus.js + spatial-audio.js (howler.js channels, 3D pan, 24-voice pool)
T17-T18: music-director.js (calm/exploration/combat layers, crossfade)
T19: ambience-system.js (city bed, wind at altitude, weather hooks)
T20-T22: Audio sprite production (Sonniss SFX → audiosprite → Opus packs)
T23: M4 verification — alive city + reactive combat audio
```

### M5 — UI + Save polish + ship gate

```
T01-T03: HUD (health, energy, minimap, reticle)
T04-T06: menu-router.js + pause-menu.js + settings (DOM overlay, accessibility)
T07-T08: title-screen.js
T09-T10: save-system.js + save-schema.js (versioned, checksummed, corruption recovery — spec §20)
T11: settings-store.js (persisted graphics/audio/input)
T12: pointer-lock UX hardening (spec §17)
T13: audio autoplay handling (spec §18)
T14: error-telemetry / perf-capture export (spec §19)
T15: gamepad support (spec §21)
T16-T17: dev console hardening + production gates
T18: M5 verification — full v1 done definition (spec §16)
T19: Deploy: itch.io upload OR vercel:deploy
```

---

## 10. Build sequence — recommended "Week 1" calendar

| Day | Time | What | Who |
|---|---|---|---|
| **Day 1 morning** | 1 hr | Final plan review + green-light (right now) | You |
| Day 1 mid | 2-3 hrs | **M1.Task01-14 (S1A)** via subagent-driven mode | Codex implements per task; Opus reviewer between tasks; me orchestrating |
| Day 1 end | 30 min | Open browser, fly the capsule, gut-check feel | You |
| Day 2 morning | 4 hrs | **M1.Task15-22 (S1B)** | Same pattern |
| Day 2 mid | 1 hr | Play the 3×3 city — both backends, both perf tiers | You |
| Day 2 end | 30 min | M1 verification gate (Task 23) + commit + tag | Me |
| **Day 3** | Whole day | Download M2 assets (Block Man, Mixamo anims, Kenney City Kit, Poly Haven HDRIs) + start asset pipeline | You (downloads) + Me/Codex (scripts) |
| Day 4-7 | Daily | M2 execution: rigged hero + cape + lighting + postprocess | Same multi-agent pattern |
| Day 8+ | Daily | M3 (combat) → M4 (AI+audio) → M5 (UI+save+ship) | Same |

**Total to v1 ship**: ~3 weeks at this pace. Faster if you focus harder; slower if you playtest a lot (which is the point).

---

## 11. Run book — commands you'll actually type

### Start the dev server (server already running, but for reference)
```bash
# Via Claude (preferred — managed lifecycle):
# preview_start("super-dev")

# Or directly:
cd /Users/kdawg/Projects/super
npm run dev          # serves at http://127.0.0.1:5173

# Vertical-slice entry (after M1):
npm run dev:slice    # port 5174, S1B 3×3 city scene
```

### Run tests
```bash
npm test             # vitest run, all unit tests
npm run test:ui      # vitest UI on port 51204 (after @vitest/ui installs)
npx playwright test  # Playwright smoke tests (after M1.Task14)
```

### Force a render backend (for testing the WebGL2 fallback)
```
http://127.0.0.1:5173/?forceWebGL2=1
http://127.0.0.1:5173/?forceWebGPU=1
```

### Dev console commands (after M1.Task12)
```
~                              open / close console
quality low|medium|high|ultra  switch render preset
seed 42                        regenerate world deterministically
render backend webgpu|webgl2   force a backend
perf capture start|stop|save   record perf bundle
weather rain|clear|storm|fog   (M4+)
spawn car|civilian|drone|prop  (M4+)
hero energy full               (M3+)
teleport district 0 0          (M2+)
```

### Git workflow
```bash
# After each M1 task (subagent-driven mode does this for you):
git add <specific files>
git commit -m "task NN: <what it did>"

# At end of M1:
git tag M1-vertical-slice

# At end of each milestone: same pattern
```

### Asset pipeline (after M2.Task01-05)
```bash
npm run assets:import    # bring new FBX/GLB into pipeline
npm run assets:optimize  # gltf-transform pass
npm run assets:ktx2      # toktx pass
npm run assets:manifest  # rebuild registry
npm run assets:validate  # sanity check
```

---

## 12. Risk register (updated)

Top risks for the build, with mitigations:

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Flight feel** is the product — easy to be correct-but-unfun | Live-tuning sliders in `dev-tools/scene-inspector` from M1.Task08; iterate against your own feel, not numbers |
| 2 | **WebGPU/WebGL2 divergence** (the v0.2 spec BLOCKER #1) | M1.Task07 enforces both backends day one; CI Playwright runs both tiers; `?forceWebGL2` flag for manual testing |
| 3 | **Postprocess drops to 30 FPS** at `high` preset during combat | M1's `perf-hud` profiles every commit; SSR/motion-blur gated behind `ultra` preset, off by default |
| 4 | **Asset pipeline glue layer** breaks Mixamo rigs / bloats downloads | M2 has 5 named scripts (assets:import/optimize/ktx2/manifest/validate); one hero GLB must pass before M3 starts |
| 5 | **Naive culling** draws 5000 occluded windows | InstancedMesh2 BVH + tile-level AABB cull; collapse to BatchedMesh once geometry stabilizes |
| 6 | **npm install errors** (the @vitest/ui peer-dep issue) | M1.Task01 resolves explicitly — likely pin `@vitest/ui@^2.1` or bump vitest to v3 |
| 7 | **Codex scaffolds without writing tests** (which happened pre-M1) | Subagent-driven mode forces TDD via the writing-plans skill — no code without failing test first |
| 8 | **You burn out** because the project scope grew | Milestone gates are real — you play each milestone and decide whether to go on. Sandbox v1.0 is OK to ship and walk away from |

---

## 13. Open issues / debt to clear before / during M1

| Issue | Where | Resolution |
|---|---|---|
| `npm install @vitest/ui playwright @playwright/test` errored on peer deps | npm log `2026-05-19T22_50_41` | M1.Task01: read log + pin compatible versions |
| Codex's `render-system.js` has no WebGL2 fallback | `src/engine/render/render-system.js:18` | M1.Task07 rewrites with backend selection |
| Codex's pre-scaffold has 0 tests | `tests/` dir empty | M1.Task02 onward adds Vitest tests per module |
| `package.json` doesn't include `dev:slice` script yet | `package.json:7-12` | M1.Task21 adds it |
| Browser may show console errors from scaffold (import paths, undefined globals) | DevTools at http://127.0.0.1:5173 | Expected; M1 plan replaces or fixes |
| Some src/* files are speculative scaffolds rather than tested code | `src/engine/` | M1 plan rewrites each one TDD-style |

---

## 14. The final ask — green-light?

**Spec v0.2 has been treated as approved (per your "go").** §11 defaults locked per §2 above unless you override.

**Final plan = this document + Codex's [`2026-05-19-super-m1.md`](2026-05-19-super-m1.md).**

**If you say "green-light"** (or any clear approval), I'll:

1. Invoke `superpowers:subagent-driven-development` to drive M1 execution
2. Dispatch a fresh Opus subagent (or Codex) per M1 task, with TDD discipline
3. Run code review between every task via `superpowers:code-reviewer`
4. Commit after every task (per the M1 plan)
5. Pause at the end of M1 (Task 23) for your playtest + gate decision
6. Repeat the milestone pattern: write detailed M2 plan → execute → playtest → M3 → etc.

**If you want to override anything** — answer any §11 question differently, swap a tool/lib choice, add or remove a milestone, change the asset sources, anything — tell me before "green-light" and I'll revise this document.

---

## Appendix A — Synthesis trail

This plan is built on:

- **Spec v0.2** — itself a synthesis of 5 Opus subagents + Codex (xhigh) + Gemini 2.5 Pro, critically reviewed by Codex (fast/low) + Gemini 3 Flash Preview, enriched with direct GitHub + npm + threejs-forum + Apple/Metal docs research
- **M1 task plan** (Codex `gpt-5.5` @ `priority`+`high`, 23 TDD tasks)
- **9 research artifacts** in `research/01-09-*.md`
- **Codex's pre-scaffold** (17 engine modules — quality varies; M1 plan refines or replaces each)

Total agent participation in this design: 5 Opus subagents + Codex (3 different reasoning levels) + Gemini (2 different model variants) + Ollama (evaluated, deferred to v1.1) + me orchestrating + you driving.

That's the multi-agent workflow you asked for. **Ready when you are.**

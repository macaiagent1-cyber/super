# Super — Execution Playbook (18-hour sprint)

> **The hour-by-hour, agent-by-agent, task-by-task plan for shipping a playable Super by tomorrow morning.** Complement to the strategic [`2026-05-19-super-game-plan.md`](2026-05-19-super-game-plan.md) and the detailed Codex M1 task list at [`2026-05-19-super-m1.md`](2026-05-19-super-m1.md).

**Date:** 2026-05-19 ~6:50 PM
**Sprint goal:** Playable, recognizable "superhero flying through a procedural city" web game by tomorrow morning (~+12-18 working hours, factoring in sleep)
**Status:** **Awaiting your final green-light** — once you say go, execution starts in the next message
**Author:** Claude Opus 4.7 with full multi-agent backing

---

## Table of contents

0. [Honest reality check — what 18 hours actually buys](#0-honest-reality-check)
1. [What "done by tomorrow morning" looks like](#1-what-done-looks-like)
2. [Scope compression decisions (transparent)](#2-scope-compression)
3. [The multi-agent execution model — how this works](#3-multi-agent-execution-model)
4. [Hour-by-hour sprint timeline](#4-hour-by-hour-timeline)
5. [Detailed per-task breakdown (every task gets a row)](#5-per-task-breakdown)
6. [Skill inventory — when each one fires](#6-skill-inventory)
7. [Agent roster — what each compute resource does](#7-agent-roster)
8. [Stretch goals — "if we finish early"](#8-stretch-goals)
9. [Risk register + recovery playbook](#9-risks-and-recovery)
10. [Run book — commands you'll type during the sprint](#10-run-book)
11. [Glossary — what every skill / agent / tool actually does](#11-glossary)
12. [The green-light protocol](#12-green-light-protocol)

---

## 0. Honest reality check

You said: "**I would like it completed by today or tomorrow morning.**" Right now it's ~6:50 PM on 2026-05-19. Tomorrow morning ≈ +12-18 hours of *working* time (sleep takes a bite). That's not enough to ship the full v1 from the strategic plan (which estimated ~3 weeks).

**So I'm being honest with you:** the strategic plan stays valid as the long-term roadmap. This sprint plan compresses scope to the *playable core* — a real working game, not a tech demo, but missing some of the bells and whistles. Everything we defer is one focused work session away later this week.

This is the right call. **A great vertical slice beats a half-built sprawl every time** — and a flying superhero game that *feels good to fly* with a city, basic combat, and audio is genuinely fun. We add cape, civilians, heat vision, save system one week at a time.

---

## 1. What "done by tomorrow morning" looks like

You'll wake up, open http://127.0.0.1:5173 (or hit "Resume" if you left the dev server running overnight), and have this experience:

1. **Click-to-play splash** → pointer lock acquires, music starts
2. **You're flying.** A capsule (or simple rigged) hero in a third-person camera, mid-air over a 3×3 procedural city
3. **WASD + mouse** controls — pitch/yaw with mouse, throttle direction with WASD
4. **Shift to boost** — FOV pumps, motion blur smear, speed lines, particle contrail behind you
5. **Banking turns** — you don't snap-rotate, you bank into the turn like a fighter jet
6. **3×3 procedural city below** — varied-color/varied-height kit-bashed boxes representing buildings, a flat ground plane with roads, all rendered at 60 FPS
7. **Click to punch** — a sphere-cast in front of you; if it hits a building, the building flashes red and emits a particle burst (real destructibles come later)
8. **Land with `Space` released** — superhero-landing arc with dust ring particle burst + camera shake-and-pull-out
9. **HUD shows** altitude, speed, energy (drains on boost, refills when not boosting)
10. **Audio**: ambient wind that pitch-shifts with speed, boost whoosh, punch impact, mellow background music loop (Kevin MacLeod CC-BY)
11. **Dev console** (~) lets you: `quality low|med|high`, `seed <n>`, `render backend webgpu|webgl2`, `perf capture start|stop`
12. **Both render backends** work — `?forceWebGL2=1` URL flag gives you the fallback path
13. **60 FPS at `high` preset** on your MBA M5 sustained, validated by an on-screen perf HUD

This is **M1 (the full vertical slice from the spec) + a tight subset of M2 (lighting + minimal animations) + a tight subset of M3 (one combat action) + a tight subset of M4 (audio basics) + a tight subset of M5 (minimal HUD + dev console)**.

It's the minimum that *feels like a game*, not a demo.

---

## 2. Scope compression — transparent decisions

To make 18 hours work, I'm cutting hard. Here's the honest map of what's IN and what's OUT for tomorrow morning.

### ✅ IN — shipping by tomorrow morning

| Feature | Why it ships | Skill / agent doing it |
|---|---|---|
| Vite + Three.js r184 + WebGPU + WebGL2 fallback | Foundation; without this, nothing works | Codex via M1.Task01-07 |
| Deterministic seeded RNG + clock + double-buffered input | Engine spine; deterministic = debuggable | Codex via M1.Task02-05 |
| Engine loop with fixed-step accumulator | Frame-rate-independent physics | Codex via M1.Task06 |
| Two-tier render backend (WebGPU primary, WebGL2 fallback) | Spec BLOCKER #1 fix | Codex via M1.Task07 |
| Third-person spring-follow camera with FOV boost | Sells flight speed | Codex via M1.Task08 |
| Pure-function hero flight math + unit tests | Tunable, testable, the *product* | Codex via M1.Task09 |
| 3×3 procedural city (deterministic kit-bash boxes) | The world | Codex via M1.Task15-18 |
| Static AABB collision for ground + buildings | Hero doesn't fall through anything | Codex via M1.Task19-20 |
| Browser Playwright smoke tests | Catch regressions both backends | Codex via M1.Task14, Task22 |
| Perf HUD (FPS, frame ms, draw calls, backend) | Live feedback while tuning | Codex via M1.Task11 |
| Dev console with seed/quality/backend/perf commands | Live world surgery | Codex via M1.Task12 |
| **Bonus: motion blur + speed lines at boost** | Sells flight feel (M3+M4 mini-feature) | Me + Codex inline polish |
| **Bonus: sphere-cast punch with VFX flash** | Adds a verb beyond fly (M3 mini-feature) | Me writing inline |
| **Bonus: 3 howler.js SFX (boost, punch, ambient wind)** | Audio = 50% of feel (M4 mini-feature) | Me writing inline |
| **Bonus: 1 music track (Kevin MacLeod, you download)** | Energy + mood | You download + me wire |
| **Bonus: 3-cascade sun shadow + HDRI sky** | Single biggest "this looks AAA" upgrade for the cost | Me inline using `Sky` addon + Poly Haven HDRI |
| **Bonus: minimal HUD (DOM overlay: altitude, speed, energy)** | Visual feedback for boost (M5 mini-feature) | Me writing inline DOM |

### ⏸ DEFERRED — not shipping tomorrow morning (next 1-2 weeks)

| Feature | Why deferred | When |
|---|---|---|
| Real GLB hero (Mixamo / Block Man) with rig | Asset pipeline (KTX2 + Meshopt + Mixamo) takes ~3-4 hrs alone | M2, day 3-4 |
| Bone-driven vertex-shader cape | Beautiful but a sink for cycles right now | M2, day 4 |
| Heat vision (continuous ray, scorch decals, screen shimmer) | Needs decal-system + beam-system + audio | M3, day 5-6 |
| Grab + throw + kinematic attach | Needs Rapier physics commitment | M3, day 6 |
| Dodge with i-frames + motion trail | Combat polish | M3, day 7 |
| Destructible props (real damage states + debris) | Needs Rapier + asset pipeline | M3, day 7 |
| Civilian + traffic AI | nav-graph + behavior trees | M4, day 8-9 |
| Threat AI (goons, drones) | M4, day 9-10 |
| Full audio sprite system + spatial mixing | Production pipeline | M4, day 10 |
| Music director with adaptive layers | Combat vs exploration crossfade | M4, day 10 |
| Save system + corruption recovery | Settings/progress persistence | M5, day 11 |
| Full menu suite (title, pause, settings, accessibility) | M5, day 11-12 |
| Pointer-lock + autoplay UX hardening | M5, day 12 |
| Gamepad support | M5, day 12 |
| WFC procgen city (marian42 port) | Research project | v1.1 |
| GPU compute Verlet cape via TSL | R&D | v1.1 |
| Volumetric clouds (raymarched) | Beautiful but 3-5ms cost | v1.1 |
| GTAO + half-res SSR + TAA + Bokeh DoF | Ultra preset only | v1.1 |
| NPC barks via Ollama qwen3:4b | Real after civilians ship | v1.1 |
| Multi-district streaming + LRU + floating-origin | Only needed past 5km world | v1.1 |
| itch.io / vercel deploy | After feel is right | M5+ |

### 🤔 CONSIDERING — if Hour 14 finds us ahead

These are the "if we have time" candidates that could push the sprint result from "playable core" to "playable + magic":

- **Block Man rigged hero** instead of capsule (replaces ~30 lines of code + 1 GLB download from Sketchfab)
- **Single flight idle animation from Mixamo** (~30 min if it works first try, ∞ if rig is broken)
- **Vertex-shader speed-lines shader** (10 min, huge visual impact)
- **One destructible prop** (a single car you can punch and watch break)
- **Itch.io upload** (15 min if account already exists)

---

## 3. The multi-agent execution model

This is HOW the sprint actually executes. Six compute resources orchestrate around a single chair (yours).

### The flow per task

```
                       ┌──────────────────────────────────────────┐
                       │  USER (you):                              │
                       │  - reads task summary                      │
                       │  - says "go" or "skip" or "change X"      │
                       └──────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE (me):                                                    │
│  - reads next task from M1 plan                                  │
│  - selects executor (Codex / Opus subagent / inline)             │
│  - dispatches with precisely-crafted prompt                      │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTOR (Codex high+fast OR Opus subagent):                    │
│  - writes failing test                                            │
│  - runs test, verifies failure                                    │
│  - writes minimal code to pass                                    │
│  - runs test, verifies pass                                       │
│  - commits                                                        │
│  - returns summary to me                                          │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  REVIEWER (Opus subagent or superpowers:code-reviewer):          │
│  - reads diff                                                     │
│  - flags critical / important / minor issues                      │
│  - confirms tests are real, not vacuous                           │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE (me) again:                                              │
│  - applies fixes from reviewer (or pushes back if wrong)         │
│  - updates task list                                              │
│  - posts brief summary to you                                     │
│  - cycles to next task                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Tone-setting for the sprint

- **You are the gatekeeper for milestones**, not for individual tasks. You'll get summary updates every 2-3 tasks ("just finished render backend selection, dev server now boots both modes, moving to camera rig"). You stop me if something feels wrong.
- **I make 90% of in-the-moment decisions** to keep pace. If a task discovers it needs a different library or different signature, I decide (defaulting to spec) and move on. If the decision is BIG (changes the architecture), I'll pause and ask.
- **Test failures are *signal*, not annoyance.** Failed Playwright run → we know the WebGL2 fallback broke. Failed unit test → we know flight math regressed. The TDD pattern is doing its job.
- **Background processes work in parallel.** Codex writing task N+1 while I'm reviewing task N. Headless Playwright running while we plan. Compounded throughput.
- **Every commit is a checkpoint** to roll back to. If task N somehow breaks task N-1, we revert and re-do.

---

## 4. Hour-by-hour sprint timeline

This is the proposed schedule from "green-light" to "playable Super by tomorrow morning." Assumes you green-light tonight; sleep happens between Hour 4 and Hour 12.

### Tonight — Hours 0 to 4 (≈7 PM → 11 PM)

| Hour | Goal | Agent activity | Your activity |
|---|---|---|---|
| **0.0-0.3** | Green-light + setup confirmation | Me: confirm dev server health, verify codex/opus pipelines warm | Read this doc, say "go" |
| **0.3-1.0** | M1.Task01 (scaffold cleanup) + Task02 (constants) + Task03 (RNG) | Codex high+fast as the executor; me as orchestrator; commit per task | Sip coffee, glance at commits |
| **1.0-2.0** | Task04 (clock) + Task05 (input) + Task06 (engine loop) | Same pattern; pure-function tests for each | Optional: open another tab and watch git log scroll |
| **2.0-3.0** | Task07 (render backend WebGPU + WebGL2 — the BLOCKER fix) + Task08 (camera rig) | Codex; this is the hardest M1 task; me intervening if it stalls | This is when "fly" becomes possible — first time the canvas isn't blank |
| **3.0-4.0** | Task09 (flight math) + Task10 (hero facade) + Task11 (perf HUD) | Codex; flight math gets exhaustive unit tests | **Optional: open the dev server, fly the capsule for 30 sec, report how it feels** |

**Hour 4 checkpoint:** capsule hero is flying over a ground plane at 60 FPS. No city yet, no buildings yet, no audio. But the engine spine is *real, tested, and shipped*.

→ **Get sleep here if you want.** Resume tomorrow morning.

### Tomorrow morning — Hours 4 to 12 (assume ≈ 7 AM → 3 PM)

| Hour | Goal | Agent activity | Your activity |
|---|---|---|---|
| **4.0-4.5** | Task12 (dev console) + Task13 (S1A entry: 20 boxes) | Codex; you can now seed-toggle worlds | Quick gut check: open dev server, fly through 20 boxes |
| **4.5-5.5** | Task14 (Playwright smoke tests both backends) | Codex; failures here = something earlier broke | Wait |
| **5.5-7.0** | Task15-18 (tile grid + building kit + district generator + instancing system) | Codex; this is the city — biggest visual milestone | This is when "flying through a city" becomes real. **Open browser, fly, send me a 1-sentence reaction.** |
| **7.0-8.0** | Task19 (collision facade) + Task20 (capsule collision tests) | Codex; pure math + integration tests | Wait |
| **8.0-9.0** | Task21 (S1B dev entry) + Task22 (Playwright FPS gates) | Codex; the official M1 ends here | **PLAYTEST GATE — fly the 3×3 city for 5 min, tell me what feels off** |
| **9.0-9.5** | Task23 (M1 verification) + git tag `M1-vertical-slice` | Me | Sip coffee, celebrate the milestone |

**Hour 9 checkpoint: M1 complete.** Spec §16 v1 done definition partially met (no hero asset, no combat, no audio yet). This is the **honest "vertical slice"** the spec promised.

### Tomorrow morning continued — Hours 9 to 18 ("M1+" sprint bonus features)

This is where I push past the formal M1 to add the "this feels like a game, not a tech demo" features.

| Hour | Goal | Agent activity | Your activity |
|---|---|---|---|
| **9.5-10.5** | Sun shadow (CSM, 3 cascades) + HDRI sky (Poly Haven `belfast_sunset_puresky`) | Me writing inline + you download HDRI from Poly Haven | Download `belfast_sunset_puresky.exr` from polyhaven.com when prompted |
| **10.5-11.5** | DOM HUD overlay (altitude, speed, energy with boost drain) | Me writing inline | Optional: fly and watch the HUD change |
| **11.5-12.5** | Sphere-cast punch (click to swing fist; hit boxes flash red + particle burst) | Me writing inline | Click-test |
| **12.5-13.5** | Howler.js + 3 SFX (ambient wind, boost whoosh, punch impact) | Me wires howler + you download 3 SFX from Sonniss GDC | You download a small SFX pack (~5 min) |
| **13.5-14.5** | Music track + speed lines + motion blur | Me inline + you download MacLeod track | Download 1 track from incompetech.com |
| **14.5-15.5** | Superhero-landing arc + dust ring + camera shake | Me inline | Fly + dive + watch |
| **15.5-16.5** | Final tune pass — gravity, max speed, banking response, audio levels | Me + you (live tune the constants via dev-tools sliders) | **This is the most important hour — feel-tuning** |
| **16.5-17.5** | Final smoke run, browser audit, save, commit, push (if you want to publish) | Me | Optional itch.io upload |
| **17.5-18.0** | **You play your game.** | Me steps back | Have fun |

**Hour 18 checkpoint:** Playable Super. Tagged in git as `playable-sprint-v0.1`. Anything beyond this is the next-week roadmap from the strategic game plan.

---

## 5. Detailed per-task breakdown

Every task in the sprint, with assignee, skills, files, done criteria.

### M1 Plan (Codex's 23 tasks) — Hours 0.3 → 9.5

| # | Task | Executor | Skills fired | Files | Done when | ETA |
|---|---|---|---|---|---|---|
| 01 | Scaffold cleanup (Vite + tests + folders + npm deps) | Codex | writing-plans, test-driven-development | `package.json`, `vite.config.js`, `vitest.config.js`, `tests/setup.js` | `npm test` runs (even with 0 tests); `npm run dev` boots | 20 min |
| 02 | `core/constants.js` + first vitest | Codex | TDD | `src/engine/core/constants.js`, `tests/unit/constants.test.js` | Constants exported, types asserted | 10 min |
| 03 | Deterministic RNG | Codex | TDD | `src/engine/core/rng.js`, `tests/unit/rng.test.js` | Same seed → same sequence; 6 named streams | 15 min |
| 04 | Clock (fixed-step accumulator) | Codex | TDD | `src/engine/core/clock.js`, `tests/unit/clock.test.js` | Accumulator math correct; alpha [0,1) | 15 min |
| 05 | Input router (double-buffered) | Codex | TDD; fps-game pattern | `src/engine/core/input-router.js`, `tests/unit/input.test.js` | Same pattern as `fps-game/engine/input.js`; race-free | 20 min |
| 06 | Engine loop | Codex | TDD | `src/engine/core/engine-loop.js`, `tests/unit/engine-loop.test.js` | Fixed + variable update + render in correct order | 20 min |
| 07 | **Render backend selection (BLOCKER fix)** | Codex | TDD; systematic-debugging if it stalls | `src/engine/render/render-system.js`, `webgpu-backend.js`, `webgl2-backend.js`, `tests/unit/render-system.test.js` | `?forceWebGL2=1` works; both boot, both render the sun + ground | 45 min |
| 08 | Third-person camera rig | Codex | TDD | `src/engine/render/camera-rig.js`, `tests/unit/camera.test.js` | Spring follow, FOV boost, no jitter | 20 min |
| 09 | Pure-function hero flight math | Codex | TDD strict | `src/engine/hero/hero-flight.js`, `tests/unit/hero-flight.test.js` | Given input vector → pitch/yaw/velocity output asserted | 30 min |
| 10 | Hero system facade | Codex | TDD | `src/engine/hero/hero-system.js`, `tests/unit/hero-system.test.js` | Routes input → flight; exposes transform | 15 min |
| 11 | Perf HUD overlay | Codex | TDD-light (DOM-heavy) | `src/engine/dev-tools/perf-hud.js` | FPS, frame ms, draw calls, backend, GPU adapter info show | 25 min |
| 12 | Dev console | Codex | TDD-light | `src/engine/dev-tools/dev-console.js` | `~` toggles; commands `quality`, `seed`, `render backend`, `perf capture` work | 30 min |
| 13 | S1A Vite entry (20 box demo) | Codex | TDD-light | `src/entry/s1a.js`, `index.html` updated | http://127.0.0.1:5173 shows hero flying over 20 colored boxes | 20 min |
| 14 | S1A Playwright smoke (both backends) | Codex | playwright skill | `tests/smoke/s1a.spec.js`, `playwright.config.js` | `npx playwright test` passes on both `?forceWebGPU=1` and `?forceWebGL2=1` | 40 min |
| 15 | Tile grid (seeded) | Codex | TDD | `src/engine/world/tile-grid.js`, `tests/unit/tile-grid.test.js` | Same seed → same grid; 3×3 query works | 20 min |
| 16 | Building kit (HSL-varied boxes) | Codex | TDD-light | `src/engine/world/building-kit.js` | Returns geometry+material per slot | 20 min |
| 17 | District generator (3×3 city) | Codex | TDD | `src/engine/world/district-generator.js`, refactored | Deterministic; emits scene-ready batch | 30 min |
| 18 | Instancing system (BatchedMesh, ≤ 5 draws) | Codex | TDD | `src/engine/render/instancing-system.js` | `perf-hud` shows ≤ 5 draws for buildings | 30 min |
| 19 | Collision facade (static AABB) | Codex | TDD strict | `src/engine/world/collision-world.js`, `tests/unit/collision.test.js` | Ray queries return correct hits | 20 min |
| 20 | Hero capsule collision | Codex | TDD | `src/engine/hero/hero-collision.js`, `tests/unit/hero-collision.test.js` | Hero stops at building wall, lands on ground plane | 25 min |
| 21 | S1B Vite entry (`npm run dev:slice`) | Codex | TDD-light | `src/entry/s1b.js`, `package.json` script | http://127.0.0.1:5174/?slice=s1b shows hero flying over 3×3 city | 20 min |
| 22 | S1B Playwright FPS gates (≥ 55 FPS WebGPU, ≥ 30 FPS WebGL2) | Codex | playwright skill | `tests/smoke/s1b.spec.js` | Both gates green | 40 min |
| 23 | Final M1 verification + git tag | Me | verification-before-completion | n/a | M1 done definition met; tag pushed | 15 min |

**M1 total ETA: ~8 hours of agent work + maybe 1 hour of my orchestration overhead = ~9 hours**

### M1+ Sprint Bonus Tasks — Hours 9.5 → 17.5

These don't have formal "Task N" plans yet; I write them inline as I execute. Each is a small, focused step.

| # | Task | Executor | Files touched | Done when | ETA |
|---|---|---|---|---|---|
| 24 | Sun + CSM shadows | Me | `src/engine/render/lighting-system.js` (NEW) | Hero casts shadow on buildings + ground | 30 min |
| 25 | HDRI sky + IBL | Me (you download HDRI) | `src/engine/render/sky-system.js` (NEW), `public/assets/hdri/belfast_sunset_puresky.exr` | Sky has clouds + sun; PBR materials look correct | 30 min |
| 26 | DOM HUD overlay | Me | `src/engine/ui/hud.js` (NEW), `index.html` updated | Altitude/speed/energy bars visible | 45 min |
| 27 | Boost energy system | Me | `src/engine/hero/hero-energy.js` (NEW) | Boost drains energy; energy refills when not boosting | 20 min |
| 28 | Sphere-cast punch | Me | `src/engine/combat/punch.js` (NEW) | Click → ray from camera-forward → hit → flash | 45 min |
| 29 | Punch hit VFX (particle burst + flash) | Me | `src/engine/vfx/impact-fx.js` (NEW) | Visible feedback on hit | 30 min |
| 30 | Howler audio bus + 3 SFX | Me (you download SFX) | `src/engine/audio/audio-bus.js` (NEW), `public/assets/audio/*.ogg` | Boost / punch / ambient wind play | 45 min |
| 31 | Music track (Kevin MacLeod) | Me (you download track) | same dir | Background music loops | 20 min |
| 32 | Speed lines shader | Me | `src/engine/vfx/screen-fx.js` (NEW) | Lines streak at boost+camera-velocity | 25 min |
| 33 | Motion blur (low samples, camera-only) | Me | extend `screen-fx` | Visible smear at boost | 30 min |
| 34 | Superhero landing arc + dust ring + camera shake | Me | `src/engine/hero/hero-landing.js` (NEW) + `vfx/dust-ring.js` | Triggered when hero touches ground at speed | 45 min |
| 35 | Final tune pass (live-tuning sliders for gravity/maxSpeed/banking) | You + me | `src/engine/dev-tools/scene-inspector.js` (NEW) | You're satisfied with feel | 60 min |
| 36 | Final smoke run + git tag `playable-sprint-v0.1` | Me | n/a | All Playwright green; commit pushed | 15 min |

**M1+ total: ~7.5 hours**

**Grand total: ~16.5 hours of agent work** — fits in the 18-hour window with margin.

---

## 6. Skill inventory — when each one fires

Every skill in the toolbox gets a time-window where it's *actively guiding* the work.

| Skill | Type | When it fires | Why |
|---|---|---|---|
| `superpowers:using-superpowers` | Meta | Every turn, every task | The base rule: check for skills BEFORE responding. Always active. |
| `superpowers:subagent-driven-development` | Process | Hours 0.3 → 9.5 (M1 execution) | Drives the "fresh subagent per task" pattern with review between |
| `superpowers:test-driven-development` | Process | Every M1 task with a `tests/unit/*.test.js` file | NO CODE WITHOUT A FAILING TEST FIRST — strict |
| `superpowers:writing-plans` | Process | Already fired (this doc + M1 plan) | One-shot per planning cycle |
| `superpowers:requesting-code-review` | Process | After every M1 task | Dispatches `superpowers:code-reviewer` subagent with precisely-crafted context |
| `superpowers:receiving-code-review` | Process | When reviewer flags an issue | Verify-don't-comply discipline; push back if review is wrong |
| `superpowers:executing-plans` | Process | Fallback if subagent-driven mode is too slow | Inline batch execution; less context-switching |
| `superpowers:systematic-debugging` | Process | If Task07 (render backend) stalls; if tests fail unexpectedly | Hypothesize → test → eliminate; no guessing |
| `superpowers:verification-before-completion` | Process | Hour 9 (M1 gate) and Hour 18 (sprint gate) | Actually play the slice, don't just assert it works |
| `superpowers:finishing-a-development-branch` | Process | Hour 18 (final tag + commit) | Choose merge / PR / keep |
| `anthropic-skills:dev-quality` | Combined | Hours 0-18 | TDD, debug, harness all-in-one |
| `anthropic-skills:dev-workflow` | Combined | Hour 0 (worktree decision), Hour 18 (finish branch) | Worktree setup + finish branch |
| `anthropic-skills:agent-orchestration` | Meta | Multi-agent decisions throughout | Already loaded; routes between Codex / Gemini / inline |
| `anthropic-skills:superpowers-orchestrator` | Meta | Skill selection meta-decisions | Already loaded |
| `commit-commands:commit` | Tool | Every task's commit step | Lightweight wrapper for `git commit -m` |
| `anthropic-skills:framer-motion` | NOT FIRED | n/a | No React/animation framework in this sprint |
| `frontend-design`, `vercel:*`, `firebase:*`, `supabase:*` | NOT FIRED | n/a | No backend, no React, no deploy in sprint |
| `anthropic-skills:impeccable-style` | Maybe Hour 16 | If you want the HUD/menu polished | Anti-AI-slop critique pass — only if time |
| `anthropic-skills:algorithmic-art` | Maybe v1.1 | WFC procgen spike, deferred | Not in sprint |

---

## 7. Agent roster — what each compute resource does

| Agent | Role in sprint | When invoked | How invoked | Cost |
|---|---|---|---|---|
| **Claude Opus 4.7 (me)** | Orchestrator, single-file editor, decision arbiter, user-facing voice | Every turn | This conversation | (anthropic plan) |
| **Codex `gpt-5.5` @ priority+high** | Heavy executor — M1 tasks 01-22 via subagent-driven mode | Hours 0.3-9.0 (most of M1) | `codex exec -c model_service_tier=priority -c model_reasoning_effort=high "..."` (background) | Your OpenAI plan |
| **Opus subagents** (via `Agent` tool) | Code review between tasks; parallel research if needed | After each M1 task | `Agent({ subagent_type: "general-purpose", model: "opus", prompt: "..." })` | (anthropic plan) |
| **`superpowers:code-reviewer` subagent** | Specialized review (per `requesting-code-review` skill) | After each M1 task | Via Agent tool with that subagent type | (anthropic plan) |
| **Gemini 3 Flash Preview** | Fact-check if a library claim feels wrong; quick web research | On-demand, maybe Hours 9-12 | `gemini -m gemini-3-flash-preview -y -p "..."` (background) | (Google free tier or your plan) |
| **Ollama local (`qwen3:4b`)** | Not used in this sprint — v1.1 NPC barks only | n/a | Daemon at localhost:11434 | $0 |
| **MCP `preview_start`** | Manages the Vite dev server (start/stop/list) | Hour 0, kept running through Hour 18 | Tool call | n/a |
| **MCP `chrome-devtools`** (loaded) | Optional perf/DOM inspection during tuning | Hour 15-17 (tuning) | Tool call | n/a |
| **MCP Playwright** (loaded) | Programmatic browser smoke tests if Codex's Playwright config has issues | Hour 8, Hour 17 | Tool call | n/a |
| **Background `Bash run_in_background`** | npm install, codex exec, gemini calls, anything that takes > 30 sec | Throughout | Tool param | n/a |
| **You** | Gatekeeper, playtest judge, asset downloader, feel-tuner | Hours 0, 4, 9, 14-17 | Browser + keyboard + your time | (your time) |

### How I'll dispatch each task (concrete pattern)

```
# Pattern for M1 task execution (subagent-driven mode):

1. Read M1 plan section for Task N
2. Decide executor:
   - If task is multi-file (renderer, asset pipeline): Codex
   - If task is single-file refinement: Inline (me, Edit/Write tool)
   - If task needs parallel research first: dispatch Opus subagent

3. If Codex:
   - Write prompt to /tmp/codex-task-NN-prompt.md
   - Bash: `codex exec -c model_service_tier=priority -c model_reasoning_effort=high - < /tmp/codex-task-NN-prompt.md` (background)
   - Wait for notification

4. After executor returns:
   - Read what was written
   - Run tests locally to verify (Bash: `cd super && npm test -- --reporter=verbose`)
   - If green: dispatch reviewer subagent with diff
   - If red: invoke systematic-debugging skill, fix, re-run

5. After reviewer returns:
   - If critical issue: fix inline (Edit) or re-dispatch
   - If minor: note for later
   - If clean: proceed

6. Commit (commit-commands:commit skill or direct git)
7. Update TaskList
8. Quick user summary every 2-3 tasks
```

---

## 8. Stretch goals — "if we finish ahead"

If by Hour 14 we're tracking ahead, candidates in priority order:

1. **Block Man rigged hero** — replaces capsule with a proper humanoid silhouette. ~30 min if Sketchfab download is smooth.
2. **Single Mixamo flight idle anim** — hero arms-back, cape-trailing pose. ~30 min if the rig retargets cleanly.
3. **One destructible car** — Kenney Car Kit asset, you can punch it. ~30 min including download.
4. **Vertex-shader cape (no physics, just wind sway)** — looks like a real cape from a distance. ~45 min, risky.
5. **Itch.io upload** — public URL to share. ~15 min if you have an itch account.

Cape sim is the most likely "I'm gonna try" stretch — it makes the game look like a SUPERHERO game, not just a flying capsule.

---

## 9. Risk register + recovery playbook

Risks specific to a 18-hour sprint with multi-agent execution:

| # | Risk | Probability | Recovery plan |
|---|---|---|---|
| 1 | **Codex stalls on a task** (like the M1 plan job earlier) | Medium | Kill the job after 10 min stale; switch to inline (me) executing that task; lose 15 min |
| 2 | **WebGPU/WebGL2 fallback won't work the same way** | Medium | Spec says we already have webgpu-high and webgl2-low TIERS — they don't need to look identical, just both work. Drop WebGPU-specific features from webgl2-low. |
| 3 | **npm install peer-dep error** (already happened with @vitest/ui) | High | Pin vitest@2.1 and @vitest/ui@2.1; if needed, bump to vitest@3 + @vitest/ui@3 |
| 4 | **Flight feel is bad** (Hour 4 or Hour 16 playtest) | Medium-high | Live-tuning sliders in dev-tools mean we can iterate. Spend Hour 15-17 on tune passes. |
| 5 | **Frame rate drops in city** | Medium | Drop preset from `high` to `medium`; reduce shadow cascade resolution; cap building count |
| 6 | **Asset download fails / wrong format** | Low | Procedural fallback meshes mean game still runs; replace assets later |
| 7 | **You can't fall asleep / start late tomorrow** | Real | Sleep is more important than the sprint. The plan is robust to a 2-3 hour slip. |
| 8 | **Audio doesn't autoplay** | Low | All audio gated behind first user gesture (per spec §18). Splash with "Click to play". |
| 9 | **Pointer lock breaks on Safari** | Medium | Test on Chrome first. Safari fix is M5 polish anyway. |
| 10 | **You decide the scope was wrong mid-sprint** | Real | Stop-the-line is always allowed. Re-plan. |

---

## 10. Run book — commands you'll type during the sprint

These are the commands you might actually run. Most things happen via the harness (my tool calls), but you'll occasionally drive directly.

### Dev server lifecycle
```bash
# Server is already running. To check status:
#   (via Claude tool: mcp__Claude_Preview__preview_list)

# To restart manually if needed:
cd /Users/kdawg/Projects/super
npm run dev          # main, port 5173
npm run dev:slice    # vertical slice S1B, port 5174 (after Task 21)
```

### Testing
```bash
cd /Users/kdawg/Projects/super
npm test                           # vitest run, all unit tests
npm run test:ui                    # vitest UI on port 51204 (after @vitest/ui installs)
npx playwright test                # Playwright smoke (after Task 14)
npx playwright test --headed       # Watch it run in a real browser
npx playwright test --grep "fps"   # Run just FPS gate tests
```

### Backend forcing (test the WebGL2 fallback)
```
http://127.0.0.1:5173/?forceWebGL2=1
http://127.0.0.1:5173/?forceWebGPU=1
http://127.0.0.1:5174/?slice=s1b&seed=42  # after Task 21
```

### Dev console (after Task 12, in-browser)
```
~                              open/close console
quality low|medium|high|ultra  switch render preset
seed 42                        regenerate world deterministically
render backend webgpu|webgl2   force a backend at runtime
perf capture start|stop|save   record perf bundle
```

### Git milestones
```bash
git log --oneline                  # see commit history
git tag M1-vertical-slice          # at Hour 9
git tag playable-sprint-v0.1       # at Hour 18
```

### When you find a bug or want to override a decision
- Just tell me. I'll pause the executor, fix or revise, and resume.

### Asset downloads (links you'll click when prompted)
- **HDRI** (Hour 10): [Poly Haven `belfast_sunset_puresky`](https://polyhaven.com/a/belfast_sunset_puresky) — download 2k EXR
- **SFX** (Hour 13): [Sonniss GDC bundles](https://sonniss.com/gameaudiogdc/) — grab any year's bundle, you'll cherry-pick 3 files: whoosh, impact, wind
- **Music** (Hour 14): [Kevin MacLeod / incompetech.com](https://incompetech.com/music/royalty-free/music.html) — pick a chill electronic track, MP3 or OGG
- **(stretch) Block Man hero**: [Sketchfab CC0 Block Man](https://sketchfab.com/3d-models/cc0-block-man-auto-rigged-humanoid-55571b5d47614b4c9973e853fc6b6a72) — download GLB
- **(stretch) Mixamo anims**: log in with Adobe ID, pick Flying Idle, export FBX → I'll convert to GLB

---

## 11. Glossary — what every skill / agent / tool actually does

For anyone who wants the literal definition, especially if you skim:

### Skills

| Term | What it actually does |
|---|---|
| `superpowers:using-superpowers` | The meta-rule that says "always check for relevant skills before responding" — establishes how all other skills work |
| `superpowers:test-driven-development` | Enforces the discipline: never write code without a failing test first. Every task's first step is the test, second is verify-fail, third is minimal-code-to-pass, fourth is verify-pass, fifth is commit |
| `superpowers:subagent-driven-development` | The execution pattern: each task gets a fresh subagent (no context from prior tasks), implements the task, returns. Then a reviewer subagent reads the diff. Then we commit and move on |
| `superpowers:requesting-code-review` | The dispatch pattern: precisely-crafted prompt to a code-reviewer subagent, including base SHA, head SHA, what was implemented, what it should do. Reviewer doesn't see this conversation |
| `superpowers:writing-plans` | Already fired — produced the M1 plan and this sprint plan. Bite-sized tasks, exact paths, complete code, TDD steps |
| `superpowers:systematic-debugging` | When something breaks: reproduce minimally → form ONE hypothesis → test it → eliminate or confirm → repeat. No "let me try a few things" |
| `superpowers:verification-before-completion` | At gates: actually play the slice. Don't say "M1 complete" without flying through the city for 30 seconds first |
| `superpowers:executing-plans` | Alternative to subagent-driven mode: execute tasks inline (in this conversation), batched, with checkpoints |
| `superpowers:finishing-a-development-branch` | At the end: choose merge / PR / keep. Make sure tests pass. Run `npm test` for real |
| `anthropic-skills:dev-quality` | Combined TDD + debug + harness setup skill. The 3-in-1 for development quality |
| `anthropic-skills:dev-workflow` | Worktree setup at start; finish-branch at end; execute-plan in the middle. Workflow scaffolding |
| `anthropic-skills:agent-orchestration` | Meta: when to use Codex vs Gemini vs inline. Used when I need to decide which compute resource gets a task |

### Agents

| Term | What it actually is |
|---|---|
| **Claude Opus 4.7** | Me. The orchestrator. The voice you're reading. I do single-file edits, decision arbitration, multi-agent dispatch, task list management |
| **Codex** (CLI: `codex`) | OpenAI's gpt-5.5 model running locally via the codex CLI. With `priority` service tier = 1.5× speed. With `high` reasoning = deep thinking. Best for multi-file work, scaffolding, refactors |
| **Opus subagent** | A fresh instance of me, spawned via the `Agent` tool, with no shared context. Used for parallel work and unbiased review |
| **`superpowers:code-reviewer` subagent** | A specialized subagent type that reviews code diffs against a plan; gets a precisely-crafted prompt with the relevant SHA range and what to look for |
| **Gemini 3 Flash Preview** | Google's fast model via the `gemini` CLI. Best for fact-check, library/version verification, web grounding. Hosted by Google with their model |
| **Ollama** | A local LLM runtime on your machine. The `qwen3:4b` model runs offline at sub-200ms for NPC barks. NOT used in this sprint — saved for v1.1 |

### Tools / MCP servers (you have available)

| Tool | What it does in this sprint |
|---|---|
| `Bash` | Run any shell command. Most of the work. |
| `Read` / `Write` / `Edit` | File ops. |
| `Agent` | Spawn a subagent for parallel work. |
| `TaskCreate` / `TaskUpdate` / `TaskList` | Task tracking visible to you in the UI. |
| `mcp__Claude_Preview__preview_start` | Start a dev server from .claude/launch.json. **Already started super-dev.** |
| `mcp__Claude_Preview__preview_list` / `preview_stop` | Manage running servers |
| `mcp__plugin_chrome-devtools-mcp__*` | Browser perf inspection — optional Hour 15-17 tuning |
| `mcp__plugin_playwright_*` | Programmatic browser control — alternative to Codex's Playwright tests |
| `WebSearch` / `WebFetch` | Quick research if a library claim feels wrong |

### Repositories / external resources

| Resource | What we use it for |
|---|---|
| `/Users/kdawg/Projects/super` | The game itself |
| `/Users/kdawg/Projects/fps-game` | Architectural reference (input pattern, gamestate, modular engine) |
| [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) | The engine, r184+ |
| [npm: @three.ez/instanced-mesh](https://www.npmjs.com/package/@three.ez/instanced-mesh) | M2+; not in sprint |
| [npm: @dimforge/rapier3d-simd-compat](https://www.npmjs.com/package/@dimforge/rapier3d-simd-compat) | M3+; not in sprint |
| [npm: howler](https://www.npmjs.com/package/howler) | Audio bus, Hour 13 |
| [kenney.nl](https://kenney.nl/), [quaternius.com](https://quaternius.com/), [polyhaven.com](https://polyhaven.com/), [incompetech.com](https://incompetech.com/), [sonniss.com](https://sonniss.com/) | CC0 / CC-BY assets |

---

## 12. The green-light protocol

When you say "green-light" (or any clear approval), here's what happens *in the next message*:

1. I update the TaskList to mark this plan complete + add 23 M1 tasks
2. I invoke `superpowers:subagent-driven-development` (the execution mode)
3. I prepare the Task 01 prompt for Codex
4. I dispatch Codex (background) with the Task 01 prompt
5. I post a brief status to you: "Codex executing Task 01 — should be ~20 min. I'll update when it's done."
6. While Codex works, I prepare the Task 02 prompt (parallel orchestration)
7. When Codex returns Task 01: I dispatch the code-reviewer subagent + the Task 02 executor
8. Cycle repeats through Task 23
9. At Hour 9 (M1 gate): I pause, summarize, ask you to playtest
10. After your gate sign-off, I continue into M1+ bonus tasks (Hour 9.5-17.5)
11. At Hour 18: I tag the build and step back. You play.

**Status updates: every 2-3 tasks** so you're not flooded but not in the dark.

**Hard stops: I will pause and ask you** if:
- A task fails 3+ times in a row (per dev-quality DEBUG mode)
- The decision involves changing the architecture (not just implementation detail)
- We're tracking >2 hours behind the timeline
- You said something explicit that I can't reconcile with the plan

**What you can do during the sprint** (totally optional):
- Open the dev server in a tab and watch it evolve
- Glance at `git log --oneline` to see commits land
- Tell me to skip a feature, add a feature, change a feature
- Take a nap (this is the most realistic option)

---

## Appendix A — What's NOT in this sprint and where it lives

For everything I'm cutting, here's where it shows up later. **None of this is lost.** The strategic [`2026-05-19-super-game-plan.md`](2026-05-19-super-game-plan.md) tracks the full roadmap.

| Cut feature | Lives in | When |
|---|---|---|
| Rigged Mixamo hero with full anim tree | M2 | Days 3-4 |
| Bone-driven vertex-shader cape | M2 | Day 4 |
| Heat vision + decals + shimmer | M3 | Days 5-6 |
| Rapier physics + grab + throw + destructibles | M3 | Days 6-7 |
| Civilian + traffic + threat AI | M4 | Days 8-10 |
| Full audio sprite system + music director | M4 | Day 10 |
| Save system + corruption recovery | M5 | Day 11 |
| Full menus + accessibility | M5 | Day 11-12 |
| Pointer-lock UX hardening | M5 | Day 12 |
| Gamepad support | M5 | Day 12 |
| WFC procgen, GPU compute cape, volumetrics | v1.1 | Week 4+ |
| NPC barks via Ollama qwen3:4b | v1.1 | Week 4+ |

---

## Appendix B — File map (what gets created during the sprint)

By Hour 18, the project will look like:

```
super/
├── .git/
├── .gitignore
├── docs/superpowers/
│   ├── specs/2026-05-19-game-super-design.md          ✅ exists
│   └── plans/
│       ├── 2026-05-19-super-m1.md                     ✅ exists (Codex's M1 detail)
│       ├── 2026-05-19-super-game-plan.md              ✅ exists (strategic)
│       └── 2026-05-19-super-execution-playbook.md     ← this file
├── research/01-09-*.md                                ✅ exists
├── public/assets/
│   ├── audio/
│   │   ├── wind-ambient.ogg                           ← Hour 13 download
│   │   ├── boost-whoosh.ogg                           ← Hour 13 download
│   │   ├── punch-impact.ogg                           ← Hour 13 download
│   │   └── music-loop.ogg                             ← Hour 14 download
│   └── hdri/
│       └── belfast_sunset_puresky_2k.exr              ← Hour 10 download
├── index.html                                         ✅ exists, polished by Task 13
├── package.json                                       ✅ exists, polished by Task 01
├── vite.config.js                                     ✅ exists, polished by Task 01
├── vitest.config.js                                   ← Task 01
├── playwright.config.js                               ← Task 14
├── src/
│   ├── main.js                                        ✅ exists, polished by Task 13
│   ├── game.js                                        ✅ exists, polished by Task 13
│   ├── entry/
│   │   ├── s1a.js                                     ← Task 13
│   │   └── s1b.js                                     ← Task 21
│   └── engine/
│       ├── core/
│       │   ├── constants.js                           ✅ → Task 02
│       │   ├── rng.js                                 ← Task 03
│       │   ├── clock.js                               ✅ → Task 04 (tests)
│       │   ├── input-router.js                        ✅ → Task 05 (rewrite)
│       │   ├── engine-loop.js                         ✅ → Task 06 (tests)
│       │   ├── logger.js                              ✅ exists
│       │   ├── event-bus.js                           ✅ exists
│       │   ├── app-config.js                          ✅ exists
│       │   └── debug-flags.js                         ✅ exists
│       ├── render/
│       │   ├── render-system.js                       ✅ → Task 07 (BLOCKER fix)
│       │   ├── webgpu-backend.js                      ← Task 07
│       │   ├── webgl2-backend.js                      ← Task 07
│       │   ├── camera-rig.js                          ✅ → Task 08 (tests)
│       │   ├── scene-roots.js                         ✅ exists
│       │   ├── instancing-system.js                   ✅ → Task 18
│       │   ├── lighting-system.js                     ← Task 24 (M1+ bonus)
│       │   └── sky-system.js                          ← Task 25 (M1+ bonus)
│       ├── world/
│       │   ├── tile-grid.js                           ← Task 15
│       │   ├── building-kit.js                        ← Task 16
│       │   ├── district-generator.js                  ✅ → Task 17 (refactor)
│       │   └── collision-world.js                     ← Task 19
│       ├── hero/
│       │   ├── hero-system.js                         ✅ → Task 10
│       │   ├── hero-flight.js                         ✅ → Task 09 (pure math)
│       │   ├── hero-collision.js                      ← Task 20
│       │   ├── hero-energy.js                         ← Task 27 (M1+ bonus)
│       │   └── hero-landing.js                        ← Task 34 (M1+ bonus)
│       ├── combat/
│       │   └── punch.js                               ← Task 28 (M1+ bonus)
│       ├── vfx/
│       │   ├── impact-fx.js                           ← Task 29 (M1+ bonus)
│       │   ├── screen-fx.js                           ← Task 32-33 (M1+ bonus)
│       │   └── dust-ring.js                           ← Task 34 (M1+ bonus)
│       ├── audio/
│       │   └── audio-bus.js                           ← Task 30 (M1+ bonus)
│       ├── ui/
│       │   └── hud.js                                 ← Task 26 (M1+ bonus)
│       └── dev-tools/
│           ├── perf-hud.js                            ← Task 11
│           ├── dev-console.js                         ← Task 12
│           └── scene-inspector.js                     ← Task 35 (M1+ bonus, live-tuning sliders)
├── tests/
│   ├── unit/
│   │   ├── constants.test.js                         ← Task 02
│   │   ├── rng.test.js                                ← Task 03
│   │   ├── clock.test.js                              ← Task 04
│   │   ├── input.test.js                              ← Task 05
│   │   ├── engine-loop.test.js                       ← Task 06
│   │   ├── render-system.test.js                     ← Task 07
│   │   ├── camera.test.js                             ← Task 08
│   │   ├── hero-flight.test.js                       ← Task 09
│   │   ├── hero-system.test.js                       ← Task 10
│   │   ├── tile-grid.test.js                          ← Task 15
│   │   ├── collision.test.js                          ← Task 19
│   │   └── hero-collision.test.js                    ← Task 20
│   └── smoke/
│       ├── s1a.spec.js                                ← Task 14
│       └── s1b.spec.js                                ← Task 22
└── node_modules/                                      ✅ + Hour 13 howler stays
```

Files **NEW in sprint**: 25
Files **MODIFIED from scaffold**: 12 (Codex's pre-scaffold gets TDD-tested versions)
Files **assets you'll download**: 5 (1 HDRI + 3 SFX + 1 music)

---

## Final word

This is a real plan for a real game shipping by tomorrow morning. The math works: ~16.5 hours of agent work + your sleep + your playtest gates = "playable Super tomorrow morning."

I'm ready. Say **"green-light"** and I'll start Task 01 in my next message.

If you want anything changed — scope, pacing, agent assignments, deferred features, anything — say it now and I revise.

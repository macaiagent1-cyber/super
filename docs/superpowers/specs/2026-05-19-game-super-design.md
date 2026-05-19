# Super — Game Design & Architecture Spec **v0.2**

**Status:** Draft — awaiting user approval before any code is written
**Date:** 2026-05-19 (v0.2 revision same day)
**Author:** Synthesis of 5 Opus subagents + Codex (gpt-5.5 xhigh) + Gemini 2.5 Pro → critical review by Codex (gpt-5.5 fast/low) + Gemini 3 Flash Preview → web-research enrichment → consolidated revision
**Project root:** `/Users/kdawg/Projects/super/`
**Research:** [`research/01-fps-game-audit.md`](../../research/01-fps-game-audit.md) · [`02-aaa-web-3d-techniques.md`](../../research/02-aaa-web-3d-techniques.md) · [`03-reference-repo-triage.md`](../../research/03-reference-repo-triage.md) · [`04-engine-architecture.md`](../../research/04-engine-architecture.md) · [`05-asset-perf-audio.md`](../../research/05-asset-perf-audio.md) · [`06-codex-module-skeleton.md`](../../research/06-codex-module-skeleton.md) · [`07-gemini-deep-research.md`](../../research/07-gemini-deep-research.md) · [`08-enrichment-findings.md`](../../research/08-enrichment-findings.md)

## What changed from v0.1

The v0.1 review pass surfaced 4 blockers, 9 majors, 5 minors, 2 nits, and 5 product gaps. v0.2 applies every fix:

| Change | Where | Why |
|---|---|---|
| **WebGPU+WebGL2 reframed as TWO TIERS** (`webgpu-high`, `webgl2-low`) — not "same code two backends" | §3, §5 | Codex BLOCKER: compute/render-bundles/some node effects diverge; fake parity will break |
| **`three-wfc` DROPPED** as primary procgen — replaced with deterministic grid kit-bash; WFC = optional v1.1 spike | §3, §10 | Codex BLOCKER + my enrichment: it's v0.1.0, 2D-only, WIP. Gemini's earlier rec was wrong |
| **Vertical slice SPLIT** into `S1A` (2-3 h) and `S1B` (1-2 d) | §10 | Codex BLOCKER: a single 2-3h "real city + WebGPU + flight" target is fantasy |
| **Perf budget tier-ified** — `low`/`med`/`high`/`ultra` presets, not one flat budget | §8 | Codex BLOCKER: §5 effects sum to 12-14 ms before scene draw — exceeds 12 ms target |
| **Architecture PHASED** — slice 1 builds 5 modules, layers grow per milestone | §4 | Codex MAJOR: 55 modules upfront is framework-building, not game-building |
| **v1 render stack REDUCED** — AgX + IBL + CSM + bloom + fog only; SSR/GTAO/TAA/motion-blur deferred to v1.1 | §5 | Codex MAJOR: SSR+TAA+cape+fast flight = ghosting/reflection debug trap |
| **Apple Silicon rules reframed as HYPOTHESES** to benchmark | §6 | Codex MAJOR: cargo-cult risk without benchmark gates |
| **Apple Silicon SIMD width FIXED**: 32, not 64 | §6 | Gemini MAJOR: M-series subgroup is 32; 64 is still good (2× subgroup) but reasoning was wrong |
| **Asset pipeline gets CONCRETE SCRIPTS** | §7 | Codex MAJOR: "Vite plugin" was hand-wavy |
| **Streaming DEFERRED to v1.1** — v1 = one resident world | §9 | Codex MAJOR: 3×3 city doesn't need streaming/LRU/floating-origin |
| **Open questions REWRITTEN** to ones that actually block architecture | §11 | Codex MAJOR: hero model/music license don't unblock anything; renderer/physics/combat scope do |
| **Test strategy REPLACED** — Playwright smoke checks, not golden-image diffs | §13 | Codex MAJOR: cross-backend pixel diffs are noisy |
| **NEW §17-21 cover the 5 product gaps**: pointer-lock UX, audio autoplay, error telemetry, save-corruption recovery, gamepad policy | §17-21 | Codex GAPS — all real product behavior the v0.1 spec assumed away |
| **Three.js pinned to r184+** (was r183+) | §3 | My enrichment: r184 fixed WebGPU render bundle reuse — needed for our optimization |
| **Rapier candidate now `@dimforge/rapier3d-simd-compat`** | §3, §12 | My enrichment: SIMD variant is 2-5× faster in 2026; `-compat` adds bundler safety |
| **§14 lo-th/3d.city** marked as architectural inspiration only — legacy code, do not port | §14 | Gemini MINOR: it's r70-r80 era, won't map to modern stack |
| **§12 "pre-bake GTAO into albedo" CORRECTED** to "vertex AO or baked AO texture" | §12 | Codex NIT: AO isn't albedo |
| **§1 "AAA-ish web look" DEFINED** as 3 concrete visual targets | §1 | Codex NIT: undefined invites scope creep |

---

## 1. Vision

"Super" is a 3D open-world flying superhero browser game. You play a Superman-archetype hero in a procedurally arranged city district with **flight, super-strength punches, heat vision, grab-and-throw, dodge, super-jump**, and a flowing cape. Personal project — not commercial — built to feel impressive and be genuinely fun on a MacBook Air M5.

**"AAA-ish web look" = three concrete visual targets** (defined per Codex critique):
1. **Dense, readable skyline silhouette** — when flying at altitude, the city profile reads as a coherent place, not stacked cubes. Achieved via instanced buildings with kit-bashed variation + warm sky atmospheric scattering.
2. **Hero silhouette legible at flight speed** — cape, pose, and key light read cleanly against any background. Achieved via rim light, contact shadow, cape physics, and FOV pump on boost.
3. **Cinematic flight speed cues** — the camera *feels* the speed without measuring it. Achieved via motion-blur smear, FOV pump, particle contrail, and (v1.1) speed-tied radial blur.

**"Feel" north stars** (cribbed from ManOfSteel GIFs for tuning targets, not code):
- Flight banks into turns, doesn't snap-rotate.
- Boost has a *kick* — small FOV pump, speed lines, particle contrail.
- Landings are *cinematic* — superhero-land arc, dust ring, camera shake + pull-out.
- Heat vision burns visible decals into surfaces and emits screen-shimmer.

**Not in scope (v1):** multiplayer, persistent world beyond settings/progress, save-anywhere, Earth-sized world, story missions with cutscenes, mobile/touch.

## 2. Constraints

| Constraint | Value |
|---|---|
| Target hardware | **The user's MacBook Air M5.** Engineering decisions validated against measured benchmarks on this machine, not chip-spec lore. |
| Target resolution | 1440 × 900 (windowed) |
| Target framerate | **60 FPS sustained, 12 ms target frame, 16.6 ms hard ceiling** — measured by `dev-tools/perf-hud` |
| Render backend | Three.js **r184+** `WebGPURenderer` (primary) + `WebGLRenderer` WebGL2 — but treated as **two distinct capability tiers**, not one universal pipeline. See §3 / §5. |
| Browser baseline | Safari 26+, Chrome current, Firefox current (WebGPU is Baseline as of January 2026) |
| Scope budget | v1 = one resident district (3×3 to 5×5 grid). Multi-district streaming deferred to v1.1. |
| Audio | howler.js (inherited from `fps-game`); browser autoplay rules respected — see §18 |
| Code style | Vanilla JS ES modules, no framework (matches user's prior `fps-game`) |
| Build tool | Vite (justified in §3 row) |

## 3. Tech stack — settled with caveats

| Concern | Choice | Why |
|---|---|---|
| 3D engine | Three.js **r184+** | Stable WebGPU `RenderPipeline` with WebGL2 backend. r184 fixed WebGPU render-bundle reuse, which our planned optimization needs. |
| Render backend split | **Two tiers, not one pipeline.** `webgpu-high` = compute particles, GPU cape, full post chain. `webgl2-low` = no compute particles, bone-driven cape only, reduced post (no SSR, no GTAO). Tested with `forceWebGL2` from week one. | Codex BLOCKER: assumed "same code two backends" parity is false. TSL covers many cases; compute + render-bundle + some node effects diverge. Build the tiers explicitly. |
| Bundler | Vite | GLB/KTX2/WASM loaders, HMR for live flight-constant tuning, tree-shakes Three.js from ~1.5 MB → ~400 KB |
| Audio | howler.js | User already ships this in `fps-game`; positional + sprite support enough |
| Procgen city | **Deterministic grid kit-bash for v1.** Lots → roads → buildings via seeded RNG + Kenney/Quaternius kit assembly. WFC = optional v1.1 spike (using marian42's Unity algorithm as reference port — `three-wfc` is 2D-only and 0.1.0). | Codex BLOCKER + enrichment: ship something honest first |
| Physics | **Collision facade now.** Candidate package: `@dimforge/rapier3d-simd-compat` (SIMD-accelerated, WASM embedded for bundler ease, 2-5× faster than 2024 versions). Commit after `S1B` proves collision needs (capsule sweeps + thrown cars + static city volume). | Codex's deferred-decision logic |
| Cape sim (v1) | **Bone-driven `SkinnedMesh` + vertex-shader wind/sway.** GPU compute Verlet via TSL = v1.1 stretch (Bandinopla's Feb 2026 article makes the blend pattern more concrete). | Gemini practicality wins for v1; enrichment opens v1.1 path |
| Postprocess | Three.js `RenderPipeline` node graph; **the v1 chain is a *subset* of what's possible — see §5** | Codex MAJOR: over-commit risk |
| Testing | `node:test` (carried from `fps-game`) for pure logic + Vitest + **Playwright smoke checks**, not golden-image diffs. Browser failure modes covered. See §13. | Codex MAJOR: cross-backend pixel diffs are noisy |

## 4. Engine architecture — **phased**, not all-at-once

**The 10-layer / ~55-module structure is the *eventual* shape — not what slice 1 builds.** Per Codex MAJOR: a personal project from a 2D-raycaster background shouldn't ship architecture before gameplay. Layers are added when their first feature lands.

### Phase 1 (slice 1, S1A + S1B) — only these layers exist
```
super/src/engine/
  core/         engine-loop, clock, constants, input-router, logger, rng
  render/       render-system, render-pipeline, webgpu-backend, webgl2-backend,
                scene-roots, camera-rig, post-fx-stack-minimal, material-library,
                instancing-system
  world/        district-generator, tile-grid, building-kit, collision-world (facade)
  hero/         hero-system, hero-flight, hero-camera-target
  dev-tools/    perf-hud, dev-console
```

### Phase 2 (M2) — add hero polish
```
  hero/         + hero-animation, cape-sim, hero-energy
  render/       + lighting-system (CSM + IBL), sky-system
  core/         + asset-registry, event-bus
```

### Phase 3 (M3) — add combat
```
  combat/       combat-system, punch-system, heat-vision-system, grab-throw-system,
                damage-model, hit-query, impulse-resolver, destructible-system,
                dodge-system
  vfx/          vfx-system, particle-system, beam-system, decal-system, impact-fx
```

### Phase 4 (M4) — add AI + audio
```
  ai/           ai-system, ai-director, civilian-ai, traffic-ai, threat-ai,
                perception-system, steering, nav-graph, behavior-budget
  audio/        audio-system, audio-bus, spatial-audio, music-director, ambience-system
  world/        + traffic-spawner, population-spawner, environment-system, weather-system
  vfx/          + trail-system, weather-fx, screen-fx
```

### Phase 5 (M5) — UI/save polish
```
  ui/           ui-system, hud, reticle, minimap, menu-router, pause-menu, debug-overlay
  save/         save-system, save-schema, settings-store, progress-store
  core/         + app-config, debug-flags, scheduler
  hero/         + hero-state-machine, hero-ground-move, hero-ability-input
  combat/       + projectile-system
  world/        + district-streamer, road-network, prop-placement, nav-graph (if needed at scale)
  dev-tools/    + free-camera, scene-inspector, spawn-tools, capture-tools
```

Full 55-module breakdown lives in [`04-engine-architecture.md`](../../research/04-engine-architecture.md) and [`06-codex-module-skeleton.md`](../../research/06-codex-module-skeleton.md) — those remain the target, just not the slice-1 plan.

**Data flow (unchanged):** `input → engine-loop → (hero, ai, physics, world) → event-bus → (combat, vfx, audio) → scene-graph → render-pipeline → GPU`

**Architectural rules (kept from v0.1, validated by both reviewers as strengths):**
- **No ECS yet.** Explicit systems + lightweight records. Revisit only if cross-system query pain emerges.
- **Event bus is for facts, not data.** Good: `district.loaded`, `combat.impact`. Bad: per-frame hero position.
- **All runtime assets flow through `asset-registry`** (lands in Phase 2). Systems request `assetId`s, not paths.
- **Seeded RNG streams** by domain: `city`, `population`, `traffic`, `weather`, `ambient`, `capture`.
- **Single source of `dt`** in `core/clock.js`; physics/cape/AI = clamped fixed-step, rendering = variable interp.
- **Structured logger from day one.** Channels (`render`, `world`, `hero`, `ai`, `asset`, `audio`) + levels.
- **Dev console with real commands in S1A** — `quality low|med|high|ultra`, `seed <n>`, `teleport district x z`, `weather rain`, `spawn car`, `perf capture start`, `render backend webgpu|webgl2`.

## 5. Render pipeline — **v1 launch stack (reduced)**

Reference: [`02-aaa-web-3d-techniques.md`](../../research/02-aaa-web-3d-techniques.md). Frame budget: ~8 ms scene draw + ≤4 ms postprocessing + ~2 ms CPU/JS = 14 ms. **Hard cap on post+shadows: 4 ms until measured.** This is the *real* arithmetic Codex demanded.

### Ship in v1 (post + shadows ≤ 4 ms total, both tiers)

Tier | Effects | Cost budget
---|---|---
**webgpu-high** | AgX tonemap (negligible) + HDRI/IBL via PMREM (<0.5 ms one-time) + 3-cascade CSM @ 1024² (~2 ms) + Bloom TSL node (<0.5 ms) + atmospheric fog | ~3 ms
**webgl2-low** | AgX tonemap + HDRI/IBL + 2-cascade CSM @ 1024² + bloom (smaller mip chain) + atmospheric fog | ~3 ms

Both tiers ship: BatchedMesh for varied buildings, `@three.ez/instanced-mesh` (`InstancedMesh2`) for cars+civilians (with per-instance BVH+LOD+frustum cull), KTX2/Basis Universal textures, `Sky` addon + imposter cloud billboards, 3 LOD tiers per building, impostor billboards beyond 400 m.

### Deferred to v1.1 (added behind `ultra` preset only after v1 ships and benchmarks have headroom)
- **GTAO** (`GTAONode` — 1-2 ms) — only after lighting feels flat
- **Half-res SSR** on wet asphalt + glass towers (2-4 ms) — keystone "wow" effect, but heavy
- **TAA + 3D LUT** (~1-2 ms) — only if MSAA aliasing on cape/HUD is intolerable
- **Motion blur** at low samples (1-2 ms) — sells flight speed but ghosting trap with TAA
- **GPU compute Verlet cape** via TSL (<0.5 ms) — replaces bone-driven only on webgpu-high tier
- **Raymarched volumetric clouds, atmospheric scattering, Bokeh DoF** — far stretch

### Why this is smaller than v0.1 said
Codex MAJOR: "SSR + TAA + cape + fast flight = ghosting/reflection debug trap." Real. Ship art direction first; ship visual effects after gameplay stabilizes. The deferred list is *available*, not *missing*.

## 6. Apple Silicon (M5) optimization — **hypotheses to benchmark**, not laws

These come from research, not measurement. They go in `render/webgpu-backend.js` as **default settings** plus a microbenchmark step (`assets:bench-gpu`) that validates each on the actual machine.

| Hypothesis | Detail | Validate via |
|---|---|---|
| `shader-f16` (`shader-f16` extension) doubles math throughput on colors/normals | Apple Silicon has 16-bit float hardware. Confirmed by Gemini. | Particle compute pass timed with f16 vs f32 |
| Avoid bind group churn | Never recreate `GPUBindGroup` per frame. Use dynamic uniform offsets. | `perf-hud` shows bind-group-create count per frame; alert if > 5 |
| `storeOp:'discard'` keeps MSAA on-chip (TBDR) | Combined with `resolveTarget` makes MSAA nearly free | Frame time delta with MSAA on/off, on/off discard |
| **Compute workgroup size: try 64 (2× subgroup width of 32)** | **CORRECTION from v0.1**: M-series SIMD subgroup width is **32**, not 64. Workgroup 64 is still recommended as the sweet spot (2× subgroup, better occupancy + memory latency hiding). | Particle compute timed at 32/64/128 |
| `GPURenderBundle` for static geometry | Records draw commands once, replays via Metal Indirect Command Buffers. **Requires r184+** (r183 had a render bundle reuse bug). | CPU JS time per frame with/without bundles |
| Combine render passes aggressively | Every new pass forces tile memory flush to RAM | Render-pass count per frame in perf HUD |

**Rule**: any of these rules that *fails its benchmark* on this machine gets reverted. No cargo cult.

## 7. Asset & audio plan

Reference: [`05-asset-perf-audio.md`](../../research/05-asset-perf-audio.md).

| Category | Source (CC0 unless noted) | Specific pick |
|---|---|---|
| Hero (rigged + cape) | [Meshy.ai](https://www.meshy.ai/) **($20/mo)** or [CC0 Block Man](https://sketchfab.com/3d-models/cc0-block-man-auto-rigged-humanoid-55571b5d47614b4c9973e853fc6b6a72) | User decision §11.Q1 |
| Hero anims | [Mixamo](https://www.mixamo.com/) (Adobe, free commercial, no redistribution of raw files) | `Flying Idle`, `Flying Forward`, `Punching`, `Throw`, `Hard Landing`, `Dodge L/R`, `Standing Idle 02` (heat-vision pose) |
| City | [Kenney City Kit](https://kenney.nl/assets/category:3D?query=city) + [Quaternius Buildings](https://quaternius.com/packs/ultimatetexturedbuildings.html) + [Kay Lousberg KayKit](https://kaylousberg.itch.io/kaykit-city-builder-bits) | ~250+ pieces, 4 m grid |
| Vehicles | [Kenney Car Kit](https://kenney.nl/assets/car-kit) + [Quaternius Cars](https://quaternius.com/packs/cars.html) (LOD2) | ~30 |
| Civilians | [Quaternius Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html) + [100 Avatars R2](https://sketchfab.com/3d-models/100-avatars-r2-cc0-character-pack-80cb24ac52cb4e839930aaa12314f716) | Instanced; rigged ≤ 40 m, billboard beyond |
| Props | [Kenney Urban Kit](https://kenney.nl/assets/urban-kit) + [Poly Pizza CC0](https://poly.pizza/search/CC0) | Lampposts, hydrants, signs, dumpsters |
| HDRI | [Poly Haven](https://polyhaven.com/hdris) | 2 HDRIs: daylight (`belfast_sunset_puresky`) + dusk (`cloud_layers`), 2k |
| SFX | [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) bundles 2020-2024 | Royalty-free perpetual; **2026 license bans AI training** (confirmed by Gemini) — fine for us |
| Music | [incompetech.com](https://incompetech.com/) (Kevin MacLeod CC-BY) | 4 tracks; credit roll required |

### Asset pipeline — **concrete scripts** (Codex MAJOR fix)

The v0.1 "Vite plugin" hand-wave is replaced with named npm scripts in `package.json`:

```
"scripts": {
  "assets:import":   "node tools/asset-import.js",     // FBX→GLB, Mixamo rig fix, cape socket
  "assets:optimize": "node tools/asset-optimize.js",   // gltf-transform: meshopt + prune + dedup
  "assets:ktx2":     "node tools/asset-ktx2.js",       // toktx UASTC normals + ETC1S color
  "assets:manifest": "node tools/asset-manifest.js",   // JSON asset registry w/ stable IDs + licenses
  "assets:validate": "node tools/asset-validate.js",   // bone count, anim names, texture format, decoder presence
  "assets:bench":    "node tools/asset-bench.js"       // load + decode timing per asset class
}
```

Format pipeline:
- Geometry: **GLB + Meshopt** (Gemini confirmed Meshopt > Draco for skinned/animated)
- Textures: **KTX2/Basis Universal**, UASTC for normals/data, ETC1S for color
- Audio: **Opus in WebM** + audio sprites
- Build-time plugin: **[NYT `rd-bundler-3d-plugins`](https://github.com/nytimes/rd-bundler-3d-plugins)** (Apache 2.0) for the Vite-time gltf-transform chain (Draco/Meshopt/prune/dedup); KTX2 stays a separate `toktx` step

**Gate**: one rigged hero GLB passes through the full pipeline before M2 starts. If anything breaks here, M2 is blocked.

## 8. Performance budget — **tiered presets**

Replaces v0.1's single flat budget with four presets the user can toggle. The 12 ms target is **per preset**, not a single global aspirational number.

### Preset budgets (per frame, post + shadows only)

| Preset | Post + shadows budget | Effects |
|---|---|---|
| `low` | 1.5 ms | AgX + small bloom + 1-cascade shadow @ 512² |
| `medium` | 2.5 ms | AgX + bloom + 2-cascade CSM @ 1024² + IBL |
| `high` (default) | 4 ms | + 3-cascade CSM + fog + larger bloom mip chain |
| `ultra` | 8 ms | + GTAO + half-res SSR + TAA + motion blur + GPU compute cape |

### Scene-shape budgets (apply at any preset)

| Resource | Budget | Notes |
|---|---|---|
| Visible triangles | 1.8 M | But: less important than the next four (Codex MINOR) |
| **Draw calls** | 180 (hard 220) | BatchedMesh+InstancedMesh2 collapse thousands to ~30 |
| **Shadow-casting meshes** | 20 nearest | Distant city receives only, baked sky shadow |
| **Material variants** | 12 unique | Cap shader compile churn |
| **Skinned meshes active** | 6 (hero + 5 nearest civilians) | Beyond = animated impostor billboards |
| **Animated instances** | 60 | Cars + civilians using shared anim tex |
| Texture VRAM | 600 MB | KTX2, mipmapped, atlased |
| Active particles | 2,000 | GPU TSL on webgpu-high; CPU pool on webgl2-low |
| Cape | 24 bones, 2 substeps | Freeze beyond 60 m |
| Physics bodies | 120 active rigid | Hero + ~30 cars + ~20 destructibles + ~70 debris |
| Audio voices | 24 concurrent | Voice-stealing by priority + distance |
| **JS allocations / frame** | < 1 KB steady-state | Object pools; perf HUD alerts on GC spikes |
| **GPU memory (post-transcode)** | < 1.2 GB | KTX2 sizes after Basis transcode |

## 9. Streaming & LOD — **deferred to v1.1**

v1 ships with **one resident 3×3 world** (~12 MB GLB chunk) + fake far skyline. No multi-district streaming, no LRU, no floating-origin until v1.1 — Codex MAJOR: 3×3 doesn't need it. The streaming design from v0.1 is preserved in [`05-asset-perf-audio.md`](../../research/05-asset-perf-audio.md) as a v1.1 reference.

**LOD policy (still applies in v1):**
- Hero: 1 LOD always (close). Cape simulated LOD0; static-mesh LOD1 swap at 50 m.
- Buildings: LOD0 full / LOD1 4k tri at 80 m / LOD2 1.5k tri at 150 m / impostor at 400 m / merged BatchedMesh skyline beyond 600 m.
- Civilians: LOD0 rigged at ≤ 40 m / LOD1 simplified rigged ≤ 80 m / animated impostor billboard beyond / hard-cull at 150 m.
- Vehicles: LOD0 to 120 m / LOD1 beyond / hard-cull at 400 m.

**Boot preload (v1 = single world, target 4-6 s on 50 Mbps):**
1. UI fonts + atlas (200 KB)
2. Hero GLB + idle/flight anims (2.5 MB)
3. Sky HDRI 2k + IBL prefilter (1.5 MB)
4. Audio sprite #1: UI + flight loop + 1 music track (~2 MB Opus)
5. World GLB (~12 MB)
6. **Splash dismissible — gameplay begins**
7. Async: combat anims, audio sprite #2, particle atlases

## 10. Vertical slice — **split into S1A + S1B** (Codex BLOCKER fix)

A single 2-3 hour target proving "real city + WebGPU + flight" is fantasy. Real split:

### **S1A — Minimum viable flight (2-3 hours)**
*Goal: capsule hero flying over 20 placeholder boxes on a ground plane, 60 FPS, BOTH backends.*

| # | Module | Behavior |
|---|---|---|
| 1 | `core/engine-loop.js` | Fixed-step accumulator, `requestAnimationFrame`, `dt` clamp, resize, frame counter |
| 2 | `core/input-router.js` | Port fps-game's double-buffered keyboard pattern; add mouse for look |
| 3 | `render/render-system.js` + `webgpu-backend.js` + `webgl2-backend.js` | Three.js renderer; WebGPU primary; **`forceWebGL2` flag works from day one**; blue sky color, sun light, ground plane, AgX tone |
| 4 | `render/camera-rig.js` + `hero/hero-flight.js` | WASD + mouse pitch/yaw, throttle on Shift, hover damping, third-person camera with spring follow |
| 5 | `dev-tools/perf-hud.js` | FPS, frame time, draw calls, triangles, backend label |

**Done definition for S1A:** can fly above 20 boxes at 60 FPS, can toggle WebGPU/WebGL2 backend with no rendering difference visible to user.

### **S1B — The actual city (1-2 days)**
*Goal: 3×3 deterministic kit-bashed city, all batched, ≤ 5 draw calls for buildings, forced-WebGL2 smoke test green.*

| # | Module | Behavior |
|---|---|---|
| 1 | `world/district-generator.js` + `world/tile-grid.js` + `world/building-kit.js` | Seeded RNG lots → roads → buildings, kit-bashed from placeholder Kenney pieces (or untextured boxes if asset pipeline isn't ready) |
| 2 | `render/instancing-system.js` | BatchedMesh per building cluster, InstancedMesh2 for repeated props |
| 3 | `world/collision-world.js` (facade) | Static AABB/heightfield for ground+buildings only; Rapier commit deferred |
| 4 | `dev-tools/dev-console.js` | Real commands: `seed`, `quality`, `render backend`, `perf capture` |

**Done definition for S1B:** 3×3 city at 60 FPS @ high preset on webgpu-high, ≥ 30 FPS on webgl2-low. Slice playable and tunable. **User decides at this gate** whether to keep going.

### Milestone roadmap after S1B
- **M2:** GLB hero + Mixamo anims + cape (bone-driven) + lighting (CSM + IBL) + asset pipeline production-ready
- **M3:** Combat (punch + heat-vision + grab-throw + dodge) + destructibles + impact VFX
- **M4:** AI (civilians + traffic + threats) + audio (sprites + music + spatial)
- **M5:** UI polish (HUD + minimap + menus) + save (settings + progress) + dev console hardening

## 11. Open questions — **the ones that actually block architecture** (Codex MAJOR rewrite)

The v0.1 list (hero model, music license, ambient events) was wrong — those don't unblock implementation. These do:

1. **Renderer commitment**: WebGPU primary + WebGL2 fallback from day one (recommended), OR WebGPU-only at first and add WebGL2 later? My pick: **fallback from day one** — it's a 30-min cost in S1A, free-of-charge insurance against WebGPU performance regressions per the [Three.js forum perf issue](https://discourse.threejs.org/t/webgpu-performance-issue/87939).
2. **Physics scope at v1**: Pure collision facade only (no thrown cars, no destructibles) for S1B, OR Rapier from day one to enable thrown-object combat in M3? My pick: **facade only in S1B; Rapier lands in M3 when combat needs it**.
3. **Combat scope for v1 "done"**: Punch only, OR punch + heat-vision + grab-throw + dodge? My pick: **full combat (punch + heat-vision + grab + dodge)**, but ship in that order so each is tunable independently.
4. **City generation strategy**: Deterministic grid kit-bash with seeded variation (recommended), OR commit to WFC spike using marian42's algorithm? My pick: **deterministic kit-bash for v1; WFC = v1.1 spike if grid feels stale**.
5. **Default visual preset for the 60 FPS target**: `medium`, `high`, or `ultra`? My pick: **high** — meets the "AAA-ish" bar without burning thermal headroom on a fanless M5 Air. User can toggle to `ultra` for screenshot moments.

**Lower-priority questions** (don't block S1A — answer by M2):
- Hero asset: Meshy.ai paid vs CC0 Block Man (my pick: Block Man for slice 1, upgrade if/when art bothers you)
- Music license: MacLeod CC-BY vs CC0-only (my pick: CC-BY, credit roll is trivial)
- Game shape at v1: pure sandbox vs sandbox + ambient civilian-rescues vs sandbox + scripted missions (my pick: sandbox + ambient — emergent without writing mission triggers)

## 12. Top 5 risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Flight feel** is the product — easy to get wrong with correct-but-unfun math | Ship `dev-tools/scene-inspector` live-tuning sliders for every flight constant from S1A; iterate against your own feel |
| 2 | **WebGPU/WebGL2 divergence** in compute/render-bundle/some node effects | Two-tier capability split from day one; `forceWebGL2` test in S1A; CI Playwright run on both tiers |
| 3 | **Postprocess drops to 30 FPS during combat** | `perf-monitor` profiles every commit; SSR/motion blur live in `ultra` only and behind benchmark gate; `vertex AO or baked AO texture` on static assets as the GTAO fallback (corrected from v0.1's wrong "bake into albedo" phrasing) |
| 4 | **Asset pipeline (Meshy/Mixamo/KTX2/Meshopt/Vite/Rapier WASM)** breaks rigs or bloats downloads | The concrete script-set in §7 + the "one hero GLB through full pipeline before M2" gate; procedural-fallback meshes per `fps-game` pattern so missing assets never block dev |
| 5 | **Naive culling draws 5000 occluded windows** | Hierarchical AABB cull per tile + `InstancedMesh2` BVH; collapse each tile into one BatchedMesh once geometry stabilizes |

## 13. Test strategy

**Unit-testable (Vitest, pure functions, no Three.js):**
- `hero/hero-flight.js` — given input vector + state, assert pitch/yaw/velocity output
- `combat/damage-model.js`, `combat/punch-system.js` (sphere-cast math), `combat/impulse-resolver.js`
- `ai/steering.js`, `ai/nav-graph.js` (A* on synthetic grids)
- `save/save-schema.js` — read/write, version migration, **corruption recovery** (see §20)
- `core/rng.js` — deterministic seeded streams

**Playwright smoke checks (browser, both backends, replaces brittle golden-image diffs per Codex):**
- **Boot smoke**: page loads, canvas is non-blank within 8 s, no console errors
- **FPS sample**: ≥ 55 FPS sustained over 10 s on a deterministic seed/camera path on the dev machine
- **Backend forced WebGL2**: `?forceWebGL2=1` URL flag boots cleanly, FPS sample ≥ 30
- **Backend forced WebGPU**: same with `?forceWebGPU=1`, FPS sample ≥ 55
- **Pointer lock flow**: click-to-lock → ESC unlocks → re-click re-locks; pause menu on unlock
- **Asset load failure**: simulated 404 on a building GLB triggers procedural fallback, game still playable
- **Audio autoplay**: SFX/music start ONLY after first user gesture; no autoplay errors in console
- **Save corruption**: pre-seeded broken localStorage value triggers reset-to-defaults, dismissable UI

CI runs Vitest on every push. `npm run dev:slice` boots S1A or S1B for human-eye verification.

## 14. Reference patterns lifted from prior work

From [`fps-game`](../../../fps-game/) — three patterns carry directly:
1. **"Register fallback first, then async-overwrite" asset pattern** (`renderer.js` constructor)
2. **`transition()` + `_needsReload` flag** (`gamestate.js`)
3. **Double-buffered input** (`input.js`)

From open-source reference repos ([details in 03-reference-repo-triage.md](../../research/03-reference-repo-triage.md)):
- **CDLOD streaming chunk** from `obecerra3/OpenWorldJS` — adapt for city tiles in v1.1
- **Procgen pipeline order** (terrain → roads → lots → buildings → camera) from `jstrait/city-tour`
- **Web-Worker simulation thread** from `lo-th/3d.city` — **architectural inspiration only**: that repo is r70-r80 legacy (per Gemini); don't port code. Adoption threshold: only move AI/traffic to worker after main-thread frame time exceeds **8 ms** in a perf capture.
- **Multi-tier build variants** from `lo-th/3d.city` — same caveat
- **Isolated dev harnesses per procgen module** from `lo-th/3d.city` — same caveat
- **FSM animator** from `OpenWorldJS/Animator.js` — map to hover/fly/dive/superhero-land
- **Speed-tied radial post-blur + follow-emitter** from `Three.js-City/T3/js/Application.js`
- **Floating-origin / world-rebasing** from Babylon.js 9.0 LargeWorldRendering (Gemini confirmed real) — engine-agnostic, kicks in only at v1.1 multi-district scale

From [enrichment](../../research/08-enrichment-findings.md):
- **Marian42's WFC algorithm** ([Unity, MIT, blog](https://marian42.de/article/wfc/)) — reference *only*, if we ever do the WFC spike
- **Three.js `physics_rapier_character_controller` example** — starting pattern for hero capsule, modified for flight
- **Bandinopla's compute-shader+skeletal cloth blend** ([Feb 2026 Medium](https://medium.com/@pablobandinopla/simple-cloth-simulation-with-three-js-and-compute-shaders-on-skeletal-animated-meshes-acb679a70d9f)) — v1.1 cape upgrade path
- **NYT `rd-bundler-3d-plugins`** — Vite asset pipeline

## 15. Build & ship plan (high level)

1. **You review v0.2** → request edits or approve.
2. **Spec approval** → I invoke `superpowers:writing-plans` to produce the numbered task plan.
3. **`dev-workflow:WORKTREE SETUP`** → create `/Users/kdawg/Projects/super` worktree, init git, commit v0.2.
4. **Plan execution** → `superpowers:executing-plans` or `superpowers:subagent-driven-development`. TDD when possible; `superpowers:requesting-code-review` after each task.
5. **Per-milestone gate** → you play S1A → feedback → S1B → feedback → M2... never proceed without your sign-off.
6. **Multi-agent execution** continues per your direction — Opus subagents for parallel work, Codex for multi-file scaffolding/refactors, Gemini for fresh research as questions emerge.
7. **Deployment** — `vercel:deploy` or itch.io upload once shippable.

## 16. Done definition for v1

You can:
- Open the URL (or local dev server)
- See a 3×3 procedurally-arranged district at 60 FPS @ `high` preset
- Fly anywhere in it with banking, boost, hover, dive, superhero landing
- Punch a car and watch it launch with debris + sound
- Use heat vision on a wall and see scorch decal + sizzle SFX
- Grab a thrown prop and chuck it
- Take damage from threat AI, dodge, recover
- See cape flowing in wind (bone-driven; webgpu-high tier may upgrade to compute Verlet)
- Toggle dev console with `~` for quality, seed, spawn commands
- Pause cleanly (pointer-lock-aware), resume cleanly
- Settings + progress persist across reload, gracefully recover from corruption (§20)
- Optionally play with a gamepad (§21)

**It does NOT need:** multiplayer, persistent saves beyond settings/progress, story missions, mobile/touch, more than one district map.

---

## NEW SECTIONS — covering the 5 product gaps Codex flagged

## 17. Pointer-lock UX

The game needs the cursor locked to the canvas for mouse-look. Pointer Lock API behaviors:

- **Lock acquisition:** triggered ONLY by user gesture (`pointerdown` on canvas). Splash screen explicitly says "Click to play."
- **Lock loss = pause:** if `pointerlockchange` fires and `document.pointerLockElement === null`, immediately enter PAUSED state and show the pause menu. Don't try to silently relock — that violates browser intent and may trigger anti-abuse cooldown.
- **Re-lock UX:** pause menu has a "Resume" button that triggers `canvas.requestPointerLock()` on click.
- **ESC handling:** browsers auto-release pointer lock on ESC. Don't fight it — pause and show menu.
- **Safari quirk:** Safari's pointer lock implementation has historically dropped lock when window loses focus. Test path: alt-tab away, alt-tab back, verify resume flow works.
- **Settings**: a "mouse sensitivity" slider in `ui/pause-menu.js`.

## 18. Browser audio autoplay policy

Modern browsers block audio until a user gesture. howler.js + Web Audio behavior:

- **Boot path:** audio context stays `suspended` until first interaction.
- **First-gesture unlock:** on the splash screen's "Click to play" gesture, call `Howler.ctx.resume()` and `Howler.autoUnlock` is on by default.
- **Music starts on gameplay start**, not on boot. UI/menu SFX wait for first hover/click.
- **Test gate:** Playwright check (§13) asserts no autoplay errors in console; SFX/music start only after gesture.
- **Failure mode:** if audio context is permanently blocked (Safari low-power mode quirk), game still runs silent with a one-time toast: "Audio blocked by browser. Click [retry] to enable."

## 19. Error telemetry & perf capture

Personal project, no analytics service. Telemetry stays local:

- **Session log** (`logger.js`): structured rows with timestamp + channel + level + payload, kept in a ring buffer (last 1000 entries).
- **Dev console command** `perf capture start|stop|save`: writes a JSON blob to `localStorage` (or downloads as a file) with:
  - Backend chosen (`webgpu` / `webgl2`), GPU adapter info via `navigator.gpu.requestAdapter().info`
  - FPS samples + frame-time histogram
  - Draw call / triangle / material-variant counts per frame
  - Asset load failures (URL + reason)
  - Console errors captured via `window.onerror` and `window.onunhandledrejection`
  - Seed used + quality preset
- **Uncaught error UI:** non-fatal errors surface as a dismissible toast; fatal errors (render init failure) show a recovery screen with "force WebGL2 + retry" button.

## 20. Save corruption recovery

`fps-game` mentions this in its save test; v0.1 spec only had it in test strategy, not product behavior. Now in product:

- **All saves are versioned + checksummed** (`save-schema.js`). Format: `{ version, schemaHash, payload, payloadChecksum }`.
- **Load path:**
  1. Read from localStorage.
  2. If parse fails OR checksum mismatch OR version unknown → **don't crash**. Log a warning, fall back to defaults, show a one-time toast: "Save data was corrupted and reset to defaults. (Old data backed up to `super:save:backup`.)"
  3. Back the bad payload up to `super:save:backup` so the user could recover it manually.
- **Schema migration:** known older versions migrate via numbered migration functions. Unknown future version = same recovery path.
- **No silent data loss.** Always notify the user when their save was reset.

## 21. Gamepad support policy

Flight games benefit from analog sticks. Policy:

- **Day-one keyboard + mouse**, gamepad opt-in via auto-detect (`navigator.getGamepads()`).
- **Mapping:** left stick = pitch/yaw, right stick = roll + look, triggers = boost / heat-vision, face buttons = punch / dodge / grab / jump.
- **Pause-menu setting:** input device toggle (Auto / Keyboard+Mouse only / Gamepad only).
- **Hot-swap:** detect gamepad connect/disconnect mid-game; show toast and switch HUD prompts.
- **Mobile/touch:** explicitly **NOT** in v1.

---

## Appendix — Decisions deferred to later spec revisions

1. **Physics library final commitment.** Facade now; Rapier (`@dimforge/rapier3d-simd-compat`) is the named candidate, marry it in M3 when combat lands.
2. **World scale and mission structure.** A chain of districts vs continuous streamed city changes save schema, AI persistence, skyline tricks. Decide after S1B.
3. **GPU compute Verlet cape.** v1.1 if v1's bone-driven feels insufficient and budget has slack.
4. **Volumetric clouds.** Imposter quads v1; raymarched volumetrics v1.1.
5. **WFC procgen.** v1 = grid kit-bash; WFC spike in v1.1 if the grid feels stale.
6. **Whether to ship `ultra` preset effects** (GTAO/SSR/TAA/motion blur) at all, or whether `high` is "good enough" for the user.

---

## Synthesis trail — v0.2

v0.2 is the result of:
- **v0.1 spec** — synthesis of 5 Opus subagents + Codex (xhigh) + Gemini 2.5 Pro
- **Codex review** (gpt-5.5 fast/low) — HOLD with 4 blockers + 8 majors + 4 minors + 2 nits + 5 gaps
- **Gemini 3 Flash Preview review** — GREEN-LIGHT with 1 major + 1 minor + 1 nit; fact-checked 32 claims
- **Web enrichment** — direct GitHub READMEs, npm metadata, blog posts, Three.js forum threads

### Where the two reviewers disagreed

- **`three-wfc` validity**: Gemini said "verified leading 2026 implementation, bitmasking + min-heaps." Codex did `npm view three-wfc` and saw `v0.1.0`, single release April 2025. My enrichment fetched the README directly: "🚧 Work in Progress" / "currently provides a robust 2D solver." **Codex + enrichment wins.** Gemini hallucinated capability. Spec drops three-wfc.

### Where Gemini's fact-check caught what Codex didn't

- **§6 SIMD width**: Codex called the workgroup-64 rule "cargo cult." Gemini caught the *actual* bug: M-series subgroup is 32, not 64. The workgroup *choice* (64) is still good (2× subgroup) but the *reasoning* was wrong. Spec corrected.
- **§14 lo-th/3d.city is legacy** (r70-r80): Codex didn't surface this; Gemini did. Spec adds caveat.

### Where Codex caught what Gemini didn't

- All 4 blockers (renderer parity, three-wfc, vertical-slice timing, perf budget arithmetic)
- All 5 product gaps (pointer lock, audio autoplay, telemetry, save corruption, gamepad)
- Scope/scale overcommitment in the architecture and render stack

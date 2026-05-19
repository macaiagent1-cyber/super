# Super Engine Architecture v0.1

## Executive Summary

Super is a 3D open-world flying-superhero browser game built on vanilla ES modules + Vite + Three.js r183. The engine inherits fps-game's idioms — small kebab-case modules, explicit `update(dt, ...)` lifecycles, constructor dependency injection, procedural fallbacks for missing assets, a thin `main.js` orchestrator — and scales them across ten layers: **core / render / world / hero / combat / ai / vfx / audio / ui / save / dev-tools**. We commit to **Vite** (justified by GLB/KTX2/Draco loading, modern Three.js examples shipping as ESM-only, and hot-reload speed). Rendering runs on **RenderPipeline** (WebGPU with WebGL2 fallback). Physics is **Rapier WASM** (deterministic, fast, integrates cleanly with Three).

The vertical slice — `core-loop`, `input`, `render-pipeline`, `district-streamer`, `hero-flight` — gets a caped hero flying over a procedurally tiled city block in 2-3 hours. Highest risks are flight feel, cape simulation, postprocessing perf, the asset pipeline, and occlusion; each has a one-line mitigation. Pure-math modules (flight kinematics, hit math, damage curves, projectile ballistics) are unit-tested; rendering, audio, and physics integration are validated via dev-tools scenes with FPS, frame-time, and draw-call HUDs. Target: 60 FPS @ 1440x900 on MacBook Air M5.

---

## 1. Project Layout

```
super/
  index.html
  vite.config.js
  package.json
  public/
    assets/
      models/          # .glb (heroes, civilians, cars, props)
      textures/        # .ktx2 (compressed)
      audio/           # .ogg/.webm (howler)
      hdri/            # .hdr / .exr for IBL
  src/
    main.js                       # orchestrator (boots core, owns Game)
    game.js                       # top-level Game class
    engine/
      core/
        core-loop.js
        time.js
        constants.js
        input.js
        event-bus.js
        config.js
      render/
        render-pipeline.js
        camera-rig.js
        scene-graph.js
        postprocess.js
        sky-atmosphere.js
        lighting.js
        material-library.js
        instanced-renderer.js
      world/
        district-streamer.js
        tile-grid.js
        building-generator.js
        traffic-grid.js
        nav-graph.js
        physics-world.js
        environment.js
        weather.js
      hero/
        hero-controller.js
        hero-flight.js
        hero-locomotion.js
        cape-sim.js
        hero-animator.js
        hero-camera.js
      combat/
        combat-system.js
        punch-resolver.js
        heat-vision.js
        grab-throw.js
        damage-model.js
        projectile-system.js
        dodge.js
      ai/
        ai-director.js
        civilian-ai.js
        traffic-ai.js
        threat-ai.js
        steering.js
        perception.js
      vfx/
        vfx-manager.js
        particle-system.js
        decal-system.js
        impact-fx.js
        screen-fx.js
      audio/
        audio-bus.js
        spatial-audio.js
        music-director.js
      ui/
        hud.js
        menu-system.js
        title-screen.js
        pause-menu.js
        damage-overlay.js
      save/
        save-store.js
        progress-tracker.js
      dev-tools/
        debug-hud.js
        free-cam.js
        scene-inspector.js
        perf-monitor.js
        spawn-console.js
    assets/                        # built-in tiny placeholders, splash svg, etc.
  tests/                           # vitest, unit only
  research/
```

## 2. Module List by Layer

### core/
- **core-loop.js** — Fixed-step physics + variable-step render loop with accumulator; calls `update(dt)` on every system in registration order. Deps: `time`, `event-bus`.
- **time.js** — Master clock, `now()`, `dt`, frame counter, time-scale (for slow-mo / hitstop). Deps: `performance.now`.
- **constants.js** — Tuning numbers: gravity, fly speeds, damage tables, tile size, draw distance.
- **input.js** — Keyboard, mouse, gamepad. Buffered presses (per fps-game pattern).
- **event-bus.js** — Tiny pub/sub for cross-system signals (`hero:land`, `enemy:killed`).
- **config.js** — Quality presets (low/med/high/ultra), persisted user settings.

### render/
- **render-pipeline.js** — Owns the Three.js renderer; chooses WebGPU then falls back to WebGL2; manages resize and pixel ratio.
- **camera-rig.js** — Third-person follow camera with spring damping, FOV pump on boost, look-at and aim modes.
- **scene-graph.js** — Root `THREE.Scene`, layer masks (world / hero / fx / debug), frustum-culling helpers.
- **postprocess.js** — TAA, bloom, motion blur, tonemapping, vignette. WebGPU node materials when available.
- **sky-atmosphere.js** — Sky shader, sun/moon, time-of-day Rayleigh scattering.
- **lighting.js** — Sun light, ambient IBL from HDRI, cascaded shadow maps (3 cascades).
- **material-library.js** — Shared `MeshStandardMaterial` cache + KTX2 texture loader + Draco decoder.
- **instanced-renderer.js** — `InstancedMesh` / `BatchedMesh` pools for civilians, cars, debris, windows.

### world/
- **district-streamer.js** — Loads / unloads tiles around hero; ring buffer of district chunks.
- **tile-grid.js** — 2D grid of district cells (`{ buildings, roads, props, navMeshRef }`); seeded procgen.
- **building-generator.js** — Lot → footprint → extruded shell with module kit (roof, ledge, window stripe).
- **traffic-grid.js** — Lane graph derived from roads; spawn slots.
- **nav-graph.js** — Sidewalk and rooftop navmesh; A* for civilians.
- **physics-world.js** — Rapier WASM world; rigid bodies, colliders for buildings and dynamic props.
- **environment.js** — Time-of-day controller, sun position curve, ambient color.
- **weather.js** — Rain, fog, wind vector (read by `cape-sim` and `vfx`).

### hero/
- **hero-controller.js** — Top-level hero facade; routes to flight/locomotion/combat sub-states.
- **hero-flight.js** — Flight kinematics: pitch/yaw/roll, thrust, hover, dive, superhero-land arc. Pure math, unit-testable.
- **hero-locomotion.js** — Ground state, run, jump, landing impact.
- **cape-sim.js** — Verlet cloth simulation, wind+velocity coupled, GPU instanced if perf allows.
- **hero-animator.js** — Mixamo clip blend tree (idle / fly / punch / land / dodge), additive layers.
- **hero-camera.js** — Hero-aware camera presets (chase, aim, cinematic land).

### combat/
- **combat-system.js** — Coordinator: punch, heat-vision, grab-throw, dodge.
- **punch-resolver.js** — Sphere-cast in front of fist, applies impulse + damage. Pure math core.
- **heat-vision.js** — Continuous ray, beam VFX, damage-over-time.
- **grab-throw.js** — Pick up car/prop, becomes kinematic, throw applies launch impulse.
- **damage-model.js** — Pure damage curves, armor, knockback math. Unit-tested.
- **projectile-system.js** — Object pool for thrown debris, bullets (enemy).
- **dodge.js** — Short i-frame dash with motion-blur trail.

### ai/
- **ai-director.js** — Population manager: budget civilians/cars/threats per district.
- **civilian-ai.js** — Sidewalk wander, panic on threat.
- **traffic-ai.js** — Cars on lane graph, traffic-light states.
- **threat-ai.js** — Goons, drones, vehicles that target hero.
- **steering.js** — Reusable seek/flee/avoid functions.
- **perception.js** — Sight cones, hearing radius.

### vfx/
- **vfx-manager.js** — Registry + per-frame update for all visual effects.
- **particle-system.js** — GPU instanced quads / `BufferGeometry` particles.
- **decal-system.js** — Pooled decals (scorch, cracks).
- **impact-fx.js** — Punch impact rings, debris bursts.
- **screen-fx.js** — Speed lines, chromatic aberration on boost, hit-flash.

### audio/
- **audio-bus.js** — Howler.js channels (music / sfx / voice / ambient), volume mixer.
- **spatial-audio.js** — 3D panning via Howler's spatial features.
- **music-director.js** — Adaptive layers (calm/exploration/combat).

### ui/
- **hud.js** — Health, energy, minimap, reticle.
- **menu-system.js** — DOM-overlay menu (faster + accessible than canvas menus).
- **title-screen.js** / **pause-menu.js** — Screens via `menu-system`.
- **damage-overlay.js** — Red-flash + directional indicators.

### save/
- **save-store.js** — `localStorage` slots, schema versioning, corruption guard.
- **progress-tracker.js** — Districts visited, missions completed.

### dev-tools/
- **debug-hud.js** — FPS, frame-time, draw calls, triangles.
- **free-cam.js** — Detached camera for inspection.
- **scene-inspector.js** — lil-gui tweakables.
- **perf-monitor.js** — GPU timestamp queries.
- **spawn-console.js** — Press `~`, spawn cars/civilians/threats.

## 3. Dependency Graph

```
                    +-----------+        +---------+
                    |  input    |        |  time   |
                    +-----+-----+        +----+----+
                          |                   |
                          v                   v
                     +----+-------------------+----+
                     |          core-loop          |
                     +--+---------+---------+------+
                        |         |         |
       +----------------+         |         +---------------------+
       |                |         |                               |
       v                v         v                               v
+------+------+  +------+----+  +-+-----------+        +----------+--------+
| hero-ctrl   |  | ai-       |  | physics-    |        |  district-        |
| (flight/    |  | director  |  | world       |        |  streamer         |
|  locomotion)|  |           |  | (rapier)    |        |                   |
+------+------+  +-----+-----+  +------+------+        +----------+--------+
       |               |               |                          |
       | events        | events        | contacts                 | tiles
       v               v               v                          v
   +---+---------------+---------------+--------------------------+----+
   |                          event-bus                                |
   +---+---------------+----------------------------+-----------------+
       |               |                            |
       v               v                            v
+------+------+  +-----+-----+               +------+-----+
| combat-     |  | vfx-      |               | audio-bus  |
| system      +->| manager   |               | + spatial  |
+------+------+  +-----+-----+               +------+-----+
       |               |                            |
       |   scene mutations                          |
       v               v                            v
            +----------+-----------------------+
            |           scene-graph             |
            |  (lighting, sky, materials,       |
            |   instanced-renderer, postproc)   |
            +-----------------+-----------------+
                              |
                              v
                      +-------+--------+
                      | render-pipeline|
                      |  (WebGPU/WGL2) |
                      +-------+--------+
                              |
                              v
                      +-------+--------+
                      |  GPU output    |
                      +----------------+
```

Flow: **input → core-loop → (hero, ai, physics, world) → event-bus → (combat, vfx, audio) → scene-graph → render-pipeline → GPU.**

## 4. Vertical Slice — First 5 Modules

Goal: caped hero flying over a procedurally tiled district at 60 FPS within 2-3 hours of dev.

1. **`core/core-loop.js`** — Fixed-step loop with `dt`. Without this nothing animates.
2. **`core/input.js`** — Port the fps-game double-buffered keyboard pattern; add mouse for look.
3. **`render/render-pipeline.js`** — Boot Three.js WebGPU → WebGL2 fallback, blue sky color, sun light, ground plane. Hero is a `BoxGeometry` for now.
4. **`world/district-streamer.js` + `tile-grid.js` + `building-generator.js`** *(one slice deliverable)* — A 5×5 grid of seeded extruded boxes with HSL color variation. Instant "city".
5. **`hero/hero-flight.js`** — WASD + mouse pitch/yaw, throttle on `Shift`, hover. Camera follows. Cape and animations come later — visible delight is **flying through skyscrapers** by hour 3.

Skip until slice 2: cape sim, postprocessing, AI, audio polish, GLB hero asset.

## 5. Top 5 Highest-Risk Modules

1. **`hero-flight.js`** — Flight *feel* is the entire game. **Risk**: math that's correct but unfun. **Mitigation**: ship a `dev-tools/scene-inspector` slider panel from day one so every constant (acceleration, banking response, hover deadzone) is live-tunable in-game.
2. **`cape-sim.js`** — Verlet cloth can spike CPU and look terrible if wind coupling is off. **Risk**: visible jitter, frame drops. **Mitigation**: cap to 24 nodes × 8 segments, run on a fixed sub-step independent of physics, and ship a "no-cape" quality toggle.
3. **`postprocess.js`** — Bloom + TAA + motion-blur on integrated GPU eats budget. **Risk**: drops to 30 FPS during combat. **Mitigation**: budget 3.5 ms for post; gate motion-blur and SSAO behind the high-quality preset, profile with `perf-monitor.js` every commit.
4. **`material-library.js` + asset pipeline** — KTX2 + Draco + GLB + Meshy.ai churn is the most-likely-to-fail chain. **Risk**: bloated downloads, missing decoder workers, broken Mixamo rigs. **Mitigation**: enforce KTX2 via a Vite plugin pre-commit hook, keep procedural fallbacks (per fps-game `renderer.js` pattern) so missing assets never block dev.
5. **`district-streamer.js` (occlusion)** — Naive frustum culling alone will draw 5000 windows the hero can't see. **Risk**: 1M+ tris on screen. **Mitigation**: hierarchical AABB culling per tile + Three.js occlusion queries when on WebGPU; combine into `InstancedMesh` per tile for ~1 draw call per building cluster.

## 6. Bundler Decision — Vite

We use **Vite**. Three.js's modern modules (`three/examples/jsm/...` and `three/webgpu`) ship as ESM with bare specifiers and assume a bundler-style import map — wiring those by hand kills iteration speed. Vite also gives us native handling of binary assets (GLB, KTX2, HDR, WASM for Rapier) via `?url` and `import.meta.glob`, plus instant HMR for tuning hero-flight constants without reloading the city. The production build path (Rollup under Vite) is required to tree-shake Three.js — without it our shipped JS would be ~1.5 MB instead of ~400 KB.

## 7. Test Strategy

**Unit-testable (Vitest, pure functions, no Three):**
- `hero-flight.js` — given input vector + state, asserts pitch/yaw/velocity output.
- `damage-model.js` — damage curve, armor absorption, knockback magnitude.
- `punch-resolver.js` — hit math (sphere-cast vs AABB list).
- `projectile-system.js` — ballistic integration over `dt`.
- `steering.js` — seek/flee/avoid vector outputs.
- `save-store.js` — slot read/write, schema versioning, corruption recovery.
- `nav-graph.js` — A* pathfinding on synthetic grids.

**Integration-only (manual + dev-tools scenes):**
- `render-pipeline.js` — golden-image diff under WebGPU vs WebGL2.
- `postprocess.js` — visual + perf budget verified in `perf-monitor`.
- `cape-sim.js` — visual smoke test scene with toggle for wind vector.
- `audio-bus.js` / `spatial-audio.js` — howler integration runs in browser only.
- `physics-world.js` — Rapier WASM ≠ unit-testable in Node easily; use scripted dev scenes.
- `district-streamer.js` — load/unload timing measured with `perf-monitor`.

CI runs Vitest on every push. A manual `npm run dev:vertical-slice` boots the slice-1 city for human-eye verification.

# Super Engine Module Skeleton

Target: vanilla JS ES modules + Vite, Three.js r183+ with RenderPipeline, WebGPU primary, WebGL2 fallback, howler.js audio. Hardware target: MacBook Air M5 at 60 FPS @ 1440x900.

This is not a scaled-up raycaster. Super needs a real 3D runtime with streaming world state, instanced city rendering, hero-grade traversal feel, GPU-aware postprocessing, and built-in profiling from the first playable slice.

## 1. Top-Level Project Layout

```text
super/
  index.html
  package.json
  vite.config.js
  public/
    assets/
      audio/
        music/
        sfx/
      fonts/
      hdri/
      models/
        hero/
        city/
        civilians/
        vehicles/
        props/
      textures/
      manifests/
  src/
    main.js
    game.js
    engine/
      core/
        app-config.js
        asset-registry.js
        clock.js
        constants.js
        debug-flags.js
        engine-loop.js
        event-bus.js
        input-router.js
        logger.js
        rng.js
        scheduler.js
      render/
        render-system.js
        render-pipeline.js
        webgpu-backend.js
        webgl2-backend.js
        scene-roots.js
        camera-rig.js
        lighting-system.js
        sky-system.js
        post-fx-stack.js
        material-library.js
        mesh-pool.js
        instancing-system.js
        visibility-system.js
      world/
        world-system.js
        district-streamer.js
        district-generator.js
        tile-grid.js
        road-network.js
        building-kit.js
        prop-placement.js
        traffic-spawner.js
        population-spawner.js
        collision-world.js
        environment-system.js
        weather-system.js
      hero/
        hero-system.js
        hero-state-machine.js
        hero-flight.js
        hero-ground-move.js
        hero-ability-input.js
        hero-camera-target.js
        hero-animation.js
        cape-sim.js
        hero-energy.js
      combat/
        combat-system.js
        punch-system.js
        heat-vision-system.js
        grab-throw-system.js
        damage-model.js
        hit-query.js
        impulse-resolver.js
        destructible-system.js
        dodge-system.js
      ai/
        ai-system.js
        ai-director.js
        civilian-ai.js
        traffic-ai.js
        threat-ai.js
        perception-system.js
        steering.js
        nav-graph.js
        behavior-budget.js
      vfx/
        vfx-system.js
        particle-system.js
        trail-system.js
        beam-system.js
        decal-system.js
        weather-fx.js
        impact-fx.js
        screen-fx.js
      audio/
        audio-system.js
        audio-bus.js
        spatial-audio.js
        music-director.js
        ambience-system.js
      ui/
        ui-system.js
        hud.js
        reticle.js
        minimap.js
        menu-router.js
        pause-menu.js
        debug-overlay.js
      save/
        save-system.js
        save-schema.js
        settings-store.js
        progress-store.js
      dev-tools/
        dev-console.js
        perf-hud.js
        scene-inspector.js
        free-camera.js
        spawn-tools.js
        capture-tools.js
  tests/
    unit/
    perf/
  research/
```

## 2. Module List Grouped By Layer

### Core

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `core/app-config.js` | Loads boot config, quality preset, feature gates, and user overrides. Owns the high-level runtime profile before systems initialize. | `core/debug-flags.js`, `save/settings-store.js`, `core/logger.js` |
| `core/asset-registry.js` | Manifest-backed registry for models, textures, audio, and generated placeholder assets. Tracks load state, pinning, and eviction eligibility. | `core/logger.js`, `core/event-bus.js`, `render/material-library.js`, `audio/audio-bus.js` |
| `core/clock.js` | Master time source: frame index, raw dt, clamped dt, scaled dt, fixed-step accumulator, hitstop, and pause semantics. | `core/app-config.js`, browser `performance` |
| `core/constants.js` | Shared tuning constants that are stable enough to import directly: units, tile sizes, masks, default budgets. | none |
| `core/debug-flags.js` | Central debug feature flags so render, AI, combat, and world systems do not invent separate switches. | `save/settings-store.js`, `core/event-bus.js` |
| `core/engine-loop.js` | Owns initialization order, per-frame update order, fixed-step simulation, render dispatch, and teardown. This replaces `main.js` as the place where runtime policy lives. | `core/clock.js`, `core/scheduler.js`, `core/event-bus.js`, `render/render-system.js` |
| `core/event-bus.js` | Typed-enough pub/sub for domain events such as `hero.boosted`, `district.loaded`, `combat.impact`, and `quality.changed`. | `core/logger.js`, `core/debug-flags.js` |
| `core/input-router.js` | Normalizes keyboard, mouse, pointer lock, touch fallback, and gamepad into action states. Keeps raw input separate from hero intent. | `core/event-bus.js`, `ui/menu-router.js`, `core/clock.js` |
| `core/logger.js` | Structured logging with channels, levels, session ring buffer, and dev-console mirroring. No stray `console.log` in systems. | `core/debug-flags.js`, `dev-tools/dev-console.js` |
| `core/rng.js` | Seeded deterministic random streams for city layout, traffic population, ambient events, and replayable perf captures. | `core/app-config.js`, `core/logger.js` |
| `core/scheduler.js` | Time-slices expensive work: district generation, nav refreshes, asset warmup, impostor updates, and AI batches. | `core/clock.js`, `dev-tools/perf-hud.js`, `core/logger.js` |

### Render

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `render/render-system.js` | Public render facade used by the game loop. Owns frame lifecycle, resize handling, render targets, and backend selection. | `render/render-pipeline.js`, `render/scene-roots.js`, `render/camera-rig.js`, `core/app-config.js` |
| `render/render-pipeline.js` | Backend-neutral pipeline contract for main pass, depth prepass where useful, shadow pass, post stack, and debug overlays. | `render/webgpu-backend.js`, `render/webgl2-backend.js`, `render/post-fx-stack.js` |
| `render/webgpu-backend.js` | Primary Three.js RenderPipeline/WebGPU implementation. Enables higher-end lighting, GPU particles, timestamp profiling, and modern material paths. | `render/material-library.js`, `render/post-fx-stack.js`, `dev-tools/perf-hud.js` |
| `render/webgl2-backend.js` | Fallback renderer with reduced postprocessing, conservative shadow settings, and the same scene contract. | `render/material-library.js`, `render/post-fx-stack.js`, `core/app-config.js` |
| `render/scene-roots.js` | Defines scene roots and layer masks: world, hero, VFX, UI anchors, debug geometry. Prevents every system from owning ad hoc `THREE.Scene` state. | Three.js, `core/constants.js`, `render/visibility-system.js` |
| `render/camera-rig.js` | Third-person flight camera with spring follow, collision pull-in, boost FOV, aim offsets, and cinematic landing framing. | `hero/hero-camera-target.js`, `core/input-router.js`, `world/collision-world.js` |
| `render/lighting-system.js` | Sun/moon, ambient probes, hero key light, cascaded shadows, shadow caster budget, and quality-dependent lighting policy. | `world/environment-system.js`, `render/visibility-system.js`, `core/app-config.js` |
| `render/sky-system.js` | Time-of-day sky, cloud layer hooks, horizon haze, and weather tinting. Must read as expensive even when the geometry is cheap. | `world/environment-system.js`, `world/weather-system.js`, `render/material-library.js` |
| `render/post-fx-stack.js` | Tonemapping, bloom, velocity-aware motion streaks, color grade, heat shimmer hooks, and quality preset variants. | `render/render-pipeline.js`, `vfx/screen-fx.js`, `core/app-config.js` |
| `render/material-library.js` | Shared material and texture cache. Applies KTX2 setup, anisotropy policy, shader variants, and generated fallback materials. | `core/asset-registry.js`, Three.js loaders, `core/logger.js` |
| `render/mesh-pool.js` | Reuses transient meshes for debug shapes, debris visuals, impact rings, and generated proxy geometry. | `render/scene-roots.js`, `core/scheduler.js`, `dev-tools/scene-inspector.js` |
| `render/instancing-system.js` | Owns `InstancedMesh`/batched draw pools for buildings, windows, cars, civilians, props, and distant skyline pieces. | `world/district-streamer.js`, `render/material-library.js`, `render/visibility-system.js` |
| `render/visibility-system.js` | Frustum culling, distance bands, LOD selection, optional occlusion hints, and per-frame render budget reporting. | `render/camera-rig.js`, `world/district-streamer.js`, `dev-tools/perf-hud.js` |

### World

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `world/world-system.js` | Coordinates district streaming, city generation, environment, collision, traffic, and ambient population. | `world/district-streamer.js`, `world/collision-world.js`, `world/environment-system.js`, `core/scheduler.js` |
| `world/district-streamer.js` | Maintains resident district rings around the hero, preloads along velocity, unloads behind, and exposes visible district sets. | `hero/hero-system.js`, `core/asset-registry.js`, `world/district-generator.js`, `core/rng.js` |
| `world/district-generator.js` | Seeded procedural district builder: lots, blocks, roads, skyline rhythm, hero-readable landmarks, and gameplay clearances. | `world/tile-grid.js`, `world/building-kit.js`, `world/road-network.js`, `core/rng.js` |
| `world/tile-grid.js` | Spatial index for district cells, lots, roads, rooftops, and streaming boundaries. Keeps procgen queryable by AI and physics. | `core/constants.js`, `core/rng.js`, `world/road-network.js` |
| `world/road-network.js` | Builds drive lanes, intersections, sidewalks, crosswalks, and fly-through corridors from district layout. | `world/tile-grid.js`, `ai/nav-graph.js`, `world/traffic-spawner.js` |
| `world/building-kit.js` | Turns lot definitions into instanced kit pieces: shells, roofs, window bands, rooftop props, collision proxies, and LOD groups. | `render/instancing-system.js`, `world/collision-world.js`, `render/material-library.js` |
| `world/prop-placement.js` | Places signs, hydrants, benches, roof units, antennas, street lights, and destructible dressing using deterministic rules. | `world/tile-grid.js`, `render/instancing-system.js`, `core/rng.js`, `combat/destructible-system.js` |
| `world/traffic-spawner.js` | Creates car pools per district, assigns lane routes, and hands update authority to traffic AI. | `world/road-network.js`, `ai/traffic-ai.js`, `render/instancing-system.js` |
| `world/population-spawner.js` | Budgets civilians by district density and visibility. Spawns close characters and distant impostors from the same population source. | `ai/civilian-ai.js`, `ai/ai-director.js`, `render/instancing-system.js` |
| `world/collision-world.js` | Broadphase and collision query facade for hero movement, camera collision, combat hit queries, and static district colliders. | `world/district-streamer.js`, `combat/hit-query.js`, `render/mesh-pool.js` |
| `world/environment-system.js` | Day/night phase, sun direction, exposure target, ambient color, and mission/weather override hooks. | `render/lighting-system.js`, `render/sky-system.js`, `audio/ambience-system.js` |
| `world/weather-system.js` | Weather state machine for rain, wind, fog, wetness, and storm intensity. Feeds cape, particles, ambience, and postprocessing. | `world/environment-system.js`, `hero/cape-sim.js`, `vfx/weather-fx.js`, `audio/ambience-system.js` |

### Hero

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `hero/hero-system.js` | Public hero facade: owns hero entity state, model root, current movement mode, combat readiness, and events. | `hero/hero-state-machine.js`, `hero/hero-animation.js`, `world/collision-world.js`, `core/event-bus.js` |
| `hero/hero-state-machine.js` | Explicit state graph for ground sprint, takeoff, hover, cruise, boost, dive, landing, dodge, grab, throw, and hit reaction. | `hero/hero-flight.js`, `hero/hero-ground-move.js`, `combat/combat-system.js` |
| `hero/hero-flight.js` | Flight kinematics and feel: thrust, banking, hover damping, dive acceleration, air brake, vertical authority, and camera-facing input mapping. | `core/input-router.js`, `core/clock.js`, `world/collision-world.js`, `hero/hero-energy.js` |
| `hero/hero-ground-move.js` | Ground sprint, super jump, wall/roof contact rules, landing impact, and transition back to flight. | `core/input-router.js`, `world/collision-world.js`, `hero/hero-state-machine.js` |
| `hero/hero-ability-input.js` | Converts raw input into ability intents: punch, heat vision, grab, throw, dodge, boost, and contextual interact. | `core/input-router.js`, `combat/combat-system.js`, `ui/reticle.js` |
| `hero/hero-camera-target.js` | Stable target data for camera: position, look vector, velocity, banking, aim point, and cinematic cues. | `hero/hero-system.js`, `hero/hero-flight.js`, `combat/heat-vision-system.js` |
| `hero/hero-animation.js` | Loads and blends hero animation clips, additive upper-body combat layers, flight poses, and landing impact reactions. | `core/asset-registry.js`, `hero/hero-state-machine.js`, `hero/cape-sim.js` |
| `hero/cape-sim.js` | Lightweight cape simulation using hero velocity, wind, pose anchors, and camera distance. Must degrade cleanly to baked motion. | `world/weather-system.js`, `hero/hero-animation.js`, `core/scheduler.js`, `render/mesh-pool.js` |
| `hero/hero-energy.js` | Energy budget for heat vision, boost, dodge, and recovery pacing. Keeps ability tuning out of the input layer. | `core/clock.js`, `ui/hud.js`, `core/event-bus.js` |

### Combat

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `combat/combat-system.js` | Coordinates all hero combat abilities, queues animation windows, dispatches damage events, and exposes combat state to UI and AI. | `hero/hero-state-machine.js`, `combat/damage-model.js`, `core/event-bus.js`, `vfx/vfx-system.js` |
| `combat/punch-system.js` | Super-strength punch arcs, active frames, target acquisition, hit pause, impulse, impact VFX, and miss recovery. | `combat/hit-query.js`, `combat/impulse-resolver.js`, `hero/hero-animation.js`, `audio/audio-system.js` |
| `combat/heat-vision-system.js` | Continuous beam targeting, energy drain, scorch decals, heat shimmer, damage-over-time, and weak-point interaction. | `hero/hero-energy.js`, `combat/hit-query.js`, `vfx/beam-system.js`, `vfx/decal-system.js` |
| `combat/grab-throw-system.js` | Grabbing cars/props/enemies, attaching them to hero pose sockets, previewing throw arc, and launching with impulse. | `world/collision-world.js`, `combat/impulse-resolver.js`, `hero/hero-animation.js`, `vfx/trail-system.js` |
| `combat/damage-model.js` | Pure gameplay math for health, armor, stun, knockback, heat accumulation, and destructible thresholds. | `core/constants.js`, `core/rng.js` |
| `combat/hit-query.js` | Shape casts, ray casts, overlap queries, target filters, team masks, and query result normalization. | `world/collision-world.js`, `core/constants.js`, `dev-tools/scene-inspector.js` |
| `combat/impulse-resolver.js` | Applies physically plausible but game-feel-biased impulses to vehicles, props, civilians, threats, and debris. | `world/collision-world.js`, `combat/damage-model.js`, `vfx/impact-fx.js` |
| `combat/destructible-system.js` | Destructible props, facade chips, cracked pavement, vehicle damage states, debris pooling, and cleanup policy. | `world/prop-placement.js`, `combat/damage-model.js`, `render/mesh-pool.js`, `audio/audio-system.js` |
| `combat/dodge-system.js` | Short invulnerable reposition move on ground and in air, with cooldown, directional bias, and camera-readable streaking. | `hero/hero-state-machine.js`, `hero/hero-energy.js`, `vfx/trail-system.js` |

### AI

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `ai/ai-system.js` | Runs AI update phases under a budget: director, perception, civilian, traffic, threats, and deferred behavior work. | `ai/ai-director.js`, `ai/behavior-budget.js`, `core/scheduler.js`, `core/event-bus.js` |
| `ai/ai-director.js` | Chooses ambient density and threat pressure based on hero speed, district type, mission state, and frame budget. | `world/district-streamer.js`, `hero/hero-system.js`, `ai/behavior-budget.js` |
| `ai/civilian-ai.js` | Sidewalk wandering, panic, look-at-hero beats, flee behavior, and crowd despawn rules. | `ai/nav-graph.js`, `ai/steering.js`, `ai/perception-system.js`, `world/population-spawner.js` |
| `ai/traffic-ai.js` | Lane following, traffic spacing, intersection logic, panic braking, and collision avoidance. | `world/road-network.js`, `ai/steering.js`, `world/traffic-spawner.js`, `world/collision-world.js` |
| `ai/threat-ai.js` | Enemy drones/goons/vehicles: target selection, pursuit, attack windows, retreat, and formation hints. | `ai/perception-system.js`, `combat/combat-system.js`, `ai/steering.js`, `world/collision-world.js` |
| `ai/perception-system.js` | Sight, hearing, hero shockwave events, occlusion tests, and threat awareness sharing. | `world/collision-world.js`, `core/event-bus.js`, `hero/hero-system.js` |
| `ai/steering.js` | Reusable seek, flee, arrive, avoid, lane-follow, and separation functions. Designed as pure math. | `world/collision-world.js`, `core/constants.js` |
| `ai/nav-graph.js` | Sidewalk, rooftop, and road graph access. Provides async path requests and cheap local path repair. | `world/road-network.js`, `world/tile-grid.js`, `core/scheduler.js` |
| `ai/behavior-budget.js` | Per-frame AI work allocator. Distant civilians and cars update less often; near threats never starve. | `dev-tools/perf-hud.js`, `core/app-config.js`, `core/clock.js` |

### VFX

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `vfx/vfx-system.js` | Central VFX registry and update/render bridge. Keeps gameplay systems from constructing particles and decals directly. | `render/render-system.js`, `core/event-bus.js`, `core/asset-registry.js` |
| `vfx/particle-system.js` | GPU-oriented particle pools for sparks, dust, rain splashes, contrails, debris flecks, and impact bursts. | `render/render-pipeline.js`, `render/material-library.js`, `core/scheduler.js` |
| `vfx/trail-system.js` | Flight contrails, dodge streaks, thrown-object trails, and speed-line anchors. | `hero/hero-system.js`, `combat/grab-throw-system.js`, `render/camera-rig.js` |
| `vfx/beam-system.js` | Heat vision beam geometry, glow, distortion, contact flare, and beam fade. | `combat/heat-vision-system.js`, `render/post-fx-stack.js`, `audio/audio-system.js` |
| `vfx/decal-system.js` | Scorch marks, cracked pavement, vehicle dents, and temporary wall impacts with pooled lifetime management. | `combat/hit-query.js`, `render/material-library.js`, `world/district-streamer.js` |
| `vfx/weather-fx.js` | Rain streaks, fog sheets, wet surface hints, windborne debris, and lightning hooks. | `world/weather-system.js`, `render/sky-system.js`, `vfx/particle-system.js` |
| `vfx/impact-fx.js` | Punch rings, shockwaves, chunks, sparks, camera rumble hints, and event-driven impact composition. | `combat/punch-system.js`, `combat/impulse-resolver.js`, `vfx/particle-system.js`, `audio/audio-system.js` |
| `vfx/screen-fx.js` | Full-screen effects: boost distortion, damage flash, heat-vision glare, low-health pulse, and menu-safe fades. | `render/post-fx-stack.js`, `ui/hud.js`, `hero/hero-energy.js` |

### Audio

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `audio/audio-system.js` | Public audio facade for SFX, ambience, music, listener updates, lifecycle, and mute/pause behavior. | `audio/audio-bus.js`, `audio/spatial-audio.js`, `core/asset-registry.js`, `core/event-bus.js` |
| `audio/audio-bus.js` | howler.js channel mixer: master, music, SFX, ambience, UI, and voice-stealing policy. | howler.js, `save/settings-store.js`, `core/logger.js` |
| `audio/spatial-audio.js` | Listener position, 3D panning, distance rolloff, doppler-lite velocity cues, and priority by audible distance. | `hero/hero-system.js`, `render/camera-rig.js`, `audio/audio-bus.js` |
| `audio/music-director.js` | Adaptive music states for free flight, danger, combat, victory, and cooldown. Crossfades without blocking gameplay. | `core/event-bus.js`, `audio/audio-bus.js`, `ai/ai-director.js` |
| `audio/ambience-system.js` | City bed, wind at altitude, rain, thunder, traffic bed, and day/night ambience transitions. | `world/environment-system.js`, `world/weather-system.js`, `audio/spatial-audio.js` |

### UI

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `ui/ui-system.js` | Coordinates DOM overlay, HUD canvas or HTML, pause/menu states, debug overlay routing, and resize. | `core/input-router.js`, `ui/menu-router.js`, `ui/hud.js`, `core/event-bus.js` |
| `ui/hud.js` | In-play hero HUD: health, energy, altitude/speed hinting, objective marker, threat indicator, and minimal ability cooldowns. | `hero/hero-system.js`, `hero/hero-energy.js`, `combat/combat-system.js`, `ui/reticle.js` |
| `ui/reticle.js` | Aim reticle, heat-vision lock state, grab candidate, throw arc validity, and hit confirmation flash. | `combat/hit-query.js`, `combat/heat-vision-system.js`, `hero/hero-camera-target.js` |
| `ui/minimap.js` | Lightweight district minimap with hero position, nearby threats, route hints, and dev overlay option. | `world/district-streamer.js`, `ai/ai-director.js`, `hero/hero-system.js` |
| `ui/menu-router.js` | Title, pause, settings, and accessibility screens as DOM views. It owns focus, pointer lock escape, and game pause semantics. | `core/input-router.js`, `save/settings-store.js`, `audio/audio-system.js` |
| `ui/pause-menu.js` | Pause view, graphics/audio/input settings, resume flow, and save/load entry points. | `ui/menu-router.js`, `save/save-system.js`, `core/app-config.js` |
| `ui/debug-overlay.js` | Non-production overlay mount for system toggles, current target info, and links into dev tools. | `dev-tools/dev-console.js`, `dev-tools/perf-hud.js`, `core/debug-flags.js` |

### Save

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `save/save-system.js` | Save/load coordinator for settings, progression, unlocked powers, visited districts, and safe respawn state. | `save/save-schema.js`, `save/progress-store.js`, `core/logger.js`, `core/event-bus.js` |
| `save/save-schema.js` | Versioned save schema, migration steps, validation, corruption fallback, and compatibility warnings. | `core/logger.js`, `core/constants.js` |
| `save/settings-store.js` | Persists graphics, audio, input, accessibility, dev toggles, and selected quality preset. | `core/app-config.js`, `audio/audio-bus.js`, `ui/menu-router.js` |
| `save/progress-store.js` | Mission progress, collected upgrades, discovered districts, and world state snapshots that are worth persisting. | `save/save-schema.js`, `world/district-streamer.js`, `hero/hero-system.js` |

### Dev-Tools

| Filename | Responsibility | Key Dependencies |
|---|---|---|
| `dev-tools/dev-console.js` | In-game command console for toggles, spawn commands, quality changes, time/weather jumps, and log inspection. | `core/logger.js`, `core/event-bus.js`, `dev-tools/spawn-tools.js` |
| `dev-tools/perf-hud.js` | Frame time, simulation time, render time, draw calls, triangles, GPU timing where available, pools, and streaming status. | `core/clock.js`, `render/render-system.js`, `ai/behavior-budget.js`, `core/scheduler.js` |
| `dev-tools/scene-inspector.js` | Runtime object selection, bounds display, material inspection, light debugging, collision proxies, and layer masks. | `render/scene-roots.js`, `world/collision-world.js`, `render/mesh-pool.js` |
| `dev-tools/free-camera.js` | Detached camera for city inspection, perf captures, and fly-through debugging without changing hero state. | `render/camera-rig.js`, `core/input-router.js`, `dev-tools/dev-console.js` |
| `dev-tools/spawn-tools.js` | Spawns cars, civilians, threats, props, weather states, VFX, and hero test scenarios from commands. | `world/world-system.js`, `ai/ai-system.js`, `combat/combat-system.js`, `vfx/vfx-system.js` |
| `dev-tools/capture-tools.js` | Deterministic screenshot/perf capture harness with seed, quality preset, camera path, and frame budget report. | `core/rng.js`, `dev-tools/perf-hud.js`, `render/render-system.js` |

## 3. Cross-Cutting Concerns

### Logging

Use a structured logger from the start. Every system logs through `core/logger.js` with channel names (`render`, `world`, `hero`, `ai`, `asset`, `audio`) and levels (`debug`, `info`, `warn`, `error`). The logger keeps a session ring buffer for the dev console and can export a capture bundle with seed, settings, and recent warnings.

Rule: production systems never call `console.log` directly. Console output is a sink, not the API.

### Profiling

Profiling is not a later task. The first vertical slice should display frame time, update time, render time, draw calls, visible instance counts, resident districts, and asset memory estimates. WebGPU timestamp queries are used when available; WebGL2 fallback still reports CPU timings and renderer counters.

Budgets should be expressed as policy, not vibes: 16.6 ms absolute frame, 12 ms target, 180 draw calls target, district generation time-sliced, and AI updates budgeted by `ai/behavior-budget.js`.

### ECS Or Not

Do not start with a full ECS. Use system-owned lightweight records plus explicit managers.

Reason: Super has a small number of complex hero/combat/camera objects and a large number of simple instanced ambient objects. A full ECS would add abstraction cost before the gameplay shape is known. The right compromise is:

- Explicit systems for hero, combat, world, render, AI, VFX, audio, and UI.
- Plain records for cars, civilians, props, district cells, and particles.
- Stable ids and component-like data where scale demands it, especially instancing and AI pools.
- Revisit ECS only if missions, destructibles, and AI interactions create repeated cross-system query pain.

### Event Bus

Use `core/event-bus.js`, but keep it disciplined. It is for facts that happened, not every data dependency. Good events: `district.loaded`, `combat.impact`, `hero.startedBoost`, `weather.changed`, `asset.failed`. Bad events: per-frame hero position, camera transform, raw input axes.

The main state path stays explicit through system dependencies; events prevent tight coupling around secondary reactions like VFX, audio, HUD flashes, and telemetry.

### Asset Registry

All runtime assets flow through `core/asset-registry.js`. It owns manifests, stable ids, fallback assets, pinning, reference counts, load errors, and eviction hints. Systems request `assetId`s, not paths. This is mandatory for district streaming and for clean WebGPU/WebGL2 fallback behavior.

### RNG

Use named seeded streams: `city`, `population`, `traffic`, `weather`, `ambient`, `capture`. This gives reproducible districts and perf captures while allowing non-critical ambience to vary independently. Avoid `Math.random` in simulation code.

### Time / dt

Use `core/clock.js` as the single source of dt. Physics-like simulation, hero movement, cape simulation, and AI should receive clamped fixed or semi-fixed dt from `engine-loop.js`; rendering receives variable interpolation data. Time scale and hitstop must be centralized so combat does not break camera, audio, or VFX.

### Dev Console

The dev console is a production accelerator, not a toy. It should be available in week one with commands for:

- `quality low|medium|high|ultra`
- `seed <value>`
- `teleport district <x> <z>`
- `weather clear|rain|storm|fog`
- `spawn car|civilian|drone|prop`
- `hero energy full`
- `perf capture start|stop`
- `render backend webgpu|webgl2`

If a feature cannot be inspected or forced from the console, it will be slow to tune.

## 4. First 5 Modules For The Vertical Slice

The goal is not a clean empty engine. The goal is to see a caped hero flying above a plausible tiled city at 60 FPS within roughly two hours of implementation.

1. `core/engine-loop.js`

   Minimum code path: initialize systems, own `requestAnimationFrame`, clamp dt, call update/render, wire resize, expose one debug frame object. Without this, every other module invents lifecycle policy.

2. `render/render-system.js`

   Minimum code path: create Three renderer, choose WebGPU if available, fall back to WebGL2, create scene roots, camera, sun, sky color, and a basic post stack. The first screenshot should already have tone mapping, bloom-ready lighting, and a third-person camera.

3. `world/district-generator.js`

   Minimum code path: generate a 3x3 grid of city tiles from a seed using instanced boxes/building kit placeholders, roads, sidewalks, roof heights, and collision proxies. This is the fastest path to "open world" without waiting on art.

4. `render/instancing-system.js`

   Minimum code path: batch buildings, windows, road markings, props, and placeholder cars into a small number of draw calls. The vertical slice succeeds or fails on scale; individual meshes for city pieces are not acceptable.

5. `hero/hero-flight.js`

   Minimum code path: third-person flight movement with hover, boost, banking, altitude control, camera-facing input, and speed-dependent camera target data. A capsule or simple placeholder hero is fine; flight feel is the product.

The deliberate omission: combat. Punches and heat vision are important, but they should not come before traversal, scale, and the city rendering budget. A superhero game that cannot make flying feel good is already in trouble.

## 5. Deliberate Departures From `fps-game`

1. Replace Canvas 2D and raycasting with real Three.js 3D rendering.

   `fps-game` renders a 2.5D illusion by casting rays into a grid and painting columns. Super needs free vertical movement, banking, rooftop traversal, real camera parallax, dynamic lighting, animated characters, volumetric-feeling weather, and a skyline visible from altitude. The rendering model must be mesh-based 3D from the first commit.

2. Replace ad hoc asset loading with Vite plus manifest-driven runtime assets.

   `fps-game` can load PNGs and JSON maps by direct path. Super needs GLB, KTX2, HDRI, audio sprites, animation clips, fallback assets, district streaming, and build-time cache behavior. Vite is not just convenience; it is the packaging layer that keeps ES modules, Three examples, workers, WASM decoders, and dev iteration sane.

3. Replace single-file renderer/gameplay coupling with layered systems and renderer backends.

   In `fps-game`, `main.js`, `renderer.js`, and gameplay modules can know about each other because the world is small. Super must keep hero flight, district streaming, combat, AI, VFX, and audio independent enough to profile and degrade separately. The WebGPU/WebGL2 split also forces a clean render facade; gameplay code should not care which backend drew the frame.

## 6. Decide-Later Open Questions

1. Physics library commitment.

   The skeleton uses `world/collision-world.js` as a facade instead of naming a hard dependency. Rapier is a strong browser candidate, but I would not commit until the first flight/city prototype proves the collision needs: hero capsule sweeps, camera collision, thrown cars, destructibles, and enough static-city collider scale.

2. World scale and mission structure.

   A single dense district, a chain of districts, and a true continuously streamed city imply different save data, AI persistence, traffic simulation, and skyline tricks. The vertical slice should fake a larger world with a 3x3 or 5x5 tiled district before committing to mission persistence and long-distance streaming rules.

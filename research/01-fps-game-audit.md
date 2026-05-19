# fps-game Audit: What Carries to Super

**Source:** `/Users/kdawg/Projects/fps-game/` — vanilla-JS DOOM-style raycaster, no build step, Howler.js only external dep, Canvas 2D 640x400 with pixel-art rendering.
**Target:** `/Users/kdawg/Projects/super/` — Three.js r183+ (WebGPU + WebGL2 fallback) open-world flying superhero game, 60 FPS @ 1440x900 on MBA M5.

The fps-game codebase is small (12 engine modules, ~1500 LOC) but architecturally clean. It is the right reference for Super not because of *what* it renders, but because of *how* it composes a game loop, isolates state, and stays testable with zero build infrastructure. Most non-render code transfers; everything that touches pixels is replaced.

---

## Module-by-Module

```
Module          | Inherit / Adapt / Replace | Notes
----------------+---------------------------+--------------------------------------------------------
constants.js    | Inherit (pattern)         | Flat exported numbers. Super splits to constants/{world,camera,physics,gfx}.js.
input.js        | Inherit (~90%)            | Two-buffer pressed/down model is excellent. Add gamepad + WASD-rebind layer.
map.js          | Replace (concept), Inherit (loader) | 2D grid -> 3D scene graph (chunks, GLTF tiles). Keep async static `load()`, JSON meta block, door state map.
player.js       | Adapt heavily             | Movement math is 2D angle-based; flight needs full 6DOF quaternion. Keep pickup() dispatch, ammo/inventory pattern, takeDamage(armor-absorb) formula.
raycaster.js    | Replace entirely          | DDA is obsolete. Three.js handles visibility. Repurpose name for a `physics-raycast.js` (THREE.Raycaster wrapper for hit detection, line-of-sight, ground probes).
renderer.js     | Replace entirely          | Per-pixel ImageData loops -> Three.js scene/render-graph. But preserve the texture/asset *registration* + procedural-fallback pattern verbatim.
enemy.js        | Inherit (FSM)             | IDLE/SEE/CHASE/ATTACK/PAIN/DEATH state machine is a gem — port straight over, swap geometry for behaviour-tree node skinning.
weapon.js       | Adapt                     | WEAPONS data-driven table + slot toggle (shotgun/SSG) carries over. Hitscan becomes Three.js Raycaster; projectiles become physics bodies.
projectile.js   | Adapt                     | Already engine-agnostic. Swap 2D Manhattan-grid collision for sphere/AABB physics. Splash-radius logic is reusable as-is.
hud.js          | Replace presentation, inherit shape | Canvas 2D drawing must move to a DOM/CSS overlay (or a separate Three orthographic camera). The update()->draw() split and face-state FSM transfer cleanly.
gamestate.js    | Inherit (~95%)            | State enum + transition() + save()/load() to localStorage is exactly what Super needs. Just add an async-asset gate before PLAYING.
audio.js        | Inherit (~100%)           | Howler.js wrapper is already 3D-ready (just upgrade to Howler's full panner/spatial API or swap to Three.js PositionalAudio). Distance-attenuation logic carries.
```

---

## Bigger Picture

**Build/bundler.** fps-game's "no build, open index.html" stance is wonderful for a ~1500 LOC project. Super is a different beast: Three.js r183 ESM, GLTF/Draco/KTX2 loaders, WebGPU shaders (WGSL), texture compression, possibly worker threads for physics/streaming. **Move to Vite.** Justification: HMR alone pays for itself when iterating on shaders, native `import.meta.glob` for asset manifests beats hand-listing in `main.js`, and Vite's dev server handles MIME types for `.wgsl`/`.glsl`/`.ktx2` that vanilla static serving fumbles. Keep the *spirit* of the old approach: zero config beyond what's necessary, no framework, no React.

**Test conventions.** The Node `node:test` + `assert/strict` + `.mjs` pattern (see `tests/save.test.mjs`, `tests/player.test.mjs`) is excellent and transfers directly. Tests are **unit-shaped on pure modules** — they import `Player`, `GameMap`, `castAllRays` directly with mock inputs. This works for any pure-logic module (physics step, FSM transitions, inventory, save/load). It does **not** cover the renderer, which fps-game leaves to manual browser verification. For Super, add a Playwright tier for integration smoke tests (canvas mounts, asset loads, first frame within budget).

**Folder structure that should evolve.**
```
super/
  src/
    core/        constants/, input/, time/, events/
    world/       scene-graph, chunking, streaming
    entities/    player, npcs, projectiles (one file each, like fps-game)
    systems/     physics, ai, audio, hud, save
    render/      three-init, materials, post, shaders/*.wgsl
    assets/      manifests (typed)
  public/        gltf, textures, audio
  tests/         node:test for systems/, playwright/ for smoke
```

---

## 3 Lifted Patterns (the user's style worth carrying explicitly)

1. **The "register fallback first, then async-overwrite" texture pattern** (`renderer.js` constructor → `loadTexture()`). Procedurally generated placeholders register synchronously so the game can render *before* any file loads; real assets quietly replace them as they arrive. For Super, do the same with a procedural placeholder mesh/material so the world is interactive during streaming — no loading screen lock-up. The `Promise.all([...names].map(load))` block in `main.js` lines 19-28 is the explicit, readable preload manifest worth keeping verbatim in shape.

2. **The state-machine `transition()` + `_needsReload` flag** (`gamestate.js:45-48`, consumed in `main.js:110-121`). State changes never directly mutate the world; they set a flag the game loop services on its next tick. This decoupling is *exactly* what an open-world game needs for region streaming, fast-travel, and save-load — keep the pattern, just rename to `_needsWorldReload` and let it accept a target chunk coord.

3. **The double-buffered input model** (`input.js`: `_pressedBuffer` accumulates between frames, `_pressedFrame` is the visible snapshot, `update()` swaps). This is rare in JS game tutorials and dead-correct — it prevents the "I pressed F but the loop didn't see it" race that bites every framework. Port it byte-for-byte, then layer gamepad and rebindable actions on top.

Honorable mentions worth lifting: the F5 quicksave one-liner pattern, the `painAlpha/pickupAlpha` decaying screen-effect overlays, and the Tab automap toggle — all map cleanly to Three.js post-processing passes and a minimap render-target.

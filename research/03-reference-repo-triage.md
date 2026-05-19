# Reference Repo Triage for Super

A 3D open-world flying superhero game in Three.js + WebGPU + vanilla JS ES modules. Below: nine candidate reference repos, three quick web searches, and a shortlist of patterns to lift.

---

## Triage Card Template
- **License** | **Activity** | **Stack** | **Lift** | **Verdict**

---

### 1. ProdiG66/ManOfSteel
- **License:** MIT
- **Activity:** 10 stars, 31 commits, UE5.3, hit Git LFS quota (assets on Google Drive). Hobby-active.
- **Stack:** Unreal Engine 5.3, C++/Blueprints. Wrong runtime for us, but the *design* is on-point.
- **Lift:** Mechanics design reference only — not code. The README + GIFs show: flight-leaning (lean-into-turn input mapping), superhero-landing animation event, flight-burst + sonic-boom VFX trigger points, heat-vision decal burn-marks on hit surfaces, motion-warping transitions between locomotion states. Steal the *input-to-anim-state machine* layout, not the engine.
- **Verdict:** `light-reference` — mine the GIFs for feel/timing values; ignore the C++.

### 2. jstrait/city-tour
- **License:** MIT
- **Activity:** 84 stars, 1510 commits, live demo at joelstrait.com/citytour. Maintained.
- **Stack:** Three.js + plain JS, yarn build, modular `/src` layout with `/test` coverage. Vanilla-friendly.
- **Lift:** Highest-fit repo on the list. Pipeline is exactly the genre we need: terrain-map -> road-network-follows-terrain -> building-lot-placement -> building-gen-with-variation -> auto-camera-tour. The `/src` modular split is a clean blueprint for our `procgen/` directory. Auto-flight-tour camera logic in particular is borrowable for cinematic camera moments and "find-me" pan transitions.
- **Verdict:** `heavy-reference` — closest architectural cousin; study every module.

### 3. getzelus/babcity
- **License:** Unclear (none specified)
- **Activity:** 2 stars, 15 commits, pre-alpha, no recent activity. Abandoned.
- **Stack:** Babylon.js, multiple `alphaXX.html` test files, MakeHuman + Blender assets.
- **Lift:** Nothing concrete. README is aspirational. No streaming/LOD code visible. Wrong engine + no real implementation.
- **Verdict:** `skip-and-why` — abandoned pre-alpha, no extractable code, wrong engine.

### 4. obecerra3/OpenWorldJS
- **License:** Unclear
- **Activity:** 17 stars, 239 commits, 4 open PRs. Active.
- **Stack:** Three.js + Ammo.js, GLSL, Draco/GLTF. Vanilla-JS-ish.
- **Lift:** Best technical fit after city-tour. Specifically borrow: `Terrain.js` + `TextureGen.frag` (GPGPU-accelerated procedural terrain with **CDLOD** — Continuous-Distance LOD — chunk centered on player; this is exactly the streaming pattern we need adapted for a city instead of terrain), `PlayerInputHandler.js` (modified PointerLockControls — for our "flying-cam" we want freelook anyway), `Animator.js` (FSM-driven anim states: idle/walk/run/crouch/jump — map to hover/fly/dive/land for us), and `Physics.js`/`Collider.js`/`Ray.js` (Ammo wrapper; we may swap for Rapier WASM but the API shape is reusable).
- **Verdict:** `heavy-reference` — lift CDLOD pattern and the FSM animator wholesale.

### 5. Tacit1/threejs-openworld
- **License:** Unclear
- **Activity:** 0 stars, 8 commits, no releases. Stub-tier.
- **Stack:** Three.js + Vite (the `localhost:5173` is the tell). Just `main.js` + `counter.js` — looks like a stock Vite starter.
- **Lift:** Possibly the Vite-with-Three.js bootstrap config, but we can scaffold that in 30 seconds without reading this.
- **Verdict:** `skip-and-why` — too thin; appears to be a personal sketch.

### 6. forthtemple/openworldthreejs
- **License:** Unclear
- **Activity:** 17 stars, last release **August 2016**. ~10 years stale.
- **Stack:** Three.js (ancient version), PHP/MySQL server, OBJ + JSON model exports from Blender. No bundler.
- **Lift:** One genuinely interesting idea — **world coordinates + directional angles instead of local rotations**, which sidesteps gimbal/quaternion headaches for ground-based controls but is the *wrong* call for a flying superhero. Networking is HTTP-poll-every-second to MySQL; do not copy. Mobile virtual joystick layout is fine as a UI reference if we want touch support.
- **Verdict:** `skip-and-why` — too old, networking pattern is harmful, mechanics don't transfer to flight.

### 7. mauriciopoppe/Three.js-City
- **License:** Listed (file in repo) — likely MIT/permissive
- **Activity:** 225 stars, 63 forks. Built circa 2013 (Chrome v27 references). Abandoned.
- **Stack:** Three.js + Grunt + jQuery + AngularJS + Bootstrap. Legacy stack we should not adopt.
- **Lift:** Two specifically interesting bits in `T3/js/Application.js`: (a) **post-processing radial blur tied to speed** — perfect for our supersonic-flight effect, and (b) **particle rain system that tracks the player** — borrow the "follow-player particle emitter" pattern for sonic-boom contrails and high-altitude cloud-wisps. Skip Angular and everything else.
- **Verdict:** `light-reference` — extract the speed-blur shader + follow-emitter idea, ignore architecture.

### 8. lo-th/3d.city
- **License:** MIT
- **Activity:** 1.7k stars, 359 forks. Highest-engagement repo on the list.
- **Stack:** Three.js + micropolisJS sim, Web Workers for sim threading, WebGL2/WebGPU rendering paths, multiple build variants (standard / GPU-optimized / low-spec).
- **Lift:** Architectural gold for *perf engineering*: (a) **simulation in a Web Worker** so the 3D thread stays at 60fps — directly applicable to our city AI / traffic / NPC sim, (b) **multiple build variants by capability tier** — pattern for shipping a low-spec fallback without forking the codebase, (c) `dev_mapgen.html` + `dev_tile.html` — isolated dev harnesses for procgen modules (steal this convention for our procgen iteration). Specific procgen filenames live in `/src` but aren't named in README — worth grep'ing during implementation.
- **Verdict:** `heavy-reference` — best perf architecture on the list.

### 9. mattyfew/retro-express
- **License:** Unclear
- **Activity:** 7 stars, 57 commits, live demo at oxideous.com/retroexpress. Completed-feeling but small.
- **Stack:** Three.js + Express/Node for hosting. No bundler info.
- **Lift:** Flying-game UX patterns: 3 camera modes (1/2/3 keys = chase / cockpit / external) — useful for our "third-person flight" vs "first-person heat-vision" vs "cinematic" toggle. Shift-to-roll is a clean rotation-input mapping. README is thin on shader/terrain details, so this is mostly a UX-and-controls reference, not a tech reference.
- **Verdict:** `light-reference` — borrow camera-mode toggle and flight-input mapping.

---

## Quick Web Searches

**1. Three.js GPU-driven open world, 2025-2026.** WebGPU is now baseline in every major browser (Safari 26 shipped Sept 2025). Three.js r171+ has zero-config WebGPU imports with WebGL2 fallback. Reported wins of 2-10x on draw-call-heavy scenes; GPU-driven culling, compute-shader particle/physics sims, and large instanced meshes are the high-leverage primitives. World Labs' Spark 2.0 demonstrates streaming-LOD for 3DGS worlds on the open web — relevant if we ever consider Gaussian-splat skyboxes or distant-city impostors. ([Migrate Three.js to WebGPU](https://www.utsubo.com/blog/webgpu-threejs-migration-guide), [What's New in Three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed), [WebGPU Baseline](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default), [Spark 2.0 streaming 3DGS](https://www.worldlabs.ai/blog/spark-2.0))

**2. Babylon.js streaming open world, 2025-2026.** Babylon.js 9.0 added **LargeWorldRendering** (kills floating-point jitter at large coords — critical for citywide flight), a Geospatial Camera for globe-style navigation, and a `3DTilesRendererJS` integration for OGC 3D Tiles streaming. Pryme8's "Strategies for large terrains" forum thread is the canonical community pattern doc. We're not on Babylon, but the **LargeWorldRendering** technique (origin-rebasing / floating-origin) is engine-agnostic — we'll need it. ([Large World Rendering](https://forum.babylonjs.com/t/new-large-world-rendering/61114), [Strategies for large terrains](https://forum.babylonjs.com/t/strategies-for-large-terrains/8802), [Babylon.js 9.0 geospatial](https://blogs.windows.com/windowsdeveloper/2026/03/30/part-2-babylon-js-9-0-tooling-updates-and-new-geospatial-features/))

**3. Indie WebGPU open-world examples (2024-2026).** Soulbound (browser MMO, 2025) is the clearest "AAA-ish look in a browser" reference — pulls off hundreds of concurrent skill-fx without crashing the tab; worth a session of competitive teardown. Phaser 4 (beta end-of-2025) shipped WebGPU rendering; mostly 2D but worth knowing about. PlayCanvas remains the highest-fidelity WebGPU-first commercial engine demo bench. ([WebGPU Browser Games 2025](https://netgamex.com/blog/the-webgpu-browser-games-of-2025), [AAA in the browser via WebGPU](https://riven.ch/en/news/jeux-aaa-dans-le-navigateur-web-webgpu), [PlayCanvas](https://playcanvas.com/))

---

## Lifted Patterns Shortlist

1. **CDLOD streaming chunk centered on player** — from `OpenWorldJS/Terrain.js` + `TextureGen.frag`. Adapt for city tiles instead of terrain heights. Highest priority.
2. **Procgen pipeline order: terrain -> roads -> lots -> buildings -> camera-tour** — from `jstrait/city-tour` `/src` module split. Use as our `procgen/` directory blueprint.
3. **Web-Worker simulation thread separated from render thread** — from `lo-th/3d.city`. Run traffic, civilian AI, and city sim off the main thread.
4. **Multi-tier build variants (standard / gpu-optimized / low-spec)** — from `lo-th/3d.city`. Lets us ship one repo with capability-detected bundles.
5. **Isolated dev harnesses per procgen module** (`dev_mapgen.html`, `dev_tile.html`) — from `lo-th/3d.city`. Faster iteration than booting the whole game.
6. **FSM-driven animator with per-state transitions** — from `OpenWorldJS/Animator.js`. Map to hover/fly/dive/superhero-land for our character.
7. **Speed-tied radial post-process blur + follow-player particle emitter** — from `Three.js-City/T3/js/Application.js`. Drop-in supersonic-flight feel.
8. **Floating-origin / world-rebasing** — pattern from Babylon.js 9.0 LargeWorldRendering. Engine-agnostic; required for citywide flight without coordinate jitter.

Sources:
- [Migrate Three.js to WebGPU (2026)](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [What's New in Three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [WebGPU Baseline in Every Major Browser](https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default)
- [Spark 2.0 — Streaming 3DGS worlds on the web](https://www.worldlabs.ai/blog/spark-2.0)
- [Babylon.js Large World Rendering](https://forum.babylonjs.com/t/new-large-world-rendering/61114)
- [Babylon.js Strategies for Large Terrains](https://forum.babylonjs.com/t/strategies-for-large-terrains/8802)
- [Babylon.js 9.0 Geospatial Features](https://blogs.windows.com/windowsdeveloper/2026/03/30/part-2-babylon-js-9-0-tooling-updates-and-new-geospatial-features/)
- [WebGPU Browser Games of 2025](https://netgamex.com/blog/the-webgpu-browser-games-of-2025)
- [AAA Games in the Browser via WebGPU](https://riven.ch/en/news/jeux-aaa-dans-le-navigateur-web-webgpu)
- [PlayCanvas WebGPU Engine](https://playcanvas.com/)

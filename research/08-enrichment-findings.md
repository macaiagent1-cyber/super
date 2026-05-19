# Enrichment Findings — Web Research Pass (post-spec)

Run alongside Codex+Gemini reviews of the spec. These findings should drive spec revisions where they contradict prior research.

## 🚨 Critical revisions needed

### 1. `three-wfc` is 2D-ONLY, not the right pick for 3D city

**Source:** [github.com/Fennec-hub/three-wfc](https://github.com/Fennec-hub/three-wfc) README

> "🚧 Work in Progress 🚧"
> "Currently provides a robust **2D** WFC solver"
> 72 stars, 20 commits, no releases.

Gemini 2.5 Pro's earlier research recommended it for our 3D city — but it explicitly *does not* do 3D yet. Tile edge editor described as "a basic sketch." Adopting it would be a research-grade dependency on an early-stage 2D library.

**Spec revision:** Drop `three-wfc` from §3 tech stack. Replace with one of:

| Option | Cost | Quality |
|---|---|---|
| Port [marian42's WFC ModulePrototype algorithm](https://github.com/marian42/wavefunctioncollapse) (Unity C#, MIT, [blog](https://marian42.de/article/wfc/)) to JS | High — full reimplementation | Highest |
| Adapt the [WebGPU TSL hex-map WFC](https://felixturner.github.io/hex-map-wfc/article/) by Felix Turner | Medium — adapt grid topology | Medium |
| Grid kit-bash + seeded rotation/swap (no WFC) | Low — half a day | Acceptable |
| Defer WFC to v1.1; ship v1 with grid kit-bash | Lowest | Acceptable for v1 |

**Recommendation:** Ship v1 with **grid kit-bash + seeded variation**, defer WFC to v1.1. This is honest scope management — WFC is sophistication we *want* but don't *need* for slice 1.

---

### 2. WebGPU can be 2-4x SLOWER than WebGL for unbatched scenes (Three.js)

**Sources:**
- [Three.js forum: WebGPU performance issue](https://discourse.threejs.org/t/webgpu-performance-issue/87939)
- [Three.js GitHub issue #31055](https://github.com/mrdoob/three.js/issues/31055)
- [WebGL vs WebGPU performance gap (Galante)](https://gjgalante.medium.com/webgl-vs-webgpu-the-performance-gap-fbd121fb221a)

> Test: 5k-50k individual cubes (non-instanced). **WebGL: 350 FPS. WebGPU: 50 FPS.** 7x slower.
> Root cause: "UBO system has severe performance issues with many render items."
> Workaround: "Use instancing and batching whenever possible."

**Implication for Super:** Our spec already mandates `BatchedMesh` + `InstancedMesh2` (§5) — that's the GOOD case for WebGPU. But:
1. We should **benchmark in slice 1** before committing.
2. If our batched scene benchmarks WORSE than WebGL2, flip the primary.
3. The `webgpu-backend.js` and `webgl2-backend.js` split in §4 makes this swap trivial.

**Spec revision:** Add to §3 — "WebGPU primary *iff* slice-1 benchmark beats WebGL2 on our scene shape; otherwise WebGL2 primary, WebGPU as quality-preset opt-in."

---

### 3. Pin to Three.js r184+, not r183+

**Source:** [r184 release notes](https://github.com/mrdoob/three.js/releases/tag/r184)

r184 (March 2026) explicitly fixed **WebGPU render bundle reuse across render contexts** — which is the exact optimization Gemini cited from Apple Silicon WebGPU best practices (`GPURenderBundle` → Metal Indirect Command Buffers). Without r184, our planned optimization would be partly broken.

**Spec revision:** Change every reference of "Three.js r183+" to "Three.js r184+."

---

## 🟢 Findings that *strengthen* the spec (no revision needed, just stronger evidence)

### 4. Rapier 3D is 2-5x faster in 2026 vs 2024

**Source:** [Dimforge 2025 year in review](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/)

> "The fastest Rapier NPM package available today is between 2x and 5x faster than the fastest Rapier NPM package available in 2024."

New BVH with SIMD broad-phase. The `-simd-compat` variant is the right pick:
- `@dimforge/rapier3d-simd-compat` — SIMD optimized + WASM embedded in JS (bigger bundle, bundler-friendly)
- Alternative: `@dimforge/rapier3d-simd` — needs bundler that handles `.wasm` files

**Spec specificity:** Name `@dimforge/rapier3d-simd-compat` as the candidate (not just "Rapier"). Note: Rapier commitment still deferred per Codex's "physics library decide-later" — but the *candidate package* should be the SIMD-compat variant.

### 5. Three.js has an official Rapier character controller example

**Source:** [physics_rapier_character_controller.html](https://threejs.org/examples/physics_rapier_character_controller.html)

It's ground-based (slope handling, snap-to-ground) — **not** flight. But the capsule-collision + Rapier-integration patterns transfer directly. Use as a starting point for `hero/hero-ground-move.js`, then extend for flight.

### 6. NYT `rd-bundler-3d-plugins` for Vite asset pipeline

**Source:** [github.com/nytimes/rd-bundler-3d-plugins](https://github.com/nytimes/rd-bundler-3d-plugins) (Apache 2.0)

A Vite (and Rollup) plugin for gltf-transform. Build-time GLB optimization: Draco + Meshopt + texture compression + prune + dedup in one chain. **Caveat:** uses Sharp for textures, not KTX2 explicitly — we'd need to add a separate KTX2 step OR custom transform. Worth adopting for Draco/Meshopt/prune/dedup; KTX2 stays a separate `toktx` build step.

### 7. Cape sim: Bandinopla's compute-shader+skeletal blend (Feb 2026)

**Source:** [Simple Cloth Simulation with Three.js and Compute Shaders on skeletal animated meshes](https://medium.com/@pablobandinopla/simple-cloth-simulation-with-three-js-and-compute-shaders-on-skeletal-animated-meshes-acb679a70d9f)

Recent (Feb 2026) tutorial showing how to blend cloth-sim positions with skinned-mesh positions via vertex paint factor. This is **the missing piece** that made Gemini doubt GPU compute Verlet feasibility — there's now a documented blend pattern.

**Spec revision (optional):** Soften the "GPU compute Verlet has no production-ready examples" claim in §3 cape-sim row. Bandinopla's article changes that. The bone-driven recommendation for v1 still stands (simpler, faster to ship), but the v1.1 upgrade path is now more concrete.

### 8. M5 GPU is 31% faster than M4, 1.5x faster ray-tracing in Blender

**Sources:** [Apple M5 announcement](https://www.apple.com/newsroom/2026/03/apple-introduces-the-new-macbook-air-with-m5/), [Sean Kim M5 review](https://blog.imseankim.com/macbook-air-m5-review-gpu-boost-thunderbolt-5-wifi-7-upgrade-from-m4-2026/), [Axis Intelligence M5 analysis](https://axis-intelligence.com/apple-m5-chip-technical-analysis-benchmarks/)

153 GB/s unified memory bandwidth (up from 120 on M4). Our perf budget of 1.8M tris / 180 draws / 12 ms target was sized conservatively — we likely have headroom. Good problem to have.

---

## 🟡 Optional reference resources

- **Marian's procedural city blog post:** [marian42.de/article/wfc/](https://marian42.de/article/wfc/) — the canonical WFC-for-cities explainer
- **The Coding Train WFC tutorials:** [thecodingtrain.com/challenges/171-wave-function-collapse](https://thecodingtrain.com/challenges/171-wave-function-collapse/) — educational, p5.js-based, good for understanding the algorithm before porting
- **WFC tips and tricks (Boris the Brave):** [boristhebrave.com/2020/02/08/wave-function-collapse-tips-and-tricks/](https://www.boristhebrave.com/2020/02/08/wave-function-collapse-tips-and-tricks/) — practical pitfalls
- **Felix Turner WFC hex-map (Three.js + WebGPU + TSL):** [felixturner.github.io/hex-map-wfc/article/](https://felixturner.github.io/hex-map-wfc/article/) — closest published reference to what we'd want to build
- **Three.js fly-controls example:** [misc_controls_fly.html](https://threejs.org/examples/misc_controls_fly.html) — baseline for flight input wiring (we'll replace the controller logic but it shows how input + camera + scene get composed)
- **NYT bundler plugin:** [nytimes/rd-bundler-3d-plugins](https://github.com/nytimes/rd-bundler-3d-plugins) — Vite asset pipeline starting point

---

## Summary table — what changes in the spec

| § | Current spec | Revised | Severity |
|---|---|---|---|
| 3 | "Three.js r183+" | "Three.js r184+" | MINOR |
| 3 | "WebGPU primary; WebGL2 fallback" | "WebGPU primary IFF benchmarks beat WebGL2 in slice-1; otherwise flip" | MAJOR |
| 3 | "`three-wfc` for procgen, grid fallback" | "Grid kit-bash v1, WFC deferred to v1.1 (marian42 port reference)" | MAJOR |
| 3 | "Physics: collision facade; Rapier WASM as candidate" | "...candidate package: `@dimforge/rapier3d-simd-compat`" | MINOR |
| 7 | Vite plugin not specified | "NYT `rd-bundler-3d-plugins` for Draco/Meshopt; `toktx` separate for KTX2" | MINOR |
| 3 | "Cape: GPU compute Verlet has no Three.js examples (defer)" | "Bandinopla Feb 2026 article documents the blend pattern; v1.1 upgrade is more concrete" | NIT |

Total: 2 MAJOR, 3 MINOR, 1 NIT — to merge with Codex+Gemini review feedback.

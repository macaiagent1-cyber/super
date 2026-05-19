# AAA Web 3D Technique Shortlist for Super

Target platform: MacBook Air M5 (16 GB unified, 8-core GPU, Metal 4) at 1440x900, 60 FPS. Renderer: Three.js r183+ `WebGPURenderer` with the new node-based `RenderPipeline` (auto WebGL2 fallback). Frame budget = 16.6 ms; we reserve ~8 ms for scene draw, ~6 ms for postprocessing, ~2 ms for CPU/JS, so any single effect over 2 ms gets scrutinized hard.

## Technique table

| # | Technique | What it does | Reference | Cost (M5 @ 1440x900) | Verdict |
|---|-----------|--------------|-----------|----------------------|---------|
| 1a | **TAA** | Jittered camera samples accumulated across frames; best AA + free supersampling | `examples/webgl_postprocessing_taa.html` ([source](https://threejs.org/examples/webgl_postprocessing_taa.html)) | 0.5–2 ms | **ship** — best quality/cost ratio, hides foliage/aliased thin geometry on the city skyline |
| 1b | MSAA | Hardware multisample at geometry edges only | `WebGPURenderer({ antialias: true, samples: 4 })` ([forum](https://discourse.threejs.org/t/add-post-processing-in-the-context-of-web-gpu-and-use-msaa-anti-aliasing/78274)) | 0.5–1 ms | **skip** — incompatible with deferred-style postprocessing chain; no shader-aliasing fix |
| 1c | SMAA | Morphological post AA, no temporal data | `examples/webgpu_postprocessing_smaa.html` ([source](https://threejs.org/examples/webgpu_postprocessing_smaa.html)) | <0.5 ms | **defer** — fallback when TAA ghosts on the cape or HUD |
| 1d | FXAA | Single-pass luminance blur AA | `examples/webgl_postprocessing_fxaa.html` ([source](https://threejs.org/examples/webgl_postprocessing_fxaa.html)) | <0.5 ms | **skip** — too blurry for hero close-ups |
| 2a | **GTAO** | Ground-Truth Ambient Occlusion (horizon-based) — contact shadows in alley crevices, under awnings | `examples/webgpu_postprocessing_ao.html` + `GTAONode` from `three/addons/tsl/display/GTAONode.js` ([docs](https://threejs.org/docs/pages/GTAONode.html)) | 1–2 ms | **ship** — physically motivated, looks right in dense urban geometry; watch out for the known `logarithmicDepthBuffer` incompatibility ([issue 29797](https://github.com/mrdoob/three.js/issues/29797)) |
| 2b | SSAO | Classic screen-space AO | `examples/webgl_postprocessing_sao.html` | 1–2 ms | **skip** — GTAO is strictly better at same cost |
| 2c | SAO | Scalable AO | three addons SAOPass | 1–2 ms | **skip** — superseded by GTAO node |
| 3 | **SSR** | Screen-space reflections on wet asphalt + glass curtain walls | `examples/webgpu_postprocessing_ssr.html` ([source](https://threejs.org/examples/webgpu_postprocessing_ssr.html)) | 2–4 ms | **ship** at half-res — keystone "AAA" effect for a flying city game; budget half-res buffer + low ray count |
| 4a | **Bloom (TSL node)** | Hot-pixel bleed for neon/sun glints | `bloom()` node in `RenderPipeline` ([guide](https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026)) | <0.5 ms | **ship** — cheap, sells HDR sun |
| 4b | **ACES tonemap** | Filmic curve, slight saturation crush | `THREE.ACESFilmicToneMapping` ([toneMapping docs](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.toneMapping)) | free | **defer as toggle** — classic AAA look |
| 4c | **AgX tonemap** | Blender 4.0 default, better hue stability in highlights ([overview](https://discourse.threejs.org/t/tone-mapping-overview/75204)) | `THREE.AgXToneMapping` | free | **ship** — best default for a sunlit open world, the cape's reds won't go orange |
| 4d | PBR Neutral | Khronos curve that preserves product-color saturation | `THREE.NeutralToneMapping` ([modelviewer ref](https://modelviewer.dev/examples/tone-mapping)) | free | **skip** — designed for ecommerce, too flat for a hero game |
| 5 | **Cascaded Shadow Maps** | Sun shadows with near-camera detail and distant coverage | `examples/webgl_shadowmap_csm.html` ([source](https://threejs.org/examples/webgl_shadowmap_csm.html)) + `three-csm` ([github](https://github.com/StrandedKitty/three-csm)) | 2–4 ms (4 cascades @ 2048) | **ship** — mandatory; sun is the dominant light and the camera moves kilometers |
| 6a | **Volumetric clouds (raymarched)** | Sphere-traced 3D-noise cumulus you can fly through | `examples/webgpu_volume_cloud.html` ([source](https://threejs.org/examples/webgpu_volume_cloud.html)) or `@takram/three-clouds` ([repo](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds)) | 3–5 ms half-res | **defer to v1.1** — gorgeous but the most expensive single effect; ship a stylized version later |
| 6b | **Imposter cloud quads** | Flat textured billboards over a gradient sky | manual w/ `Sprite` + soft particles | <0.5 ms | **ship for v1** — covers 90% of the visual win for 5% of the cost |
| 7 | **Sky + atmospheric scattering** | Rayleigh/Mie sky dome with sun direction driving lighting | `examples/webgl_shaders_sky.html` + `Sky` addon ([docs](https://threejs.org/docs/pages/Sky.html)); upgrade path: `@takram/three-atmosphere` ([repo](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere)) | <0.5 ms (addon) | **ship** — drives time-of-day mood essentially free |
| 8 | **Depth of Field (Bokeh)** | Cinematic blur for landing zooms and photo mode | `BokehPass` ([docs](https://threejs.org/docs/pages/BokehPass.html)) or `examples/webgl_postprocessing_dof2.html` ([source](https://threejs.org/examples/webgl_postprocessing_dof2.html)) | 1–2 ms when enabled | **defer to cinematic camera** — only fires during scripted landings/photo mode, never during gameplay |
| 9 | **Motion blur (per-object + camera)** | Velocity-buffer smear; sells flight speed | `examples/webgpu_postprocessing_motion_blur.html` ([source](https://threejs.org/examples/webgpu_postprocessing_motion_blur.html)); ref: gkjohnson sandbox ([demo](https://gkjohnson.github.io/threejs-sandbox/motionBlurPass/webgl_postprocessing_perobjectmotionblur.html)) | 1–2 ms | **ship** at low sample count — the *single* effect that conveys "you are moving at 200 mph" |
| 10 | **GPU instancing — BatchedMesh + InstancedMesh2** | One draw call for hundreds of building variants, cars, pedestrians | `BatchedMesh` ([docs](https://threejs.org/docs/pages/BatchedMesh.html)); `@three.ez/instanced-mesh` ([repo](https://github.com/agargaro/instanced-mesh)) for per-instance frustum cull + BVH + LOD | budget-saving, not a cost | **ship** — non-negotiable; without it you cannot draw a city. Use BatchedMesh for varied buildings, InstancedMesh2 for cars/people |
| 11 | **Frustum + occlusion culling** | Skip what the camera can't see | Three.js default frustum cull is free; add `@three.ez/instanced-mesh` BVH for per-instance culling. No native HW occlusion in WebGPU yet ([issue 32305](https://github.com/mrdoob/three.js/issues/32305)) | budget-saving | **ship frustum** / **defer occlusion** — software Hi-Z is too much engineering for v1; rely on aggressive LOD + view-distance fog instead |
| 12 | **Mesh LOD (manual + auto)** | Swap to lower-tri meshes at distance | `THREE.LOD` for hero models; `InstancedMesh2` LOD groups for buildings; bake LODs offline with gltf-transform `meshopt`/`simplify` | budget-saving | **ship** — three discrete LODs per building, distance bands tuned to flight altitude |
| 13 | **KTX2 / Basis Universal textures** | GPU-compressed transcoded textures (BC7 on Mac), 4-8x VRAM savings vs PNG | `KTX2Loader` ([docs](https://threejs.org/docs/pages/KTX2Loader.html)); offline compress with `basisu` or `gltf-transform uastc` | budget-saving (VRAM + upload time) | **ship** — KTX2 over WebP every time; M5 has 16 GB unified so VRAM is shared with the OS, be a good citizen |
| 14 | **Color grading via 3D LUT** | 32³ or 64³ LUT applied as final post step; lets the art director tune the look in Photoshop | `examples/webgpu_postprocessing_3dlut.html` ([source](https://threejs.org/examples/webgpu_postprocessing_3dlut.html)); `LUTPass` ([PR 20558](https://github.com/mrdoob/three.js/pull/20558)) | <0.5 ms | **ship** — single biggest "looks pro" upgrade per millisecond spent |
| 15a | **Cape physics — WebGPU compute (Verlet)** | GPU-resident cloth solved in TSL compute shader | `examples/webgpu_compute_cloth.html` ([source](https://threejs.org/examples/webgpu_compute_cloth.html)); pattern: `three-simplecloth` ([repo](https://github.com/bandinopla/three-simplecloth)) | <0.5 ms for ~1k particles | **ship** — perfect fit; cape is one mesh, runs entirely on GPU, no CPU/GPU sync per frame |
| 15b | Vertex-shader bone-driven cape | Cheap fake, sine-wave displacement | custom shader | free | **skip** — looks like a 2007 cape; the user explicitly wants impressive |
| 15c | CPU Verlet | JS-side particle sim | hand-rolled | 1–3 ms CPU | **skip** — wastes the main thread on a problem the GPU solves trivially |
| 16 | **IBL / HDRI environment map** | Pre-filtered roughness mipmaps light all PBR materials from a single HDR | `examples/webgl_materials_envmaps_hdr.html` ([source](https://threejs.org/examples/webgl_materials_envmaps_hdr.html)); `RGBELoader` + `PMREMGenerator` | <0.5 ms one-time prefilter at scene load | **ship** — required for PBR materials to look correct; swap HDRIs per time-of-day |

## Recommended Launch Stack (v1)

Ship these six core effects + two supporting systems on day one. Total post budget ~6–8 ms, leaving the scene pass ~8 ms.

1. **AgX tonemapping** (free, ship default)
2. **HDRI / IBL via PMREM** (<0.5 ms, required for PBR)
3. **Cascaded Shadow Maps**, 4 cascades @ 2048 (2–4 ms — the single biggest lighting tell)
4. **GTAO** (1–2 ms — sells contact between hero and ground)
5. **SSR at half-res** on flagged materials only: wet streets, glass towers (2–4 ms — the "wow" effect for a flying camera)
6. **TAA + Bloom + 3D LUT** as a fused post chain (~1–2 ms total)
7. **Motion blur**, low samples, camera + per-object (1–2 ms — sells flight speed)
8. **GPU compute cape** via TSL Verlet (<0.5 ms — character read)

Supporting (not "effects" but mandatory infra): **BatchedMesh + InstancedMesh2 + LOD + KTX2 textures + Sky addon + imposter clouds.** These pay for the budget the effects above consume.

Deferred to v1.1: volumetric clouds (replace imposters when we have budget), full atmospheric scattering via `@takram/three-atmosphere`, Bokeh DoF (cinematic camera only), SMAA fallback (only if TAA ghosts).

Sources:
- [Three.js Post-Processing Guide 2026](https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026)
- [Three.js examples index](https://threejs.org/examples/)
- [three-csm by StrandedKitty](https://github.com/StrandedKitty/three-csm)
- [InstancedMesh2 by agargaro](https://github.com/agargaro/instanced-mesh)
- [takram three-geospatial monorepo](https://github.com/takram-design-engineering/three-geospatial)
- [Tone Mapping Overview forum thread](https://discourse.threejs.org/t/tone-mapping-overview/75204)
- [BatchedMesh and WebGPURenderer (Codrops)](https://tympanus.net/codrops/2024/10/30/interactive-3d-with-three-js-batchedmesh-and-webgpurenderer/)
- [Field Guide to TSL and WebGPU (Maxime Heckel)](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)

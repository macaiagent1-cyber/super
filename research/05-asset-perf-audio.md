# Super Asset / Audio / Perf Plan v0.1

Target: MacBook Air M5 (10c CPU / 8c GPU / 16 GB unified / Metal 4) at **60 FPS @ 1440x900**, Three.js + WebGPU, vanilla JS ES modules, Vite. AAA-ish look on a CC0-heavy diet.

---

## 1. Asset sourcing (CC0 / permissive)

### Hero character (rigged, with cape)
**Winner: Meshy.ai (paid tier, $20/mo Hobbyist) for hero prototype, swap to artist-tweaked later.**
- [Meshy.ai](https://www.meshy.ai/) — Free = CC BY 4.0 (attribute Meshy); paid = full ownership. Use text-to-3D for a stylized "Super" silhouette, then auto-rig. Export GLB. **License: paid private.**
- [CC0 Block Man Auto Rigged Humanoid (Sketchfab)](https://sketchfab.com/3d-models/cc0-block-man-auto-rigged-humanoid-55571b5d47614b4c9973e853fc6b6a72) — CC0, 25 bones, GLB. **Backup hero / stand-in during boot-time-asset-missing fallback.**
- Cape is **not** in either — author separately in Blender (cloth-sim mesh, ~24 bones).

### Hero animations
**Winner: Mixamo, full stop.**
- [Mixamo](https://www.mixamo.com/) (Adobe) — Free, royalty-free for commercial, no attribution. Cannot redistribute as standalone. Grab: `Flying Idle`, `Flying Forward`, `Punching`, `Throw`, `Hard Landing`, `Dodge Left/Right`, `Standing Idle 02` (for heat-vision pose, retargeted with constraints). Export FBX → convert to GLB via gltf-transform.
- Skip Cascadeur Free — FBX export is **paid-only**. Not worth it for v0.1.

### City building kits
**Winner: Kenney City Kit family + Quaternius for variety.**
- [Kenney City Kit (Commercial)](https://kenney.nl/assets/city-kit-commercial), [Industrial](https://kenney.nl/assets/city-kit-industrial), [Suburban](https://kenney.nl/assets/city-kit-suburban), [Roads](https://kenney.nl/assets/city-kit-roads) — all **CC0**, GLB/FBX/OBJ. ~185 modular pieces total. Snappable on a 4m grid. **Primary city kit.**
- [Quaternius Ultimate Buildings](https://quaternius.com/packs/ultimatetexturedbuildings.html) — CC0, atlas-textured. **Use for hero-skyline landmarks Kenney can't supply.**
- [Quaternius Modular Streets](https://quaternius.com/packs/modularstreets.html) — CC0, complements Kenney roads.

### Vehicles
**Winner: Kenney Car Kit.**
- [Kenney Car Kit](https://kenney.nl/assets/car-kit) — CC0, GLB, ~30 vehicles (sedan, taxi, truck, bus, ambulance). Atlas-textured.
- [Quaternius Cars](https://quaternius.com/packs/cars.html) — CC0, lower-poly, **use as distant LOD2.**

### Civilians
**Winner: Quaternius People, instanced.**
- [Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html) — CC0, atlas, ~50 pre-built variants. **Primary civilian asset.**
- Mixamo random rigged characters — **only the named hero**; civilians stay non-rigged crowd-sim billboards beyond 80m to save bones.
- [100 Avatars R2 CC0 Pack](https://sketchfab.com/3d-models/100-avatars-r2-cc0-character-pack-80cb24ac52cb4e839930aaa12314f716) by Polygonal Mind — CC0, crowd fill.

### Props
**Winner: Kenney Urban + Poly Pizza CC0 filter for one-offs.**
- [Kenney Urban Kit](https://kenney.nl/assets/urban-kit) — CC0, lampposts, hydrants, signs, dumpsters, benches. ~70 pieces.
- [Poly Pizza CC0 search](https://poly.pizza/search/CC0) — CC0 individual props, GLB/OBJ. Use for: scaffolding, AC units, satellite dishes Kenney lacks.

### Skybox / HDRI
**Winner: Poly Haven, two HDRIs only.**
- [Poly Haven HDRIs](https://polyhaven.com/hdris) — **CC0**, 16k unclipped. Pick one daylight (`belfast_sunset_puresky`) and one dusk (`cloud_layers`). Downsample to 2k EXR for skybox + 256x128 for ambient probe / IBL prefilter.

### Sound FX
**Winner: Sonniss GDC bundles, archived.**
- [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) — Royalty-free perpetual license, unlimited projects, no attribution required. **AI/ML training forbidden — fine for us.** Grab 2020–2024 bundles (160+ GB total; cherry-pick whoosh/impact/cloth/wind/explosion/foley).
- [Freesound](https://freesound.org/) filtered to CC0 — backup, niche sounds (e.g., heat-vision sizzle).

### Music
**Winner: Kevin MacLeod CC-BY, with attribution scrolled at credits.**
- [incompetech.com](https://incompetech.com/) — CC-BY 4.0. Format: `"Title" Kevin MacLeod (incompetech.com) Licensed CC BY 4.0`. 4 tracks max: hub theme, flight loop, combat stinger, victory.
- Backup: [Free Music Archive](https://freemusicarchive.org/) CC0 filter.

---

## 2. Format & compression pipeline

**Geometry: GLB + Meshopt (NOT Draco).**
Reason: Meshopt compresses geometry + morph targets + keyframe animation; Draco only compresses static geometry. Hero has cape blendshapes + skeletal anim — Draco can't help. Meshopt decoder is ~30 KB WASM, decodes 4-10x faster than Draco at similar ratios. Pipeline: source FBX/GLB → `gltf-transform optimize --compress meshopt --texture-compress ktx2 input.glb output.glb`. For city kit pieces (static): same flag still wins on decode speed. **Target: 70-85% size reduction.**

**Textures: KTX2 / Basis Universal, UASTC for normals, ETC1S for albedo/roughness.**
Reason: GPU-resident compressed (BCn on M5 via Metal); faster GPU upload, ~4x less VRAM than PNG/WebP equivalents at near-PNG quality. Tool: `toktx --t2 --encode uastc --uastc_quality 2 --zcmp 18` for normal/data maps; `toktx --t2 --encode etc1s --clevel 4 --qlevel 192` for color. WebP only as authoring intermediate. PNG banned from runtime. **All textures power-of-two, max 2048; hero face 1024; cape 512; civilians atlased into a single 2048.**

**Audio: Opus in WebM container for SFX, Opus for music too.**
Opus beats OGG Vorbis and MP3 on quality-per-bit at 64-96 kbps and is supported in all modern browsers (Safari 17+ included on macOS — confirmed for M5 Air). **SFX audio sprite: bundle ~80 short SFX into 2-3 Opus sprite files** via `audiosprite` CLI, fed into Howler.js with the sprite manifest. Music as separate streamed files. Bitrates: SFX 96 kbps mono, music 128 kbps stereo.

**Loading: Tiered, with a splash + playable-prelude.**
- **Boot bundle (preload, < 8 MB gz):** hero GLB, hero idle+flight anim, sky HDRI 2k, UI textures, 1 music track, audio sprite #1 (UI + flight loop). Target: < 3 s on 50 Mbps.
- **Streamed:** city districts, vehicle/civilian pools, combat anims, audio sprite #2/#3, second music track. Begin streaming behind a 5-second animated splash with hero idle-flying over a procedural skybox (no city yet — fakes loading screen).
- **Lazy:** ragdoll physics shapes, particle texture atlas #2, victory music — fetched after first 30 s of gameplay.

---

## 3. Perf budget — M5 Air @ 60 FPS @ 1440x900

Budget is per-frame (16.6 ms total). Aim for **12 ms** to leave headroom for thermal throttle.

| Resource | Budget | Notes |
|---|---|---|
| **Visible tris** | **1.8M** | Hero 35k, cape 8k, 60 buildings @ 8k avg = 480k, 40 vehicles instanced @ 5k = 200k, 80 civilians LODed @ 2.5k = 200k, props 150k, sky/clouds 50k, FX 200k, slack 500k. |
| **Draw calls** | **180** (hard cap 220) | InstancedMesh for vehicles/civilians/props/buildings collapses thousands of objects into ~30 draws. Hero ~6 (body, cape, eyes, FX). UI 10. Postprocess 8. Distant city as a single merged BatchedMesh = 1. |
| **Texture VRAM** | **600 MB** (of ~4 GB practical budget within 16 GB unified) | All KTX2, mipmapped. Atlasing aggressive. Streaming evicts. |
| **Shadow maps** | **CSM, 3 cascades @ 1024² each** | 12 MB total. PCF 3x3. Hero + ~4 nearest buildings cast; everything else receives only. Distant sky-shadow baked into HDRI lighting. |
| **Active particles** | **2,000** | GPU-driven (compute shader via TSL/WGSL). Heat vision: 300. Flight contrail: 200. Explosion: 800 burst. Ambient debris: 200. Sparks: 500. |
| **Cape bones** | **24 bones, 2 substeps** | Verlet on CPU worker; ~0.4 ms. Wind field updated 30 Hz. Distance cull > 60 m → freeze to last pose. |
| **Physics bodies** | **120 active rigid** (Rapier3D WASM) | Hero capsule, ~30 vehicles in 200 m radius (kinematic until interacted), ~20 destructibles, ~70 debris from last explosion (auto-despawn 5 s). Static colliders are merged trimeshes per district. |
| **Audio voices** | **24 concurrent** via Howler.js Web Audio backend | Pool: SFX min 8 / max 24, music min 1 / max 2. Voice-stealing by priority + distance. Spatial pan + distance attenuation on hero-relative sounds. |
| **Postprocess** | **2.5 ms** | TAA 0.8, bloom (1 down + 3 mip blur) 0.7, tone-map + color grade 0.3, vignette/chromatic 0.2, motion-blur (camera-only, 4 samples) 0.5. Skip DoF, skip SSR (reflections from probe), skip SSAO (bake AO into albedo). |

---

## 4. LOD + streaming strategy

**LOD counts**
- **Hero**: 1 LOD (always close). Cape has a simulated LOD0 + static-mesh LOD1 swap at 50 m.
- **Nearby buildings (< 150 m)**: LOD0 (full detail, 8-15k tris) + LOD1 (4k) at 80 m.
- **Distant buildings (150-600 m)**: LOD2 (1.5k) + LOD3 (impostor billboard) at 400 m. Beyond 600 m: merged BatchedMesh "skyline silhouette" (1 draw call, ~30k tris).
- **Civilians**: LOD0 rigged (2.5k) within 40 m, LOD1 simplified rigged (1k) to 80 m, LOD2 animated impostor billboard beyond 80 m. Hard-cull at 150 m.
- **Vehicles**: LOD0 (5k) to 120 m, LOD1 (1.5k) beyond, hard-cull at 400 m.

**Streaming policy**
- **District-based, NOT pure camera-distance.** Divide city into 8 districts of ~300 m². Each district = one GLB chunk (10-20 MB). Hero position + velocity drives preload of the 3 districts in flight path; current + 2 ring-neighbors stay resident.
- **Frustum + occlusion culling** on top (Three.js `Frustum` + custom Hi-Z cull via compute pass).
- Vehicles + civilians = **per-district instance pools**, populated on district load, returned to pool on unload.

**Eviction policy**
- LRU on textures and GLB chunks above 800 MB resident asset budget. Hero, UI, sky, audio sprites are **pinned** (never evicted).
- Cooldown of 8 s before re-loading a recently evicted district (prevents thrash when hero pivots).

**Preload order at boot**
1. UI fonts + atlas (200 KB)
2. Hero GLB + skeleton + idle/flight anims (2.5 MB)
3. Sky HDRI 2k + IBL prefilter (1.5 MB)
4. Audio sprite #1 (UI + flight loop + 1 music track), ~2 MB Opus
5. Starting district GLB (~12 MB)
6. *Splash dismissible — gameplay begins.*
7. **Async**: combat anims, audio sprite #2, ring-neighbor districts, particle atlases, ragdoll physics shapes
8. **Lazy on first combat**: audio sprite #3 (impacts/explosions), victory music

**Boot target: 6-8 s on 50 Mbps to first interaction, < 3 s on Gigabit.**

import * as THREE from 'three';

export const sceneRoots = {
  world: new THREE.Scene(),
  hero: new THREE.Scene(),
  vfx: new THREE.Scene(),
  ui: new THREE.Scene()
};

// World scene often contains everything, but we can separate for rendering passes
// For v1, we'll mainly use world for everything and hero for specific hero needs if any.
// Actually, standard practice in Three is often one scene with groups.
// But the spec says "scene-roots.js: Defines scene roots and layer masks... Prevents every system from owning ad hoc THREE.Scene state."

export const layers = {
  DEFAULT: 0,
  HERO: 1,
  WORLD: 2,
  VFX: 3,
  UI: 4
};

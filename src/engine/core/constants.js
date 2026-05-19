export const TILE_SIZE = 100;
export const DISTRICT_SIZE = 3; // 3x3 tiles
export const WORLD_UP = [0, 1, 0];

export const COLLISION_LAYERS = {
  DEFAULT: 1,
  HERO: 2,
  WORLD: 4,
  PROPS: 8,
  TRAFFIC: 16,
  CIVILIANS: 32,
  THREATS: 64
};

export const PHYSICS_STEP = 1 / 60;
export const MAX_DT = 0.1;

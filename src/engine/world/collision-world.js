export function createCollisionWorld() {
  const aabbs = [];

  return {
    aabbs,
    addAabb(aabb) {
      aabbs.push(aabb);
    },
    addBuildings(buildings) {
      for (const building of buildings) {
        const halfX = building.size.x / 2;
        const halfZ = building.size.z / 2;
        aabbs.push({
          min: { x: building.position.x - halfX, y: 0, z: building.position.z - halfZ },
          max: { x: building.position.x + halfX, y: building.size.y, z: building.position.z + halfZ },
          tag: 'building',
        });
      }
    },
    resolveCapsule(position, radius, height) {
      const floorY = radius + height / 2;
      if (position.y < floorY) {
        return {
          position: { ...position, y: floorY },
          hitGround: true,
        };
      }
      return { position, hitGround: false };
    },
    raycast(origin, direction, maxDistance) {
      let best = null;
      for (const aabb of aabbs) {
        const hit = rayAabb(origin, direction, aabb, maxDistance);
        if (hit && (!best || hit.distance < best.distance)) best = hit;
      }
      return best;
    },
  };
}

function rayAabb(origin, direction, aabb, maxDistance) {
  // Slab method. tMin must start at -Infinity so rays whose origin is INSIDE
  // the AABB still register a near-plane intersection (their hit distance is
  // clamped to 0 below). Starting tMin at 0 produced bogus 0-distance hits
  // whenever the hero capsule clipped a building corner.
  let tMin = -Infinity;
  let tMax = maxDistance;
  for (const axis of ['x', 'y', 'z']) {
    const inv = 1 / (direction[axis] || 1e-9);
    let t1 = (aabb.min[axis] - origin[axis]) * inv;
    let t2 = (aabb.max[axis] - origin[axis]) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMax < tMin) return null;
  }
  // Reject hits that ended behind the origin (both slabs in the negative-t).
  if (tMax < 0) return null;
  // Clamp to ≥0 so rays starting inside the AABB report point=origin.
  const hitDistance = Math.max(0, tMin);
  return {
    distance: hitDistance,
    point: {
      x: origin.x + direction.x * hitDistance,
      y: origin.y + direction.y * hitDistance,
      z: origin.z + direction.z * hitDistance,
    },
    tag: aabb.tag,
    aabb,
  };
}

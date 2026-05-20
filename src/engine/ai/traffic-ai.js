import * as THREE from 'three';
import { WORLD } from '../core/constants.js';

const ROAD_CENTERS = [-WORLD.tileSize, 0, WORLD.tileSize];
const ROUTE_LIMIT = WORLD.tileSize * 1.45;
const LANE_OFFSETS = [-5.25, -1.75, 1.75, 5.25];

export function createTrafficSystem({ scene, count = 8, csm = null }) {
  const group = new THREE.Group();
  group.name = 'traffic';
  scene.add(group);

  const trafficGeo = new THREE.BoxGeometry(2.0, 1.0, 4.4);
  const cars = [];

  for (let i = 0; i < count; i += 1) {
    const color = new THREE.Color().setHSL((i * 0.31) % 1, 0.7, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
    if (csm) csm.setupMaterial(mat);

    const mesh = new THREE.Mesh(trafficGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const horizontal = i % 2 === 0;
    const dir = (i % 4) < 2 ? 1 : -1;
    const roadCenter = ROAD_CENTERS[Math.floor(i / 2) % ROAD_CENTERS.length];
    const offset = LANE_OFFSETS[i % LANE_OFFSETS.length];
    const routePosition = -ROUTE_LIMIT + ((i + 0.5) / count) * ROUTE_LIMIT * 2;

    const car = {
      mesh,
      horizontal,
      offset,
      dir,
      speed: 6 + (i % 3) * 2,
      roadCenter,
    };

    if (horizontal) {
      mesh.position.set(routePosition, 0.6, roadCenter + offset);
      mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      mesh.position.set(roadCenter + offset, 0.6, routePosition);
      mesh.rotation.y = dir > 0 ? 0 : Math.PI;
    }

    cars.push(car);
  }

  return {
    update(dt) {
      for (const car of cars) {
        if (car.horizontal) {
          car.mesh.position.x += car.dir * car.speed * dt;
          car.mesh.position.z = car.roadCenter + car.offset;
          car.mesh.position.y = 0.6;
          car.mesh.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (car.mesh.position.x > ROUTE_LIMIT) car.mesh.position.x = -ROUTE_LIMIT;
          if (car.mesh.position.x < -ROUTE_LIMIT) car.mesh.position.x = ROUTE_LIMIT;
        } else {
          car.mesh.position.z += car.dir * car.speed * dt;
          car.mesh.position.x = car.roadCenter + car.offset;
          car.mesh.position.y = 0.6;
          car.mesh.rotation.y = car.dir > 0 ? 0 : Math.PI;
          if (car.mesh.position.z > ROUTE_LIMIT) car.mesh.position.z = -ROUTE_LIMIT;
          if (car.mesh.position.z < -ROUTE_LIMIT) car.mesh.position.z = ROUTE_LIMIT;
        }
      }
    },
  };
}

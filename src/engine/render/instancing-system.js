import * as THREE from 'three';

export function clusterBuildingsForBatches(buildings, maxBatches = 5) {
  const sorted = [...buildings].sort((a, b) => a.size.y - b.size.y);
  const clusters = Array.from({ length: Math.min(maxBatches, sorted.length) }, () => []);
  sorted.forEach((building, index) => {
    clusters[index % clusters.length].push(building);
  });
  return clusters.filter(cluster => cluster.length > 0);
}

export function addBatchedBuildings(scene, buildings) {
  const clusters = clusterBuildingsForBatches(buildings, 5);
  const meshes = [];

  for (const cluster of clusters) {
    const group = new THREE.Group();
    group.name = 'building-batch';
    for (const building of cluster) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(building.size.x, building.size.y, building.size.z),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(building.color), roughness: 0.84 })
      );
      mesh.position.set(building.position.x, building.position.y, building.position.z);
      group.add(mesh);
    }
    scene.add(group);
    meshes.push(group);
  }

  return meshes;
}

export function addRoadMeshes(scene, roads) {
  const meshes = [];
  for (const road of roads) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(road.size.x, road.size.y, road.size.z),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(road.color), roughness: 0.95 })
    );
    mesh.position.set(road.position.x, road.position.y, road.position.z);
    scene.add(mesh);
    meshes.push(mesh);
  }
  return meshes;
}

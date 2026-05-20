import * as THREE from 'three';

/**
 * Heat vision system. Held button -> continuous ray from hero head forward.
 * Tracks active time, emits beam mesh, places scorch decals on hit surfaces.
 */
export function createHeatVisionSystem({ scene, physicsWorld, eventBus = null }) {
  const beamGeometry = new THREE.CylinderGeometry(0.02, 0.04, 1, 8, 1, true);
  beamGeometry.translate(0, 0.5, 0);
  beamGeometry.rotateX(Math.PI / 2);
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5522,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.visible = false;
  scene.add(beam);

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), glowMat);
  glow.visible = false;
  scene.add(glow);

  const decalPool = [];
  const decalMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1.0,
    metalness: 0,
    transparent: true,
    opacity: 0.85,
  });
  const decalGeo = new THREE.CircleGeometry(0.4, 12);
  for (let i = 0; i < 32; i += 1) {
    const d = new THREE.Mesh(decalGeo, decalMat);
    d.visible = false;
    scene.add(d);
    decalPool.push(d);
  }
  let decalIndex = 0;

  let active = false;
  let totalActiveTime = 0;
  let lastDecalTime = 0;

  return {
    /**
     * Set heat vision active or not; ray from hero head.
     * @param state hero flight state
     * @param input intent
     * @param dt
     */
    update(state, input, dt) {
      const wantActive = !!input.heatVision;
      active = wantActive;
      beam.visible = active;
      glow.visible = active;

      if (!active) {
        totalActiveTime = 0;
        lastDecalTime = 0;
        return;
      }

      totalActiveTime += dt;

      const origin = {
        x: state.position.x,
        y: state.position.y + 0.6,
        z: state.position.z,
      };
      const cosP = Math.cos(state.pitch);
      const forward = {
        x: Math.sin(state.yaw) * cosP,
        y: Math.sin(state.pitch),
        z: -Math.cos(state.yaw) * cosP,
      };

      const maxRange = 80;
      const hit = physicsWorld.raycast(origin, forward, maxRange);
      const distance = hit ? hit.distance : maxRange;

      beam.position.set(origin.x, origin.y, origin.z);
      beam.lookAt(origin.x + forward.x, origin.y + forward.y, origin.z + forward.z);
      beam.scale.set(1, 1, distance);

      if (hit) {
        glow.position.set(hit.point.x, hit.point.y, hit.point.z);
        glow.scale.setScalar(0.18 + Math.sin(totalActiveTime * 28) * 0.04);

        if (totalActiveTime - lastDecalTime > 0.15) {
          lastDecalTime = totalActiveTime;
          const d = decalPool[decalIndex];
          decalIndex = (decalIndex + 1) % decalPool.length;
          d.position.set(hit.point.x, hit.point.y, hit.point.z);
          // Orient the decal plane to face AWAY from the surface (toward the
          // beam origin). Previously lookAt(origin) faced the decal toward
          // the hero, which produced thin-ellipse artifacts on rooftops and
          // other surfaces not perpendicular to the beam. Aligning to the
          // beam direction is a close approximation of the surface normal
          // for primary-ray hits; a true normal-aligned decal would require
          // adding `normal` to the raycast return value (TODO).
          const back = {
            x: hit.point.x - forward.x * 0.01,
            y: hit.point.y - forward.y * 0.01,
            z: hit.point.z - forward.z * 0.01,
          };
          d.lookAt(back.x, back.y, back.z);
          d.visible = true;
        }

        eventBus?.emit?.('combat.heatHit', {
          distance,
          point: hit.point,
          tag: hit.tag,
          bodyHandle: hit.bodyHandle,
          dt,
        });
      } else {
        glow.position.set(
          origin.x + forward.x * maxRange,
          origin.y + forward.y * maxRange,
          origin.z + forward.z * maxRange,
        );
        glow.scale.setScalar(0.001);
      }
    },
    /**
     * Free all GPU resources owned by this system. Called on slice teardown.
     * Three.js never garbage-collects BufferGeometry or Material — they sit
     * on the GPU until explicitly disposed.
     */
    dispose() {
      scene.remove(beam, glow);
      for (const d of decalPool) scene.remove(d);
      beamGeometry.dispose();
      beamMaterial.dispose();
      glow.geometry.dispose();
      glowMat.dispose();
      decalGeo.dispose();
      decalMat.dispose();
      decalPool.length = 0;
    },
  };
}

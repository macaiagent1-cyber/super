import * as THREE from 'three';

const POOL_SIZE = 12;
const FLASH_LIFE = 0.16;
const FLASH_OPACITY = 0.32;

/**
 * Impact VFX manager. Reusable ring + screen flash when punch lands.
 */
export function createImpactFx({ scene, documentRef = globalThis.document } = {}) {
  const pool = [];
  const flash = createScreenFlash(documentRef);

  for (let i = 0; i < POOL_SIZE; i += 1) {
    const ringGeo = new THREE.RingGeometry(0.05, 0.08, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd060,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.visible = false;
    scene?.add?.(ring);
    pool.push({ mesh: ring, mat: ringMat, age: 0, life: 0, active: false });
  }

  let cursor = 0;

  function spawn({ position, normal = { x: 0, y: 1, z: 0 } }) {
    const entry = pool[cursor];
    cursor = (cursor + 1) % POOL_SIZE;
    entry.mesh.position.set(position.x, position.y, position.z);
    entry.mesh.lookAt(position.x + normal.x, position.y + normal.y, position.z + normal.z);
    entry.mesh.scale.setScalar(1);
    entry.mesh.visible = true;
    entry.mat.opacity = 0.95;
    entry.age = 0;
    entry.life = 0.42;
    entry.active = true;
    flash.trigger();
  }

  function update(dt) {
    for (const entry of pool) {
      if (!entry.active) continue;
      entry.age += dt;
      const t = entry.age / entry.life;
      if (t >= 1) {
        entry.active = false;
        entry.mesh.visible = false;
        continue;
      }
      entry.mesh.scale.setScalar(1 + t * 5);
      entry.mat.opacity = 0.95 * (1 - t);
    }
    flash.update(dt);
  }

  function dispose() {
    for (const entry of pool) {
      scene?.remove?.(entry.mesh);
      entry.mesh.geometry.dispose();
      entry.mat.dispose();
    }
    pool.length = 0;
    flash.dispose();
  }

  return { spawn, update, dispose };
}

function createScreenFlash(documentRef) {
  let element = null;
  let age = FLASH_LIFE;

  function ensureElement() {
    if (element || !documentRef?.body) return element;
    element = documentRef.createElement('div');
    element.setAttribute('aria-hidden', 'true');
    element.style.position = 'fixed';
    element.style.inset = '0';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '9';
    element.style.background = 'rgb(255, 208, 96)';
    element.style.mixBlendMode = 'screen';
    element.style.opacity = '0';
    element.style.transition = 'none';
    documentRef.body.append(element);
    return element;
  }

  return {
    trigger() {
      age = 0;
      const flashElement = ensureElement();
      if (flashElement) flashElement.style.opacity = String(FLASH_OPACITY);
    },
    update(dt) {
      if (age >= FLASH_LIFE) return;
      age = Math.min(FLASH_LIFE, age + dt);
      const flashElement = ensureElement();
      if (!flashElement) return;
      const t = age / FLASH_LIFE;
      flashElement.style.opacity = String(FLASH_OPACITY * (1 - t) * (1 - t));
    },
    dispose() {
      if (element?.parentNode) element.parentNode.removeChild(element);
      element = null;
    },
  };
}

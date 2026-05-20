import * as THREE from 'three';

function setupCsmMaterial(csm, material) {
  if (!csm) return;
  csm.setupMaterial(material);
}

/**
 * Build a procedural humanoid hero: head, torso, limbs, and cape anchor.
 * Returns a THREE.Group with named bones exposed via .bones and .userData.bones.
 */
export function createHeroModel({ csm = null } = {}) {
  const group = new THREE.Group();
  group.name = 'hero';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f3fa8,
    roughness: 0.52,
    metalness: 0.04,
  });
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0xb91d28, roughness: 0.45 });
  const markMat = new THREE.MeshStandardMaterial({
    color: 0xf5c526,
    roughness: 0.35,
    metalness: 0.1,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0xb91d28, roughness: 0.5 });

  for (const material of [bodyMat, shieldMat, markMat, skinMat, hairMat, bootMat]) {
    setupCsmMaterial(csm, material);
  }

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 1.05, 16), bodyMat);
  torso.name = 'torso';
  torso.position.y = 0;
  torso.castShadow = true;
  group.add(torso);

  const shoulderBar = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 0.34), bodyMat);
  shoulderBar.name = 'shoulders';
  shoulderBar.position.y = 0.41;
  shoulderBar.castShadow = true;
  group.add(shoulderBar);

  const shield = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), shieldMat);
  shield.name = 'chestShield';
  shield.position.set(0, 0.18, 0.43);
  shield.scale.set(1.15, 0.9, 1);
  group.add(shield);

  const mark = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), markMat);
  mark.name = 'chestMark';
  mark.position.set(0, 0.18, 0.44);
  mark.scale.set(1.25, 0.72, 1);
  group.add(mark);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  head.name = 'head';
  head.position.y = 0.78;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
    hairMat
  );
  hair.name = 'hair';
  hair.position.y = 0.83;
  hair.castShadow = true;
  group.add(hair);

  const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.085, 0.6, 12);
  const forearmGeo = new THREE.CylinderGeometry(0.085, 0.08, 0.55, 12);
  const handGeo = new THREE.SphereGeometry(0.09, 12, 12);

  function createArm(side, name) {
    const root = new THREE.Group();
    root.name = name;
    root.position.set(side * 0.46, 0.4, 0);
    root.rotation.set(0.15, 0, side * -0.05);

    const upper = new THREE.Mesh(upperArmGeo, bodyMat);
    upper.name = `${name}Upper`;
    upper.position.y = -0.3;
    upper.castShadow = true;
    root.add(upper);

    const lowerGroup = new THREE.Group();
    lowerGroup.name = `${name}Forearm`;
    lowerGroup.position.y = -0.6;
    lowerGroup.rotation.x = -0.2;
    root.add(lowerGroup);

    const lower = new THREE.Mesh(forearmGeo, bodyMat);
    lower.name = `${name}Lower`;
    lower.position.y = -0.275;
    lower.castShadow = true;
    lowerGroup.add(lower);

    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.name = `${name}Hand`;
    hand.position.y = -0.6;
    hand.castShadow = true;
    lowerGroup.add(hand);

    return { root, upper, lower: lowerGroup, hand };
  }

  const leftArm = createArm(-1, 'leftArm');
  const rightArm = createArm(1, 'rightArm');
  group.add(leftArm.root, rightArm.root);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.08, 16), shieldMat);
  belt.name = 'belt';
  belt.position.y = -0.52;
  belt.castShadow = true;
  group.add(belt);

  const upperLegGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.6, 12);
  const lowerLegGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.58, 12);
  const footGeo = new THREE.BoxGeometry(0.18, 0.08, 0.3);

  function createLeg(side, name) {
    const root = new THREE.Group();
    root.name = name;
    root.position.set(side * 0.16, -0.55, 0);

    const upper = new THREE.Mesh(upperLegGeo, bodyMat);
    upper.name = `${name}Upper`;
    upper.position.y = -0.3;
    upper.castShadow = true;
    root.add(upper);

    const lowerGroup = new THREE.Group();
    lowerGroup.name = `${name}Shin`;
    lowerGroup.position.y = -0.6;
    root.add(lowerGroup);

    const lower = new THREE.Mesh(lowerLegGeo, bodyMat);
    lower.name = `${name}Lower`;
    lower.position.y = -0.29;
    lower.castShadow = true;
    lowerGroup.add(lower);

    const foot = new THREE.Mesh(footGeo, bootMat);
    foot.name = `${name}Foot`;
    foot.position.set(0, -0.6, 0.05);
    foot.castShadow = true;
    lowerGroup.add(foot);

    return { root, upper, lower: lowerGroup, foot };
  }

  const leftLeg = createLeg(-1, 'leftLeg');
  const rightLeg = createLeg(1, 'rightLeg');
  group.add(leftLeg.root, rightLeg.root);

  const capeAnchor = new THREE.Object3D();
  capeAnchor.name = 'capeAnchor';
  capeAnchor.position.set(0, 0.42, -0.42);
  group.add(capeAnchor);

  const bones = {
    torso,
    head,
    hair,
    leftArm: leftArm.root,
    leftForearm: leftArm.lower,
    rightArm: rightArm.root,
    rightForearm: rightArm.lower,
    leftLeg: leftLeg.root,
    rightLeg: rightLeg.root,
    capeAnchor,
  };
  group.userData.bones = bones;
  group.bones = bones;

  return group;
}

/**
 * Set hero pose based on flight state.
 * - hover: arms slightly out, legs straight
 * - flight: arms forward in a superhero pose, legs trailing
 */
export function poseHeroForFlight(model, state) {
  const bones = model.userData.bones || model.bones;
  if (!bones) return;

  const t = state.speed01 || 0;
  const armForward = -0.15 - t * 1.45;

  bones.leftArm.rotation.x = armForward;
  bones.rightArm.rotation.x = armForward;
  bones.leftArm.rotation.z = -0.05 + t * 0.4;
  bones.rightArm.rotation.z = 0.05 - t * 0.4;

  const legTrail = -t * 0.25;
  bones.leftLeg.rotation.x = legTrail;
  bones.rightLeg.rotation.x = legTrail;
  bones.leftLeg.rotation.z = -t * 0.04;
  bones.rightLeg.rotation.z = t * 0.04;

  model.rotation.z = state.bank || 0;
}

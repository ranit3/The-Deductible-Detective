import * as THREE from 'three';

/**
 * LAYER 2: CRIME SCENE PROCEDURAL DECORATORS ("FAKING DAMAGE")
 * Generates low-poly atmospheric details:
 * - Ransacked room scattering (papers, open drawers, knocked furniture)
 * - Three.js floor decals (charred accelerant pools, water puddles, mud tracks)
 * - Theme-specific chunky diorama props (bakery flour sacks, attic rafters, warehouse pallets)
 */
export class CrimeSceneDecorators {
  /**
   * Spawns scattered document / invoice paper sheets on the floor
   */
  public static createRansackedPapers(
    scene: THREE.Scene,
    origin: THREE.Vector3,
    count: number = 6
  ): THREE.Mesh[] {
    const papers: THREE.Mesh[] = [];
    const paperGeo = new THREE.BoxGeometry(0.25, 0.005, 0.35);

    const paperColors = [0xFFFBEB, 0xFEF2F2, 0xF8FAFC, 0xFEF9C3];

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: paperColors[i % paperColors.length],
        roughness: 0.7
      });
      const paper = new THREE.Mesh(paperGeo, mat);

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 0.3 + Math.random() * 0.9;
      paper.position.set(
        origin.x + Math.cos(angle) * dist,
        origin.y + 0.01 + i * 0.006, // subtle layer stack to avoid z-fighting
        origin.z + Math.sin(angle) * dist
      );
      paper.rotation.y = Math.random() * Math.PI * 2;
      paper.rotation.z = (Math.random() - 0.5) * 0.05;
      paper.receiveShadow = true;
      scene.add(paper);
      papers.push(paper);
    }

    return papers;
  }

  /**
   * Creates a multi-layered procedural floor decal
   */
  public static createDecal(
    scene: THREE.Scene,
    type: 'burn_accelerant' | 'water_puddle' | 'tire_tracks',
    pos: THREE.Vector3
  ): THREE.Group {
    const group = new THREE.Group();

    if (type === 'burn_accelerant') {
      // 1. Outer hydrocarbon rainbow sheen ring
      const sheenMat = new THREE.MeshStandardMaterial({
        color: 0x3B0764, // Dark purple/blue iridescent sheen
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.75
      });
      const sheenRing = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.01, 14), sheenMat);
      sheenRing.position.y = 0.005;
      sheenRing.scale.set(1.3, 1.0, 0.8);
      group.add(sheenRing);

      // 2. Inner charred carbon core
      const sootMat = new THREE.MeshStandardMaterial({
        color: 0x09090B, // Charcoal black
        roughness: 0.95,
        metalness: 0.1
      });
      const sootCore = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.015, 12), sootMat);
      sootCore.position.y = 0.01;
      sootCore.scale.set(1.2, 1.0, 0.75);
      group.add(sootCore);
    } else if (type === 'water_puddle') {
      // Reflective water pool
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        roughness: 0.08,
        metalness: 0.2,
        transparent: true,
        opacity: 0.65
      });
      const puddle = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.01, 16), waterMat);
      puddle.position.y = 0.01;
      puddle.scale.set(1.4, 1.0, 0.9);
      group.add(puddle);
    } else {
      // Tread / entry tracks
      const trackMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.9,
        transparent: true,
        opacity: 0.5
      });
      for (let i = 0; i < 4; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.005, 0.32), trackMat);
        step.position.set((i % 2 === 0 ? -0.15 : 0.15), 0.005, -0.6 * i);
        step.rotation.y = 0.05 * (i % 2 === 0 ? 1 : -1);
        group.add(step);
      }
    }

    group.position.copy(pos);
    scene.add(group);
    return group;
  }

  /**
   * Spawns chunky flour sacks (Bakery Theme)
   */
  public static createFlourSack(scene: THREE.Scene, pos: THREE.Vector3, rotY: number = 0): THREE.Mesh {
    const sackMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0, // Burlap cloth off-white
      roughness: 0.85
    });
    const sack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.75), sackMat);
    sack.position.copy(pos);
    sack.rotation.y = rotY;
    sack.castShadow = true;
    sack.receiveShadow = true;
    scene.add(sack);
    return sack;
  }

  /**
   * Spawns a chunky wooden warehouse shipping pallet (Industrial Theme)
   */
  public static createPallet(scene: THREE.Scene, pos: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.8 }); // Pine lumber

    // Top planks
    for (let i = -2; i <= 2; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.18), woodMat);
      plank.position.set(0, 0.14, i * 0.22);
      plank.castShadow = true;
      group.add(plank);
    }

    // 3 Cross stringers
    for (let j = -1; j <= 1; j++) {
      const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 1.1), woodMat);
      stringer.position.set(j * 0.5, 0.06, 0);
      stringer.castShadow = true;
      group.add(stringer);
    }

    group.position.copy(pos);
    scene.add(group);
    return group;
  }
}


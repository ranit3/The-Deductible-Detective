import * as THREE from 'three';
import { Clue } from '../logic/types';

interface ClueVisual {
  clue: Clue;
  group: THREE.Group;
  pin: THREE.Mesh;
  ring: THREE.Mesh;
}

/**
 * LAYER 2: 3D CLUE INSPECTION MARKERS
 * Renders spatial points of interest at physical evidence locations.
 */
export class ClueMarkers {
  private scene: THREE.Scene;
  private visuals: ClueVisual[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setClues(clues: Clue[]) {
    // Clear previous
    this.visuals.forEach(v => this.scene.remove(v.group));
    this.visuals = [];

    const ringGeo = new THREE.RingGeometry(0.45, 0.65, 20);
    const pinGeo = new THREE.OctahedronGeometry(0.24);

    clues.forEach(c => {
      const group = new THREE.Group();

      // Ground beacon ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xF59E0B, // Amber uninspected
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);

      // Floating forensic marker diamond
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.3,
        roughness: 0.3
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.y = 0.8;
      group.add(pin);

      group.position.set(c.scenePosition.x, c.scenePosition.y, c.scenePosition.z);
      this.scene.add(group);

      this.visuals.push({ clue: c, group, pin, ring });
    });
  }

  public update(time: number, playerPos: THREE.Vector3): Clue | null {
    let closestClue: Clue | null = null;
    let minDist = Infinity;

    this.visuals.forEach((v, idx) => {
      const c = v.clue;
      // Animate floating pin
      v.pin.rotation.y += 0.02;
      v.pin.position.y = 0.8 + Math.sin(time * 3 + idx) * 0.08;

      // Update color based on discovery & photo state
      if (c.photographed) {
        (v.pin.material as THREE.MeshStandardMaterial).color.setHex(0x10B981); // Green (photographed)
        (v.ring.material as THREE.MeshBasicMaterial).color.setHex(0x10B981);
      } else if (c.discovered) {
        (v.pin.material as THREE.MeshStandardMaterial).color.setHex(0x38BDF8); // Cyan (discovered)
        (v.ring.material as THREE.MeshBasicMaterial).color.setHex(0x38BDF8);
      } else {
        (v.pin.material as THREE.MeshStandardMaterial).color.setHex(0xF59E0B); // Amber (new)
        (v.ring.material as THREE.MeshBasicMaterial).color.setHex(0xF59E0B);
      }

      // Proximity check
      const d = Math.hypot(c.scenePosition.x - playerPos.x, c.scenePosition.z - playerPos.z);
      if (d < c.interactRadius && d < minDist) {
        minDist = d;
        closestClue = c;
      }
    });

    return closestClue;
  }
}


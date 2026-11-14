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

    // Small, subtle, translucent forensic marker geometries
    const ringGeo = new THREE.RingGeometry(0.18, 0.25, 16);
    const pinGeo = new THREE.OctahedronGeometry(0.08);

    clues.forEach(c => {
      const group = new THREE.Group();

      // Delicate ground beacon ring (translucent)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xF59E0B, // Amber uninspected
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      ring.userData = { clueId: c.id, name: c.name, interactive: true };
      group.add(ring);

      // Subtle, compact floating forensic marker diamond
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: 0.55
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.y = 0.32;
      pin.userData = { clueId: c.id, name: c.name, interactive: true };
      group.add(pin);

      group.userData = { clueId: c.id, name: c.name, interactive: true };
      group.position.set(c.scenePosition.x, c.scenePosition.y, c.scenePosition.z);
      this.scene.add(group);

      this.visuals.push({ clue: c, group, pin, ring });
    });
  }

  public getInteractiveObjects(): THREE.Object3D[] {
    return this.visuals.flatMap(v => [v.pin, v.ring]);
  }

  public update(time: number, playerPos: THREE.Vector3): Clue | null {
    let closestClue: Clue | null = null;
    let minDist = Infinity;

    this.visuals.forEach((v, idx) => {
      const c = v.clue;
      // Gentle subtle floating bob
      v.pin.rotation.y += 0.025;
      v.pin.position.y = 0.32 + Math.sin(time * 2.5 + idx) * 0.04;

      const pinMat = v.pin.material as THREE.MeshStandardMaterial;
      const ringMat = v.ring.material as THREE.MeshBasicMaterial;

      // Update state: once photographed, fade out completely to keep diorama clean
      if (c.photographed) {
        pinMat.color.setHex(0x10B981);
        ringMat.color.setHex(0x10B981);
        v.pin.visible = false; // Hide diamond after capture
        ringMat.opacity = 0.10;
      } else if (c.discovered) {
        pinMat.color.setHex(0x38BDF8); // Cyan
        ringMat.color.setHex(0x38BDF8);
        v.pin.visible = true;
        v.pin.scale.set(0.75, 0.75, 0.75);
        pinMat.opacity = 0.38;
        ringMat.opacity = 0.20;
      } else {
        pinMat.color.setHex(0xF59E0B); // Amber
        ringMat.color.setHex(0xF59E0B);
        v.pin.visible = true;
        v.pin.scale.set(1.0, 1.0, 1.0);
        pinMat.opacity = 0.55;
        ringMat.opacity = 0.32;
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


import * as THREE from 'three';

/**
 * LAYER 2: 3D NPC CLAIMANT / WITNESS
 * Pure visual representation and proximity interaction.
 */
export class NPCClaimant {
  public group: THREE.Group;
  private iconMesh: THREE.Mesh;
  public position: THREE.Vector3 = new THREE.Vector3();
  public interactRadius: number = 2.8;
  public name: string = '';

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // Build stylized 3D Humanoid Claimant Model
    this.buildNPCMesh();

    // Floating Animated Interaction Indicator ("💬")
    const iconGeo = new THREE.OctahedronGeometry(0.32);
    const iconMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      metalness: 0.2,
      roughness: 0.3
    });
    this.iconMesh = new THREE.Mesh(iconGeo, iconMat);
    this.iconMesh.position.y = 2.3;
    this.group.add(this.iconMesh);
  }

  private buildNPCMesh() {
    // Body / Apron / Clothes
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.7 }); // Baker white apron
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 1.3, 12), bodyMat);
    body.position.y = 1.05;
    body.castShadow = true;
    this.group.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xFCD34D, roughness: 0.8 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), headMat);
    head.position.y = 1.85;
    head.castShadow = true;
    this.group.add(head);

    // Baker's Toque Hat
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.45, 14), hatMat);
    hat.position.y = 2.15;
    hat.castShadow = true;
    this.group.add(hat);

    // Trousers
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    [-0.14, 0.14].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 8), pantsMat);
      leg.position.set(lx, 0.4, 0);
      leg.castShadow = true;
      this.group.add(leg);
    });
  }

  public setup(name: string, pos: { x: number; y: number; z: number }) {
    this.name = name;
    this.position.set(pos.x, pos.y, pos.z);
    this.group.position.copy(this.position);
  }

  public update(time: number, playerPos: THREE.Vector3): boolean {
    // Animate speech beacon icon
    this.iconMesh.rotation.y += 0.03;
    this.iconMesh.position.y = 2.3 + Math.sin(time * 3) * 0.1;

    // Proximity check
    const dist = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);
    const isNear = dist <= this.interactRadius;

    if (isNear) {
      // Look toward player
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
      this.iconMesh.scale.set(1.2, 1.2, 1.2);
    } else {
      this.iconMesh.scale.set(1.0, 1.0, 1.0);
    }

    return isNear;
  }
}


import * as THREE from 'three';
import { BoundingBox2D } from './PlayerCharacter';
import { CrimeSceneDecorators } from './CrimeSceneDecorators';

/**
 * LAYER 2: STEP 3 & STEP 7 - CHUNKY LOW-POLY INCIDENT DIORAMA
 * Walls, baseboards, door, smashed window, furniture, and procedural crime-scene decorators.
 */
export class Environment {
  private scene: THREE.Scene;
  public colliders: BoundingBox2D[] = [];
  public interactiveProps: THREE.Object3D[] = [];
  public southWallMat!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildGrayboxWorld();
  }

  /**
   * Returns exact ground elevation at given (x, z) coordinates
   * Ensures player feet rest directly on the floor surfaces (never submerged).
   */
  public getGroundHeight(x: number, z: number): number {
    // Inside House Interior Floor: x in [-5.0, 5.0], z in [0.8, 9.0]
    if (x >= -5.0 && x <= 5.0 && z >= 0.8 && z <= 9.0) {
      return 0.10;
    }
    // Front Entrance Walkway / Porch: x in [-1.8, 1.8], z in [-3.5, 0.8]
    if (x >= -1.8 && x <= 1.8 && z >= -3.5 && z < 0.8) {
      return 0.10;
    }
    // Exterior Ground
    return 0.0;
  }

  /**
   * Toggles dynamic cutaway view for front (South) walls when viewing room interior.
   */
  public setCutaway(isCutaway: boolean) {
    if (this.southWallMat) {
      this.southWallMat.opacity = isCutaway ? 0.12 : 0.95;
      this.southWallMat.depthWrite = !isCutaway;
    }
  }

  private buildGrayboxWorld() {
    // Neutral Graybox Materials
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.85 }); // Neutral asphalt/ground
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.7 });  // House interior floor
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.8 });   // Solid graybox walls
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });   // Door/window frames & table
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.2, transparent: true, opacity: 0.6 });

    // 1. Exterior Ground Plane
    const ground = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 36), groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. House Interior Floor (10m wide x 8m deep, centered around z = 5.0)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.1, 8.0), floorMat);
    floor.position.set(0, 0.05, 5.0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Front Entrance Walkway / Porch (aligned at y = 0.10 to match interior floor)
    const porch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.10, 4.2), floorMat);
    porch.position.set(0, 0.05, -1.1);
    porch.receiveShadow = true;
    this.scene.add(porch);

    const h = 3.0; // Wall height

    // 3. Walls (Plain Boxes)
    // A. North Wall (Back): 10m wide at z = 9.0
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(10.0, h, 0.4), wallMat);
    northWall.position.set(0, h / 2, 9.0);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.scene.add(northWall);
    this.colliders.push({ minX: -5.2, maxX: 5.2, minZ: 8.8, maxZ: 9.2 });

    // B. West Wall: 8m long at x = -5.0
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 8.0), wallMat);
    westWall.position.set(-5.0, h / 2, 5.0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
    this.colliders.push({ minX: -5.2, maxX: -4.8, minZ: 0.8, maxZ: 9.2 });

    // C. East Wall (With Smashed Window opening at z = 4.0 to 6.0)
    // East Wall North Segment (z: 6.0 to 9.0, length 3.0m)
    const eastWallN = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 3.0), wallMat);
    eastWallN.position.set(5.0, h / 2, 7.5);
    eastWallN.castShadow = true;
    eastWallN.receiveShadow = true;
    this.scene.add(eastWallN);
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 6.0, maxZ: 9.2 });

    // East Wall South Segment (z: 1.0 to 4.0, length 3.0m)
    const eastWallS = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 3.0), wallMat);
    eastWallS.position.set(5.0, h / 2, 2.5);
    eastWallS.castShadow = true;
    eastWallS.receiveShadow = true;
    this.scene.add(eastWallS);
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 0.8, maxZ: 4.0 });

    // SMASHED WINDOW (Opening between z = 4.0 and z = 6.0)
    // Lower Sill Wall (height: 0.9m)
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 2.0), wallMat);
    sill.position.set(5.0, 0.45, 5.0);
    sill.castShadow = true;
    this.scene.add(sill);
    // Upper Lintel / Header Wall (height: 0.6m from y = 2.4 to 3.0)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 2.0), wallMat);
    lintel.position.set(5.0, 2.7, 5.0);
    lintel.castShadow = true;
    this.scene.add(lintel);

    // Broken Glass Shards on Sill & Floor
    const glassClueMat = glassMat.clone();
    const shard1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), glassClueMat);
    shard1.position.set(5.0, 1.1, 4.4);
    shard1.rotation.z = 0.15;
    shard1.userData = { clueId: 'clue_intact_oven_interior', name: 'Undamaged Deck Oven Chamber & Window', interactive: true };
    this.scene.add(shard1);
    this.interactiveProps.push(shard1);

    const shard2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.4), glassClueMat);
    shard2.position.set(5.0, 1.05, 5.6);
    shard2.rotation.z = -0.18;
    shard2.userData = { clueId: 'clue_intact_oven_interior', name: 'Undamaged Deck Oven Chamber & Window', interactive: true };
    this.scene.add(shard2);
    this.interactiveProps.push(shard2);

    // Glass fragments on floor inside
    [-0.3, 0.2, 0.6].forEach((dz, i) => {
      const glassFloor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.25), glassMat);
      glassFloor.position.set(4.4 + (i % 2) * 0.3, 0.07, 5.0 + dz);
      glassFloor.rotation.y = i * 0.8;
      this.scene.add(glassFloor);
    });

    // Window collider (blocks walking through the wall/window)
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 4.0, maxZ: 6.0 });

    // D. South Wall (Front, with Open Doorway at center x: -1.0 to 1.0)
    // Front walls use dynamic cutaway material so they fade when viewing inside
    this.southWallMat = new THREE.MeshStandardMaterial({
      color: 0x64748B,
      roughness: 0.8,
      transparent: true,
      opacity: 0.95
    });

    // South Wall Left Segment (x: -5.0 to -1.0, length 4.0m)
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 0.4), this.southWallMat);
    southWallL.position.set(-3.0, h / 2, 1.0);
    southWallL.castShadow = true;
    southWallL.receiveShadow = true;
    this.scene.add(southWallL);
    this.colliders.push({ minX: -5.2, maxX: -1.0, minZ: 0.8, maxZ: 1.2 });

    // South Wall Right Segment (x: 1.0 to 5.0, length 4.0m)
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 0.4), this.southWallMat);
    southWallR.position.set(3.0, h / 2, 1.0);
    southWallR.castShadow = true;
    southWallR.receiveShadow = true;
    this.scene.add(southWallR);
    this.colliders.push({ minX: 1.0, maxX: 5.2, minZ: 0.8, maxZ: 1.2 });

    // Doorway Header (above door opening from y = 2.4 to 3.0)
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.4), this.southWallMat);
    doorHeader.position.set(0, 2.7, 1.0);
    doorHeader.castShadow = true;
    this.scene.add(doorHeader);

    // Door Frame & Open Door Slab (Ajar at ~45° angle)
    const doorFrameMat = trimMat;
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 1.1), doorFrameMat);
    doorSlab.position.set(0.85, 1.15, 1.4);
    doorSlab.rotation.y = 0.7; // Swung inward into room
    doorSlab.castShadow = true;
    this.scene.add(doorSlab);

    // Clue Prop: Forced Lock on Back Door (forced_lock_back_door)
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.35, metalness: 0.8 });
    const lockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), lockMat);
    lockMesh.position.set(0.82, 1.15, 1.4);
    lockMesh.castShadow = true;
    lockMesh.userData = {
      clueId: 'forced_lock_back_door',
      name: 'Forced Lock on Back Door',
      interactive: true
    };
    this.scene.add(lockMesh);
    this.interactiveProps.push(lockMesh);

    // 4. Graybox Table (Center-Left of the Room: x: -1.8, z: 5.2)
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.4), trimMat);
    tableTop.position.set(-1.8, 0.85, 5.2);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    // Clue Prop: Concealed Kerosene Canister on Table (clue_kerosene_canister)
    const canisterGroup = new THREE.Group();
    const canisterMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.45, metalness: 0.4 });
    const canisterBody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.38, 16), canisterMat);
    canisterBody.position.y = 0.19;
    canisterBody.castShadow = true;
    canisterGroup.add(canisterBody);

    const spoutMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.3 });
    const canisterSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8), spoutMat);
    canisterSpout.position.set(0.05, 0.42, 0);
    canisterSpout.rotation.z = -0.25;
    canisterGroup.add(canisterSpout);

    canisterGroup.position.set(-1.8, 0.91, 5.2);
    canisterGroup.userData = {
      clueId: 'clue_kerosene_canister',
      name: 'Concealed Kerosene Canister',
      interactive: true
    };
    this.scene.add(canisterGroup);
    this.interactiveProps.push(canisterGroup);

    // 4 Table Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.8, 0.12);
    [
      [-1.8 - 1.0, 5.2 - 0.55],
      [-1.8 + 1.0, 5.2 - 0.55],
      [-1.8 - 1.0, 5.2 + 0.55],
      [-1.8 + 1.0, 5.2 + 0.55]
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, trimMat);
      leg.position.set(lx, 0.4, lz);
      leg.castShadow = true;
      this.scene.add(leg);
    });

    // Table Collider
    this.colliders.push({ minX: -3.1, maxX: -0.5, minZ: 4.4, maxZ: 6.0 });

    // 5. Overturned Chair near Table
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), trimMat);
    chair.position.set(-0.2, 0.25, 5.2);
    chair.rotation.z = 1.1; // Knocked over on its side
    chair.castShadow = true;
    this.scene.add(chair);

    // Clue Prop: Accelerant V-Pattern & Puddle Sheen on Floor (clue_burn_pour_pattern)
    const burnMat = new THREE.MeshStandardMaterial({
      color: 0x18181B,
      roughness: 0.95,
      metalness: 0.15
    });
    const burnPuddle = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.015, 14), burnMat);
    burnPuddle.position.set(0.0, 0.06, 4.8);
    burnPuddle.scale.set(1.3, 1.0, 0.75);
    burnPuddle.receiveShadow = true;
    burnPuddle.userData = {
      clueId: 'clue_burn_pour_pattern',
      name: 'Accelerant V-Pattern & Puddle Sheen',
      interactive: true
    };
    this.scene.add(burnPuddle);
    this.interactiveProps.push(burnPuddle);

    // Clue Prop: Unplugged Industrial 240V Cable (clue_unplugged_oven)
    const cableGroup = new THREE.Group();
    const plugMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.7 });
    const plugBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.36), plugMat);
    plugBody.position.set(0, 0.07, 0);
    cableGroup.add(plugBody);

    const prongMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.8, roughness: 0.2 });
    [-0.06, 0.06].forEach(px => {
      const prong = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.1), prongMat);
      prong.position.set(px, 0.07, 0.22);
      cableGroup.add(prong);
    });

    const cordMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.8 });
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8), cordMat);
    cord.rotation.z = Math.PI / 2;
    cord.rotation.y = 0.3;
    cord.position.set(-0.6, 0.04, -0.2);
    cableGroup.add(cord);

    cableGroup.position.set(-3.6, 0.05, 7.2);
    cableGroup.userData = {
      clueId: 'clue_unplugged_oven',
      name: 'Unplugged Industrial 240V Cable',
      interactive: true
    };
    this.scene.add(cableGroup);
    this.interactiveProps.push(cableGroup);

    // 6. Cabinet against North Wall (x: 2.5, z: 8.5)
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 0.8), trimMat);
    cabinet.position.set(2.5, 0.9, 8.5);
    cabinet.castShadow = true;
    this.scene.add(cabinet);
    this.colliders.push({ minX: 1.3, maxX: 3.7, minZ: 8.0, maxZ: 9.0 });

    // Clue Prop: Final Eviction Notice & Debt Ledger (clue_late_rent_ledger)
    const ledgerGroup = new THREE.Group();
    const ledgerCoverMat = new THREE.MeshStandardMaterial({ color: 0xB91C1C, roughness: 0.6 });
    const ledgerFolder = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.48), ledgerCoverMat);
    ledgerFolder.position.set(0, 0.015, 0);
    ledgerGroup.add(ledgerFolder);

    const paperMat = new THREE.MeshStandardMaterial({ color: 0xFEF2F2, roughness: 0.7 });
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.44), paperMat);
    paper.position.set(0, 0.03, 0);
    ledgerGroup.add(paper);

    ledgerGroup.position.set(2.5, 1.82, 8.5);
    ledgerGroup.userData = {
      clueId: 'clue_late_rent_ledger',
      name: 'Final Eviction Notice & Debt Ledger',
      interactive: true
    };
    this.scene.add(ledgerGroup);
    this.interactiveProps.push(ledgerGroup);

    // 7. Chunky Architectural Baseboards (Kenney Style Trim)
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    // North baseboard
    const baseNorth = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.16, 0.06), baseboardMat);
    baseNorth.position.set(0, 0.13, 8.78);
    this.scene.add(baseNorth);
    // West baseboard
    const baseWest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 7.8), baseboardMat);
    baseWest.position.set(-4.78, 0.13, 5.0);
    this.scene.add(baseWest);

    // 8. Procedural Crime-Scene Decorators ("Faking Damage")
    // Scattered ransacked papers near cabinet
    CrimeSceneDecorators.createRansackedPapers(this.scene, new THREE.Vector3(2.2, 0.05, 7.6), 5);

    // Chunky Burlap Flour Sacks stacked near kitchen prep table
    CrimeSceneDecorators.createFlourSack(this.scene, new THREE.Vector3(-3.2, 0.22, 5.2), 0.3);
    CrimeSceneDecorators.createFlourSack(this.scene, new THREE.Vector3(-3.2, 0.55, 5.2), -0.2);

    // Wooden Shipping Pallet on Porch
    CrimeSceneDecorators.createPallet(this.scene, new THREE.Vector3(-1.0, 0.04, -1.6));

    // Multi-Layered Iridescent Hydrocarbon Decal beneath burn mark
    CrimeSceneDecorators.createDecal(this.scene, 'burn_accelerant', new THREE.Vector3(0.0, 0.05, 4.8));
  }

  public getInteractiveObjects(): THREE.Object3D[] {
    return this.interactiveProps;
  }
}

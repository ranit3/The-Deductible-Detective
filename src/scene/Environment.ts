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
   * Returns exact ground elevation at given (x, z) coordinates.
   * Multi-level elevation logic:
   *  - Staircase & Landing: climbs continuously from 0.10m to 3.10m
   *  - Rooftop Deck: 3.10m when elevated (y >= 2.0m)
   *  - Room Interior & Front Porch: 0.10m (shoes directly on floor surface)
   *  - Exterior Yard: 0.0m
   */
  public getGroundHeight(x: number, z: number, currentY?: number): number {
    // 1. Staircase & Top Landing along West Wall:
    // x in [-6.4, -4.8], z in [0.8, 8.5]
    if (x >= -6.4 && x <= -4.8 && z >= 0.8 && z <= 8.5) {
      if (z >= 7.0) {
        return 3.10; // Top Landing platform leading into roof
      }
      if (z <= 1.0) {
        return 0.10; // Stair bottom approach from yard/porch
      }
      // Linear slope along the 16 steps from y = 0.10 (z = 1.0) to y = 3.10 (z = 7.0)
      const t = (z - 1.0) / 6.0;
      return 0.10 + t * 3.00;
    }

    // 2. House Footprint (Room Interior vs Rooftop Deck):
    // x in [-5.2, 5.2], z in [0.8, 9.2]
    if (x >= -5.2 && x <= 5.2 && z >= 0.8 && z <= 9.2) {
      // If player is elevated (on the roof or climbing above 2.0m)
      if (currentY !== undefined && currentY >= 2.0) {
        return 3.10; // Rooftop deck elevation
      }
      return 0.10; // Ground floor interior room elevation
    }

    // 3. Front Entrance Walkway / Porch:
    if (x >= -1.8 && x <= 1.8 && z >= -3.5 && z < 0.8) {
      return 0.10;
    }

    // 4. Exterior Yard Ground
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
    this.colliders.push({ minX: -5.2, maxX: 5.2, minZ: 8.8, maxZ: 9.2, maxY: 2.8 });

    // B. West Wall: 8m long at x = -5.0
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 8.0), wallMat);
    westWall.position.set(-5.0, h / 2, 5.0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
    this.colliders.push({ minX: -5.2, maxX: -4.8, minZ: 0.8, maxZ: 9.2, maxY: 2.8 });

    // C. East Wall (With Smashed Window opening at z = 4.0 to 6.0)
    // East Wall North Segment (z: 6.0 to 9.0, length 3.0m)
    const eastWallN = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 3.0), wallMat);
    eastWallN.position.set(5.0, h / 2, 7.5);
    eastWallN.castShadow = true;
    eastWallN.receiveShadow = true;
    this.scene.add(eastWallN);
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 6.0, maxZ: 9.2, maxY: 2.8 });

    // East Wall South Segment (z: 1.0 to 4.0, length 3.0m)
    const eastWallS = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 3.0), wallMat);
    eastWallS.position.set(5.0, h / 2, 2.5);
    eastWallS.castShadow = true;
    eastWallS.receiveShadow = true;
    this.scene.add(eastWallS);
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 0.8, maxZ: 4.0, maxY: 2.8 });

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
    this.colliders.push({ minX: 4.8, maxX: 5.2, minZ: 4.0, maxZ: 6.0, maxY: 2.8 });

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
    this.colliders.push({ minX: -5.2, maxX: -1.0, minZ: 0.8, maxZ: 1.2, maxY: 2.8 });

    // South Wall Right Segment (x: 1.0 to 5.0, length 4.0m)
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 0.4), this.southWallMat);
    southWallR.position.set(3.0, h / 2, 1.0);
    southWallR.castShadow = true;
    southWallR.receiveShadow = true;
    this.scene.add(southWallR);
    this.colliders.push({ minX: 1.0, maxX: 5.2, minZ: 0.8, maxZ: 1.2, maxY: 2.8 });

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
    this.colliders.push({ minX: -3.1, maxX: -0.5, minZ: 4.4, maxZ: 6.0, maxY: 2.0 });

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
    this.colliders.push({ minX: 1.3, maxX: 3.7, minZ: 8.0, maxZ: 9.0, maxY: 2.5 });

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

    // 9. Exterior Walk-up Staircase to Rooftop Deck
    this.buildStaircase();

    // 10. Rooftop Deck, Parapet Walls, Interior Ceiling & Diorama Props
    this.buildRoof();
  }

  /**
   * Builds the exterior walk-up staircase along the West exterior wall:
   * 16 steps, stringers, safety handrails, balusters, and top landing platform connecting to roof deck.
   */
  private buildStaircase() {
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75, metalness: 0.15 });
    const stringerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4, metalness: 0.8 });

    const numSteps = 16;
    const startZ = 1.0;
    const endZ = 7.0;
    const runTotal = endZ - startZ; // 6.0m
    const startY = 0.10;
    const endY = 3.10;
    const riseTotal = endY - startY; // 3.0m

    const stepDepth = runTotal / numSteps; // 0.375m
    const stepRise = riseTotal / numSteps; // 0.1875m

    // 1. Treads / Steps
    for (let i = 0; i < numSteps; i++) {
      const stepZ = startZ + (i + 0.5) * stepDepth;
      const stepY = startY + (i + 0.5) * stepRise;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, stepRise, stepDepth + 0.04), stepMat);
      stepMesh.position.set(-5.6, stepY, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      this.scene.add(stepMesh);
    }

    // 2. Diagonal Stringers (Support Beams)
    const stairAngle = Math.atan2(riseTotal, runTotal); // ~0.4636 rad (~26.56°)
    const stairLen = Math.sqrt(runTotal * runTotal + riseTotal * riseTotal); // ~6.708m
    const midY = startY + riseTotal / 2; // 1.60m
    const midZ = startZ + runTotal / 2; // 4.0m

    // Outer stringer at x = -6.2
    const outerStringer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, stairLen), stringerMat);
    outerStringer.position.set(-6.2, midY, midZ);
    outerStringer.rotation.x = -stairAngle;
    outerStringer.castShadow = true;
    this.scene.add(outerStringer);

    // Inner stringer against wall at x = -5.02
    const innerStringer = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, stairLen), stringerMat);
    innerStringer.position.set(-5.02, midY, midZ);
    innerStringer.rotation.x = -stairAngle;
    innerStringer.castShadow = true;
    this.scene.add(innerStringer);

    // 3. Handrail & Balusters along Outer Edge (x = -6.22)
    const handrailHeight = 0.85;
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, stairLen), railMat);
    handrail.position.set(-6.22, midY + handrailHeight, midZ);
    handrail.rotation.x = -stairAngle;
    handrail.castShadow = true;
    this.scene.add(handrail);

    // Vertical Baluster Posts every 4 steps
    for (let k = 0; k <= numSteps; k += 4) {
      const bZ = startZ + k * stepDepth;
      const bBaseY = startY + k * stepRise;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, handrailHeight, 0.06), railMat);
      post.position.set(-6.22, bBaseY + handrailHeight / 2, bZ);
      post.castShadow = true;
      this.scene.add(post);
    }

    // 4. Top Landing Platform (x in [-6.2, -5.0], z in [7.0, 8.4], top at y = 3.10)
    const landing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.4), stepMat);
    landing.position.set(-5.6, 3.04, 7.7);
    landing.castShadow = true;
    landing.receiveShadow = true;
    this.scene.add(landing);

    // Structural steel support pillars under landing
    [[-6.15, 7.05], [-6.15, 8.35]].forEach(([colX, colZ]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8), railMat);
      col.position.set(colX, 1.5, colZ);
      col.castShadow = true;
      this.scene.add(col);
    });

    // Landing safety guardrails
    // West outer guardrail
    const landWestRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.4), railMat);
    landWestRail.position.set(-6.22, 3.10 + handrailHeight, 7.7);
    landWestRail.castShadow = true;
    this.scene.add(landWestRail);

    // North guardrail
    const landNorthRail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.06), railMat);
    landNorthRail.position.set(-5.6, 3.10 + handrailHeight, 8.4);
    landNorthRail.castShadow = true;
    this.scene.add(landNorthRail);

    // Corner balusters on landing
    const landPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, handrailHeight, 0.06), railMat);
    landPost1.position.set(-6.22, 3.10 + handrailHeight / 2, 7.0);
    this.scene.add(landPost1);

    const landPost2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, handrailHeight, 0.06), railMat);
    landPost2.position.set(-6.22, 3.10 + handrailHeight / 2, 8.4);
    this.scene.add(landPost2);

    // Boundary Colliders for stairs & landing
    this.colliders.push({ minX: -6.5, maxX: -6.15, minZ: 0.8, maxZ: 8.5 });
    this.colliders.push({ minX: -6.5, maxX: -5.0, minZ: 8.35, maxZ: 8.7, minY: 2.0 });
  }

  /**
   * Builds the Roof Deck, Parapet Safety Walls, Interior Ceiling with Beams & Pendant Lamp,
   * Red Brick Chimney, Industrial HVAC Compressor, and Attic Skylight.
   */
  private buildRoof() {
    const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.8 });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.75 });
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const parapetCapMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.85 });
    const capstoneMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.6 });
    const flueMat = new THREE.MeshStandardMaterial({ color: 0xEA580C, roughness: 0.65 });
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.4, metalness: 0.6 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
    const skylightGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.15,
      transparent: true,
      opacity: 0.45
    });

    // 1. Roof Deck Slabs (Walking surface at y = 3.10m, thickness 0.12m, center at y = 3.04m)
    // A. Main Slab: covers x in [-3.8, 5.0], z in [1.0, 9.0]
    const slabMain = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 8.0), roofDeckMat);
    slabMain.position.set(0.6, 3.04, 5.0);
    slabMain.receiveShadow = true;
    slabMain.castShadow = true;
    this.scene.add(slabMain);

    // B. West South Slab: covers x in [-5.0, -3.8], z in [1.0, 6.8]
    const slabWestS = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 5.8), roofDeckMat);
    slabWestS.position.set(-4.4, 3.04, 3.9);
    slabWestS.receiveShadow = true;
    slabWestS.castShadow = true;
    this.scene.add(slabWestS);

    // C. West North Slab: covers x in [-5.0, -3.8], z in [8.4, 9.0]
    const slabWestN = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.6), roofDeckMat);
    slabWestN.position.set(-4.4, 3.04, 8.7);
    slabWestN.receiveShadow = true;
    slabWestN.castShadow = true;
    this.scene.add(slabWestN);
    // (Note: x in [-5.0, -3.8], z in [6.8, 8.4] is open for walk-in from stair landing!)

    // 2. Interior Ceiling & Wooden Timber Beams (Visible from inside room in FPP)
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.02, 7.6), ceilingMat);
    ceiling.position.set(0, 2.97, 5.0);
    this.scene.add(ceiling);

    [2.4, 4.4, 6.4, 8.2].forEach(beamZ => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.16, 0.22), beamMat);
      beam.position.set(0, 2.89, beamZ);
      beam.castShadow = true;
      this.scene.add(beam);
    });

    // Hanging Pendant Inspection Lamp over Evidence Table (x: -1.8, z: 5.2)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.8, 0, 5.2);

    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), frameMat);
    canopy.position.y = 2.96;
    lampGroup.add(canopy);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 8), frameMat);
    cord.position.y = 2.58;
    lampGroup.add(cord);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.20, 16, 1, true), frameMat);
    shade.position.y = 2.22;
    lampGroup.add(shade);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xFEF08A,
      emissive: 0xFDE047,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), bulbMat);
    bulb.position.y = 2.15;
    lampGroup.add(bulb);

    const lampLight = new THREE.PointLight(0xFFFBEB, 1.3, 9, 2.0);
    lampLight.position.y = 2.10;
    lampGroup.add(lampLight);

    this.scene.add(lampGroup);

    // 3. Parapet Safety Walls on Roof (Height 0.45m, center y = 3.325)
    // North Parapet
    const pNorth = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.45, 0.25), parapetMat);
    pNorth.position.set(0, 3.325, 9.0);
    pNorth.castShadow = true;
    this.scene.add(pNorth);
    const pNorthCap = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.06, 0.32), parapetCapMat);
    pNorthCap.position.set(0, 3.58, 9.0);
    this.scene.add(pNorthCap);
    this.colliders.push({ minX: -5.2, maxX: 5.2, minZ: 8.85, maxZ: 9.3, minY: 2.8 });

    // East Parapet
    const pEast = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 8.0), parapetMat);
    pEast.position.set(5.0, 3.325, 5.0);
    pEast.castShadow = true;
    this.scene.add(pEast);
    const pEastCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 8.05), parapetCapMat);
    pEastCap.position.set(5.0, 3.58, 5.0);
    this.scene.add(pEastCap);
    this.colliders.push({ minX: 4.85, maxX: 5.3, minZ: 0.8, maxZ: 9.2, minY: 2.8 });

    // South Parapet
    const pSouth = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.45, 0.25), parapetMat);
    pSouth.position.set(0, 3.325, 1.0);
    pSouth.castShadow = true;
    this.scene.add(pSouth);
    const pSouthCap = new THREE.Mesh(new THREE.BoxGeometry(10.05, 0.06, 0.32), parapetCapMat);
    pSouthCap.position.set(0, 3.58, 1.0);
    this.scene.add(pSouthCap);
    this.colliders.push({ minX: -5.2, maxX: 5.2, minZ: 0.7, maxZ: 1.15, minY: 2.8 });

    // West Parapet South Section (z: 1.0 to 6.8, length 5.8m)
    const pWestS = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 5.8), parapetMat);
    pWestS.position.set(-5.0, 3.325, 3.9);
    pWestS.castShadow = true;
    this.scene.add(pWestS);
    const pWestSCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 5.85), parapetCapMat);
    pWestSCap.position.set(-5.0, 3.58, 3.9);
    this.scene.add(pWestSCap);
    this.colliders.push({ minX: -5.3, maxX: -4.85, minZ: 0.8, maxZ: 6.8, minY: 2.8 });

    // West Parapet North Section (z: 8.4 to 9.0, length 0.6m)
    const pWestN = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.6), parapetMat);
    pWestN.position.set(-5.0, 3.325, 8.7);
    pWestN.castShadow = true;
    this.scene.add(pWestN);
    const pWestNCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.65), parapetCapMat);
    pWestNCap.position.set(-5.0, 3.58, 8.7);
    this.scene.add(pWestNCap);
    this.colliders.push({ minX: -5.3, maxX: -4.85, minZ: 8.4, maxZ: 9.2, minY: 2.8 });

    // 4. Rooftop Diorama Props
    // A. Red Brick Chimney (x: 2.8, z: 7.5)
    const chimneyGroup = new THREE.Group();
    chimneyGroup.position.set(2.8, 3.10, 7.5);

    const chimneyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.9), brickMat);
    chimneyShaft.position.y = 0.65;
    chimneyShaft.castShadow = true;
    chimneyGroup.add(chimneyShaft);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.10, 1.05), capstoneMat);
    chimneyCap.position.y = 1.35;
    chimneyCap.castShadow = true;
    chimneyGroup.add(chimneyCap);

    [-0.2, 0.2].forEach(fx => {
      const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 12), flueMat);
      flue.position.set(fx, 1.58, 0);
      flue.castShadow = true;
      chimneyGroup.add(flue);
    });
    this.scene.add(chimneyGroup);
    this.colliders.push({ minX: 2.2, maxX: 3.4, minZ: 6.9, maxZ: 8.1, minY: 2.8 });

    // B. Industrial HVAC Compressor Unit (x: -1.2, z: 3.2)
    const hvacGroup = new THREE.Group();
    hvacGroup.position.set(-1.2, 3.10, 3.2);

    const hvacBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 1.0), hvacMat);
    hvacBody.position.y = 0.425;
    hvacBody.castShadow = true;
    hvacGroup.add(hvacBody);

    const fanRecess = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16), parapetCapMat);
    fanRecess.position.y = 0.85;
    hvacGroup.add(fanRecess);

    const fanBlades = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.10), parapetCapMat);
    fanBlades.position.y = 0.86;
    hvacGroup.add(fanBlades);

    const fanBlades2 = fanBlades.clone();
    fanBlades2.rotation.y = Math.PI / 2;
    hvacGroup.add(fanBlades2);

    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.5, metalness: 0.7 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-0.8, 0.25, 0);
    hvacGroup.add(pipe);

    this.scene.add(hvacGroup);
    this.colliders.push({ minX: -2.0, maxX: -0.4, minZ: 2.6, maxZ: 3.8, minY: 2.8 });

    // C. Attic Skylight Hatch (x: 1.2, z: 4.0)
    const skylightGroup = new THREE.Group();
    skylightGroup.position.set(1.2, 3.10, 4.0);

    const curb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 1.4), frameMat);
    curb.position.y = 0.08;
    curb.castShadow = true;
    skylightGroup.add(curb);

    const paneGeo = new THREE.BoxGeometry(0.85, 0.03, 1.35);
    const paneWest = new THREE.Mesh(paneGeo, skylightGlassMat);
    paneWest.position.set(-0.38, 0.26, 0);
    paneWest.rotation.z = 0.32;
    skylightGroup.add(paneWest);

    const paneEast = new THREE.Mesh(paneGeo, skylightGlassMat);
    paneEast.position.set(0.38, 0.26, 0);
    paneEast.rotation.z = -0.32;
    skylightGroup.add(paneEast);

    this.scene.add(skylightGroup);
    this.colliders.push({ minX: 0.3, maxX: 2.1, minZ: 3.2, maxZ: 4.8, minY: 2.8 });
  }

  public getInteractiveObjects(): THREE.Object3D[] {
    return this.interactiveProps;
  }
}

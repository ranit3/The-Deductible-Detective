import * as THREE from 'three';
import { BoundingBox2D } from './PlayerCharacter';

/**
 * LAYER 2: STEP 3 - GRAYBOX ONE HOUSE
 * Plain boxes for walls, a door, a smashed window, and a table.
 * No decorative art yet; clean, functional, readable spatial geometry and collision.
 */
export class Environment {
  private scene: THREE.Scene;
  public colliders: BoundingBox2D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildGrayboxWorld();
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

    // Front Entrance Walkway / Porch
    const porch = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 4.0), floorMat);
    porch.position.set(0, 0.04, -1.0);
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
    const shard1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), glassMat);
    shard1.position.set(5.0, 1.1, 4.4);
    shard1.rotation.z = 0.15;
    this.scene.add(shard1);

    const shard2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.4), glassMat);
    shard2.position.set(5.0, 1.05, 5.6);
    shard2.rotation.z = -0.18;
    this.scene.add(shard2);

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
    // South Wall Left Segment (x: -5.0 to -1.0, length 4.0m)
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 0.4), wallMat);
    southWallL.position.set(-3.0, h / 2, 1.0);
    southWallL.castShadow = true;
    southWallL.receiveShadow = true;
    this.scene.add(southWallL);
    this.colliders.push({ minX: -5.2, maxX: -1.0, minZ: 0.8, maxZ: 1.2 });

    // South Wall Right Segment (x: 1.0 to 5.0, length 4.0m)
    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 0.4), wallMat);
    southWallR.position.set(3.0, h / 2, 1.0);
    southWallR.castShadow = true;
    southWallR.receiveShadow = true;
    this.scene.add(southWallR);
    this.colliders.push({ minX: 1.0, maxX: 5.2, minZ: 0.8, maxZ: 1.2 });

    // Doorway Header (above door opening from y = 2.4 to 3.0)
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.4), wallMat);
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

    // 4. Graybox Table (Center-Left of the Room: x: -1.8, z: 5.2)
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.4), trimMat);
    tableTop.position.set(-1.8, 0.85, 5.2);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

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

    // 6. Cabinet against North Wall (x: 2.5, z: 8.5)
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 0.8), trimMat);
    cabinet.position.set(2.5, 0.9, 8.5);
    cabinet.castShadow = true;
    this.scene.add(cabinet);
    this.colliders.push({ minX: 1.3, maxX: 3.7, minZ: 8.0, maxZ: 9.0 });
  }
}

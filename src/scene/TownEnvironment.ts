import * as THREE from 'three';
import { ModelLoader } from './ModelLoader';
import { BoundingBox2D } from './PlayerCharacter';

/**
 * LAYER 2: TOWN ENVIRONMENT (KENNEY CITY KITS LAYOUT)
 * Implements the town layout following the design order:
 *  1. Roads first: Main street ("Rue de la Boulangerie"), 4-way crossroad, and street bends.
 *  2. Buildings along the roads, rotated so fronts face the street.
 *  3. Fences, driveways, trees, and stone paths around each house.
 *  4. Exterior of Case 1 building: attached garage, driveway, fenced back garden, flower beds.
 */
export class TownEnvironment {
  private scene: THREE.Scene;
  private modelLoader: ModelLoader;
  public colliders: BoundingBox2D[] = [];

  constructor(scene: THREE.Scene, modelLoader: ModelLoader) {
    this.scene = scene;
    this.modelLoader = modelLoader;
    this.buildTown();
  }

  private buildTown() {
    // 0. Town Lawn Grass Expanse
    this.buildLandscape();

    // 1. Roads First (Main Street, Crossroad, Bends, Sidewalks)
    this.buildRoadNetwork();

    // 2. Buildings Along the Roads (Rotated so fronts face the street)
    this.buildBuildings();

    // 3. Fences, Driveways, Paths, Trees & Street Props
    this.buildFencesAndDriveways();
    this.buildVegetation();
    this.buildStreetFurniture();
  }

  /**
   * Expansive lush suburban grass ground
   */
  private buildLandscape() {
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4D7C0F, // Vibrant low-poly lawn green
      roughness: 0.9,
      metalness: 0.05
    });

    const townGround = new THREE.Mesh(new THREE.BoxGeometry(100, 0.4, 90), grassMat);
    townGround.position.set(0, -0.22, 0);
    townGround.receiveShadow = true;
    this.scene.add(townGround);
  }

  /**
   * STEP 1: ROADS FIRST
   *  - Main Street ("Rue de la Boulangerie") running East-West in front of bakery
   *  - 4-Way Crossroad intersection at x = 14m connecting to North-South Avenue ("Boulevard de l'Étoile")
   *  - West road bend curving North
   *  - North road bend on Boulevard de l'Étoile
   */
  private buildRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.75 });
    const whiteStripeMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 });

    // A. Main Street: Runs along z in [-9.5, -3.5] (width 6m, centered at z = -6.5)
    // From West bend (x = -20) to Crossroad (x = 9)
    const mainStreetLen = 29.0;
    const mainStreet = new THREE.Mesh(new THREE.BoxGeometry(mainStreetLen, 0.06, 6.0), roadMat);
    mainStreet.position.set(-5.5, 0.03, -6.5);
    mainStreet.receiveShadow = true;
    this.scene.add(mainStreet);

    // Dashed White Centerline along Main Street
    for (let x = -18.0; x <= 7.0; x += 3.2) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.01, 0.18), whiteStripeMat);
      dash.position.set(x, 0.065, -6.5);
      this.scene.add(dash);
    }

    // Main Street Sidewalks (North & South)
    // North Sidewalk (in front of bakery & shops): width 1.6m at z in [-3.5, -1.9]
    const northWalk = new THREE.Mesh(new THREE.BoxGeometry(mainStreetLen, 0.10, 1.6), sidewalkMat);
    northWalk.position.set(-5.5, 0.05, -2.7);
    northWalk.receiveShadow = true;
    this.scene.add(northWalk);

    const northCurb = new THREE.Mesh(new THREE.BoxGeometry(mainStreetLen, 0.12, 0.15), curbMat);
    northCurb.position.set(-5.5, 0.06, -3.45);
    this.scene.add(northCurb);

    // South Sidewalk (in front of opposite suburban houses): width 1.6m at z in [-11.1, -9.5]
    const southWalk = new THREE.Mesh(new THREE.BoxGeometry(mainStreetLen, 0.10, 1.6), sidewalkMat);
    southWalk.position.set(-5.5, 0.05, -10.3);
    southWalk.receiveShadow = true;
    this.scene.add(southWalk);

    const southCurb = new THREE.Mesh(new THREE.BoxGeometry(mainStreetLen, 0.12, 0.15), curbMat);
    southCurb.position.set(-5.5, 0.06, -9.55);
    this.scene.add(southCurb);

    // B. 4-Way Crossroad Intersection (at x = 14.0, z = -6.5)
    const crossroad = this.modelLoader.instantiate('road_crossroad', {
      position: [14.0, 0, -6.5],
      receiveShadow: true
    });
    this.scene.add(crossroad);

    // C. North-South Avenue ("Boulevard de l'Étoile", width 6m, centered at x = 14.0)
    // South segment (z: -11.5 down to -25.0)
    const aveSouth = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.06, 14.0), roadMat);
    aveSouth.position.set(14.0, 0.03, -18.5);
    aveSouth.receiveShadow = true;
    this.scene.add(aveSouth);

    // North segment (z: -1.5 up to 18.0)
    const aveNorth = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.06, 19.5), roadMat);
    aveNorth.position.set(14.0, 0.03, 8.25);
    aveNorth.receiveShadow = true;
    this.scene.add(aveNorth);

    // Avenue Sidewalks (West & East)
    [-3.8, 3.8].forEach(dx => {
      // South walk
      const wS = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.10, 14.0), sidewalkMat);
      wS.position.set(14.0 + dx, 0.05, -18.5);
      wS.receiveShadow = true;
      this.scene.add(wS);

      // North walk
      const wN = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.10, 19.5), sidewalkMat);
      wN.position.set(14.0 + dx, 0.05, 8.25);
      wN.receiveShadow = true;
      this.scene.add(wN);
    });

    // D. West Road Bend (Curves from Main St at x = -20 northward to z = 14)
    const westBend = this.modelLoader.instantiate('road_bend', {
      position: [-20.0, 0, -1.5],
      rotation: [0, Math.PI / 2, 0],
      receiveShadow: true
    });
    this.scene.add(westBend);

    // Road north continuation from bend
    const westRoadNorth = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.06, 16.0), roadMat);
    westRoadNorth.position.set(-25.0, 0.03, 7.5);
    westRoadNorth.receiveShadow = true;
    this.scene.add(westRoadNorth);
  }

  /**
   * STEP 2: BUILDINGS ALONG THE ROADS
   * Rotated so fronts face the street!
   */
  private buildBuildings() {
    // 1. Case 1 Garage (Attached property to West of Bakery: x = -10.2, z = 4.5)
    // Front faces South (+Z) towards Main Street
    const garage = this.modelLoader.instantiate('garage_single', {
      position: [-10.2, 0, 4.5],
      rotation: [0, 0, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(garage);
    this.colliders.push({ minX: -12.6, maxX: -7.8, minZ: 1.5, maxZ: 7.5 });

    // 2. East Neighbor Commercial Shop (Corner Cafe: x = 9.0, z = 4.5)
    // Front faces South (+Z) towards Main Street with blue awning & display windows
    const cafe = this.modelLoader.instantiate('commercial_shop_cafe', {
      position: [9.0, 0, 4.5],
      rotation: [0, 0, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(cafe);
    this.colliders.push({ minX: 5.6, maxX: 12.4, minZ: 0.8, maxZ: 8.2 });

    // 3. Across the Street (South of Main Street, rotated PI so fronts face North towards Main Street):
    // A. Suburban House 1 (Green 2-story home with porch & chimney: x = -11.0, z = -17.5)
    const houseGreen = this.modelLoader.instantiate('suburban_house_green', {
      position: [-11.0, 0, -17.5],
      rotation: [0, Math.PI, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(houseGreen);
    this.colliders.push({ minX: -14.8, maxX: -7.2, minZ: -21.0, maxZ: -14.2 });

    // B. Commercial Bookstore / Antique Shop (Red brick storefront with maroon awning: x = -1.0, z = -17.5)
    const bookstore = this.modelLoader.instantiate('commercial_shop_bookstore', {
      position: [-1.0, 0, -17.5],
      rotation: [0, Math.PI, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(bookstore);
    this.colliders.push({ minX: -4.4, maxX: 2.4, minZ: -21.5, maxZ: -13.8 });

    // C. Suburban House 2 (Cream Craftsman with porch: x = 9.0, z = -17.5)
    const houseCream = this.modelLoader.instantiate('suburban_house_cream', {
      position: [9.0, 0, -17.5],
      rotation: [0, Math.PI, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(houseCream);
    this.colliders.push({ minX: 5.2, maxX: 12.8, minZ: -21.0, maxZ: -14.2 });

    // 4. East Avenue Buildings (Along Boulevard de l'Étoile, facing West onto the avenue):
    // Commercial Pharmacy / Municipal building shell (x = 21.0, z = 4.0, rotated -PI/2)
    const municipal = this.modelLoader.instantiate('commercial_shop_cafe', {
      position: [21.0, 0, 4.0],
      rotation: [0, -Math.PI / 2, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(municipal);
    this.colliders.push({ minX: 17.5, maxX: 24.5, minZ: 0.5, maxZ: 7.5 });
  }

  /**
   * STEP 3: FENCES, DRIVEWAYS, PATHS & GARDENS
   *  - Case 1 Garage Driveway connecting to Main Street
   *  - White picket fences enclosing the back yard and side garden
   *  - Flagstone walking paths
   */
  private buildFencesAndDriveways() {
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const stonePathMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.75 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3F2E1E, roughness: 0.9 });
    const woodBorderMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.7 });

    // 1. Case 1 Garage Driveway: connects garage (z = 1.7) down across sidewalk to Main Street (z = -3.5)
    const driveway = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 5.2), asphaltMat);
    driveway.position.set(-10.2, 0.03, -0.9);
    driveway.receiveShadow = true;
    this.scene.add(driveway);

    // 2. Stone Walkway connecting Sidewalk to Bakery Porch
    const walkToPorch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.8), stonePathMat);
    walkToPorch.position.set(0, 0.05, -2.2);
    walkToPorch.receiveShadow = true;
    this.scene.add(walkToPorch);

    // 3. Side Garden Path around West wall past staircase into back yard
    for (let z = 1.0; z <= 9.0; z += 1.8) {
      const paver = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), stonePathMat);
      paver.position.set(-7.4, 0.03, z);
      paver.receiveShadow = true;
      this.scene.add(paver);
    }

    // 4. White Picket Fences around Case 1 Property:
    // A. West Property Boundary Fence (x = -13.0, z from 1.5 to 9.5)
    [3.5, 7.5].forEach(fz => {
      const fence = this.modelLoader.instantiate('fence_picket', {
        position: [-12.8, 0, fz],
        rotation: [0, Math.PI / 2, 0],
        castShadow: true
      });
      this.scene.add(fence);
    });
    this.colliders.push({ minX: -13.2, maxX: -12.4, minZ: 1.5, maxZ: 9.5 });

    // B. North Back Property Fence (z = 9.8, running behind garage & bakery)
    [-10.8, -6.8, 2.8].forEach(fx => {
      const fence = this.modelLoader.instantiate('fence_picket', {
        position: [fx, 0, 9.8],
        castShadow: true
      });
      this.scene.add(fence);
    });
    this.colliders.push({ minX: -13.0, maxX: -4.8, minZ: 9.6, maxZ: 10.0 });
    this.colliders.push({ minX: 0.8, maxX: 4.8, minZ: 9.6, maxZ: 10.0 });
    // (Note: x in [-4.8, 0.8] is open for garden gate / back exit!)

    // 5. Back Garden Raised Soil Vegetable Beds & Flower Box behind Bakery
    const gardenBed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 1.6), soilMat);
    gardenBed.position.set(-2.0, 0.11, 8.2);
    this.scene.add(gardenBed);

    const bedBorder = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.26, 1.8), woodBorderMat);
    bedBorder.position.set(-2.0, 0.13, 8.2);
    bedBorder.castShadow = true;
    this.scene.add(bedBorder);

    // 6. Low Stone Garden Walls around South Suburban Front Lawns
    const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.8 });
    [-11.0, 9.0].forEach(hx => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.35, 0.25), stoneWallMat);
      wall.position.set(hx, 0.175, -12.0);
      wall.castShadow = true;
      this.scene.add(wall);
      this.colliders.push({ minX: hx - 3.8, maxX: hx + 3.8, minZ: -12.2, maxZ: -11.8 });
    });
  }

  /**
   * STEP 4: TREES & VEGETATION (KENNEY LOW-POLY AESTHETIC)
   */
  private buildVegetation() {
    const treePositions: Array<{ type: 'oak' | 'pine'; pos: [number, number, number]; scale?: number }> = [
      // Street Trees along North Sidewalk
      { type: 'oak', pos: [-14.5, 0, -2.5], scale: 1.1 },
      { type: 'oak', pos: [4.8, 0, -2.2], scale: 0.95 },
      { type: 'oak', pos: [11.8, 0, -2.5], scale: 1.05 },

      // Shade Trees along South Sidewalk & Front Lawns
      { type: 'oak', pos: [-15.5, 0, -13.5], scale: 1.2 },
      { type: 'oak', pos: [-6.5, 0, -12.5], scale: 1.0 },
      { type: 'oak', pos: [3.8, 0, -12.8], scale: 1.05 },
      { type: 'oak', pos: [14.0, 0, -13.5], scale: 1.15 },

      // Avenue & Crossroad Park Trees
      { type: 'oak', pos: [18.5, 0, -2.5], scale: 1.2 },
      { type: 'oak', pos: [18.5, 0, 9.5], scale: 1.25 },

      // Back Garden & Perimeter Trees
      { type: 'oak', pos: [-7.5, 0, 11.2], scale: 1.1 },
      { type: 'oak', pos: [2.5, 0, 11.5], scale: 1.0 },
      { type: 'pine', pos: [-13.5, 0, 11.8], scale: 1.3 },
      { type: 'pine', pos: [-14.2, 0, 7.5], scale: 1.15 },
      { type: 'pine', pos: [11.5, 0, 10.8], scale: 1.35 },
      { type: 'pine', pos: [-24.0, 0, -1.8], scale: 1.4 },
      { type: 'pine', pos: [-24.0, 0, 6.0], scale: 1.3 }
    ];

    treePositions.forEach(t => {
      const tree = this.modelLoader.instantiate(t.type === 'oak' ? 'tree_oak' : 'tree_pine', {
        position: t.pos,
        scale: t.scale ?? 1.0,
        castShadow: true
      });
      this.scene.add(tree);

      // Collider around trunk
      this.colliders.push({
        minX: t.pos[0] - 0.4,
        maxX: t.pos[0] + 0.4,
        minZ: t.pos[2] - 0.4,
        maxZ: t.pos[2] + 0.4
      });
    });
  }

  /**
   * STEP 5: STREET FURNITURE & DETAILS
   *  - Cast-iron streetlights with warm point lights
   *  - Fire hydrant, mailboxes, park benches
   *  - Parked town car in garage driveway
   */
  private buildStreetFurniture() {
    // 1. Streetlights along Sidewalks
    const lampPositions: Array<[number, number, number]> = [
      [-12.5, 0, -3.2], // In front of garage
      [-2.8, 0, -3.2],  // West of bakery entrance
      [6.8, 0, -3.2],   // East of bakery in front of cafe
      [-5.5, 0, -9.8],  // South sidewalk across street
      [5.5, 0, -9.8],   // South sidewalk across street
      [12.2, 0, -4.5]   // Crossroad intersection corner
    ];

    lampPositions.forEach(lp => {
      const lamp = this.modelLoader.instantiate('streetlight', {
        position: lp,
        castShadow: true
      });
      this.scene.add(lamp);

      // Light collider
      this.colliders.push({
        minX: lp[0] - 0.25,
        maxX: lp[0] + 0.25,
        minZ: lp[2] - 0.25,
        maxZ: lp[2] + 0.25
      });
    });

    // 2. Fire Hydrant at Corner of Main St & Blvd de l'Étoile
    const hydrant = this.modelLoader.instantiate('fire_hydrant', {
      position: [11.2, 0.10, -3.0],
      castShadow: true
    });
    this.scene.add(hydrant);

    // 3. Sidewalk Park Bench under Shade Tree
    const bench = this.modelLoader.instantiate('park_bench', {
      position: [4.2, 0.10, -2.8],
      rotation: [0, 0, 0],
      castShadow: true
    });
    this.scene.add(bench);
    this.colliders.push({ minX: 3.2, maxX: 5.2, minZ: -3.2, maxZ: -2.4 });

    // 4. Blue Postal Mailbox near Bakery
    const mailbox = this.modelLoader.instantiate('mailbox', {
      position: [2.2, 0.10, -2.8],
      castShadow: true
    });
    this.scene.add(mailbox);

    // 5. Parked Red Town Sedan in Case 1 Driveway
    const car = this.modelLoader.instantiate('car_sedan', {
      position: [-10.2, 0.05, -0.6],
      rotation: [0, 0, 0],
      castShadow: true,
      receiveShadow: true
    });
    this.scene.add(car);
    this.colliders.push({ minX: -11.4, maxX: -9.0, minZ: -2.8, maxZ: 1.6 });

    // 6. Street Name Signpost ("Rue de la Boulangerie / Blvd de l'Étoile")
    const signGroup = new THREE.Group();
    signGroup.position.set(11.2, 0.10, -3.6);

    const signPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, roughness: 0.4 }); // Classic Parisian Blue
    const signTrimMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.3 });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), signPoleMat);
    pole.position.y = 1.4;
    pole.castShadow = true;
    signGroup.add(pole);

    // Two cross-street name plaques
    const plate1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.03), signBoardMat);
    plate1.position.set(0, 2.65, 0);
    signGroup.add(plate1);

    const plate2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.75), signBoardMat);
    plate2.position.set(0, 2.45, 0);
    signGroup.add(plate2);

    this.scene.add(signGroup);
  }
}

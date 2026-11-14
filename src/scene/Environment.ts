import * as THREE from 'three';
import { BoundingBox2D } from './PlayerCharacter';
import { Textures } from './Textures';

/**
 * LAYER 2: 3D CRIME SCENE & MUNICIPAL CITY ENVIRONMENT
 * Renders the investigation building, physical evidence scene, and surrounding street.
 */
export class Environment {
  private scene: THREE.Scene;
  public colliders: BoundingBox2D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildWorld();
  }

  private buildWorld() {
    // 1. Street & Sidewalk Ground
    const groundMat = new THREE.MeshStandardMaterial({
      map: Textures.createCobbleTexture(),
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(48, 0.4, 48), groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Incident Building: "Le Croissant Doré" Bakery & Kitchen (Center North: z: 2 to 14)
    this.buildBakeryScene();

    // 3. Surrounding Town Facades (Street context)
    this.buildSurroundingCity();

    // 4. Street Lamps & Trees
    this.buildStreetDecorations();
  }

  private buildBakeryScene() {
    const kGroup = new THREE.Group();
    const w = 14, h = 4.2, d = 12;
    const kw = w / 2, kd = d / 2;

    // Kitchen Floor with Ceramic Tiles
    const tileTex = Textures.createKitchenTile();
    tileTex.repeat.set(4, 4);
    const floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.6 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), floorMat);
    floor.position.set(0, 0.05, 7.0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Kitchen Walls (Charred plaster and pale cream)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.85 });
    const sootMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }); // Soot scorched

    // North Back Wall (behind oven)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), sootMat);
    backWall.position.set(0, h / 2, 7.0 + kd);
    backWall.castShadow = true;
    this.scene.add(backWall);

    // West Side Wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, d), wallMat);
    westWall.position.set(-kw, h / 2, 7.0);
    westWall.castShadow = true;
    this.scene.add(westWall);

    // East Side Wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, d), wallMat);
    eastWall.position.set(kw, h / 2, 7.0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);

    // South Open Storefront Entrance with French Awning
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(4.5, h, 0.4), wallMat);
    frontWallL.position.set(-kw + 2.25, h / 2, 7.0 - kd);
    this.scene.add(frontWallL);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(4.5, h, 0.4), wallMat);
    frontWallR.position.set(kw - 2.25, h / 2, 7.0 - kd);
    this.scene.add(frontWallR);

    // Striped Awning above entrance
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xF97316, roughness: 0.7 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, 2.4), awningMat);
    awning.position.set(0, 3.8, 7.0 - kd - 1.0);
    awning.rotation.x = 0.25;
    this.scene.add(awning);

    // Bakery Signboard
    const signMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, metalness: 0.2 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.9, 0.15), signMat);
    sign.position.set(0, 4.4, 7.0 - kd - 0.1);
    this.scene.add(sign);

    // Colliders for exterior bakery walls (Leaves open wide door at center z: 1.0, x: -2.5 to 2.5)
    this.colliders.push({ minX: -kw - 0.4, maxX: kw + 0.4, minZ: 7.0 + kd - 0.4, maxZ: 7.0 + kd + 0.4 }); // North
    this.colliders.push({ minX: -kw - 0.4, maxX: -kw + 0.4, minZ: 7.0 - kd, maxZ: 7.0 + kd });             // West
    this.colliders.push({ minX: kw - 0.4, maxX: kw + 0.4, minZ: 7.0 - kd, maxZ: 7.0 + kd });               // East
    this.colliders.push({ minX: -kw, maxX: -kw + 4.5, minZ: 7.0 - kd - 0.4, maxZ: 7.0 - kd + 0.4 });       // Front L
    this.colliders.push({ minX: kw - 4.5, maxX: kw, minZ: 7.0 - kd - 0.4, maxZ: 7.0 - kd + 0.4 });        // Front R

    // --- 3D FORENSIC CLUE PROPS INSIDE THE KITCHEN ---

    // A. CLUE: Charred Liquid Accelerant V-Burn Mark on Floor (at x: 0, z: 7.0)
    const burnMat = new THREE.MeshBasicMaterial({
      map: Textures.createBurnMarkTexture(),
      transparent: true,
      depthWrite: false
    });
    const burnDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), burnMat);
    burnDecal.rotation.x = -Math.PI / 2;
    burnDecal.position.set(0, 0.11, 7.0);
    this.scene.add(burnDecal);

    // B. CLUE: Commercial Deck Oven (at x: -3.8, z: 9.5)
    const ovenMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.8, roughness: 0.3 });
    const oven = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 1.8), ovenMat);
    oven.position.set(-3.8, 1.1, 9.5);
    oven.castShadow = true;
    this.scene.add(oven);
    this.colliders.push({ minX: -5.2, maxX: -2.4, minZ: 8.6, maxZ: 10.4 });

    // Glass oven door (Undamaged Interior Clue)
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.1, metalness: 0.9 });
    const ovenDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.1), glassMat);
    ovenDoor.position.set(-3.8, 1.2, 8.55);
    this.scene.add(ovenDoor);

    // CLUE: Unplugged 240V Industrial Power Cable on Floor (at x: -3.8, z: 7.6)
    const plugCableMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.9 });
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), plugCableMat);
    cable.rotation.z = Math.PI / 3;
    cable.position.set(-3.8, 0.06, 7.6);
    this.scene.add(cable);

    const plugHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.15, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.5 })
    );
    plugHead.position.set(-3.5, 0.08, 7.6);
    this.scene.add(plugHead);

    // C. CLUE: Wooden Prep Table with Flour Sacks & Hidden Kerosene Can (at x: 3.5, z: 8.5)
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.8 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.4), tableMat);
    table.position.set(3.5, 0.55, 8.5);
    table.castShadow = true;
    this.scene.add(table);
    this.colliders.push({ minX: 2.3, maxX: 4.7, minZ: 7.3, maxZ: 9.7 });

    // Flour Sacks on table
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.9 });
    const sack1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.9), sackMat);
    sack1.position.set(3.2, 1.35, 8.2);
    this.scene.add(sack1);

    // CLUE: Concealed Kerosene Canister on side of table
    const canMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.6, roughness: 0.4 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12), canMat);
    can.position.set(4.2, 0.3, 9.2);
    can.castShadow = true;
    this.scene.add(can);

    // D. CLUE: Back Office Desk with Eviction Letter & Debt Ledger (at x: -4.5, z: 4.0)
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.2), tableMat);
    desk.position.set(-4.5, 0.5, 4.0);
    desk.castShadow = true;
    this.scene.add(desk);
    this.colliders.push({ minX: -5.4, maxX: -3.6, minZ: 3.4, maxZ: 4.6 });

    // White paper ledger
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.02, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    paper.position.set(-4.5, 1.02, 4.0);
    this.scene.add(paper);
  }

  private buildSurroundingCity() {
    // 1. Loss Adjuster Bureau HQ (South: z: -16)
    const hqMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const hq = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 8), hqMat);
    hq.position.set(0, 4.5, -16);
    hq.castShadow = true;
    this.scene.add(hq);
    this.colliders.push({ minX: -8.5, maxX: 8.5, minZ: -20, maxZ: -12 });

    // Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.6 });
    [-4, -1.3, 1.3, 4].forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 5.0, 16), colMat);
      col.position.set(cx, 2.5, -11.5);
      this.scene.add(col);
    });

    // 2. West Apartment Block (x: -16, z: -2)
    const aptMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.8 });
    const apt = new THREE.Mesh(new THREE.BoxGeometry(9, 10, 14), aptMat);
    apt.position.set(-16, 5.0, -2);
    apt.castShadow = true;
    this.scene.add(apt);
    this.colliders.push({ minX: -21, maxX: -11.5, minZ: -9, maxZ: 5 });

    // 3. East Noodle Shop (x: 16, z: -2)
    const noodleMat = new THREE.MeshStandardMaterial({ map: Textures.createBrickTexture(), roughness: 0.8 });
    const noodle = new THREE.Mesh(new THREE.BoxGeometry(9, 8, 14), noodleMat);
    noodle.position.set(16, 4.0, -2);
    noodle.castShadow = true;
    this.scene.add(noodle);
    this.colliders.push({ minX: 11.5, maxX: 21, minZ: -9, maxZ: 5 });
  }

  private buildStreetDecorations() {
    // Streetlamps with warm inspection lights
    [[-4.5, -4], [4.5, -4], [-4.5, 0], [4.5, 0]].forEach(([lx, lz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x1E293B })
      );
      pole.position.set(lx, 1.9, lz);
      pole.castShadow = true;
      this.scene.add(pole);

      const light = new THREE.PointLight(0xFEF08A, 0.7, 10);
      light.position.set(lx, 3.8, lz);
      this.scene.add(light);

      this.colliders.push({ minX: lx - 0.3, maxX: lx + 0.3, minZ: lz - 0.3, maxZ: lz + 0.3 });
    });

    // Leafy Trees along curb
    [[-8, -8], [8, -8]].forEach(([tx, tz]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x78350F })
      );
      trunk.position.set(tx, 1.0, tz);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const leaves = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.6),
        new THREE.MeshStandardMaterial({ color: 0x15803D })
      );
      leaves.position.set(tx, 2.6, tz);
      leaves.castShadow = true;
      this.scene.add(leaves);

      this.colliders.push({ minX: tx - 0.4, maxX: tx + 0.4, minZ: tz - 0.4, maxZ: tz + 0.4 });
    });
  }
}


import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ModelInstanceOptions {
  position?: THREE.Vector3 | [number, number, number];
  rotation?: THREE.Euler | [number, number, number];
  scale?: number | THREE.Vector3 | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * LAYER 2: MODEL LOADER & KENNEY CITY KIT ASSET MANAGER
 * Provides:
 *  - High-performance cached GLTF/GLB asset loading
 *  - Drop-in support for Kenney City Kits:
 *      * City Kit (Roads)      -> /models/kenney/roads/...
 *      * City Kit (Suburban)   -> /models/kenney/suburban/...
 *      * City Kit (Commercial) -> /models/kenney/commercial/...
 *  - High-quality procedural fallbacks: if external .glb assets are not yet downloaded,
 *    rich Kenney-proportioned low-poly 3D models render instantly without blackouts or crashes.
 */
export class ModelLoader {
  private static instance: ModelLoader | null = null;
  private loader: GLTFLoader;
  private cache: Map<string, THREE.Group> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map();

  // Shared stylized material palette (Kenney aesthetic)
  private palette = {
    asphalt: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }),
    curb: new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.75 }),
    roadMarkingWhite: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 }),
    roadMarkingYellow: new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.5 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x4D7C0F, roughness: 0.9 }),
    woodFence: new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.7 }),
    woodTrim: new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.65 }),
    brickRed: new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.8 }),
    wallSage: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 }),
    wallCream: new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.7 }),
    wallBlue: new THREE.MeshStandardMaterial({ color: 0x1E3A8A, roughness: 0.75 }),
    wallWhite: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.7 }),
    roofRed: new THREE.MeshStandardMaterial({ color: 0xB91C1C, roughness: 0.7 }),
    roofSlate: new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.65 }),
    roofBrown: new THREE.MeshStandardMaterial({ color: 0x5C3A21, roughness: 0.7 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.5 }),
    awningRed: new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.2, transparent: true, opacity: 0.6 }),
    doorBrown: new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.6 }),
    metalIron: new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.4, metalness: 0.8 }),
    metalChrome: new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.2, metalness: 0.9 }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: 0x5C3A21, roughness: 0.8 }),
    treeLeaves1: new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.75 }),
    treeLeaves2: new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 }),
    treeLeavesPine: new THREE.MeshStandardMaterial({ color: 0x064E3B, roughness: 0.8 }),
    hydrantRed: new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.4, metalness: 0.2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.3, metalness: 0.8 }),
    carBodyRed: new THREE.MeshStandardMaterial({ color: 0xB91C1C, roughness: 0.3, metalness: 0.4 }),
    carTire: new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.8 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0xFEF08A, emissive: 0xFDE047, emissiveIntensity: 1.5 })
  };

  public constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  /**
   * Loads a GLTF/GLB model from URL or disk path with caching.
   * If not found, falls back cleanly to the procedural version.
   */
  public async load(url: string, key?: string): Promise<THREE.Group> {
    const cacheKey = key || url;
    if (this.cache.has(cacheKey)) {
      return this.cloneModel(this.cache.get(cacheKey)!);
    }

    if (this.loadingPromises.has(cacheKey)) {
      const result = await this.loadingPromises.get(cacheKey)!;
      return this.cloneModel(result);
    }

    const loadPromise = new Promise<THREE.Group>((resolve) => {
      // Guard against running in headless node tests
      if (typeof window === 'undefined' || !window.location) {
        const fallback = this.getProceduralModel(cacheKey);
        this.cache.set(cacheKey, fallback);
        resolve(fallback);
        return;
      }

      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(cacheKey, model);
          resolve(model);
        },
        undefined,
        () => {
          // Fallback on missing external asset
          const fallback = this.getProceduralModel(cacheKey);
          this.cache.set(cacheKey, fallback);
          resolve(fallback);
        }
      );
    });

    this.loadingPromises.set(cacheKey, loadPromise);
    const loaded = await loadPromise;
    this.loadingPromises.delete(cacheKey);
    return this.cloneModel(loaded);
  }

  /**
   * Synchronously obtains an instance (cloned from cache or freshly generated procedurally).
   */
  public instantiate(key: string, options: ModelInstanceOptions = {}): THREE.Group {
    let source = this.cache.get(key);
    if (!source) {
      source = this.getProceduralModel(key);
      this.cache.set(key, source);
    }

    const instance = this.cloneModel(source);

    if (options.position) {
      if (Array.isArray(options.position)) {
        instance.position.set(...options.position);
      } else {
        instance.position.copy(options.position);
      }
    }

    if (options.rotation) {
      if (Array.isArray(options.rotation)) {
        instance.rotation.set(...options.rotation);
      } else {
        instance.rotation.copy(options.rotation);
      }
    }

    if (options.scale !== undefined) {
      if (typeof options.scale === 'number') {
        instance.scale.setScalar(options.scale);
      } else if (Array.isArray(options.scale)) {
        instance.scale.set(...options.scale);
      } else {
        instance.scale.copy(options.scale);
      }
    }

    if (options.castShadow !== undefined || options.receiveShadow !== undefined) {
      instance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          if (options.castShadow !== undefined) child.castShadow = options.castShadow;
          if (options.receiveShadow !== undefined) child.receiveShadow = options.receiveShadow;
        }
      });
    }

    return instance;
  }

  /**
   * Deep clones a 3D hierarchy, preserving materials and geometry.
   */
  public cloneModel(source: THREE.Group): THREE.Group {
    const clone = source.clone(true);
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });
    return clone;
  }

  // =========================================================================
  // PROCEDURAL KENNEY-STYLE ASSET GENERATORS
  // Matches exact aesthetic and modular sizing of Kenney City Kits
  // =========================================================================

  private getProceduralModel(key: string): THREE.Group {
    switch (key) {
      case 'road_straight':
        return this.createRoadStraight();
      case 'road_crossroad':
        return this.createRoadCrossroad();
      case 'road_bend':
        return this.createRoadBend();
      case 'suburban_house_green':
        return this.createSuburbanHouse('green');
      case 'suburban_house_cream':
        return this.createSuburbanHouse('cream');
      case 'commercial_shop_cafe':
        return this.createCommercialShop('cafe');
      case 'commercial_shop_bookstore':
        return this.createCommercialShop('bookstore');
      case 'garage_single':
        return this.createGarage();
      case 'fence_picket':
        return this.createFencePicket();
      case 'tree_oak':
        return this.createTree('oak');
      case 'tree_pine':
        return this.createTree('pine');
      case 'streetlight':
        return this.createStreetlight();
      case 'fire_hydrant':
        return this.createFireHydrant();
      case 'park_bench':
        return this.createParkBench();
      case 'car_sedan':
        return this.createCarSedan();
      case 'mailbox':
        return this.createMailbox();
      default:
        // Default box fallback
        const grp = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.palette.curb);
        box.castShadow = true;
        grp.add(box);
        return grp;
    }
  }

  /**
   * Modular Straight Road (6m wide, 10m long)
   * Includes 2 asphalt lanes, sidewalks on both sides, stone curbs, dashed centerline
   */
  private createRoadStraight(): THREE.Group {
    const root = new THREE.Group();

    // Road asphalt bed
    const road = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.08, 10.0), this.palette.asphalt);
    road.position.y = 0.04;
    road.receiveShadow = true;
    root.add(road);

    // Dashed white centerline
    for (let z = -4.0; z <= 4.0; z += 2.5) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 1.2), this.palette.roadMarkingWhite);
      dash.position.set(0, 0.085, z);
      root.add(dash);
    }

    // Curbs & Sidewalks (left & right)
    [-3.8, 3.8].forEach(x => {
      // Sidewalk slab (1.6m wide)
      const walk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 10.0), this.palette.sidewalk);
      walk.position.set(x, 0.08, 0);
      walk.receiveShadow = true;
      root.add(walk);

      // Stone curb trim
      const curbX = x < 0 ? x + 0.85 : x - 0.85;
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.18, 10.0), this.palette.curb);
      curb.position.set(curbX, 0.09, 0);
      curb.receiveShadow = true;
      root.add(curb);
    });

    return root;
  }

  /**
   * 4-Way Crossroad Intersection (6m x 6m intersection with zebra pedestrian crossings)
   */
  private createRoadCrossroad(): THREE.Group {
    const root = new THREE.Group();

    // Intersection asphalt square (10m x 10m)
    const junction = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.08, 10.0), this.palette.asphalt);
    junction.position.y = 0.04;
    junction.receiveShadow = true;
    root.add(junction);

    // Zebra crosswalk stripes along the 4 entrances
    const addZebra = (cx: number, cz: number, isHorizontal: boolean) => {
      for (let i = -1.8; i <= 1.8; i += 0.8) {
        const stripe = new THREE.Mesh(
          isHorizontal ? new THREE.BoxGeometry(0.45, 0.01, 1.6) : new THREE.BoxGeometry(1.6, 0.01, 0.45),
          this.palette.roadMarkingWhite
        );
        stripe.position.set(
          isHorizontal ? cx + i : cx,
          0.085,
          isHorizontal ? cz : cz + i
        );
        root.add(stripe);
      }
    };

    addZebra(0, -3.8, true);  // South approach
    addZebra(0, 3.8, true);   // North approach
    addZebra(-3.8, 0, false); // West approach
    addZebra(3.8, 0, false);  // East approach

    // 4 Corner Sidewalk Curb Blocks
    [
      [-4.0, -4.0],
      [4.0, -4.0],
      [-4.0, 4.0],
      [4.0, 4.0]
    ].forEach(([cx, cz]) => {
      const cornerWalk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 1.8), this.palette.sidewalk);
      cornerWalk.position.set(cx, 0.08, cz);
      cornerWalk.receiveShadow = true;
      root.add(cornerWalk);
    });

    return root;
  }

  /**
   * 90-Degree Road Bend / Curve
   */
  private createRoadBend(): THREE.Group {
    const root = new THREE.Group();

    // Asphalt quadrant base
    const bed = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.08, 10.0), this.palette.asphalt);
    bed.position.set(0, 0.04, 0);
    bed.receiveShadow = true;
    root.add(bed);

    // Curved center stripe markers
    const centerRadius = 4.2;
    for (let a = 0; a <= Math.PI / 2; a += Math.PI / 10) {
      const rx = -5.0 + Math.cos(a) * centerRadius;
      const rz = -5.0 + Math.sin(a) * centerRadius;
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.7), this.palette.roadMarkingWhite);
      mark.position.set(rx, 0.085, rz);
      mark.rotation.y = -a + Math.PI / 4;
      root.add(mark);
    }

    // Outer and Inner corner sidewalks
    const outerWalk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 10.0), this.palette.sidewalk);
    outerWalk.position.set(4.1, 0.08, 0);
    root.add(outerWalk);

    const innerWalk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 1.8), this.palette.sidewalk);
    innerWalk.position.set(-4.1, 0.08, -4.1);
    root.add(innerWalk);

    return root;
  }

  /**
   * Suburban House (Charming low-poly exterior shell with front porch, gabled roof, chimney)
   */
  private createSuburbanHouse(variant: 'green' | 'cream'): THREE.Group {
    const root = new THREE.Group();
    const wallMat = variant === 'green' ? this.palette.wallSage : this.palette.wallCream;
    const roofMat = variant === 'green' ? this.palette.roofRed : this.palette.roofSlate;

    // Foundation Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 6.2), this.palette.curb);
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Main 2-Story House Body (Width 6.8m, Height 4.2m, Depth 5.8m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.2, 5.8), wallMat);
    body.position.y = 0.4 + 2.1;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Gabled Roof
    const roofGeo = new THREE.ConeGeometry(5.2, 2.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 0.4 + 4.2 + 1.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.0, 1.0, 1.15);
    roof.castShadow = true;
    root.add(roof);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.7), this.palette.brickRed);
    chimney.position.set(2.0, 5.8, 1.2);
    chimney.castShadow = true;
    root.add(chimney);

    // Front Porch & Overhang (Facing +Z)
    const porch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 1.8), this.palette.woodFence);
    porch.position.set(0, 0.35, 3.8);
    porch.castShadow = true;
    porch.receiveShadow = true;
    root.add(porch);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 2.0), roofMat);
    porchRoof.position.set(0, 2.6, 3.8);
    porchRoof.castShadow = true;
    root.add(porchRoof);

    // Porch posts
    [-1.5, 1.5].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), this.palette.woodFence);
      post.position.set(px, 1.45, 4.6);
      post.castShadow = true;
      root.add(post);
    });

    // Front Entrance Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), this.palette.doorBrown);
    door.position.set(0, 1.45, 2.92);
    door.castShadow = true;
    root.add(door);

    // Windows with Shutters (Lower & Upper floors)
    const addWindow = (wx: number, wy: number) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.06), this.palette.glass);
      win.position.set(wx, wy, 2.92);
      root.add(win);

      // Shutters
      [-0.55, 0.55].forEach(sx => {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.1, 0.04), this.palette.woodTrim);
        shutter.position.set(wx + sx, wy, 2.93);
        root.add(shutter);
      });
    };

    addWindow(-2.0, 1.8);
    addWindow(2.0, 1.8);
    addWindow(-1.8, 3.6);
    addWindow(0.0, 3.6);
    addWindow(1.8, 3.6);

    return root;
  }

  /**
   * Suburban Single-Car Garage (Facing street with white roll-up panel door)
   */
  private createGarage(): THREE.Group {
    const root = new THREE.Group();

    // Garage Body (Width 4.4m, Height 3.2m, Depth 5.6m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.0, 5.6), this.palette.wallWhite);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Gabled Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 6.0), this.palette.roofSlate);
    roof.position.set(0, 3.1, 0);
    roof.castShadow = true;
    root.add(roof);

    // White Roll-up Garage Door (Facing +Z)
    const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 0.08), this.palette.woodFence);
    garageDoor.position.set(0, 1.2, 2.82);
    garageDoor.castShadow = true;
    root.add(garageDoor);

    // Horizontal grooves on door
    for (let y = 0.4; y <= 2.2; y += 0.45) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.02, 0.09), this.palette.curb);
      groove.position.set(0, y, 2.82);
      root.add(groove);
    }

    return root;
  }

  /**
   * Commercial Shop / Storefront (Exterior shell with canvas awning, shop sign, display windows)
   */
  private createCommercialShop(variant: 'cafe' | 'bookstore'): THREE.Group {
    const root = new THREE.Group();
    const wallMat = variant === 'cafe' ? this.palette.wallCream : this.palette.brickRed;
    const awningMat = variant === 'cafe' ? this.palette.awningBlue : this.palette.awningRed;

    // 2-Story Commercial Building Shell (Width 6.4m, Height 5.4m, Depth 7.0m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.4, 5.4, 7.0), wallMat);
    body.position.y = 2.7;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Parapet Roof Rim
    const rim = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.35, 7.2), this.palette.curb);
    rim.position.y = 5.45;
    rim.castShadow = true;
    root.add(rim);

    // Storefront Display Window (Large Glass Panel)
    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.08), this.palette.glass);
    windowGlass.position.set(-0.8, 1.4, 3.52);
    root.add(windowGlass);

    // Shop Doorway
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 0.08), this.palette.doorBrown);
    door.position.set(2.0, 1.15, 3.52);
    door.castShadow = true;
    root.add(door);

    // Striped Canvas Awning (Sloped 30 deg above window & door)
    const awning = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 1.6), awningMat);
    awning.position.set(0.2, 2.7, 4.15);
    awning.rotation.x = 0.38;
    awning.castShadow = true;
    root.add(awning);

    // Shop Signboard above awning
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 0.12), this.palette.woodTrim);
    sign.position.set(0.2, 3.5, 3.55);
    sign.castShadow = true;
    root.add(sign);

    // Upper Floor Windows
    [-1.8, 0.2, 2.0].forEach(ux => {
      const uwin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.06), this.palette.glass);
      uwin.position.set(ux, 4.3, 3.52);
      root.add(uwin);
    });

    return root;
  }

  /**
   * Modular White Picket Fence Segment (4m long)
   */
  private createFencePicket(): THREE.Group {
    const root = new THREE.Group();

    // 2 Horizontal Cross Rails
    [0.35, 0.75].forEach(ry => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.06), this.palette.woodFence);
      rail.position.set(0, ry, 0);
      rail.castShadow = true;
      root.add(rail);
    });

    // Picket Slats with Pointed Tips
    for (let x = -1.85; x <= 1.85; x += 0.38) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.03), this.palette.woodFence);
      slat.position.set(x, 0.52, 0);
      slat.castShadow = true;
      root.add(slat);
    }

    // End Posts
    [-2.0, 2.0].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 0.14), this.palette.woodFence);
      post.position.set(px, 0.58, 0);
      post.castShadow = true;
      root.add(post);
    });

    return root;
  }

  /**
   * Stylized Low-Poly Tree (Oak or Pine)
   */
  private createTree(type: 'oak' | 'pine'): THREE.Group {
    const root = new THREE.Group();

    if (type === 'oak') {
      // Oak Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.2, 8), this.palette.treeTrunk);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      root.add(trunk);

      // Tiered Polygonal Foliage (layered icosahedrons / dodecahedrons)
      const mat1 = this.palette.treeLeaves1;
      const mat2 = this.palette.treeLeaves2;

      const clump1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), mat1);
      clump1.position.set(0, 2.8, 0);
      clump1.castShadow = true;
      root.add(clump1);

      const clump2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), mat2);
      clump2.position.set(-0.5, 3.4, 0.4);
      clump2.castShadow = true;
      root.add(clump2);

      const clump3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), mat1);
      clump3.position.set(0.4, 3.7, -0.3);
      clump3.castShadow = true;
      root.add(clump3);
    } else {
      // Pine Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 2.0, 8), this.palette.treeTrunk);
      trunk.position.y = 1.0;
      trunk.castShadow = true;
      root.add(trunk);

      // 3 Conical Foliage Tiers
      const tiers = [
        { y: 2.2, r: 1.5, h: 1.8 },
        { y: 3.2, r: 1.2, h: 1.6 },
        { y: 4.2, r: 0.8, h: 1.4 }
      ];

      tiers.forEach(t => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), this.palette.treeLeavesPine);
        cone.position.y = t.y;
        cone.castShadow = true;
        root.add(cone);
      });
    }

    return root;
  }

  /**
   * Cast-Iron Streetlight with Warm Lantern Glow
   */
  private createStreetlight(): THREE.Group {
    const root = new THREE.Group();

    // Base column
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.6, 8), this.palette.metalIron);
    base.position.y = 0.3;
    base.castShadow = true;
    root.add(base);

    // Tall Pole (height 3.8m)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.6, 8), this.palette.metalIron);
    pole.position.y = 2.1;
    pole.castShadow = true;
    root.add(pole);

    // Curved Top Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), this.palette.metalIron);
    arm.position.set(0.35, 3.9, 0);
    arm.castShadow = true;
    root.add(arm);

    // Lantern Fixture
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.35, 6), this.palette.lampGlow);
    lantern.position.set(0.7, 3.75, 0);
    root.add(lantern);

    // Lantern Cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 6), this.palette.metalIron);
    cap.position.set(0.7, 3.98, 0);
    root.add(cap);

    // Soft warm point light for street illumination
    const light = new THREE.PointLight(0xFFFBEB, 0.9, 8, 2.0);
    light.position.set(0.7, 3.6, 0);
    root.add(light);

    return root;
  }

  /**
   * Red Fire Hydrant
   */
  private createFireHydrant(): THREE.Group {
    const root = new THREE.Group();

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.65, 12), this.palette.hydrantRed);
    body.position.y = 0.325;
    body.castShadow = true;
    root.add(body);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), this.palette.hydrantRed);
    dome.position.y = 0.65;
    root.add(dome);

    // Brass Side Nozzles
    [-0.18, 0.18].forEach(nx => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), this.palette.brass);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(nx, 0.42, 0);
      root.add(nozzle);
    });

    return root;
  }

  /**
   * Wooden Park / Sidewalk Bench
   */
  private createParkBench(): THREE.Group {
    const root = new THREE.Group();

    // 2 Cast iron legs
    [-0.7, 0.7].forEach(bx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.45), this.palette.metalIron);
      leg.position.set(bx, 0.25, 0);
      leg.castShadow = true;
      root.add(leg);
    });

    // Wooden Slats (Seat & Back)
    for (let z = -0.16; z <= 0.16; z += 0.11) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.08), this.palette.woodTrim);
      slat.position.set(0, 0.48, z);
      slat.castShadow = true;
      root.add(slat);
    }

    // Backrest slats
    [0.65, 0.8].forEach(by => {
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.03), this.palette.woodTrim);
      back.position.set(0, by, -0.2);
      back.castShadow = true;
      root.add(back);
    });

    return root;
  }

  /**
   * Low-Poly Sedan Car (Parked in driveway / street)
   */
  private createCarSedan(): THREE.Group {
    const root = new THREE.Group();

    // Car Lower Chassis (Length 3.8m, Width 1.8m, Height 0.6m)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.8), this.palette.carBodyRed);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    root.add(lowerBody);

    // Cabin / Roof (Length 2.2m, Width 1.5m, Height 0.65m)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 2.1), this.palette.roofSlate);
    cabin.position.set(0, 1.1, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Cabin Windows
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), this.palette.glass);
    windshield.position.set(0, 1.05, 0.88);
    windshield.rotation.x = 0.35;
    root.add(windshield);

    // 4 Wheels / Tires
    [
      [-0.95, 0.32, -1.1],
      [0.95, 0.32, -1.1],
      [-0.95, 0.32, 1.1],
      [0.95, 0.32, 1.1]
    ].forEach(([tx, ty, tz]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), this.palette.carTire);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(tx, ty, tz);
      tire.castShadow = true;
      root.add(tire);
    });

    return root;
  }

  /**
   * Sidewalk Mailbox (Blue postal pillar)
   */
  private createMailbox(): THREE.Group {
    const root = new THREE.Group();

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.45), this.palette.awningBlue);
    box.position.y = 0.55;
    box.castShadow = true;
    root.add(box);

    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.45, 12), this.palette.awningBlue);
    dome.rotation.x = Math.PI / 2;
    dome.position.y = 0.925;
    root.add(dome);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.02), this.palette.metalIron);
    slot.position.set(0, 0.75, 0.23);
    root.add(slot);

    return root;
  }
}

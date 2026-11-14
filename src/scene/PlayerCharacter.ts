import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

/**
 * LAYER 2: STEP 3 - PLAYER CHARACTER (LOSS ADJUSTER / DETECTIVE)
 * Pure 3D representation and movement mechanics.
 * Supports:
 *  - Stylized low-poly Detective model (Kenney/Quaternius aesthetic with trench coat, fedora, clipboard)
 *  - Drop-in custom GLB support (Mixamo / Quaternius / KayKit / Poly Pizza rigged models)
 *  - Screen-relative locomotion (W: forward, S: back, A: screen-left, D: screen-right)
 */
export class PlayerCharacter {
  public group: THREE.Group;
  private proceduralRoot: THREE.Group;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Record<string, THREE.AnimationAction> = {};
  private currentAction: string = 'Idle';

  // Procedural limb references for non-GLB fallback animation
  private leftLegPivot: THREE.Group | null = null;
  private rightLegPivot: THREE.Group | null = null;
  private rightArmPivot: THREE.Group | null = null;
  private leftArmPivot: THREE.Group | null = null;
  private walkCycle: number = 0;

  // Position starts on porch in front of the graybox house door (y: 0.10, z: -2.5)
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.10, -2.5);
  private targetRotation: THREE.Quaternion = new THREE.Quaternion();
  private upVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  public walkSpeed: number = 3.6;
  public runSpeed: number = 6.8;

  // Jump and vertical elevation physics
  public verticalVelocity: number = 0;
  public isGrounded: boolean = true;
  public jumpForce: number = 5.4;
  public gravity: number = -18.0;

  private keys = { w: false, s: false, a: false, d: false, shift: false, space: false };
  public isReady: boolean = false;

  constructor(scene: THREE.Scene, onLoaded?: () => void) {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    scene.add(this.group);

    // 1. Build Stylized Low-Poly Detective Character (Immediate visual presence)
    this.proceduralRoot = this.buildProceduralDetective();
    this.group.add(this.proceduralRoot);

    // 2. Input handling
    this.bindInput();

    // 3. Asynchronously load custom/bundled GLTF model
    this.loadModel(onLoaded);
  }

  /**
   * Builds a stylized low-poly Detective character matching Kenney/Quaternius proportions:
   * Fedora hat, trench coat with lapels & belt, collar & red tie, trousers, leather shoes,
   * yellow forensic clipboard in hand.
   */
  private buildProceduralDetective(): THREE.Group {
    const root = new THREE.Group();

    // Materials Palette (Vibrant stylized low-poly tones)
    const matCoat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.7, metalness: 0.05 }); // Caramel Tan
    const matCoatTrim = new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.65 }); // Dark Amber Lapels
    const matHat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.7 }); // Felt Brown
    const matHatRibbon = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 }); // Dark Slate Ribbon
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.6 }); // Warm Skin Tone
    const matShirt = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.7 }); // Crisp White Collar
    const matTie = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.6 }); // Detective Crimson Tie
    const matPants = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }); // Slate Trousers
    const matShoes = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 }); // Polished Oxford Shoes
    const matGlasses = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3, metalness: 0.4 });

    // --- Torso & Trench Coat ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.95;

    // Main Coat Body
    const coatBody = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.34), matCoat);
    coatBody.castShadow = true;
    coatBody.receiveShadow = true;
    torsoGroup.add(coatBody);

    // Shirt Collar V-neck insert
    const shirtInsert = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.04), matShirt);
    shirtInsert.position.set(0, 0.20, 0.16);
    torsoGroup.add(shirtInsert);

    // Crimson Tie
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.05), matTie);
    tie.position.set(0, 0.12, 0.17);
    torsoGroup.add(tie);

    // Trench Coat Lapels (Left and Right)
    const leftLapel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.04), matCoatTrim);
    leftLapel.position.set(-0.14, 0.12, 0.165);
    leftLapel.rotation.z = -0.12;
    torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.04), matCoatTrim);
    rightLapel.position.set(0.14, 0.12, 0.165);
    rightLapel.rotation.z = 0.12;
    torsoGroup.add(rightLapel);

    // Trench Coat Waist Belt & Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.10, 0.36), matCoatTrim);
    belt.position.set(0, -0.15, 0);
    torsoGroup.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.7, roughness: 0.3 })
    );
    buckle.position.set(0, -0.15, 0.17);
    torsoGroup.add(buckle);

    // Coat Tails / Lower Skirt
    const coatSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.32, 0.36), matCoat);
    coatSkirt.position.set(0, -0.32, 0);
    coatSkirt.castShadow = true;
    torsoGroup.add(coatSkirt);

    root.add(torsoGroup);

    // --- Head & Fedora ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);

    // Head base
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.30), matSkin);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.08), matSkin);
    nose.position.set(0, -0.02, 0.18);
    headGroup.add(nose);

    // Stylized Spectacles
    const glassesBridge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), matGlasses);
    glassesBridge.position.set(0, 0.04, 0.165);
    headGroup.add(glassesBridge);

    [-0.07, 0.07].forEach(gx => {
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x93C5FD, roughness: 0.1, metalness: 0.1 })
      );
      lens.position.set(gx, 0.04, 0.17);
      headGroup.add(lens);
    });

    // Fedora Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.18;

    // Wide Fedora Brim
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.04, 16), matHat);
    brim.castShadow = true;
    hatGroup.add(brim);

    // Hat Crown (tapered top)
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.22, 16), matHat);
    crown.position.y = 0.12;
    crown.castShadow = true;
    hatGroup.add(crown);

    // Dark Ribbon Band
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.06, 16), matHatRibbon);
    ribbon.position.y = 0.05;
    hatGroup.add(ribbon);

    // Fedora crease tilt
    hatGroup.rotation.x = -0.06;
    headGroup.add(hatGroup);
    root.add(headGroup);

    // --- Left Arm & Yellow Inspection Clipboard ---
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.32, 1.22, 0);

    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), matCoat);
    leftArmMesh.position.y = -0.18;
    leftArmMesh.castShadow = true;
    this.leftArmPivot.add(leftArmMesh);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), matSkin);
    leftHand.position.set(0, -0.42, 0.06);
    this.leftArmPivot.add(leftHand);

    // Forensic Clipboard
    const clipGroup = new THREE.Group();
    const clipBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.34, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.4 })
    );
    clipBoard.castShadow = true;
    clipGroup.add(clipBoard);

    const clipPaper = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.28, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    clipGroup.add(clipPaper);

    const clipClamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8, roughness: 0.2 })
    );
    clipClamp.position.set(0, 0.15, 0.02);
    clipGroup.add(clipClamp);

    clipGroup.position.set(-0.02, -0.40, 0.16);
    clipGroup.rotation.set(-0.4, 0.3, 0);
    this.leftArmPivot.add(clipGroup);
    root.add(this.leftArmPivot);

    // --- Right Arm (Swinging locomotion limb) ---
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 1.22, 0);

    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), matCoat);
    rightArmMesh.position.y = -0.18;
    rightArmMesh.castShadow = true;
    this.rightArmPivot.add(rightArmMesh);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), matSkin);
    rightHand.position.set(0, -0.42, 0);
    this.rightArmPivot.add(rightHand);
    root.add(this.rightArmPivot);

    // --- Legs & Shoes (Walking pivots) ---
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0.58, 0);

    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.18), matPants);
    leftLegMesh.position.y = -0.22;
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), matShoes);
    leftShoe.position.set(0, -0.46, 0.05);
    leftShoe.castShadow = true;
    this.leftLegPivot.add(leftShoe);
    root.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0.58, 0);

    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.18), matPants);
    rightLegMesh.position.y = -0.22;
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), matShoes);
    rightShoe.position.set(0, -0.46, 0.05);
    rightShoe.castShadow = true;
    this.rightLegPivot.add(rightShoe);
    root.add(this.rightLegPivot);

    return root;
  }

  public jump() {
    if (this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }
  }

  private bindInput() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.w = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.s = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.a = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.d = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.shift = true; break;
        case 'Space':
          if (!this.keys.space && this.isGrounded) {
            this.jump();
          }
          this.keys.space = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.w = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.s = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.a = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.d = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.shift = false; break;
        case 'Space': this.keys.space = false; break;
      }
    });
  }

  private loadModel(onLoaded?: () => void) {
    // If running in headless/node test environment without a browser origin, retain procedural detective
    if (typeof window === 'undefined' || !window.location || !window.location.origin) {
      this.isReady = true;
      if (onLoaded) onLoaded();
      return;
    }

    const loader = new GLTFLoader();

    const onModelReady = (gltf: any) => {
      this.model = gltf.scene;
      this.group.add(this.model!);

      // glTF standards specify models face -Z; rotate by 180° so model faces +Z
      this.model!.rotation.y = Math.PI;

      // Hide procedural fallback character when GLTF is attached
      this.proceduralRoot.visible = false;

      // Preserve native textures & colors; do NOT override with solid dark silhouette
      this.model!.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material) {
            obj.material.metalness = Math.min(obj.material.metalness ?? 0.1, 0.25);
            obj.material.roughness = Math.max(obj.material.roughness ?? 0.6, 0.5);
            // If the model has textures, ensure base tint is pure white so textures render vividly
            if (obj.material.map) {
              obj.material.color.setHex(0xFFFFFF);
            }
          }
        }
      });

      // Find bones for accessories (supports standard Mixamo and custom rigs)
      let leftHandBone: any = null;
      let headBone: any = null;
      this.model!.traverse((child: any) => {
        if (child.isBone) {
          const name = child.name.toLowerCase();
          if (name.includes('lefthand') || (name.includes('hand') && name.includes('l'))) leftHandBone = child;
          if (name.includes('head')) headBone = child;
        }
      });

      // Attach Yellow Inspection Clipboard to Left Hand
      const clipGroup = new THREE.Group();
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.4 })
      );
      clipGroup.add(board);
      const paper = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.30, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      clipGroup.add(paper);
      clipGroup.position.set(0.12, 0.05, 0.15);
      clipGroup.rotation.set(0, Math.PI / 2, 0);

      if (leftHandBone) {
        leftHandBone.add(clipGroup);
      } else {
        this.group.add(clipGroup);
      }

      // Attach Spectacles to Head
      const glasses = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x1E293B })
      );
      glasses.position.set(0, 0.15, 0.18);
      if (headBone) headBone.add(glasses);

      // Setup Animation Mixer (flexible name matching for Mixamo / Quaternius / KayKit)
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model!);
        const anims: THREE.AnimationClip[] = gltf.animations;

        // Exclude any TPose clips from candidates
        const nonTpose = anims.filter(c => !c.name.toLowerCase().includes('tpose') && !c.name.toLowerCase().includes('t-pose'));

        const findClip = (patterns: string[]): THREE.AnimationClip | undefined => {
          return nonTpose.find(c => patterns.some(p => c.name.toLowerCase().includes(p.toLowerCase())));
        };

        const idleClip = findClip(['idle', 'stand', 'wait']) || anims[0];
        const walkClip = findClip(['walk', 'stride', 'move']) || anims[3] || nonTpose[0] || anims[0];
        const runClip = findClip(['run', 'sprint', 'jog']) || anims[1] || nonTpose[0] || anims[0];

        this.actions = {
          Idle: this.mixer.clipAction(idleClip),
          Walk: this.mixer.clipAction(walkClip),
          Run: this.mixer.clipAction(runClip)
        };

        // Activate all base actions with weights (Idle: 1, Walk: 0, Run: 0) like Three.js standard
        for (const key in this.actions) {
          const action = this.actions[key];
          action.enabled = true;
          action.setEffectiveTimeScale(1);
          action.setEffectiveWeight(key === 'Idle' ? 1 : 0);
          action.play();
        }
        this.currentAction = 'Idle';
      }

      this.isReady = true;
      if (onLoaded) onLoaded();
    };

    // Candidate model paths: user drop-in 'detective.glb', bundled 'Soldier.glb', or preloaded Base64
    const tryLoadPaths = [
      'models/detective.glb',
      '/models/detective.glb',
      'models/Soldier.glb',
      '/models/Soldier.glb'
    ];

    const tryNext = (index: number) => {
      if (index >= tryLoadPaths.length) {
        // Fallback to preloaded Base64 if available
        if ((window as any).SOLDIER_GLB_B64) {
          try {
            const bin = atob((window as any).SOLDIER_GLB_B64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            loader.parse(bytes.buffer, '', onModelReady, () => {
              this.isReady = true;
              if (onLoaded) onLoaded();
            });
            return;
          } catch (e) {}
        }
        // Retain procedural detective fallback
        this.isReady = true;
        if (onLoaded) onLoaded();
        return;
      }

      loader.load(
        tryLoadPaths[index],
        onModelReady,
        undefined,
        () => tryNext(index + 1)
      );
    };

    tryNext(0);
  }

  public playAction(name: string, duration: number = 0.25) {
    if (this.currentAction === name || !this.actions[name]) return;
    const prev = this.actions[this.currentAction];
    const next = this.actions[name];

    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.time = 0;

    if (prev) {
      prev.crossFadeTo(next, duration, true);
    } else {
      next.fadeIn(duration);
    }
    this.currentAction = name;
  }

  public update(
    delta: number,
    camera: THREE.Camera,
    colliders: BoundingBox2D[] = [],
    canMove: boolean = true,
    getGroundHeight?: (x: number, z: number, currentY?: number) => number
  ): THREE.Vector3 {
    const prevPos = this.position.clone();

    if (canMove) {
      // 1. Calculate Screen-Relative Locomotion Vectors from Camera
      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      // TRUE Screen-Right Vector: camForward × upVector
      const camRight = new THREE.Vector3().crossVectors(camForward, this.upVector).normalize();

      // Controls:
      // W: forward into scene (along camForward)
      // S: back toward camera (along -camForward)
      // D: right on screen (along +camRight)
      // A: left on screen (along -camRight)
      const inputZ = (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0);
      const inputX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);

      const isMoving = inputX !== 0 || inputZ !== 0;
      const targetAction = isMoving ? (this.keys.shift ? 'Run' : 'Walk') : 'Idle';
      this.playAction(targetAction);

      if (isMoving) {
        const moveDir = new THREE.Vector3()
          .addScaledVector(camForward, inputZ)
          .addScaledVector(camRight, inputX)
          .normalize();

        const speed = this.keys.shift ? this.runSpeed : this.walkSpeed;
        const step = moveDir.clone().multiplyScalar(speed * delta);

        let nextX = this.position.x + step.x;
        let nextZ = this.position.z + step.z;

        // Resolve simple AABB wall collision (slides smoothly along walls)
        const radius = 0.4;
        for (const b of colliders) {
          // Vertical check: skip colliders above or below player's current elevation
          if (b.minY !== undefined && this.position.y < b.minY) continue;
          if (b.maxY !== undefined && this.position.y > b.maxY) continue;

          const minX = b.minX - radius;
          const maxX = b.maxX + radius;
          const minZ = b.minZ - radius;
          const maxZ = b.maxZ + radius;

          if (nextX > minX && nextX < maxX && nextZ > minZ && nextZ < maxZ) {
            const dL = nextX - minX, dR = maxX - nextX;
            const dB = nextZ - minZ, dT = maxZ - nextZ;
            const minD = Math.min(dL, dR, dB, dT);

            if (minD === dL) nextX = minX;
            else if (minD === dR) nextX = maxX;
            else if (minD === dB) nextZ = minZ;
            else nextZ = maxZ;
          }
        }

        // Clamp to map bounds
        this.position.x = Math.max(-16, Math.min(16, nextX));
        this.position.z = Math.max(-12, Math.min(16, nextZ));

        // Smooth rotation to face movement heading
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        this.targetRotation.setFromAxisAngle(this.upVector, targetAngle);
        const rotFactor = Math.min(1.0, 16.0 * delta);
        this.group.quaternion.slerp(this.targetRotation, rotFactor);
      }

      // 2. Vertical Jump & Ground Height Elevation Physics
      // Samples ground height beneath feet to keep shoes directly on top of floor surfaces
      const groundY = getGroundHeight ? getGroundHeight(this.position.x, this.position.z, this.position.y) : 0.10;

      this.verticalVelocity += this.gravity * delta;
      let nextY = this.position.y + this.verticalVelocity * delta;

      if (nextY <= groundY) {
        nextY = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
      this.position.y = nextY;

      // 3. Procedural Limb Animation
      if (this.proceduralRoot.visible) {
        if (!this.isGrounded) {
          // Airborne jump silhouette: tuck knees & raise arms
          if (this.leftLegPivot) this.leftLegPivot.rotation.x = -0.35;
          if (this.rightLegPivot) this.rightLegPivot.rotation.x = -0.35;
          if (this.rightArmPivot) this.rightArmPivot.rotation.x = 0.45;
          if (this.leftArmPivot) this.leftArmPivot.rotation.x = -0.25;
        } else if (isMoving) {
          this.walkCycle += (this.keys.shift ? 14 : 9) * delta;
          const swing = Math.sin(this.walkCycle) * (this.keys.shift ? 0.65 : 0.45);
          if (this.leftLegPivot) this.leftLegPivot.rotation.x = swing;
          if (this.rightLegPivot) this.rightLegPivot.rotation.x = -swing;
          if (this.rightArmPivot) this.rightArmPivot.rotation.x = swing;
          if (this.leftArmPivot) this.leftArmPivot.rotation.x = -swing * 0.3;
        } else {
          // Return procedural limbs smoothly to rest pose
          const restSpeed = Math.min(1.0, 10.0 * delta);
          if (this.leftLegPivot) this.leftLegPivot.rotation.x *= (1 - restSpeed);
          if (this.rightLegPivot) this.rightLegPivot.rotation.x *= (1 - restSpeed);
          if (this.rightArmPivot) this.rightArmPivot.rotation.x *= (1 - restSpeed);
          if (this.leftArmPivot) this.leftArmPivot.rotation.x *= (1 - restSpeed);
        }
      }
    } else {
      this.playAction('Idle');
    }

    this.group.position.copy(this.position);

    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Return movement delta for camera sync
    return this.position.clone().sub(prevPos);
  }

  public getForwardDirection(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.group.position.copy(this.position);
  }

  /**
   * Toggles First-Person Perspective (hides character mesh when inside room)
   */
  public setFirstPerson(isFPP: boolean) {
    if (isFPP) {
      if (this.model) this.model.visible = false;
      this.proceduralRoot.visible = false;
    } else {
      if (this.model) {
        this.model.visible = true;
        this.proceduralRoot.visible = false;
      } else {
        this.proceduralRoot.visible = true;
      }
    }
  }
}

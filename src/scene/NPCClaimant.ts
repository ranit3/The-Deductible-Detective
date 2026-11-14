import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * LAYER 2: 3D NPC CLAIMANT / WITNESS (COMPLAINT FILER)
 * Stylized low-poly character representation (KayKit / Quaternius aesthetic),
 * dynamic procedural breathing, head-tracking, conversational gesturing,
 * and seamless drop-in support for custom Mixamo / Quaternius rigged GLBs.
 */
export class NPCClaimant {
  public group: THREE.Group;
  private proceduralRoot: THREE.Group;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Record<string, THREE.AnimationAction> = {};

  // Procedural body parts for lifelike animation
  private headPivot: THREE.Group = new THREE.Group();
  private rightArmPivot: THREE.Group = new THREE.Group();
  private chestGroup: THREE.Group = new THREE.Group();

  private speechBubbleGroup: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3();
  public interactRadius: number = 2.8;
  public name: string = '';

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // 1. Build Stylized Humanoid Claimant Character (Immediate visual presence, no crude shapes)
    this.proceduralRoot = this.buildProceduralClaimant();
    this.group.add(this.proceduralRoot);

    // 2. Stylized 3D Speech Bubble Beacon
    this.speechBubbleGroup = this.buildSpeechBubble();
    this.group.add(this.speechBubbleGroup);

    // 3. Check for custom drop-in GLTF character (e.g. claimant.glb)
    this.loadCustomModel();
  }

  /**
   * Builds a stylized low-poly Humanoid Claimant (Master Baker / Shopkeeper):
   * Features baker's toque hat, collared shirt, white apron with straps and pocket,
   * articulated arms, hands, trousers, and work boots.
   */
  private buildProceduralClaimant(): THREE.Group {
    const root = new THREE.Group();

    // Palette (Warm, stylized low-poly character tones)
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xFCD34D, roughness: 0.65 }); // Warm skin tone
    const matShirt = new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.7 }); // Ivory cream flour shirt
    const matApron = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.75 }); // White canvas apron
    const matApronStraps = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.6 });
    const matHat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 }); // Baker's toque hat
    const matHair = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.8 }); // Brunette hair
    const matMustache = new THREE.MeshStandardMaterial({ color: 0x5B21B6, roughness: 0.7 });
    const matPants = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }); // Dark slate trousers
    const matBoots = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.6 }); // Leather boots
    const matSoles = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.6 });

    // --- Torso & Apron ---
    this.chestGroup = new THREE.Group();
    this.chestGroup.position.y = 0.95;

    // Inner Shirt Body
    const shirtBody = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.60, 0.32), matShirt);
    shirtBody.castShadow = true;
    shirtBody.receiveShadow = true;
    this.chestGroup.add(shirtBody);

    // Apron Bib (front chest cover)
    const apronBib = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.50, 0.04), matApron);
    apronBib.position.set(0, 0.05, 0.165);
    apronBib.castShadow = true;
    this.chestGroup.add(apronBib);

    // Apron Straps over shoulders
    [-0.14, 0.14].forEach(sx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.03), matApronStraps);
      strap.position.set(sx, 0.15, 0.16);
      this.chestGroup.add(strap);
    });

    // Apron Front Pocket
    const apronPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.03), matApronStraps);
    apronPocket.position.set(0, -0.05, 0.185);
    this.chestGroup.add(apronPocket);

    // Apron Skirt (lower waist)
    const apronSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.34), matApron);
    apronSkirt.position.set(0, -0.32, 0.02);
    apronSkirt.castShadow = true;
    this.chestGroup.add(apronSkirt);

    // Baker's Tool / Towel tucked into waist
    const towel = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.28, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.8 })
    );
    towel.position.set(-0.20, -0.25, 0.18);
    towel.rotation.z = 0.15;
    this.chestGroup.add(towel);

    root.add(this.chestGroup);

    // --- Head, Face & Baker's Toque Hat ---
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.48, 0);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.14, 8), matSkin);
    neck.position.y = -0.10;
    this.headPivot.add(neck);

    // Head Base
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.30), matSkin);
    headMesh.castShadow = true;
    this.headPivot.add(headMesh);

    // Hair sides and back
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.14), matHair);
    hairBack.position.set(0, 0.04, -0.12);
    this.headPivot.add(hairBack);

    // Expressive Eyes (Polygonal)
    [-0.08, 0.08].forEach(ex => {
      const eyeSocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x1E293B })
      );
      eyeSocket.position.set(ex, 0.04, 0.16);
      this.headPivot.add(eyeSocket);

      const catchLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.02, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      catchLight.position.set(ex + 0.015, 0.05, 0.175);
      this.headPivot.add(catchLight);

      // Eyebrow
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.03), matHair);
      brow.position.set(ex, 0.09, 0.165);
      brow.rotation.z = (ex > 0 ? 0.08 : -0.08); // Slight worried/expressive slant
      this.headPivot.add(brow);
    });

    // Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.08), matSkin);
    nose.position.set(0, -0.01, 0.18);
    this.headPivot.add(nose);

    // Baker's Mustache
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.06), matHair);
    mustache.position.set(0, -0.08, 0.17);
    this.headPivot.add(mustache);

    // Baker's Toque Hat (Tall puffy chef hat)
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 0.18;

    // Hat Band
    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.12, 16), matHat);
    hatBand.position.y = 0.06;
    hatGroup.add(hatBand);

    // Puffy Crown
    const hatPuff = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.35, 16), matHat);
    hatPuff.position.y = 0.26;
    hatPuff.castShadow = true;
    hatGroup.add(hatPuff);

    // Top Pleat Bulge
    const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), matHat);
    hatTop.position.y = 0.42;
    hatTop.scale.set(1.1, 0.6, 1.1);
    hatTop.castShadow = true;
    hatGroup.add(hatTop);

    hatGroup.rotation.z = 0.05; // Charming jaunty chef slant
    this.headPivot.add(hatGroup);
    root.add(this.headPivot);

    // --- Left Arm (Resting comfortably on hip) ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.30, 1.22, 0);

    const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), matShirt);
    leftUpperArm.position.set(-0.06, -0.12, 0);
    leftUpperArm.rotation.z = 0.35;
    leftUpperArm.castShadow = true;
    leftArmPivot.add(leftUpperArm);

    const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.12), matSkin);
    leftForearm.position.set(-0.08, -0.28, 0.08);
    leftForearm.rotation.x = -0.5;
    leftForearm.rotation.z = 0.2;
    leftForearm.castShadow = true;
    leftArmPivot.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.10, 0.11), matSkin);
    leftHand.position.set(-0.04, -0.34, 0.12);
    leftArmPivot.add(leftHand);
    root.add(leftArmPivot);

    // --- Right Arm (Expressive conversational gesturing pivot) ---
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.30, 1.22, 0);

    const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), matShirt);
    rightUpperArm.position.set(0.04, -0.12, 0);
    rightUpperArm.castShadow = true;
    this.rightArmPivot.add(rightUpperArm);

    const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.12), matSkin);
    rightForearm.position.set(0.04, -0.28, 0.06);
    rightForearm.rotation.x = -0.3;
    rightForearm.castShadow = true;
    this.rightArmPivot.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.10, 0.11), matSkin);
    rightHand.position.set(0.04, -0.36, 0.12);
    this.rightArmPivot.add(rightHand);
    root.add(this.rightArmPivot);

    // --- Legs & Work Boots ---
    [-0.13, 0.13].forEach(lx => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.58, 0);

      const pantsLeg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.52, 0.19), matPants);
      pantsLeg.position.y = -0.22;
      pantsLeg.castShadow = true;
      legGroup.add(pantsLeg);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), matBoots);
      boot.position.set(0, -0.46, 0.04);
      boot.castShadow = true;
      legGroup.add(boot);

      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.29), matSoles);
      sole.position.set(0, -0.52, 0.04);
      legGroup.add(sole);

      root.add(legGroup);
    });

    return root;
  }

  /**
   * Stylized 3D Speech Bubble Beacon with floating animation.
   */
  private buildSpeechBubble(): THREE.Group {
    const group = new THREE.Group();
    group.position.y = 2.45;

    // Bubble Background (Cyan pill)
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.3,
      metalness: 0.1
    });
    const bubbleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), bubbleMat);
    bubbleBody.rotation.x = Math.PI / 2;
    group.add(bubbleBody);

    // Bubble tail pointing down to claimant
    const tailGeo = new THREE.ConeGeometry(0.09, 0.14, 4);
    const tail = new THREE.Mesh(tailGeo, bubbleMat);
    tail.position.set(0, -0.16, 0);
    tail.rotation.z = Math.PI;
    group.add(tail);

    // White Ellipsis Dots ("...")
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    [-0.10, 0, 0.10].forEach(dx => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), dotMat);
      dot.position.set(dx, 0, 0.07);
      group.add(dot);
    });

    return group;
  }

  /**
   * Tries to load custom drop-in GLB character (e.g. claimant.glb or npc.glb).
   */
  private loadCustomModel() {
    // If running in headless/node test environment without a browser origin, retain procedural claimant
    if (typeof window === 'undefined' || !window.location || !window.location.origin) {
      return;
    }

    const loader = new GLTFLoader();
    const tryPaths = [
      'models/claimant.glb',
      '/models/claimant.glb',
      'models/npc.glb',
      '/models/npc.glb'
    ];

    const tryNext = (index: number) => {
      if (index >= tryPaths.length) return; // Keep procedural claimant

      loader.load(
        tryPaths[index],
        (gltf) => {
          this.model = gltf.scene;
          this.group.add(this.model);
          this.model.rotation.y = Math.PI;

          // Hide procedural claimant when GLTF model is provided
          this.proceduralRoot.visible = false;

          // Preserve textures
          this.model.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
              if (obj.material && obj.material.map) {
                obj.material.color.setHex(0xFFFFFF);
              }
            }
          });

          // Animation clips
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            const anims = gltf.animations;
            const findClip = (patterns: string[]) =>
              anims.find(c => patterns.some(p => c.name.toLowerCase().includes(p.toLowerCase())));

            const idleClip = findClip(['idle', 'talk', 'stand', 'wait']) || anims[0];
            const action = this.mixer.clipAction(idleClip);
            action.play();
          }
        },
        undefined,
        () => tryNext(index + 1)
      );
    };

    tryNext(0);
  }

  public setup(name: string, pos: { x: number; y: number; z: number }) {
    this.name = name;
    this.position.set(pos.x, pos.y, pos.z);
    this.group.position.copy(this.position);
  }

  public update(time: number, playerPos: THREE.Vector3): boolean {
    // 1. Animate Speech Beacon (Float & Rotate)
    this.speechBubbleGroup.rotation.y = time * 1.5;
    this.speechBubbleGroup.position.y = 2.45 + Math.sin(time * 3.0) * 0.08;

    // 2. Proximity Check with Player
    const dist = Math.hypot(this.position.x - playerPos.x, this.position.z - playerPos.z);
    const isNear = dist <= this.interactRadius;

    // 3. Lifelike Procedural Animation
    if (this.proceduralRoot.visible) {
      // Natural idle breathing (subtle chest rise)
      if (this.chestGroup) {
        this.chestGroup.position.y = 0.95 + Math.sin(time * 2.2) * 0.015;
      }

      if (isNear) {
        // Look toward player
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const targetAngle = Math.atan2(dx, dz);
        this.group.rotation.y = targetAngle;

        // Interactive head tracking & nodding
        if (this.headPivot) {
          this.headPivot.rotation.x = Math.sin(time * 2.8) * 0.06; // Concerned nod
          this.headPivot.rotation.z = Math.sin(time * 2.0) * 0.03;
        }

        // Conversational hand gesturing
        if (this.rightArmPivot) {
          this.rightArmPivot.rotation.x = -0.3 + Math.sin(time * 3.5) * 0.18;
          this.rightArmPivot.rotation.z = 0.1 + Math.cos(time * 2.5) * 0.08;
        }

        this.speechBubbleGroup.scale.set(1.2, 1.2, 1.2);
      } else {
        // Neutral relaxed idle
        if (this.headPivot) {
          this.headPivot.rotation.x = 0;
          this.headPivot.rotation.z = 0;
        }
        if (this.rightArmPivot) {
          this.rightArmPivot.rotation.x = 0;
          this.rightArmPivot.rotation.z = 0;
        }
        this.speechBubbleGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    if (this.mixer) {
      this.mixer.update(0.016);
    }

    return isNear;
  }
}

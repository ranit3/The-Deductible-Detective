import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * LAYER 2: STEP 3 - PLAYER CHARACTER (CAPSULE + SKELETAL MODEL)
 * Pure 3D representation and movement mechanics.
 */
export class PlayerCharacter {
  public group: THREE.Group;
  private capsuleMesh: THREE.Mesh;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Record<string, THREE.AnimationAction> = {};
  private currentAction: string = 'Idle';

  // Position starts on porch in front of the graybox house door (z: -2.5)
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, -2.5);
  private targetRotation: THREE.Quaternion = new THREE.Quaternion();
  private upVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  public walkSpeed: number = 3.6;
  public runSpeed: number = 7.0;
  private rotateSpeed: number = 0.25;

  private keys = { w: false, s: false, a: false, d: false, shift: false };
  public isReady: boolean = false;

  constructor(scene: THREE.Scene, onLoaded?: () => void) {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    scene.add(this.group);

    // Initial Capsule Player Mesh (Instant visual presence, Step 2/3 requirement)
    const capGeo = new THREE.CapsuleGeometry(0.35, 0.9, 8, 16);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1E3A8A, // Navy Suit Blue
      roughness: 0.55,
      metalness: 0.2
    });
    this.capsuleMesh = new THREE.Mesh(capGeo, capMat);
    this.capsuleMesh.position.y = 0.8;
    this.capsuleMesh.castShadow = true;
    this.group.add(this.capsuleMesh);

    // Direction indicator visor on capsule
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.12, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xFDE047 })
    );
    visor.position.set(0, 1.1, 0.28);
    this.group.add(visor);

    this.bindInput();
    this.loadModel(onLoaded);
  }

  private bindInput() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.w = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.s = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.a = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.d = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.shift = true; break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.w = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.s = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.a = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.d = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.shift = false; break;
      }
    });
  }

  private loadModel(onLoaded?: () => void) {
    const loader = new GLTFLoader();

    const onModelReady = (gltf: any) => {
      this.model = gltf.scene;
      this.group.add(this.model!);
      this.model!.rotation.y = 0; // Model faces +Z

      // Hide simple capsule when high-poly skeletal adjuster is attached
      this.capsuleMesh.visible = false;

      // Navy suit material styling for Loss Adjuster
      this.model!.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material) {
            obj.material.metalness = 0.15;
            obj.material.roughness = 0.65;
            obj.material.color.setHex(0x2B3D52);
          }
        }
      });

      // Find bones for accessories
      let leftHandBone: any = null;
      let headBone: any = null;
      this.model!.traverse((child: any) => {
        if (child.isBone) {
          const name = child.name.toLowerCase();
          if (name.includes('lefthand') || (name.includes('hand') && name.includes('l'))) leftHandBone = child;
          if (name.includes('head')) headBone = child;
        }
      });

      // 1. Yellow Inspection Clipboard on Left Hand
      const clipGroup = new THREE.Group();
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xF4A261, roughness: 0.5 })
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

      // 2. Spectacles on Head
      const glasses = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x1E293B })
      );
      glasses.position.set(0, 0.15, 0.18);
      if (headBone) headBone.add(glasses);

      // Setup Animation Mixer
      this.mixer = new THREE.AnimationMixer(this.model!);
      const anims = gltf.animations;
      this.actions = {
        Idle: this.mixer.clipAction(anims[0]),
        Run: this.mixer.clipAction(anims[1]),
        Walk: this.mixer.clipAction(anims[3])
      };

      for (const key in this.actions) {
        this.actions[key].enabled = true;
        this.actions[key].setEffectiveWeight(key === 'Idle' ? 1 : 0);
      }
      this.actions.Idle.play();

      this.isReady = true;
      if (onLoaded) onLoaded();
    };

    // Check preloaded Base64
    if ((window as any).SOLDIER_GLB_B64) {
      try {
        const bin = atob((window as any).SOLDIER_GLB_B64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        loader.parse(bytes.buffer, '', onModelReady, () => {
          loader.load('models/Soldier.glb', onModelReady);
        });
        return;
      } catch (e) {}
    }

    loader.load('models/Soldier.glb', onModelReady, undefined, () => {
      loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', onModelReady);
    });
  }

  public playAction(name: string) {
    if (this.currentAction === name || !this.actions[name]) return;
    const prev = this.actions[this.currentAction];
    const next = this.actions[name];

    prev.fadeOut(0.2);
    next.reset().fadeIn(0.2).play();
    this.currentAction = name;
  }

  public update(
    delta: number,
    camera: THREE.Camera,
    colliders: BoundingBox2D[] = [],
    canMove: boolean = true
  ): THREE.Vector3 {
    const prevPos = this.position.clone();

    if (canMove) {
      // Screen-relative movement vector from camera
      const camForward = new THREE.Vector3();
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      const camRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camForward).normalize();

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
        this.group.quaternion.rotateTowards(this.targetRotation, this.rotateSpeed);
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
}

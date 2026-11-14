import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

interface PhysicsProp {
  mesh: THREE.Object3D;
  body: RAPIER.RigidBody;
}

/**
 * LAYER 2: STEP 8 - OPTIONAL DECORATIVE PHYSICS FLAVOR
 * Powered by Rapier3D.
 * Handles playful decorative physics (knocking over a desk lamp, kicked bottle, tumbling box).
 * STRICT RULE: Game rules, clues, dialogue, and scoring NEVER depend on physics outcomes.
 */
export class DecorativePhysics {
  private scene: THREE.Scene;
  private world: RAPIER.World | null = null;
  private playerBody: RAPIER.RigidBody | null = null;
  private props: PhysicsProp[] = [];
  public isInitialized: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private async init() {
    try {
      await RAPIER.init();
      // Initialize Rapier Physics World with downward Earth gravity
      const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
      this.world = new RAPIER.World(gravity);

      this.createStaticColliders();
      this.createPlayerKinematicBody();
      this.spawnDecorativeProps();

      this.isInitialized = true;
    } catch (err) {
      console.warn('Decorative Rapier physics disabled, running visual fallback:', err);
    }
  }

  private createStaticColliders() {
    if (!this.world) return;

    // 1. Static Ground Plane
    const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
    const groundBody = this.world.createRigidBody(groundDesc);
    const groundCollider = RAPIER.ColliderDesc.cuboid(18, 0.05, 18);
    this.world.createCollider(groundCollider, groundBody);

    // 2. Static Table Surface (x: -1.8, y: 0.45, z: 5.2, half-extents: 1.2, 0.45, 0.7)
    const tableDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(-1.8, 0.425, 5.2);
    const tableBody = this.world.createRigidBody(tableDesc);
    const tableCollider = RAPIER.ColliderDesc.cuboid(1.2, 0.425, 0.7);
    this.world.createCollider(tableCollider, tableBody);
  }

  private createPlayerKinematicBody() {
    if (!this.world) return;

    // Kinematic controller that tracks the player's locomotion
    const playerDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.8, -2.5);
    this.playerBody = this.world.createRigidBody(playerDesc);
    const playerCollider = RAPIER.ColliderDesc.capsule(0.4, 0.38);
    this.world.createCollider(playerCollider, this.playerBody);
  }

  private spawnDecorativeProps() {
    if (!this.world) return;

    // Prop 1: Brass Desk Lamp on Table (wobbles and tips over when bumped!)
    const lampGroup = new THREE.Group();
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.35, metalness: 0.7 });
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.5 });

    // Base
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), brassMat);
    lampBase.position.y = 0.02;
    lampBase.castShadow = true;
    lampGroup.add(lampBase);

    // Stem
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), brassMat);
    lampStem.position.y = 0.18;
    lampStem.castShadow = true;
    lampGroup.add(lampStem);

    // Shade
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 12, 1, true), shadeMat);
    lampShade.position.y = 0.34;
    lampShade.castShadow = true;
    lampGroup.add(lampShade);

    lampGroup.position.set(-1.2, 0.92, 5.0);
    this.scene.add(lampGroup);

    // Lamp Rigid Body
    const lampDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(-1.2, 0.92 + 0.18, 5.0)
      .setLinearDamping(0.8)
      .setAngularDamping(0.6);
    const lampBody = this.world.createRigidBody(lampDesc);
    const lampCollider = RAPIER.ColliderDesc.cylinder(0.18, 0.12).setRestitution(0.3);
    this.world.createCollider(lampCollider, lampBody);
    this.props.push({ mesh: lampGroup, body: lampBody });

    // Prop 2: Emerald Glass Soda Bottle on Floor (rolls and clinks)
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0x10B981,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.28, 12), bottleMat);
    bottle.position.set(-4.2, 0.15, 6.2);
    bottle.castShadow = true;
    this.scene.add(bottle);

    const bottleDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(-4.2, 0.15, 6.2)
      .setLinearDamping(0.5)
      .setAngularDamping(0.4);
    const bottleBody = this.world.createRigidBody(bottleDesc);
    const bottleCollider = RAPIER.ColliderDesc.cylinder(0.14, 0.065).setRestitution(0.4);
    this.world.createCollider(bottleCollider, bottleBody);
    this.props.push({ mesh: bottle, body: bottleBody });

    // Prop 3: Kraft Storage Cardboard Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.85 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 0.45), boxMat);
    box.position.set(1.2, 0.22, 8.2);
    box.castShadow = true;
    this.scene.add(box);

    const boxDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(1.2, 0.22, 8.2)
      .setLinearDamping(1.2)
      .setAngularDamping(1.0);
    const boxBody = this.world.createRigidBody(boxDesc);
    const boxCollider = RAPIER.ColliderDesc.cuboid(0.225, 0.18, 0.225).setRestitution(0.15);
    this.world.createCollider(boxCollider, boxBody);
    this.props.push({ mesh: box, body: boxBody });
  }

  public update(_delta: number, playerPos: THREE.Vector3) {
    if (!this.world || !this.isInitialized) return;

    // 1. Sync Kinematic Player Body with player's WASD locomotion
    if (this.playerBody) {
      this.playerBody.setNextKinematicTranslation({
        x: playerPos.x,
        y: playerPos.y + 0.8,
        z: playerPos.z
      });
    }

    // 2. Step Rapier Simulation (Fixed timestep)
    this.world.step();

    // 3. Sync Dynamic Rigid Bodies back to Three.js Meshes
    for (const prop of this.props) {
      const pos = prop.body.translation();
      const rot = prop.body.rotation();

      prop.mesh.position.set(pos.x, pos.y, pos.z);
      prop.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  }

  /**
   * Playfully nudges a prop with an impulse
   */
  public nudgeProp(propMesh: THREE.Object3D) {
    const found = this.props.find(p => p.mesh === propMesh);
    if (found) {
      found.body.applyImpulse({ x: (Math.random() - 0.5) * 0.4, y: 0.3, z: (Math.random() - 0.5) * 0.4 }, true);
    }
  }
}


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clue } from '../logic/types';
import { ClueMarkers } from './ClueMarkers';
import { Environment } from './Environment';
import { NPCClaimant } from './NPCClaimant';
import { PlayerCharacter } from './PlayerCharacter';
import { InteractionRaycaster, RaycastHitInfo } from './InteractionRaycaster';
import { DecorativePhysics } from './DecorativePhysics';

/**
 * LAYER 2: 3D SCENE MANAGER
 * STEP 3: Fixed / Angled 2.5D Camera & Graybox House Environment
 * STEP 4: Raycasted Hover & Click Interaction System
 * STEP 8: Decorative Rapier3D Physics Flavor
 */
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public orbitControls: OrbitControls;

  public environment: Environment;
  public player: PlayerCharacter;
  public claimantNPC: NPCClaimant;
  public clueMarkers: ClueMarkers;
  public raycaster: InteractionRaycaster;
  public physics: DecorativePhysics;

  private isRunning: boolean = true;
  private lastTime: number = performance.now();

  // Callbacks for spatial game events
  public onNearClue: ((clue: Clue | null) => void) | null = null;
  public onNearNPC: ((isNear: boolean, npcName: string) => void) | null = null;
  public onClueHovered: ((hit: RaycastHitInfo | null, screenX: number, screenY: number) => void) | null = null;
  public onClueClicked: ((clueId: string, hit: RaycastHitInfo) => void) | null = null;

  constructor(container: HTMLElement, onReady?: () => void) {
    // 1. Scene & Sky
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xBAE6FD); // Crisp daytime pastel sky
    this.scene.fog = new THREE.FogExp2(0xBAE6FD, 0.008);

    // 2. Angled 2.5D Camera (Pitch ~48°, comfortable top-down view into graybox room)
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 10.5, -9.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls with smooth target tracking
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.target.set(0, 1.2, -2.5);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.orbitControls.minDistance = 3.5;
    this.orbitControls.maxDistance = 40;
    this.orbitControls.update();

    // 5. Lighting
    this.setupLights();

    // 6. Scene Components (Graybox House, Player, NPC, Clue Markers)
    this.environment = new Environment(this.scene);
    this.claimantNPC = new NPCClaimant(this.scene);
    this.clueMarkers = new ClueMarkers(this.scene);
    this.player = new PlayerCharacter(this.scene, onReady);

    // 7. Raycasted Hover & Click Interaction System
    this.raycaster = new InteractionRaycaster(this.camera, this.renderer.domElement);
    this.updateRaycasterTargets();
    this.raycaster.onHoverChange = (hit, x, y) => {
      if (this.onClueHovered) this.onClueHovered(hit, x, y);
    };
    this.raycaster.onInteract = (clueId, hit) => {
      if (this.onClueClicked) this.onClueClicked(clueId, hit);
    };

    // 8. Decorative Rapier Physics Flavor (Step 8)
    this.physics = new DecorativePhysics(this.scene);

    // 9. Event Handlers
    window.addEventListener('resize', this.onResize.bind(this));

    // 10. Start Loop
    requestAnimationFrame(this.animate.bind(this));
  }

  private setupLights() {
    // 1. Hemisphere Light (Soft Sky & Ground Bounce)
    const hemiLight = new THREE.HemisphereLight(0xF0F9FF, 0x94A3B8, 0.85);
    this.scene.add(hemiLight);

    // 2. Warm Key Sunlight with Soft PCF Shadows
    const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.4);
    dirLight.position.set(16, 35, -14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.radius = 2.0;
    dirLight.shadow.bias = -0.0004;
    this.scene.add(dirLight);

    // 3. Sky Bounce Fill Light
    const bounceLight = new THREE.DirectionalLight(0xBAE6FD, 0.45);
    bounceLight.position.set(-14, 18, 16);
    this.scene.add(bounceLight);

    // 4. Warm Interior Inspection Lamp for Room Examination
    const interiorLight = new THREE.PointLight(0xFFFBEB, 0.95, 14, 1.8);
    interiorLight.position.set(0, 2.8, 5.0);
    this.scene.add(interiorLight);
  }

  public setupCaseScene(claimantName: string, clues: Clue[]) {
    // Position Claimant NPC near porch entrance
    this.claimantNPC.setup(claimantName, { x: 1.8, y: 0, z: -1.8 });
    this.clueMarkers.setClues(clues);
    this.updateRaycasterTargets();
  }

  public updateRaycasterTargets() {
    if (!this.raycaster) return;
    const targets: THREE.Object3D[] = [
      ...this.environment.getInteractiveObjects(),
      ...this.clueMarkers.getInteractiveObjects()
    ];
    this.raycaster.setTargets(targets);
  }

  public captureViewportSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/jpeg', 0.85);
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(now: number) {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Update Player Locomotion, Jumping & Elevation
    const groundHeightFn = (x: number, z: number) => this.environment.getGroundHeight(x, z);
    this.player.update(delta, this.camera, this.environment.colliders, true, groundHeightFn);

    // 2. Dynamic Adaptive Camera (Interior Diorama vs Exterior Porch)
    this.updateDynamicCamera(delta);

    // 3. Update Clue Markers & Proximity Detection
    const nearbyClue = this.clueMarkers.update(now * 0.001, this.player.position);
    if (this.onNearClue) {
      this.onNearClue(nearbyClue);
    }

    // 4. Update NPC Claimant Proximity
    const isNearNPC = this.claimantNPC.update(now * 0.001, this.player.position);
    if (this.onNearNPC) {
      this.onNearNPC(isNearNPC, this.claimantNPC.name);
    }

    // 5. Update Decorative Rapier Physics (Step 8)
    this.physics.update(delta, this.player.position);

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Dynamically transitions camera angle and cutaway walls based on player location.
   * When inside: steeper pitch (~63°) and cutaway front wall for full diorama visibility.
   * When outside: comfortable angled 2.5D view (~48°) of building entrance and porch.
   */
  private updateDynamicCamera(delta: number) {
    const isInside = this.player.position.z > 0.8 && Math.abs(this.player.position.x) < 5.0;

    // 1. Cutaway front wall: fade to translucent when inside the room
    this.environment.setCutaway(isInside);

    // 2. Dynamic camera offsets
    const idealOffset = isInside
      ? new THREE.Vector3(0, 9.6, -5.0)
      : new THREE.Vector3(0, 8.6, -7.6);

    const targetLookAt = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + (isInside ? 1.0 : 1.2),
      this.player.position.z
    );

    const targetCamPos = this.player.position.clone().add(idealOffset);

    // Smoothly interpolate camera position and orbit target
    const camLerp = Math.min(1.0, 4.5 * delta);
    const targetLerp = Math.min(1.0, 7.5 * delta);

    this.camera.position.lerp(targetCamPos, camLerp);
    this.orbitControls.target.lerp(targetLookAt, targetLerp);
    this.orbitControls.update();
  }

  public dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

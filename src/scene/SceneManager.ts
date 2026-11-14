import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clue } from '../logic/types';
import { ClueMarkers } from './ClueMarkers';
import { Environment } from './Environment';
import { NPCClaimant } from './NPCClaimant';
import { PlayerCharacter } from './PlayerCharacter';

/**
 * LAYER 2: 3D SCENE MANAGER
 * STEP 3: Fixed / Angled 2.5D Camera & Graybox House Environment
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

  private isRunning: boolean = true;
  private lastTime: number = performance.now();

  // Callbacks for spatial game events
  public onNearClue: ((clue: Clue | null) => void) | null = null;
  public onNearNPC: ((isNear: boolean, npcName: string) => void) | null = null;

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

    // 7. Event Handlers
    window.addEventListener('resize', this.onResize.bind(this));

    // 8. Start Loop
    requestAnimationFrame(this.animate.bind(this));
  }

  private setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x94A3B8, 0.75);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.35);
    dirLight.position.set(16, 35, -14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    // Interior Soft Fill Light for room inspection
    const interiorLight = new THREE.PointLight(0xFFFBEB, 0.8, 14);
    interiorLight.position.set(0, 2.8, 5.0);
    this.scene.add(interiorLight);
  }

  public setupCaseScene(claimantName: string, clues: Clue[]) {
    // Position Claimant NPC near porch entrance
    this.claimantNPC.setup(claimantName, { x: 1.8, y: 0, z: -1.8 });
    this.clueMarkers.setClues(clues);
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

    // 1. Update Player Locomotion & Simple AABB Wall Collision
    const deltaMove = this.player.update(delta, this.camera, this.environment.colliders, true);

    // 2. Synchronous 2.5D Camera Follow (Camera & Target translate together by deltaMove)
    this.camera.position.add(deltaMove);
    this.orbitControls.target.add(deltaMove);
    this.orbitControls.update();

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

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

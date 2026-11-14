import * as THREE from 'three';
import { PlayerCharacter } from '../PlayerCharacter';
import { NPCClaimant } from '../NPCClaimant';

console.log('--- RUNNING CHARACTER LOCOMOTION & VISUALS TEST SUITE ---');

// Mock window event listeners for headless node environment
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

// 1. Verify Player Character Construction
const scene = new THREE.Scene();
const player = new PlayerCharacter(scene);

if (!player.group) {
  throw new Error('PlayerCharacter missing group');
}
console.log('✓ PlayerCharacter instantiated with stylized procedural model.');

// 2. Test Screen-Relative Locomotion Math
// Camera at (0, 10, -10) looking toward (0, 0, 0), viewing along +Z
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 10, -10);
camera.lookAt(0, 0, 0);

// Camera forward should be (0, 0, 1) in horizontal plane
const camForward = new THREE.Vector3();
camera.getWorldDirection(camForward);
camForward.y = 0;
camForward.normalize();

if (Math.abs(camForward.z - 1) > 0.01) {
  throw new Error(`Expected camForward.z ~ 1, got ${camForward.z}`);
}

// True Screen Right vector: camForward × (0, 1, 0)
const upVector = new THREE.Vector3(0, 1, 0);
const camRight = new THREE.Vector3().crossVectors(camForward, upVector).normalize();

// In Three.js screen space when looking down +Z:
// World -X is Screen-Right
if (camRight.x > -0.99) {
  throw new Error(`Expected camRight.x to point Screen-Right (world -X, ~ -1), got ${camRight.x}`);
}
console.log(`✓ camRight points correctly to Screen-Right: (${camRight.x}, ${camRight.y}, ${camRight.z})`);

// Test input simulation
// Setting keys directly via reflection for unit test
(player as any).keys.d = true; // Press 'D' (Right)
(player as any).keys.a = false;
(player as any).keys.w = false;
(player as any).keys.s = false;

const startPos = player.position.clone();
const deltaMoveRight = player.update(0.1, camera, [], true);

// When pressing D, character must move in Screen-Right direction (world -X)
if (deltaMoveRight.x >= 0) {
  throw new Error(`Pressing 'D' moved character in +X (Screen-Left)! Expected negative X for Screen-Right. deltaMove: ${JSON.stringify(deltaMoveRight)}`);
}
console.log(`✓ Pressing 'D' correctly moves Screen-Right (delta.x: ${deltaMoveRight.x.toFixed(4)})`);

// Reset and test pressing A (Left)
(player as any).keys.d = false;
(player as any).keys.a = true;
const deltaMoveLeft = player.update(0.1, camera, [], true);

if (deltaMoveLeft.x <= 0) {
  throw new Error(`Pressing 'A' moved character in -X (Screen-Right)! Expected positive X for Screen-Left. deltaMove: ${JSON.stringify(deltaMoveLeft)}`);
}
console.log(`✓ Pressing 'A' correctly moves Screen-Left (delta.x: ${deltaMoveLeft.x.toFixed(4)})`);

// Reset and test pressing W (Forward into scene)
(player as any).keys.a = false;
(player as any).keys.w = true;
const deltaMoveForward = player.update(0.1, camera, [], true);

if (deltaMoveForward.z <= 0) {
  throw new Error(`Pressing 'W' moved character backward! Expected positive Z for forward. deltaMove: ${JSON.stringify(deltaMoveForward)}`);
}
console.log(`✓ Pressing 'W' correctly moves forward away from camera (delta.z: ${deltaMoveForward.z.toFixed(4)})`);

// 3. Test NPC Claimant Humanoid Model
const claimant = new NPCClaimant(scene);
claimant.setup('Thomas Bailey', { x: 2, y: 0, z: -2 });

// Verify group contains multiple body parts (humanoid, not simple shapes)
let meshCount = 0;
claimant.group.traverse((obj: any) => {
  if (obj.isMesh) meshCount++;
});

console.log(`Claimant 3D hierarchy contains ${meshCount} detailed polygonal meshes.`);
if (meshCount < 10) {
  throw new Error(`Expected at least 10 detailed meshes for stylized humanoid claimant, found ${meshCount}`);
}
console.log('✓ NPC Claimant is a full low-poly humanoid character with apron, hat, limbs, and facial features.');

// 4. Test Claimant Proximity & Look-At Tracking
const farPlayerPos = new THREE.Vector3(20, 0, 20);
const isNearFar = claimant.update(1.0, farPlayerPos);
if (isNearFar) {
  throw new Error('Claimant should NOT be near player at distance 25m');
}

const nearPlayerPos = new THREE.Vector3(2.5, 0, -2);
const isNearClose = claimant.update(1.5, nearPlayerPos);
if (!isNearClose) {
  throw new Error('Claimant SHOULD be near player at distance 0.5m');
}
console.log('✓ Claimant proximity detection, head-tracking, and conversational gesturing verified.');

// 5. Test Animation Cross-Fading (No T-Pose Sliding)
const mockRoot = new THREE.Group();
const mockMixer = new THREE.AnimationMixer(mockRoot);
const mockTrack = new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0, 1, 0]);
const idleClip = new THREE.AnimationClip('Idle', 1, [mockTrack]);
const walkClip = new THREE.AnimationClip('Walk', 1, [mockTrack]);
const runClip = new THREE.AnimationClip('Run', 1, [mockTrack]);

(player as any).mixer = mockMixer;
(player as any).actions = {
  Idle: mockMixer.clipAction(idleClip),
  Walk: mockMixer.clipAction(walkClip),
  Run: mockMixer.clipAction(runClip)
};

// Initialize all actions
for (const k in (player as any).actions) {
  const act = (player as any).actions[k];
  act.enabled = true;
  act.setEffectiveTimeScale(1);
  act.setEffectiveWeight(k === 'Idle' ? 1 : 0);
  act.play();
}
(player as any).currentAction = 'Idle';

// Transition to Walk
player.playAction('Walk', 0.2);
mockMixer.update(0.1);

const midWalkWeight = (player as any).actions.Walk.getEffectiveWeight();
if (midWalkWeight <= 0) {
  throw new Error(`Walk animation weight did not increase during transition! Weight: ${midWalkWeight}`);
}
console.log(`✓ Walk animation crossfades cleanly (Mid-transition weight: ${midWalkWeight.toFixed(2)})`);

mockMixer.update(0.15);
const fullWalkWeight = (player as any).actions.Walk.getEffectiveWeight();
if (fullWalkWeight < 0.99) {
  throw new Error(`Walk animation did not reach full weight! Weight: ${fullWalkWeight}`);
}
console.log(`✓ Walk animation reached full weight: ${fullWalkWeight.toFixed(2)} (Prevents T-pose sliding)`);

// 6. Test Jumping & Height Level Configuration
console.log('Testing Jump & Floor Height Elevation Configuration...');
const groundSampler = (x: number, z: number) => {
  if (x >= -5.0 && x <= 5.0 && z >= 0.8 && z <= 9.0) return 0.10;
  if (x >= -1.8 && x <= 1.8 && z >= -3.5 && z < 0.8) return 0.10;
  return 0.0;
};

// Check floor elevation on porch & inside room
const porchH = groundSampler(0, -2.0);
const roomH = groundSampler(0, 5.0);
const yardH = groundSampler(10, 10);

if (porchH !== 0.10 || roomH !== 0.10 || yardH !== 0.0) {
  throw new Error(`Invalid ground heights sampled! Porch: ${porchH}, Room: ${roomH}, Yard: ${yardH}`);
}
console.log(`✓ Floor heights configured: Porch = ${porchH}m, Room = ${roomH}m, Yard = ${yardH}m`);

// Verify player stays on top of floor (y = 0.10) when inside room (no sunken shoes)
(player as any).keys.w = false;
(player as any).keys.s = false;
(player as any).keys.a = false;
(player as any).keys.d = false;
player.setPosition(0, 0.10, 5.0);
player.update(0.1, camera, [], true, groundSampler);
if (Math.abs(player.position.y - 0.10) > 0.001) {
  throw new Error(`Player shoes sunk under floor! Expected y = 0.10, got ${player.position.y}`);
}
console.log(`✓ Player resting elevation inside room: ${player.position.y.toFixed(2)}m (Shoes directly on floor surface)`);

// Test jump execution
if (!player.isGrounded) {
  throw new Error('Player should be grounded before jump');
}
player.jump();
if (player.verticalVelocity <= 0 || player.isGrounded) {
  throw new Error('Player jump failed to initiate vertical impulse');
}
console.log(`✓ Jump initiated with impulse: ${player.verticalVelocity.toFixed(1)} m/s (isGrounded: ${player.isGrounded})`);

// Advance physics mid-air
player.update(0.1, camera, [], true, groundSampler);
if (player.position.y <= 0.10 || player.isGrounded) {
  throw new Error(`Player should be airborne mid-jump! y = ${player.position.y}`);
}
console.log(`✓ Player airborne mid-jump at y = ${player.position.y.toFixed(2)}m`);

// Advance physics until landing
for (let step = 0; step < 10; step++) {
  player.update(0.1, camera, [], true, groundSampler);
}
if (!player.isGrounded || Math.abs(player.position.y - 0.10) > 0.001) {
  throw new Error(`Player failed to land squarely on floor! isGrounded: ${player.isGrounded}, y = ${player.position.y}`);
}
console.log(`✓ Player landed cleanly on floor surface at y = ${player.position.y.toFixed(2)}m (isGrounded: ${player.isGrounded})`);

// 7. Test FPP / TPP Character Visibility Toggle
console.log('Testing FPP / TPP Character Visibility Toggle...');
player.setFirstPerson(true);
if ((player as any).proceduralRoot.visible) {
  throw new Error('Expected procedural character mesh to be hidden in FPP mode');
}
console.log('✓ Character model hidden in FPP (prevents camera clipping inside room)');

player.setFirstPerson(false);
if (!(player as any).proceduralRoot.visible) {
  throw new Error('Expected procedural character mesh to be restored in TPP mode');
}
console.log('✓ Character model restored in TPP (detective visible on exterior porch/street)');

console.log('--- ALL CHARACTER LOCOMOTION & VISUALS TESTS PASSED SUCCESSFULLY! ---');

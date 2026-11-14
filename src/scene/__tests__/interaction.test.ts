import * as THREE from 'three';
import { Environment } from '../Environment';
import { ClueMarkers } from '../ClueMarkers';
import { CaseManager } from '../../logic/CaseManager';
import { case1BakeryFire } from '../../logic/cases/case1_bakeryFire';

console.log('--- RUNNING STEP 4: INTERACTION SYSTEM TEST SUITE ---');

// 1. Verify 3D Environment Clue Props carry valid userData IDs
const scene = new THREE.Scene();
const environment = new Environment(scene);
const interactiveProps = environment.getInteractiveObjects();

console.log(`Discovered ${interactiveProps.length} interactive physical props in Environment.`);
if (interactiveProps.length === 0) {
  throw new Error('Expected interactiveProps in Environment, found none.');
}

const propClueIds = interactiveProps.map(p => p.userData.clueId);
console.log('Prop Clue IDs:', propClueIds);

// Verify required canonical clue ID: 'forced_lock_back_door'
if (!propClueIds.includes('forced_lock_back_door')) {
  throw new Error("Missing canonical clue ID 'forced_lock_back_door' on 3D props!");
}

// Verify other crucial case clues are present on props
['clue_unplugged_oven', 'clue_kerosene_canister', 'clue_burn_pour_pattern', 'clue_late_rent_ledger'].forEach(id => {
  if (!propClueIds.includes(id)) {
    throw new Error(`Missing expected clue prop for '${id}'!`);
  }
});
console.log('✓ All required physical 3D clue props have valid userData.clueId assigned.');

// 2. Verify ClueMarkers also register interactive markers with userData.clueId
const clueMarkers = new ClueMarkers(scene);
clueMarkers.setClues(case1BakeryFire.clues);
const markerObjects = clueMarkers.getInteractiveObjects();

console.log(`ClueMarkers created ${markerObjects.length} interactive marker targets.`);
if (markerObjects.length === 0) {
  throw new Error('Expected interactive objects from ClueMarkers.');
}

markerObjects.forEach(m => {
  if (!m.userData || !m.userData.clueId) {
    throw new Error('Marker object missing userData.clueId');
  }
});
console.log('✓ All ClueMarker objects carry valid userData.clueId.');

// 3. Verify interaction simulation: clicking a prop adds it to the notebook (CaseManager)
const caseManager = new CaseManager();
const initialDiscovered = caseManager.getDiscoveredClues().length;
console.log(`Initial discovered clues in notebook: ${initialDiscovered}`);

// Simulate clicking 'forced_lock_back_door'
const discoveredLock = caseManager.discoverClue('forced_lock_back_door');
if (!discoveredLock) {
  throw new Error("Failed to discover 'forced_lock_back_door'");
}
console.log(`Discovered: ${discoveredLock.name} (Category: ${discoveredLock.category})`);

// Simulate clicking 'clue_unplugged_oven'
const discoveredOven = caseManager.discoverClue('clue_unplugged_oven');
if (!discoveredOven) {
  throw new Error("Failed to discover 'clue_unplugged_oven'");
}
console.log(`Discovered: ${discoveredOven.name}`);

const afterCount = caseManager.getDiscoveredClues().length;
console.log(`Discovered clues in notebook after interaction: ${afterCount}`);
if (afterCount !== initialDiscovered + 2) {
  throw new Error(`Expected ${initialDiscovered + 2} clues in notebook, found ${afterCount}`);
}

console.log('--- ALL STEP 4 INTERACTION TESTS PASSED SUCCESSFULLY! ---');


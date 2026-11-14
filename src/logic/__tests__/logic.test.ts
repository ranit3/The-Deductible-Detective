import { case1BakeryFire } from '../cases/case1_bakeryFire';
import { DialogueEngine } from '../DialogueEngine';
import { ScoringEngine } from '../ScoringEngine';
import { ReportSubmission } from '../types';

console.log('--- RUNNING LAYER 1 GAME LOGIC TEST SUITE ---');

// Test 1: Scoring Engine with Perfect Investigation Report
const perfectSubmission: ReportSubmission = {
  selectedCause: 'deliberate_arson_accelerant',
  verdictFraud: true,
  assessedPayout: 0, // Fraud => claim denied
  attachedClueIds: ['clue_unplugged_oven', 'clue_kerosene_canister', 'clue_burn_pour_pattern'],
  notes: 'Pierre Laurent poured kerosene behind the flour sacks to stage an arson claim. The commercial oven was never plugged in.'
};

const resultA = ScoringEngine.evaluate(perfectSubmission, case1BakeryFire.groundTruth);
console.log(`Test 1 (Perfect Report): Score = ${resultA.totalScore} / 100, Grade = ${resultA.grade}`);
if (resultA.grade !== 'A+' && resultA.grade !== 'A') {
  throw new Error(`Expected Grade A, got ${resultA.grade}`);
}

// Test 2: Scoring Engine with Fraud Missed (Claimant Fooled Inspector)
const gullibleSubmission: ReportSubmission = {
  selectedCause: 'accidental_kitchen_fire',
  verdictFraud: false,
  assessedPayout: 48500,
  attachedClueIds: [],
  notes: 'Accidental oven surge.'
};

const resultF = ScoringEngine.evaluate(gullibleSubmission, case1BakeryFire.groundTruth);
console.log(`Test 2 (Gullible Report): Score = ${resultF.totalScore} / 100, Grade = ${resultF.grade}`);
if (resultF.grade !== 'F') {
  throw new Error(`Expected Grade F, got ${resultF.grade}`);
}

// Test 3: Dialogue Engine Contradiction Unlocking
const dialogue = new DialogueEngine();
dialogue.loadCase(case1BakeryFire, []);

// Without discovering clue, pressing option should be hidden
let options = dialogue.getAvailableOptions();
console.log(`Initial Options without clues: ${options.length}`);

// Discover unplugged oven clue
dialogue.updateDiscoveredClues(['clue_unplugged_oven']);
dialogue.selectOption(1); // Go to node_oven_claim

options = dialogue.getAvailableOptions();
console.log(`Options at oven claim after discovering unplugged oven: ${options.length}`);
const contradictionOpt = options.find(o => o.isPressingQuestion);
if (!contradictionOpt) {
  throw new Error('Contradiction option was not unlocked by clue!');
}

const { contradictionFound } = dialogue.selectOption(options.indexOf(contradictionOpt));
console.log(`Contradiction Triggered: ${contradictionFound}`);
if (!contradictionFound) {
  throw new Error('Expected contradiction to be found!');
}

console.log('--- ALL LAYER 1 TESTS PASSED SUCCESSFULLY! ---');


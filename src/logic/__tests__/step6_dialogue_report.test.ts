import { ALL_CASES } from '../../data/cases';
import { DialogueEngine } from '../DialogueEngine';
import { ScoringEngine } from '../ScoringEngine';
import { ReportSubmission } from '../types';

console.log('--- RUNNING STEP 6: DIALOGUE TREE & SCORING VERIFICATION SUITE ---');

// 1. Test Dialogue Trees Across All Cases
ALL_CASES.forEach((c) => {
  console.log(`\nTesting Dialogue Flow for [${c.caseNumber}] ${c.title}...`);
  const engine = new DialogueEngine();
  engine.loadCase(c, []);

  const initialNode = engine.getCurrentNode();
  if (!initialNode) {
    throw new Error(`Failed to load initial dialogue node for case ${c.id}`);
  }
  console.log(`  Initial Speaker: ${initialNode.speaker}, Node ID: ${initialNode.id}`);

  // Without clues, verify no pressing questions are accessible
  const initialOptions = engine.getAvailableOptions();
  const lockedContradictions = initialOptions.filter(o => o.isPressingQuestion);
  if (lockedContradictions.length > 0) {
    throw new Error(`Contradiction question should be locked without discovered clues!`);
  }
  console.log(`  Initial Options (all un-locked): ${initialOptions.length}`);

  // Unlock by discovering all crucial clues
  engine.updateDiscoveredClues(c.groundTruth.crucialClueIds);

  // Traverse dialogue to trigger the key contradiction
  let foundContradiction = false;
  let steps = 0;
  while (steps < 10) {
    steps++;
    const opts = engine.getAvailableOptions();
    if (opts.length === 0) break;

    // Look for contradiction option
    const contraIdx = opts.findIndex(o => o.isPressingQuestion);
    if (contraIdx !== -1) {
      const { contradictionFound } = engine.selectOption(contraIdx);
      if (contradictionFound) {
        foundContradiction = true;
        console.log(`  ✓ Successfully triggered contradiction on step ${steps}!`);
        break;
      }
    } else {
      // Advance to next branch
      engine.selectOption(0);
    }
  }

  if (!foundContradiction) {
    throw new Error(`Failed to find & trigger contradiction in case ${c.id}`);
  }
  if (!engine.hasTriggeredContradiction()) {
    throw new Error(`Engine state should record contradictionTriggered = true`);
  }
});

// 2. Test Pure Scoring Function Across Varied Report Submissions
console.log('\nTesting Pure Scoring Function Variance Calculations...');
const case1 = ALL_CASES[0];
const gt = case1.groundTruth;

// Case 1A: Perfect Report
const perfectReport: ReportSubmission = {
  selectedCause: gt.realCause,
  verdictFraud: gt.isFraud,
  assessedPayout: 0,
  attachedClueIds: gt.crucialClueIds,
  notes: 'Clear accelerant arson.'
};
const resPerfect = ScoringEngine.evaluate(perfectReport, gt);
console.log(`  Perfect Report: Score = ${resPerfect.totalScore}/100, Grade = ${resPerfect.grade}`);
if (resPerfect.totalScore !== 100 || resPerfect.grade !== 'A+') {
  throw new Error(`Expected 100 / A+, got ${resPerfect.totalScore} / ${resPerfect.grade}`);
}

// Case 1B: Correct Cause and Fraud, but Missing Attached Evidence (Omission)
const omittedEvidenceReport: ReportSubmission = {
  selectedCause: gt.realCause,
  verdictFraud: gt.isFraud,
  assessedPayout: 0,
  attachedClueIds: [], // Zero evidence attached
  notes: 'Forgot to attach forensic exhibits.'
};
const resOmission = ScoringEngine.evaluate(omittedEvidenceReport, gt);
console.log(`  Omitted Evidence: Score = ${resOmission.totalScore}/100, Grade = ${resOmission.grade}`);
if (resOmission.evidenceScore !== 0 || resOmission.totalScore !== 80 || resOmission.grade !== 'B') {
  throw new Error(`Expected evidenceScore 0, totalScore 80, got ${resOmission.totalScore}`);
}

// Case 1C: Catastrophic Miss (Gullible Adjuster Approving Fraudulent Claim in Full)
const gullibleReport: ReportSubmission = {
  selectedCause: 'accidental_kitchen_fire',
  verdictFraud: false,
  assessedPayout: 48500, // Approving claimant's fraudulent demand
  attachedClueIds: [],
  notes: 'Poor baker.'
};
const resFail = ScoringEngine.evaluate(gullibleReport, gt);
console.log(`  Gullible Miss: Score = ${resFail.totalScore}/100, Grade = ${resFail.grade}`);
if (resFail.grade !== 'F' || resFail.totalScore !== 0) {
  throw new Error(`Expected 0 / F, got ${resFail.totalScore} / ${resFail.grade}`);
}

console.log('\n--- ALL STEP 6 DIALOGUE & SCORING TESTS PASSED SUCCESSFULLY! ---');


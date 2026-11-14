import { ALL_CASES, getCaseById, getAllCases } from '../../data/cases';
import { ScoringEngine } from '../ScoringEngine';
import { CaseManager } from '../CaseManager';
import { ReportSubmission } from '../types';

console.log('--- RUNNING STEP 5: DATA-DRIVEN CASES & SCHEMA VALIDATION SUITE ---');

// 1. Verify case collection loading
console.log(`Loaded ${ALL_CASES.length} cases from pure JSON data files.`);
if (ALL_CASES.length < 3) {
  throw new Error(`Expected at least 3 cases, got ${ALL_CASES.length}`);
}

// 2. Validate every case data integrity
ALL_CASES.forEach((c, idx) => {
  console.log(`\nValidating Case #${idx + 1}: [${c.caseNumber}] ${c.title}...`);

  // Basic fields
  if (!c.id || !c.caseNumber || !c.title || !c.incidentType || !c.propertyAddress) {
    throw new Error(`Case #${idx} is missing essential header fields.`);
  }

  // Map pin validation
  if (!c.mapPin) {
    throw new Error(`Case ${c.id} is missing mapPin data for City Map menu!`);
  }
  if (c.mapPin.x < 0 || c.mapPin.x > 100 || c.mapPin.y < 0 || c.mapPin.y > 100) {
    throw new Error(`Case ${c.id} mapPin coordinates out of 0-100 bounds: (${c.mapPin.x}, ${c.mapPin.y})`);
  }
  if (!c.mapPin.district || !c.mapPin.landmark || !c.mapPin.icon) {
    throw new Error(`Case ${c.id} mapPin missing district or landmark info.`);
  }

  // Policy & Claim figures
  if (c.policyCoverageLimit <= 0 || c.claimedAmount <= 0) {
    throw new Error(`Case ${c.id} has invalid financial figures.`);
  }

  // Clues validation
  if (!Array.isArray(c.clues) || c.clues.length < 4) {
    throw new Error(`Case ${c.id} has insufficient clues (${c.clues?.length}).`);
  }
  const clueIdSet = new Set<string>();
  c.clues.forEach(clue => {
    if (!clue.id || !clue.name || !clue.category || !clue.description || !clue.inspectorNote) {
      throw new Error(`Case ${c.id} has malformed clue: ${JSON.stringify(clue)}`);
    }
    if (clueIdSet.has(clue.id)) {
      throw new Error(`Case ${c.id} has duplicate clue ID: ${clue.id}`);
    }
    clueIdSet.add(clue.id);
  });

  // Dialogue tree validation
  if (!c.initialDialogueNodeId || !c.dialogueNodes[c.initialDialogueNodeId]) {
    throw new Error(`Case ${c.id} initialDialogueNodeId (${c.initialDialogueNodeId}) does not exist in dialogueNodes!`);
  }
  Object.values(c.dialogueNodes).forEach(node => {
    if (!node.id || !node.speaker || !node.text || !Array.isArray(node.options)) {
      throw new Error(`Case ${c.id} has malformed dialogue node ${node.id}`);
    }
    node.options.forEach(opt => {
      if (opt.requiredClueId && !clueIdSet.has(opt.requiredClueId)) {
        throw new Error(`Case ${c.id} dialogue option requires unknown clue: ${opt.requiredClueId}`);
      }
    });
  });

  // Ground truth validation
  const gt = c.groundTruth;
  if (!gt || !gt.realCause || typeof gt.isFraud !== 'boolean' || gt.realDamageAmount < 0) {
    throw new Error(`Case ${c.id} has invalid groundTruth.`);
  }
  gt.crucialClueIds.forEach(id => {
    if (!clueIdSet.has(id)) {
      throw new Error(`Case ${c.id} crucialClueId '${id}' is not in clue list!`);
    }
  });

  // 3. Test Pure Scoring Function against this case's Ground Truth
  const perfectReport: ReportSubmission = {
    selectedCause: gt.realCause,
    verdictFraud: gt.isFraud,
    assessedPayout: gt.isFraud ? 0 : gt.realDamageAmount,
    attachedClueIds: gt.crucialClueIds,
    notes: `Official forensic loss adjuster audit report for ${c.caseNumber}.`
  };

  const evalResult = ScoringEngine.evaluate(perfectReport, gt);
  console.log(`  Scoring Test: Total Score = ${evalResult.totalScore}/100, Grade = ${evalResult.grade}`);
  if (evalResult.grade !== 'A+' && evalResult.grade !== 'A') {
    throw new Error(`Case ${c.id} failed scoring evaluation test! Grade: ${evalResult.grade}`);
  }
});

// 4. Test CaseManager dynamic case switching via City Map selection
console.log('\nTesting CaseManager dynamic case switching...');
const caseManager = new CaseManager();
const c1 = caseManager.getCurrentCase();
console.log(`Initial case: ${c1.id} (${c1.caseNumber})`);

caseManager.selectCaseById('case_002_roof_leak');
const c2 = caseManager.getCurrentCase();
console.log(`Selected case 2: ${c2.id} (${c2.caseNumber})`);
if (c2.id !== 'case_002_roof_leak') {
  throw new Error(`Failed to switch to case_002_roof_leak`);
}

caseManager.selectCaseById('case_003_warehouse_burglary');
const c3 = caseManager.getCurrentCase();
console.log(`Selected case 3: ${c3.id} (${c3.caseNumber})`);
if (c3.id !== 'case_003_warehouse_burglary') {
  throw new Error(`Failed to switch to case_003_warehouse_burglary`);
}

console.log('\n--- ALL STEP 5 DATA-DRIVEN CASES PASSED SCHEMA VALIDATION! ---');


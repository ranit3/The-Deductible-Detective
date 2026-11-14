/**
 * LAYER 1: GAME LOGIC TYPES
 * PURE TYPESCRIPT - NO THREE.JS, NO DOM, NO CANVAS
 */

export type CauseOfLoss = 
  | 'accidental_kitchen_fire'
  | 'deliberate_arson_accelerant'
  | 'storm_wind_damage'
  | 'long_term_dry_rot_wear'
  | 'faulty_electrical_wiring'
  | 'vandalism_burglary'
  | 'water_pipe_burst';

export interface Clue {
  id: string;
  name: string;
  category: 'physical' | 'document' | 'burn_pattern' | 'structural' | 'tampering';
  description: string;
  inspectorNote: string;
  scenePosition: { x: number; y: number; z: number };
  interactRadius: number;
  requiresPhoto: boolean;
  discovered: boolean;
  photographed: boolean;
  revealsContradictionWith?: string; // Dialogue node ID it contradicts
}

export interface DialogueOption {
  text: string;
  nextNodeId: string;
  requiredClueId?: string; // Only available if player discovered clue
  isPressingQuestion?: boolean; // Pushes claimant on a contradiction
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  isContradictionStatement?: boolean;
  options: DialogueOption[];
}

export interface GroundTruth {
  realCause: CauseOfLoss;
  realDamageAmount: number;
  isFraud: boolean;
  fraudReason: string;
  crucialClueIds: string[];
  keyContradictionNodeId?: string;
}

export interface InsuranceCase {
  id: string;
  caseNumber: string;
  title: string;
  incidentType: string;
  claimantName: string;
  claimantRole: string;
  propertyAddress: string;
  policyCoverageLimit: number;
  claimedAmount: number;
  initialDispatchBrief: string;
  claimantStatement: string;
  initialDialogueNodeId: string;
  dialogueNodes: Record<string, DialogueNode>;
  clues: Clue[];
  groundTruth: GroundTruth;
}

export interface ReportSubmission {
  selectedCause: CauseOfLoss;
  assessedPayout: number;
  verdictFraud: boolean;
  attachedClueIds: string[];
  notes: string;
}

export interface EvaluationResult {
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  totalScore: number; // 0 - 100
  causeCorrect: boolean;
  fraudCorrect: boolean;
  payoutVariance: number; // Dollar difference
  payoutScore: number;    // 0 - 25
  evidenceScore: number;  // 0 - 25
  feedback: string[];
  groundTruthSummary: {
    realCause: string;
    realDamage: number;
    wasFraud: boolean;
    explanation: string;
  };
}


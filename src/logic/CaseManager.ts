import { ALL_CASES } from './cases';
import { DialogueEngine } from './DialogueEngine';
import { ScoringEngine } from './ScoringEngine';
import { Clue, EvaluationResult, InsuranceCase, ReportSubmission } from './types';

export type GamePhase = 
  | 'claim_briefing'
  | 'investigation'
  | 'witness_interview'
  | 'report_filing'
  | 'evaluation_verdict';

export type StateListener = (phase: GamePhase, currentCase: InsuranceCase) => void;

/**
 * PURE TYPESCRIPT CASE MANAGER
 * Coordinates detective workflow:
 * Claim arrives → travel to site → inspect scene & clues → photograph evidence →
 * interview witness / spot inconsistencies → write report → get scored → next case.
 */
export class CaseManager {
  private cases: InsuranceCase[] = ALL_CASES;
  private currentCaseIndex: number = 0;
  private phase: GamePhase = 'claim_briefing';

  private discoveredClues: Map<string, Clue> = new Map();
  private photographedClueIds: Set<string> = new Set();
  private photoThumbnails: Map<string, string> = new Map(); // clueId -> base64 preview

  public dialogueEngine: DialogueEngine = new DialogueEngine();
  private lastEvaluation: EvaluationResult | null = null;
  private listeners: StateListener[] = [];

  constructor() {
    this.initCase(0);
  }

  public initCase(index: number) {
    this.currentCaseIndex = index % this.cases.length;
    this.phase = 'claim_briefing';
    this.discoveredClues.clear();
    this.photographedClueIds.clear();
    this.photoThumbnails.clear();
    this.lastEvaluation = null;

    const current = this.getCurrentCase();
    this.dialogueEngine.loadCase(current, []);
    this.notify();
  }

  public getCurrentCase(): InsuranceCase {
    return this.cases[this.currentCaseIndex];
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public setPhase(phase: GamePhase) {
    this.phase = phase;
    this.notify();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.phase, this.getCurrentCase());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const current = this.getCurrentCase();
    this.listeners.forEach(l => l(this.phase, current));
  }

  // --- CLUE & INVESTIGATION ACTIONS ---
  public discoverClue(clueId: string): Clue | null {
    const current = this.getCurrentCase();
    const clue = current.clues.find(c => c.id === clueId);
    if (!clue) return null;

    if (!clue.discovered) {
      clue.discovered = true;
      this.discoveredClues.set(clueId, clue);
      this.dialogueEngine.updateDiscoveredClues(Array.from(this.discoveredClues.keys()));
      this.notify();
    }
    return clue;
  }

  public savePhotoEvidence(clueId: string, photoDataUrl: string) {
    const clue = this.discoverClue(clueId);
    if (clue) {
      clue.photographed = true;
      this.photographedClueIds.add(clueId);
      this.photoThumbnails.set(clueId, photoDataUrl);
      this.notify();
    }
  }

  public getDiscoveredClues(): Clue[] {
    return Array.from(this.discoveredClues.values());
  }

  public getPhotographedClueIds(): string[] {
    return Array.from(this.photographedClueIds);
  }

  public getPhotoThumbnail(clueId: string): string | undefined {
    return this.photoThumbnails.get(clueId);
  }

  // --- REPORT SUBMISSION & VERDICT ---
  public submitReport(submission: ReportSubmission): EvaluationResult {
    const current = this.getCurrentCase();
    const evaluation = ScoringEngine.evaluate(submission, current.groundTruth);
    this.lastEvaluation = evaluation;
    this.phase = 'evaluation_verdict';
    this.notify();
    return evaluation;
  }

  public getLastEvaluation(): EvaluationResult | null {
    return this.lastEvaluation;
  }

  public nextCase() {
    this.initCase(this.currentCaseIndex + 1);
  }

  public restartCurrentCase() {
    this.initCase(this.currentCaseIndex);
  }
}


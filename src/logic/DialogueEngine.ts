import { DialogueNode, DialogueOption, InsuranceCase } from './types';

/**
 * PURE TYPESCRIPT DIALOGUE ENGINE
 * Manages witness interviews, branching questioning, and contradiction breakthroughs.
 */
export class DialogueEngine {
  private activeCase: InsuranceCase | null = null;
  private currentNodeId: string = '';
  private discoveredClueIds: Set<string> = new Set();
  private contradictionTriggered: boolean = false;

  constructor() {}

  public loadCase(insuranceCase: InsuranceCase, discoveredClues: string[]) {
    this.activeCase = insuranceCase;
    this.currentNodeId = insuranceCase.initialDialogueNodeId;
    this.discoveredClueIds = new Set(discoveredClues);
    this.contradictionTriggered = false;
  }

  public updateDiscoveredClues(clueIds: string[]) {
    this.discoveredClueIds = new Set(clueIds);
  }

  public getCurrentNode(): DialogueNode | null {
    if (!this.activeCase) return null;
    return this.activeCase.dialogueNodes[this.currentNodeId] || null;
  }

  /**
   * Returns valid dialogue options, filtering out options that require
   * clues the player has not discovered yet.
   */
  public getAvailableOptions(): DialogueOption[] {
    const node = this.getCurrentNode();
    if (!node) return [];

    return node.options.filter(opt => {
      if (!opt.requiredClueId) return true;
      return this.discoveredClueIds.has(opt.requiredClueId);
    });
  }

  /**
   * Selects an option and advances dialogue state.
   */
  public selectOption(optionIndex: number): { nextNode: DialogueNode | null; contradictionFound: boolean } {
    const available = this.getAvailableOptions();
    if (optionIndex < 0 || optionIndex >= available.length) {
      return { nextNode: this.getCurrentNode(), contradictionFound: false };
    }

    const chosenOption = available[optionIndex];
    let contradictionFound = false;

    if (chosenOption.isPressingQuestion) {
      this.contradictionTriggered = true;
      contradictionFound = true;
    }

    this.currentNodeId = chosenOption.nextNodeId;
    return { nextNode: this.getCurrentNode(), contradictionFound };
  }

  public resetToStart() {
    if (this.activeCase) {
      this.currentNodeId = this.activeCase.initialDialogueNodeId;
    }
  }

  public hasTriggeredContradiction(): boolean {
    return this.contradictionTriggered;
  }
}


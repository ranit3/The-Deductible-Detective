import { CaseManager } from '../logic/CaseManager';
import { DialogueEngine } from '../logic/DialogueEngine';
import { DialogueNode } from '../logic/types';

/**
 * LAYER 3: INTERVIEW DIALOGUE BOX
 * Interactive witness interrogation with contradiction spotting.
 */
export class DialogueBoxView {
  private el: HTMLElement;
  private caseManager: CaseManager;
  private dialogueEngine: DialogueEngine;
  public isOpen: boolean = false;
  public onOptionChosen: ((contradictionFound: boolean) => void) | null = null;
  public onProceedToReport: (() => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor(caseManager: CaseManager) {
    this.caseManager = caseManager;
    this.dialogueEngine = caseManager.dialogueEngine;
    this.el = document.createElement('div');
    this.el.id = 'dialogueOverlay';
    this.el.className = 'dialogue-backdrop';
    document.body.appendChild(this.el);
  }

  public open() {
    this.isOpen = true;
    this.render();
    this.el.classList.add('open');
  }

  public close() {
    this.isOpen = false;
    this.el.classList.remove('open');
    if (this.onClose) this.onClose();
  }

  private getSpeakerAvatar(role: string, name: string): string {
    const str = (role + ' ' + name).toLowerCase();
    if (str.includes('baker') || str.includes('croissant') || str.includes('pierre')) return '👨‍🍳';
    if (str.includes('landlady') || str.includes('vance') || str.includes('eleanor')) return '👵';
    if (str.includes('logistics') || str.includes('warehouse') || str.includes('brody')) return '👷';
    return '👤';
  }

  public render(contradictionBurst: boolean = false) {
    const node = this.dialogueEngine.getCurrentNode();
    if (!node) return;

    const currentCase = this.caseManager.getCurrentCase();
    const options = this.dialogueEngine.getAvailableOptions();
    const avatar = this.getSpeakerAvatar(currentCase.claimantRole, node.speaker);
    const isConclusion = options.length === 0;

    this.el.innerHTML = `
      <div class="dialogue-box ${contradictionBurst ? 'contradiction-burst' : ''}">
        <div class="dialogue-speaker-bar">
          <div class="speaker-profile">
            <span class="speaker-avatar">${avatar}</span>
            <div>
              <div class="speaker-name">${node.speaker}</div>
              <div class="speaker-role">${currentCase.claimantRole}</div>
            </div>
          </div>
          <button class="btn-close-dialogue" id="btnExitDialogue" title="Exit Interview (ESC)">✕ Leave</button>
        </div>

        <div class="dialogue-speech-text">
          "${node.text}"
        </div>

        ${isConclusion ? `
          <div style="display:flex; flex-direction:column; gap:8px;">
            <p style="font-size:12px; font-weight:800; color:#059669;">
              ✓ Claimant statement concluded. You have sufficient testimony to draft your assessment report.
            </p>
            <button class="btn btn-file-report btn-large" id="btnDialogueToFileReport" style="width:100%; justify-content:center;">
              📝 DRAFT & FILE ASSESSMENT REPORT (R) ➔
            </button>
          </div>
        ` : `
          <div class="dialogue-options-list">
            ${options.map((opt, idx) => `
              <button class="dialogue-opt-btn ${opt.isPressingQuestion ? 'opt-contradiction' : ''}" data-idx="${idx}">
                <span class="opt-num">${idx + 1}.</span>
                <span class="opt-text">${opt.text}</span>
              </button>
            `).join('')}
          </div>
        `}
      </div>
    `;

    this.el.querySelector('#btnExitDialogue')?.addEventListener('click', () => this.close());
    this.el.querySelector('#btnDialogueToFileReport')?.addEventListener('click', () => {
      this.close();
      if (this.onProceedToReport) this.onProceedToReport();
    });

    this.el.querySelectorAll('.dialogue-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
        const result = this.dialogueEngine.selectOption(idx);
        
        if (this.onOptionChosen) {
          this.onOptionChosen(result.contradictionFound);
        }

        this.render(result.contradictionFound);
      });
    });
  }
}

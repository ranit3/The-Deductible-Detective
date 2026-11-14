import { DialogueEngine } from '../logic/DialogueEngine';
import { DialogueNode } from '../logic/types';

/**
 * LAYER 3: INTERVIEW DIALOGUE BOX
 * Interactive witness interrogation with contradiction spotting.
 */
export class DialogueBoxView {
  private el: HTMLElement;
  private dialogueEngine: DialogueEngine;
  public isOpen: boolean = false;
  public onOptionChosen: ((contradictionFound: boolean) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor(dialogueEngine: DialogueEngine) {
    this.dialogueEngine = dialogueEngine;
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

  public render() {
    const node = this.dialogueEngine.getCurrentNode();
    if (!node) return;

    const options = this.dialogueEngine.getAvailableOptions();

    this.el.innerHTML = `
      <div class="dialogue-box">
        <div class="dialogue-speaker-bar">
          <div class="speaker-profile">
            <span class="speaker-avatar">👨‍🍳</span>
            <div>
              <div class="speaker-name">${node.speaker}</div>
              <div class="speaker-role">Insured Claimant</div>
            </div>
          </div>
          <button class="btn-close-dialogue" id="btnExitDialogue" title="Exit Interview (ESC)">✕ Leave</button>
        </div>

        <div class="dialogue-speech-text">
          "${node.text}"
        </div>

        <div class="dialogue-options-list">
          ${options.map((opt, idx) => `
            <button class="dialogue-opt-btn ${opt.isPressingQuestion ? 'opt-contradiction' : ''}" data-idx="${idx}">
              <span class="opt-num">${idx + 1}.</span>
              <span class="opt-text">${opt.text}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.el.querySelector('#btnExitDialogue')?.addEventListener('click', () => this.close());

    this.el.querySelectorAll('.dialogue-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0', 10);
        const result = this.dialogueEngine.selectOption(idx);
        
        if (this.onOptionChosen) {
          this.onOptionChosen(result.contradictionFound);
        }

        if (!result.nextNode || result.nextNode.options.length === 0) {
          // If conclusion reached
          this.render();
        } else {
          this.render();
        }
      });
    });
  }
}


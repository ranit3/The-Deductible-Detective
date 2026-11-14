import { CaseManager } from '../logic/CaseManager';
import { Clue } from '../logic/types';

/**
 * LAYER 3: LOSS ADJUSTER INVESTIGATION NOTEBOOK
 */
export class NotebookView {
  private el: HTMLElement;
  private caseManager: CaseManager;
  private currentTab: 'clues' | 'photos' | 'statements' = 'clues';
  public isOpen: boolean = false;
  public onClose: (() => void) | null = null;

  constructor(caseManager: CaseManager) {
    this.caseManager = caseManager;
    this.el = document.createElement('div');
    this.el.id = 'notebookModal';
    this.el.className = 'modal-backdrop';
    document.body.appendChild(this.el);
  }

  public show() {
    this.isOpen = true;
    this.render();
    this.el.classList.add('open');
  }

  public hide() {
    this.isOpen = false;
    this.el.classList.remove('open');
    if (this.onClose) this.onClose();
  }

  public toggle() {
    if (this.isOpen) this.hide();
    else this.show();
  }

  public render() {
    const currentCase = this.caseManager.getCurrentCase();
    const discoveredClues = this.caseManager.getDiscoveredClues();
    const totalClues = currentCase.clues.length;

    this.el.innerHTML = `
      <div class="notebook-container">
        <!-- Leather Notebook Spine & Cover -->
        <div class="notebook-header">
          <div class="notebook-title-bar">
            <span>📓 MUNICIPAL ADJUSTER NOTEBOOK</span>
            <span class="notebook-case-tag">${currentCase.caseNumber}</span>
          </div>
          <button class="btn-close" id="btnCloseNotebook" title="Close Notebook (ESC)">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="notebook-tabs">
          <button class="tab-btn ${this.currentTab === 'clues' ? 'active' : ''}" data-tab="clues">
            🔎 Clues & Forensics (${discoveredClues.length}/${totalClues})
          </button>
          <button class="tab-btn ${this.currentTab === 'photos' ? 'active' : ''}" data-tab="photos">
            📷 Photo Exhibits (${this.caseManager.getPhotographedClueIds().length})
          </button>
          <button class="tab-btn ${this.currentTab === 'statements' ? 'active' : ''}" data-tab="statements">
            🗣️ Witness Statements
          </button>
        </div>

        <!-- Notebook Page Content -->
        <div class="notebook-page-body">
          ${this.renderTabContent(discoveredClues)}
        </div>
      </div>
    `;

    // Event Bindings
    this.el.querySelector('#btnCloseNotebook')?.addEventListener('click', () => this.hide());
    this.el.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        this.currentTab = tab;
        this.render();
      });
    });
  }

  private renderTabContent(discoveredClues: Clue[]): string {
    const currentCase = this.caseManager.getCurrentCase();

    if (this.currentTab === 'clues') {
      if (discoveredClues.length === 0) {
        return `
          <div class="empty-state">
            <span style="font-size:36px;">🔍</span>
            <p><strong>No physical evidence discovered yet.</strong></p>
            <p>Walk around the incident scene. Approach glowing forensic markers to inspect items.</p>
          </div>
        `;
      }

      return `
        <div class="clue-list">
          ${discoveredClues.map(c => `
            <div class="clue-card">
              <div class="clue-header">
                <span class="clue-category tag-${c.category}">${c.category.toUpperCase()}</span>
                <span class="clue-name">${c.name}</span>
                <span class="photo-badge ${c.photographed ? 'badge-snapped' : 'badge-needed'}">
                  ${c.photographed ? '✓ PHOTOGRAPHED' : '📷 PHOTO NEEDED'}
                </span>
              </div>
              <p class="clue-desc">${c.description}</p>
              <div class="clue-note">
                <strong>Forensic Note:</strong> ${c.inspectorNote}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.currentTab === 'photos') {
      const photoIds = this.caseManager.getPhotographedClueIds();
      if (photoIds.length === 0) {
        return `
          <div class="empty-state">
            <span style="font-size:36px;">📷</span>
            <p><strong>No photographic evidence taken yet.</strong></p>
            <p>Press <strong>[C]</strong> to open your camera viewfinder near clue locations to capture snapshots.</p>
          </div>
        `;
      }

      return `
        <div class="photo-grid">
          ${photoIds.map(id => {
            const clue = discoveredClues.find(c => c.id === id);
            const thumb = this.caseManager.getPhotoThumbnail(id);
            return `
              <div class="polaroid-card">
                ${thumb ? `<img src="${thumb}" class="polaroid-img" alt="${clue?.name}" />` : ''}
                <div class="polaroid-caption">${clue?.name || 'Evidence Exhibit'}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // Statements & Contradictions Tab
    return `
      <div class="statements-view">
        <div class="statement-card">
          <div class="statement-header">
            <strong>${currentCase.claimantName} (${currentCase.claimantRole})</strong>
          </div>
          <p class="statement-text">"${currentCase.claimantStatement}"</p>
        </div>

        <div class="inconsistency-box">
          <h4>⚖️ Inconsistency Analysis</h4>
          <p>Examine the discrepancy between the insured's verbal testimony and your physical evidence findings. Press Pierre on contradictions during questioning to extract the truth!</p>
        </div>
      </div>
    `;
  }
}


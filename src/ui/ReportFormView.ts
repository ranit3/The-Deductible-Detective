import { CaseManager } from '../logic/CaseManager';
import { CauseOfLoss, ReportSubmission } from '../logic/types';

/**
 * LAYER 3: OFFICIAL LOSS ADJUSTER ASSESSMENT REPORT FORM
 */
export class ReportFormView {
  private el: HTMLElement;
  private caseManager: CaseManager;
  public isOpen: boolean = false;
  public onSubmitReport: ((submission: ReportSubmission) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor(caseManager: CaseManager) {
    this.caseManager = caseManager;
    this.el = document.createElement('div');
    this.el.id = 'reportFormModal';
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

  private render() {
    const currentCase = this.caseManager.getCurrentCase();
    const discoveredClues = this.caseManager.getDiscoveredClues();

    this.el.innerHTML = `
      <div class="report-card">
        <div class="report-header">
          <div>
            <div class="report-badge">MUNICIPAL CLAIMS BUREAU • FORM AF-202</div>
            <h2 class="report-title">Formal Loss Adjustment Report</h2>
          </div>
          <button class="btn-close" id="btnCloseReport">✕</button>
        </div>

        <form id="claimReportForm" class="report-form-body">
          <!-- Metadata Bar -->
          <div class="report-meta-strip">
            <span><strong>Case:</strong> ${currentCase.caseNumber}</span>
            <span><strong>Insured:</strong> ${currentCase.claimantName}</span>
            <span><strong>Claimed:</strong> $${currentCase.claimedAmount.toLocaleString()}</span>
          </div>

          <!-- Section 1: Cause of Loss -->
          <div class="form-group">
            <label class="form-label" for="reportCause">1. DETERMINATION OF ORIGIN & CAUSE</label>
            <select id="reportCause" class="form-select" required>
              <option value="" disabled selected>-- Select Determined Peril Mechanism --</option>
              <option value="accidental_kitchen_fire">Accidental Commercial Kitchen Grease Fire</option>
              <option value="deliberate_arson_accelerant">Deliberate Arson via Petroleum Accelerant</option>
              <option value="faulty_electrical_wiring">Electrical Control Panel Fault / Wiring Short</option>
              <option value="storm_wind_damage">Storm Gale-Force Wind Inundation</option>
              <option value="long_term_dry_rot_wear">Pre-existing Wear & Tear / Chronic Dry-Rot</option>
              <option value="vandalism_burglary">Malicious Mischief / Third-Party Vandalism</option>
              <option value="water_pipe_burst">Sudden Accidental Water Plumbing Discharge</option>
            </select>
          </div>

          <!-- Section 2: Fraud Determination -->
          <div class="form-group">
            <label class="form-label">2. FRAUD & MORAL HAZARD VERDICT</label>
            <div class="fraud-toggle-group">
              <label class="radio-card">
                <input type="radio" name="verdictFraud" value="false" checked />
                <span class="radio-label">
                  <strong>LEGITIMATE CASUALTY</strong>
                  <small>Covered under policy terms with no moral hazard detected.</small>
                </span>
              </label>
              <label class="radio-card fraud-danger">
                <input type="radio" name="verdictFraud" value="true" />
                <span class="radio-label">
                  <strong>FRAUDULENT / EXCLUDED CLAIM</strong>
                  <small>Intentional misrepresentation, staged peril, or intentional arson.</small>
                </span>
              </label>
            </div>
          </div>

          <!-- Section 3: Recommended Payout -->
          <div class="form-group">
            <label class="form-label" for="reportPayout">
              3. VERIFIED INDEMNITY PAYOUT ($)
              <span class="label-sub">(Enter $0 if claim is denied for fraud, or verified damage cost)</span>
            </label>
            <div class="currency-input-wrapper">
              <span class="currency-symbol">$</span>
              <input type="number" id="reportPayout" class="form-input" min="0" max="${currentCase.policyCoverageLimit}" step="100" placeholder="e.g. 0 or 6200" required />
            </div>
          </div>

          <!-- Section 4: Attached Evidence Exhibits -->
          <div class="form-group">
            <label class="form-label">4. ATTACH EVIDENCE EXHIBITS (${discoveredClues.length} available)</label>
            <div class="exhibits-checklist">
              ${discoveredClues.length === 0 ? '<p style="color:#64748B; font-size:12px;">No clues discovered. Explore the scene first!</p>' : ''}
              ${discoveredClues.map(c => `
                <label class="exhibit-checkbox">
                  <input type="checkbox" name="clueExhibit" value="${c.id}" ${c.photographed ? 'checked' : ''} />
                  <span><strong>${c.name}</strong> (${c.category.toUpperCase()}) ${c.photographed ? '📷' : ''}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Section 5: Adjuster Reasoning Notes -->
          <div class="form-group">
            <label class="form-label" for="reportNotes">5. ADJUSTER FORENSIC SUMMARY & NOTES</label>
            <textarea id="reportNotes" class="form-textarea" rows="3" placeholder="Explain the rationale supporting your verdict and discrepancy findings..."></textarea>
          </div>

          <!-- Submit Action -->
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-large btn-submit-report">
              ⚖️ SUBMIT OFFICIAL REPORT TO UNDERWRITING
            </button>
          </div>
        </form>
      </div>
    `;

    this.el.querySelector('#btnCloseReport')?.addEventListener('click', () => this.hide());

    const form = this.el.querySelector('#claimReportForm') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const cause = (this.el.querySelector('#reportCause') as HTMLSelectElement).value as CauseOfLoss;
      const isFraud = (this.el.querySelector('input[name="verdictFraud"]:checked') as HTMLInputElement).value === 'true';
      const payout = parseFloat((this.el.querySelector('#reportPayout') as HTMLInputElement).value) || 0;
      const notes = (this.el.querySelector('#reportNotes') as HTMLTextAreaElement).value;

      const attachedClueIds: string[] = [];
      this.el.querySelectorAll('input[name="clueExhibit"]:checked').forEach(cb => {
        attachedClueIds.push((cb as HTMLInputElement).value);
      });

      const submission: ReportSubmission = {
        selectedCause: cause,
        verdictFraud: isFraud,
        assessedPayout: payout,
        attachedClueIds,
        notes
      };

      this.hide();
      if (this.onSubmitReport) {
        this.onSubmitReport(submission);
      }
    });
  }
}


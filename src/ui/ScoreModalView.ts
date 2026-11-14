import { EvaluationResult } from '../logic/types';

/**
 * LAYER 3: VERDICT EVALUATION & SCORING MODAL
 * Displays supervisory audit grade, feedback breakdown, and advances to the next case.
 */
export class ScoreModalView {
  private el: HTMLElement;
  public onNextCase: (() => void) | null = null;
  public onRetryCase: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'scoreVerdictModal';
    this.el.className = 'modal-backdrop';
    document.body.appendChild(this.el);
  }

  public show(result: EvaluationResult) {
    const isPass = result.totalScore >= 70;
    const stampClass = result.grade === 'F' ? 'stamp-fail' : 'stamp-pass';

    this.el.innerHTML = `
      <div class="score-card">
        <div class="score-header">
          <div>
            <div class="report-badge">UNDERWRITING AUDIT COMMITTEE</div>
            <h2 class="score-title">Adjuster Performance Appraisal</h2>
          </div>
          <div class="rubber-stamp ${stampClass}">${result.grade} RATED</div>
        </div>

        <div class="score-summary-grid">
          <div class="score-stat-box">
            <span class="stat-num ${isPass ? 'color-pass' : 'color-fail'}">${result.totalScore}</span>
            <span class="stat-label">TOTAL SCORE / 100</span>
          </div>
          <div class="score-stat-box">
            <span class="stat-val">${result.causeCorrect ? '✓ ACCURATE' : '✗ FAILED'}</span>
            <span class="stat-label">ORIGIN & CAUSE (30 PTS)</span>
          </div>
          <div class="score-stat-box">
            <span class="stat-val">${result.fraudCorrect ? '✓ DETECTED' : '✗ FAILED'}</span>
            <span class="stat-label">FRAUD VERDICT (30 PTS)</span>
          </div>
          <div class="score-stat-box">
            <span class="stat-val">${result.payoutScore} / 20</span>
            <span class="stat-label">INDEMNITY VARIANCE ($${result.payoutVariance.toLocaleString()})</span>
          </div>
        </div>

        <!-- Ground Truth Revelation -->
        <div class="ground-truth-box">
          <h4>📁 Case Ground Truth Unveiled</h4>
          <p><strong>Actual Peril:</strong> ${result.groundTruthSummary.realCause}</p>
          <p><strong>Actual Loss Value:</strong> $${result.groundTruthSummary.realDamage.toLocaleString()}</p>
          <p><strong>Fraud Analysis:</strong> ${result.groundTruthSummary.explanation}</p>
        </div>

        <!-- Feedback Notes -->
        <div class="feedback-section">
          <h4>📋 Supervisory Audit Notes</h4>
          <ul class="feedback-list">
            ${result.feedback.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="score-actions">
          <button class="btn btn-secondary" id="btnRetryCase">↺ Re-investigate Case</button>
          <button class="btn btn-primary btn-large" id="btnNextCase">
            PROCEED TO NEXT CASUALTY CLAIM ➔
          </button>
        </div>
      </div>
    `;

    this.el.classList.add('open');

    this.el.querySelector('#btnNextCase')?.addEventListener('click', () => {
      this.hide();
      if (this.onNextCase) this.onNextCase();
    });

    this.el.querySelector('#btnRetryCase')?.addEventListener('click', () => {
      this.hide();
      if (this.onRetryCase) this.onRetryCase();
    });
  }

  public hide() {
    this.el.classList.remove('open');
  }
}


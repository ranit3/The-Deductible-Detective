import { InsuranceCase } from '../logic/types';

/**
 * LAYER 3: CASE BRIEFING MODAL (Claim Arrives)
 */
export class CaseBriefingView {
  private el: HTMLElement;
  private onTravelCallback: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'caseBriefingModal';
    this.el.className = 'modal-backdrop open';
    document.body.appendChild(this.el);
  }

  public show(insuranceCase: InsuranceCase, onTravel: () => void) {
    this.onTravelCallback = onTravel;
    this.el.innerHTML = `
      <div class="briefing-card">
        <div class="briefing-header">
          <div class="badge-alert">🚨 NEW CASUALTY CLAIM RECEIVED</div>
          <div class="briefing-case-num">${insuranceCase.caseNumber}</div>
        </div>

        <h1 class="briefing-title">${insuranceCase.title}</h1>
        <div class="briefing-subtitle">${insuranceCase.incidentType}</div>

        <div class="briefing-meta-grid">
          <div class="meta-box">
            <span class="meta-label">CLAIMANT</span>
            <span class="meta-val">${insuranceCase.claimantName}</span>
            <span class="meta-sub">${insuranceCase.claimantRole}</span>
          </div>
          <div class="meta-box">
            <span class="meta-label">LOCATION</span>
            <span class="meta-val">${insuranceCase.propertyAddress}</span>
          </div>
          <div class="meta-box">
            <span class="meta-label">CLAIMED INDEMNITY</span>
            <span class="meta-val highlight-red">$${insuranceCase.claimedAmount.toLocaleString()}</span>
            <span class="meta-sub">Policy Limit: $${insuranceCase.policyCoverageLimit.toLocaleString()}</span>
          </div>
        </div>

        <div class="briefing-section">
          <span class="meta-label">DISPATCH SUMMARY</span>
          <p class="briefing-desc">${insuranceCase.initialDispatchBrief}</p>
        </div>

        <div class="briefing-section">
          <span class="meta-label">CLAIMANT'S INITIAL STATEMENT</span>
          <blockquote class="briefing-quote">"${insuranceCase.claimantStatement}"</blockquote>
        </div>

        <div class="briefing-actions">
          <button class="btn btn-primary btn-large" id="btnTravelToSite">
            🚗 TRAVEL TO INCIDENT SITE & INSPECT
          </button>
        </div>
      </div>
    `;

    this.el.classList.add('open');
    const btn = this.el.querySelector('#btnTravelToSite');
    if (btn) {
      btn.addEventListener('click', () => {
        this.hide();
        if (this.onTravelCallback) this.onTravelCallback();
      });
    }
  }

  public hide() {
    this.el.classList.remove('open');
  }
}


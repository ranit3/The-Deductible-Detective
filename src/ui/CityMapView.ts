import { CaseManager } from '../logic/CaseManager';
import { InsuranceCase } from '../logic/types';

/**
 * LAYER 3: CITY MAP DISPATCH MENU
 * Treats the city as an interactive municipal investigation map with pins.
 * Each pin loads one dense, self-contained 3D case scene.
 */
export class CityMapView {
  private el: HTMLElement;
  private caseManager: CaseManager;
  private selectedCaseId: string;
  public isOpen: boolean = false;

  public onDispatchCase?: (selectedCase: InsuranceCase) => void;

  constructor(caseManager: CaseManager) {
    this.caseManager = caseManager;
    this.selectedCaseId = caseManager.getCurrentCase().id;

    this.el = document.createElement('div');
    this.el.id = 'cityMapModal';
    this.el.className = 'modal-backdrop';
    document.body.appendChild(this.el);
  }

  public show() {
    this.isOpen = true;
    this.selectedCaseId = this.caseManager.getCurrentCase().id;
    this.render();
    this.el.classList.add('open');
  }

  public hide() {
    this.isOpen = false;
    this.el.classList.remove('open');
  }

  public toggle() {
    if (this.isOpen) this.hide();
    else this.show();
  }

  private render() {
    const allCases = this.caseManager.getAllCases();
    const selected = allCases.find(c => c.id === this.selectedCaseId) || allCases[0];

    this.el.innerHTML = `
      <div class="city-map-container">
        <!-- Map Title Header -->
        <div class="city-map-header">
          <div class="city-map-title-row">
            <span>🗺️ MUNICIPAL DISTRICT DISPATCH MAP</span>
            <span class="city-map-badge">${allCases.length} Active Incidents</span>
          </div>
          <button class="btn-close" id="btnCloseCityMap" title="Close Map (ESC)">✕</button>
        </div>

        <!-- Main Map Area + Dossier Panel -->
        <div class="city-map-body">
          <!-- Left: Cadastral Blueprint Map -->
          <div class="map-canvas-area">
            <div class="map-river"></div>

            <!-- District Markers -->
            <div class="district-zone district-west">West Quarter</div>
            <div class="district-zone district-north">North Hills</div>
            <div class="district-zone district-docks">Industrial Docks</div>
            <div class="district-zone district-center">Municipal Plaza</div>

            <!-- Case Pins -->
            ${allCases.map(c => {
              const pin = c.mapPin || { x: 50, y: 50, icon: '📍', status: 'uninvestigated', landmark: c.title };
              const isSelected = c.id === selected.id;
              const statusClass = pin.status === 'completed' ? 'status-completed' : 'status-uninvestigated';

              return `
                <button class="map-pin ${isSelected ? 'selected' : ''}" 
                        style="left: ${pin.x}%; top: ${pin.y}%;" 
                        data-case-id="${c.id}" 
                        title="${c.title} (${pin.landmark})">
                  <div class="pin-bubble">
                    <span>${pin.icon}</span>
                    <span class="pin-status-dot ${statusClass}"></span>
                  </div>
                  <span class="pin-label-tag">$${(c.claimedAmount).toLocaleString()} • ${pin.landmark}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Right: Selected Case Dossier -->
          <div class="map-dossier-panel">
            <div>
              <div class="dossier-header-tag">
                <span class="dossier-case-no">${selected.caseNumber}</span>
                <span class="dossier-status-pill ${selected.mapPin?.status || 'uninvestigated'}">
                  ${selected.mapPin?.status === 'completed' ? '✓ Audited' : '● Incident Reported'}
                </span>
              </div>

              <h2 class="dossier-title">${selected.title}</h2>
              <p class="dossier-address">📍 ${selected.propertyAddress}</p>

              <div class="dossier-meta-grid">
                <div class="dossier-meta-card">
                  <div class="meta-label">Claimant / Role</div>
                  <div class="meta-val">${selected.claimantName}</div>
                </div>
                <div class="dossier-meta-card">
                  <div class="meta-label">Incident Type</div>
                  <div class="meta-val" style="font-size:11px;">${selected.incidentType.split('&')[0]}</div>
                </div>
                <div class="dossier-meta-card">
                  <div class="meta-label">Claimed Loss</div>
                  <div class="meta-val" style="color:#DC2626;">$${selected.claimedAmount.toLocaleString()}</div>
                </div>
                <div class="dossier-meta-card">
                  <div class="meta-label">Policy Limit</div>
                  <div class="meta-val" style="color:#059669;">$${selected.policyCoverageLimit.toLocaleString()}</div>
                </div>
              </div>

              <div class="dossier-brief-box">
                <strong>Dispatch Summary:</strong><br/>
                ${selected.initialDispatchBrief}
              </div>
            </div>

            <button class="btn-dispatch" id="btnDispatchToSite">
              <span>🚗</span> TRAVEL TO SCENE ➔
            </button>
          </div>
        </div>
      </div>
    `;

    // Event Bindings
    this.el.querySelector('#btnCloseCityMap')?.addEventListener('click', () => this.hide());

    this.el.querySelectorAll('.map-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const caseId = (e.currentTarget as HTMLElement).getAttribute('data-case-id');
        if (caseId) {
          this.selectedCaseId = caseId;
          this.render();
        }
      });
    });

    this.el.querySelector('#btnDispatchToSite')?.addEventListener('click', () => {
      this.hide();
      if (this.onDispatchCase) {
        this.onDispatchCase(selected);
      }
    });
  }
}


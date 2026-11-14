import { Clue } from '../logic/types';

/**
 * LAYER 3: CAMERA VIEWFINDER OVERLAY
 * Allows photographing physical evidence and capturing forensic snapshots.
 */
export class CameraViewfinder {
  private el: HTMLElement;
  private flashEl: HTMLElement;
  public isOpen: boolean = false;
  private currentClue: Clue | null = null;
  public onCapturePhoto: ((clue: Clue | null) => void) | null = null;
  public onClose: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'cameraViewfinder';
    this.el.className = 'camera-overlay';
    document.body.appendChild(this.el);

    this.flashEl = document.createElement('div');
    this.flashEl.className = 'shutter-flash';
    document.body.appendChild(this.flashEl);

    this.render();
  }

  private render() {
    this.el.innerHTML = `
      <div class="viewfinder-frame">
        <!-- Corner Brackets -->
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <!-- Crosshairs & Grid -->
        <div class="viewfinder-grid">
          <div class="grid-line horizontal"></div>
          <div class="grid-line vertical"></div>
          <div class="center-focus-ring"></div>
        </div>

        <!-- Top Camera Telemetry -->
        <div class="camera-telemetry">
          <span class="rec-dot"></span>
          <span>EVIDENCE FORENSIC MODE</span>
          <span class="telemetry-clue" id="camTargetText">TARGET: SCANNING SCENE...</span>
        </div>

        <!-- Bottom Shutter Button -->
        <div class="camera-controls">
          <button class="btn-shutter" id="btnSnapPhoto" title="Snap Photo (SPACE)">
            <div class="shutter-inner"></div>
          </button>
          <div class="shutter-hint">Click or press <strong>[SPACE]</strong> to Snap • <strong>[ESC]</strong> Exit</div>
        </div>
      </div>
    `;

    this.el.querySelector('#btnSnapPhoto')?.addEventListener('click', () => this.snap());
  }

  public open(clue: Clue | null = null) {
    this.isOpen = true;
    this.currentClue = clue;
    this.el.classList.add('active');

    const targetText = this.el.querySelector('#camTargetText');
    if (targetText) {
      targetText.textContent = clue 
        ? `TARGET: ${clue.name.toUpperCase()}` 
        : 'TARGET: GENERAL SCENE OVERVIEW';
    }
  }

  public close() {
    this.isOpen = false;
    this.el.classList.remove('active');
    if (this.onClose) this.onClose();
  }

  public snap() {
    if (!this.isOpen) return;

    // Trigger white shutter flash animation
    this.flashEl.classList.add('flash');
    setTimeout(() => this.flashEl.classList.remove('flash'), 180);

    if (this.onCapturePhoto) {
      this.onCapturePhoto(this.currentClue);
    }
  }
}


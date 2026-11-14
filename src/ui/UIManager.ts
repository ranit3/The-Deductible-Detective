import { SoundEffects } from '../audio/SoundEffects';
import { CaseManager } from '../logic/CaseManager';
import { Clue } from '../logic/types';
import { CameraViewfinder } from './CameraViewfinder';
import { CaseBriefingView } from './CaseBriefingView';
import { CityMapView } from './CityMapView';
import { DialogueBoxView } from './DialogueBoxView';
import { NotebookView } from './NotebookView';
import { ReportFormView } from './ReportFormView';
import { ScoreModalView } from './ScoreModalView';

/**
 * LAYER 3: CENTRAL UI MANAGER
 * Orchestrates HTML/CSS overlays, modals, and HUD indicators on top of the 3D canvas.
 */
export class UIManager {
  private caseManager: CaseManager;
  private sound: SoundEffects;

  // Sub-views
  public cityMapView: CityMapView;
  public briefingView: CaseBriefingView;
  public notebookView: NotebookView;
  public cameraView: CameraViewfinder;
  public dialogueView: DialogueBoxView;
  public reportView: ReportFormView;
  public scoreView: ScoreModalView;

  // DOM Elements
  private hudPrompt: HTMLElement;
  private toastEl: HTMLElement;
  private toastTimer: any = null;

  constructor(caseManager: CaseManager, sound: SoundEffects) {
    this.caseManager = caseManager;
    this.sound = sound;

    this.cityMapView = new CityMapView(caseManager);
    this.briefingView = new CaseBriefingView();
    this.notebookView = new NotebookView(caseManager);
    this.cameraView = new CameraViewfinder();
    this.dialogueView = new DialogueBoxView(caseManager.dialogueEngine);
    this.reportView = new ReportFormView(caseManager);
    this.scoreView = new ScoreModalView();

    this.hudPrompt = document.getElementById('interact-prompt')!;
    this.toastEl = document.getElementById('toastTip')!;

    this.bindHUDControls();
  }

  private bindHUDControls() {
    // Open City Map Button
    document.getElementById('btnOpenCityMap')?.addEventListener('click', () => {
      this.sound.playPageFlip();
      this.cityMapView.toggle();
    });

    // Open Notebook Button
    document.getElementById('btnOpenNotebook')?.addEventListener('click', () => {
      this.sound.playPageFlip();
      this.notebookView.toggle();
    });

    // Open Camera Button
    document.getElementById('btnOpenCamera')?.addEventListener('click', () => {
      this.cameraView.open();
    });

    // File Report Button
    document.getElementById('btnFileReport')?.addEventListener('click', () => {
      this.reportView.show();
    });

    // Sound Toggle
    document.getElementById('btnSound')?.addEventListener('click', () => {
      this.sound.muted = !this.sound.muted;
      const icon = document.getElementById('soundIcon');
      if (icon) icon.textContent = this.sound.muted ? '🔇' : '🔊';
    });
  }

  public updateHUD() {
    const currentCase = this.caseManager.getCurrentCase();
    const discovered = this.caseManager.getDiscoveredClues().length;
    const totalClues = currentCase.clues.length;
    const photos = this.caseManager.getPhotographedClueIds().length;

    const caseNumEl = document.getElementById('hudCaseNum');
    const caseTitleEl = document.getElementById('hudCaseTitle');
    const cluesValEl = document.getElementById('hudCluesVal');
    const photosValEl = document.getElementById('hudPhotosVal');

    if (caseNumEl) caseNumEl.textContent = currentCase.caseNumber;
    if (caseTitleEl) caseTitleEl.textContent = currentCase.title;
    if (cluesValEl) cluesValEl.textContent = `${discovered} / ${totalClues}`;
    if (photosValEl) photosValEl.textContent = `${photos}`;
  }

  public showPrompt(visible: boolean, textHtml: string = '') {
    if (!this.hudPrompt) return;
    if (visible) {
      this.hudPrompt.innerHTML = textHtml;
      this.hudPrompt.style.display = 'block';
    } else {
      this.hudPrompt.style.display = 'none';
    }
  }

  public showToast(msg: string) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2800);
  }

  public hideLoadingScreen() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  public isAnyModalOpen(): boolean {
    return (
      this.cityMapView.isOpen ||
      this.notebookView.isOpen ||
      this.cameraView.isOpen ||
      this.dialogueView.isOpen ||
      this.reportView.isOpen
    );
  }
}


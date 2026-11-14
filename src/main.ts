import { SoundEffects } from './audio/SoundEffects';
import { CaseManager } from './logic/CaseManager';
import { Clue } from './logic/types';
import { SceneManager } from './scene/SceneManager';
import { RaycastHitInfo } from './scene/InteractionRaycaster';
import { UIManager } from './ui/UIManager';

// Import CSS
import './styles/camera.css';
import './styles/dialogue.css';
import './styles/main.css';
import './styles/map.css';
import './styles/notebook.css';
import './styles/report.css';

/**
 * THE LOSS ADJUSTER - MAIN APPLICATION
 * Strict separation of three layers:
 * 1. Logic (CaseManager, DialogueEngine, ScoringEngine)
 * 2. 3D Scene (SceneManager, Environment, PlayerCharacter, NPCClaimant, ClueMarkers)
 * 3. UI (UIManager, Notebook, Camera, Dialogue, Report, Score)
 */
class App {
  private caseManager: CaseManager;
  private sound: SoundEffects;
  private sceneManager: SceneManager;
  private ui: UIManager;

  private currentNearClue: Clue | null = null;
  private isNearNPC: boolean = false;
  private nearNPCName: string = '';
  private hoveredClueHit: RaycastHitInfo | null = null;

  constructor() {
    const container = document.getElementById('container')!;

    // 1. Initialize Logic Layer (Zero 3D, Zero DOM)
    this.caseManager = new CaseManager();

    // 2. Initialize Audio
    this.sound = new SoundEffects();

    // 3. Initialize UI Layer (HTML/CSS Overlays on top of Canvas)
    this.ui = new UIManager(this.caseManager, this.sound);

    // 4. Initialize 3D Scene Layer (Three.js rendering only)
    this.sceneManager = new SceneManager(container, () => {
      this.ui.hideLoadingScreen();
      this.onEngineReady();
    });

    this.bindEvents();
  }

  private onEngineReady() {
    // Subscribe to case state changes
    this.caseManager.subscribe((phase, currentCase) => {
      this.ui.updateHUD();

      if (phase === 'claim_briefing') {
        this.sceneManager.setupCaseScene(currentCase.claimantName, currentCase.clues);
        this.ui.briefingView.show(currentCase, () => {
          this.caseManager.setPhase('investigation');
          this.ui.showToast(`Arrived at ${currentCase.propertyAddress}. Inspect the scene for clues.`);
        });
      }
    });

    // 3D Scene Event Callbacks
    this.sceneManager.onNearClue = (clue) => {
      this.currentNearClue = clue;
      this.updateInteractionPrompt();
    };

    this.sceneManager.onNearNPC = (isNear, name) => {
      this.isNearNPC = isNear;
      this.nearNPCName = name;
      this.updateInteractionPrompt();
    };

    // Step 4: Raycasted Hover & Click Clue Interaction
    this.sceneManager.onClueHovered = (hit) => {
      this.hoveredClueHit = hit;
      if (this.ui.isAnyModalOpen()) {
        this.sceneManager.raycaster.isEnabled = false;
        return;
      }
      this.sceneManager.raycaster.isEnabled = true;
      if (hit) {
        this.ui.showPrompt(
          true,
          `<span class="kbd">CLICK</span> Inspect & Log: <strong>${hit.name}</strong>`
        );
      } else {
        this.updateInteractionPrompt();
      }
    };

    this.sceneManager.onClueClicked = (clueId) => {
      if (this.ui.isAnyModalOpen()) return;

      const clue = this.caseManager.discoverClue(clueId);
      if (clue) {
        this.sound.playClueDiscovered();
        this.ui.showToast(`🔍 Discovered: ${clue.name}! Logged in notebook.`);
        this.ui.updateHUD();
        if (this.ui.notebookView.isOpen) {
          this.ui.notebookView.render();
        }
      }
    };

    // Camera Snapshot Event
    this.ui.cameraView.onCapturePhoto = (targetClue) => {
      this.sound.playCameraShutter();
      const snapshotUrl = this.sceneManager.captureViewportSnapshot();

      if (targetClue) {
        this.caseManager.savePhotoEvidence(targetClue.id, snapshotUrl);
        this.ui.showToast(`📷 Photo Evidence Captured: ${targetClue.name}! Added to dossier.`);
      } else {
        this.ui.showToast('📷 Overview photograph added to evidence notebook.');
      }
      this.ui.cameraView.close();
      this.ui.updateHUD();
    };

    // Dialogue Contradiction Event
    this.ui.dialogueView.onOptionChosen = (contradictionFound) => {
      if (contradictionFound) {
        this.sound.playContradictionSting();
        this.ui.showToast('⚖️ CONTRADICTION SPOTTED! The insured stammers and cracks under pressure.');
      } else {
        this.sound.playDialogueBlip();
      }
    };

    // Transition from Dialogue to Report
    this.ui.dialogueView.onProceedToReport = () => {
      this.sound.playPageFlip();
      this.ui.reportView.show();
    };

    // Report Submission Event
    this.ui.reportView.onSubmitReport = (submission) => {
      this.sound.playStampThud();
      const evalResult = this.caseManager.submitReport(submission);
      this.ui.scoreView.show(evalResult);
    };

    // City Map Dispatch Event (Treat City as a Menu)
    this.ui.cityMapView.onDispatchCase = (selectedCase) => {
      this.sound.playPageFlip();
      this.caseManager.selectCaseById(selectedCase.id);
      this.sceneManager.setupCaseScene(selectedCase.claimantName, selectedCase.clues);
      this.sceneManager.player.setPosition(0, 0, -4);
      this.ui.briefingView.show(selectedCase, () => {
        this.caseManager.setPhase('investigation');
        this.ui.showToast(`Arrived at ${selectedCase.propertyAddress}. Inspect the scene for clues.`);
      });
    };

    // Next Case & Retry Events
    this.ui.scoreView.onNextCase = () => {
      this.sound.playPageFlip();
      this.ui.cityMapView.show();
    };

    this.ui.scoreView.onRetryCase = () => {
      this.caseManager.restartCurrentCase();
      const current = this.caseManager.getCurrentCase();
      this.sceneManager.setupCaseScene(current.claimantName, current.clues);
      this.sceneManager.player.setPosition(0, 0, -4);
    };
  }

  private updateInteractionPrompt() {
    if (this.ui.isAnyModalOpen()) {
      this.ui.showPrompt(false);
      return;
    }

    if (this.hoveredClueHit) {
      this.ui.showPrompt(
        true,
        `<span class="kbd">CLICK</span> Inspect & Log: <strong>${this.hoveredClueHit.name}</strong>`
      );
    } else if (this.currentNearClue) {
      const c = this.currentNearClue;
      this.ui.showPrompt(
        true,
        `<span class="kbd">E</span> Inspect Clue: <strong>${c.name}</strong> &nbsp;•&nbsp; <span class="kbd">C</span> Take Photo`
      );
    } else if (this.isNearNPC) {
      this.ui.showPrompt(
        true,
        `<span class="kbd">E</span> Question Insured: <strong>${this.nearNPCName}</strong>`
      );
    } else {
      this.ui.showPrompt(false);
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      // If modal is open, ESC closes it
      if (e.code === 'Escape') {
        if (this.ui.cityMapView.isOpen) this.ui.cityMapView.hide();
        if (this.ui.cameraView.isOpen) this.ui.cameraView.close();
        if (this.ui.notebookView.isOpen) this.ui.notebookView.hide();
        if (this.ui.dialogueView.isOpen) this.ui.dialogueView.close();
        if (this.ui.reportView.isOpen) this.ui.reportView.hide();
        return;
      }

      // If camera is open, SPACE snaps photo
      if (this.ui.cameraView.isOpen && e.code === 'Space') {
        this.ui.cameraView.snap();
        return;
      }

      // Don't trigger investigation shortcuts if a modal is active
      if (this.ui.isAnyModalOpen()) return;

      // 1. Inspect Clue or Talk to NPC (E)
      if (e.code === 'KeyE') {
        if (this.isNearNPC) {
          this.ui.dialogueView.open();
        } else if (this.currentNearClue) {
          const clue = this.caseManager.discoverClue(this.currentNearClue.id);
          if (clue) {
            this.sound.playClueDiscovered();
            this.ui.showToast(`🔍 Inspected: ${clue.name}. Logged in notebook.`);
            this.ui.updateHUD();
          }
        }
      }

      // 2. Open Camera Viewfinder (C)
      else if (e.code === 'KeyC') {
        this.ui.cameraView.open(this.currentNearClue);
      }

      // 3. Open Notebook (N)
      else if (e.code === 'KeyN') {
        this.sound.playPageFlip();
        this.ui.notebookView.toggle();
      }

      // 4. File Report (R)
      else if (e.code === 'KeyR') {
        this.ui.reportView.show();
      }

      // 5. Open City Map (M)
      else if (e.code === 'KeyM') {
        this.sound.playPageFlip();
        this.ui.cityMapView.toggle();
      }
    });
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  (window as any).app = new App();
});


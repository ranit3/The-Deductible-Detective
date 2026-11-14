# 🔍 The Deductible Detective (損害査定員)

[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Rapier3D](https://img.shields.io/badge/Rapier3D-Physics-orange)](https://rapier.rs/)
[![Tests](https://img.shields.io/badge/Tests-5%20Suites%20Passing-brightgreen)]()

> *"Every casualty tells a story. Most of them are lies."*

**The Deductible Detective** is a stylized 3D forensic investigation game where you play a municipal insurance loss adjuster dispatched to investigate high-stakes property casualty claims across the city. When property owners demand five-figure policy payouts for catastrophic fires, attic collapses, and warehouse burglaries, the truth rarely matches the paperwork.

Explore detailed, chunky low-poly crime-scene dioramas, inspect physical evidence, photograph decisive forensics, interrogate shifty claimants to break their alibis with contradictory proof, and draft your official underwriting assessment report. Will you catch the fraud, or approve a staged payout?

---

## 🎮 Core Investigative Loop

```
[1. Claim Arrives] ➔ [2. City Map Dispatch] ➔ [3. Inspect Scene & Clues] ➔ [4. Photograph Evidence]
          ▲                                                                                 │
          │                                                                                 ▼
[8. Next Case] ◄── [7. Underwriting Score] ◄── [6. File Assessment Report] ◄── [5. Interrogate & Expose Contradictions]
```

1. **🗺️ City Map Dispatch:** Select incident claims from an interactive municipal cadastral map with district pins (West Quarter, North Hills, Industrial Docks).
2. **🔎 3D Scene Inspection:** Navigate compact, dense 3D incident dioramas from an angled 2.5D perspective. Hover over and inspect physical evidence carrying forensic data tags (`data-id`).
3. **📷 Forensic Photography:** Frame physical evidence in your evidence camera crosshairs and capture photographic exhibits with full-screen shutter flashes.
4. **📓 Municipal Dossier & Notebook:** Automatically catalogue discovered clues, forensic categories (*Tampering*, *Burn Patterns*, *Structural*, *Documents*), and contradiction notes.
5. **🗣️ Contradiction Interrogation:** Question claimants through branching dialogue trees. Discovered physical evidence unlocks pressing **`[CONTRADICTION]`** questions, shattering their stories.
6. **⚖️ Form AF-202 Assessment Report:** File your formal loss adjustment report: determine origin & cause, assess moral hazard / fraud, calculate actual indemnity payout, and attach photo exhibits.
7. **📊 Supervisory Underwriting Audit:** Receive an objective performance score ($0–100$) and rubber-stamped letter grade ($\text{A}^+$ to $\text{F}$) based on real forensic ground truth.

---

## 🏗️ Strict Three-Layer Architecture

The game is built with strict architectural boundaries to ensure stability, testability, and clean code:

```
┌────────────────────────────────────────────────────────┐
│  LAYER 3: UI & HUD OVERLAYS (HTML/CSS)                 │
│  City Map, Notebook, Camera, Dialogue, Report, Score   │
├────────────────────────────────────────────────────────┤
│  LAYER 2: 3D SCENE DIORAMA (Three.js)                  │
│  2.5D Camera, Player Controller, Decorators, Rapier3D │
├────────────────────────────────────────────────────────┤
│  LAYER 1: GAME LOGIC & CASES (Pure TypeScript)        │
│  Pure JSON Cases, Dialogue Engine, Scoring Engine     │
└────────────────────────────────────────────────────────┘
```

* **Layer 1: Game Logic (`/src/logic/`):** Pure TypeScript only (Zero Three.js, Zero DOM). All cases are defined in pure static JSON files in `/src/data/cases/`. Scoring is a pure function: `(report, case) => ScoreResult`. 100% testable in headless CI.
* **Layer 2: 3D Scene (`/src/scene/`):** Three.js visual rendering only. Fixed 2.5D angled camera, AABB wall sliding collision, procedural crime-scene decorators (paper scattering, burlap sacks, hydrocarbon decals), and decorative Rapier3D physics.
* **Layer 3: UI (`/src/ui/`):** Modular HTML/CSS overlays on top of the WebGL canvas. Notebook, Camera Viewfinder, City Map, Dialogue Box, Report Form, and Score Modal.

---

## 📁 Featured Cases

### Case #084: The Golden Crust Inferno
* **District:** West Quarter (Commercial)
* **Claimant:** Pierre Laurent (Master Baker & Owner)
* **Claim:** $\$48,500$ commercial fire payout for a "spontaneous oven electrical explosion."
* **Forensic Catch:** The heavy industrial 240V plug is lying cold on the floor with zero arcing, hydrocarbon pour patterns coat the floorboards, and an empty kerosene can is hidden in the flour bin. Actual repair cost is only $\$6,200$ for floor replacement.

### Case #091: The Attic Deluge
* **District:** North Hills (Residential)
* **Claimant:** Eleanor Vance (Landlady)
* **Claim:** $\$32,000$ storm damage claim for sudden gale-force roof beam failure.
* **Forensic Catch:** The timber is crumbling with 3-year chronic dry rot (*Serpula lacrymans*), official weather radar logged only a 12-knot gentle breeze, and an ignored 2024 repair estimate marked *"Declined - Too expensive"* sits in her files.

### Case #104: The Apex Auto Heist
* **District:** Industrial Docks (Maritime)
* **Claimant:** Marcus Brody (Logistics Director)
* **Claim:** $\$75,000$ for 40 crates of Japanese twin-turbochargers stolen by external burglars.
* **Forensic Catch:** The padlock was cut from the inside, the security cameras were cleanly powered down using the manager's master PIN, and port customs rejected the cargo 3 weeks ago—the inventory was never in the building!

---

## ⌨️ Controls

| Key / Action | Action Description |
| :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move Adjuster (Locomotion with wall collision) |
| <kbd>Shift</kbd> | Run / Sprint |
| <kbd>Left Click</kbd> | Hover highlight & inspect physical clues |
| <kbd>E</kbd> | Inspect Clue / Question Claimant |
| <kbd>C</kbd> | Open Evidence Camera Viewfinder |
| <kbd>Space</kbd> | Snap Photo Exhibit (inside camera mode) |
| <kbd>N</kbd> | Open / Close Investigation Notebook |
| <kbd>M</kbd> | Open / Close City Dispatch Map |
| <kbd>R</kbd> | Open / File Assessment Report Form AF-202 |
| <kbd>Right-Drag</kbd> | Orbit / Inspect $360^\circ$ Scene View |
| <kbd>Esc</kbd> | Close Active Modal / Exit Viewfinder |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation
```bash
git clone <YOUR_REPO_URL>
cd "Loss adjuster"
npm install
```

### Development Server
```bash
npm run dev
```
Open [`http://localhost:3000`](http://localhost:3000) in your browser.

### Run Automated Test Suites
Runs all 5 automated test suites (Layer 1 Logic, Step 4 Interaction, Step 5 Case Validation, Step 6 Dialogue & Scoring, Step 8 Decorative Physics):
```bash
npm test
```

### Production Build
Type-checks with `tsc` and bundles with Vite:
```bash
npm run build
```

---

## 🎨 Asset Credits & Licensing
* **Art Style:** Inspired by [Kenney](https://kenney.nl/) City Kits (Roads, Suburban, Commercial, Furniture) — CC0 Free.
* **Character Rigs:** [Mixamo](https://www.mixamo.com/) skeletal animations.
* **Physics:** [@dimforge/rapier3d-compat](https://rapier.rs/) WebAssembly physics engine.
* **Audio:** Zero external audio dependencies; pure procedural Web Audio API synthesis.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).


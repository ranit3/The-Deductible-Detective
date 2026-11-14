# RULES FOR AI DEVELOPMENT (THE LOSS ADJUSTER)

1. **Strict Three-Layer Separation:**
   - **`/src/logic/` (Game Logic):** Pure TypeScript ONLY. Zero Three.js imports. Zero DOM access (`document`, `window`, etc.). Fully testable via Node/tsx unit tests.
   - **`/src/scene/` (3D Scene):** Three.js rendering ONLY. The city, house, player, lights, and clue marker visuals. Emits spatial events (`onNearClue`, `onNearNPC`). Never decides game rules, scores, or payouts.
   - **`/src/ui/` (UI Overlays):** HTML/CSS on top of Canvas ONLY. Notebook, Camera Viewfinder, Report Form, Dialogue Box, and HUD. Never performs 3D rendering.
   - **`src/main.ts`:** The single orchestrator connecting the three layers.

2. **One Feature At A Time:**
   - Work methodically step-by-step. Do not jump ahead or implement multiple unrelated features in a single turn.

3. **Targeted Edits, Never Rewrite Whole Files:**
   - Modify only the specific functions or blocks required. Do not replace entire working systems unnecessarily.

4. **Cases Must Live in Data (JSON):**
   - All cases, clues, dialogue trees, and ground truth must be defined in pure data files (`/data/cases/` or JSON). Adding a new case means adding a data file, never changing game engine code.

5. **Scoring Is a Pure Function:**
   - Scoring must always be a pure mathematical function: `(report, case) => ScoreResult`.

6. **Decorative Physics Only:**
   - If physics (e.g. Rapier / Cannon) is used, it is strictly decorative (e.g. knocking over a cup or lamp). Core game rules and clue discoveries must NEVER depend on physics simulation.

7. **Always Run Tests Before Finishing:**
   - Every session and every logic change MUST pass the automated unit tests (`npx tsx src/logic/__tests__/logic.test.ts`) and TypeScript build check (`npx tsc --noEmit` / `npm run build`) before declaring a step complete.


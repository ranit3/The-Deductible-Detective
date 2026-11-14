# THE DEDUCTIBLE DETECTIVE (損害査定員) - GAME SPECIFICATION

## 1. Core Gameplay Loop
The game follows a strict, repeatable 8-step investigative loop:
```
[1. Claim Arrives] ➔ [2. Travel to Site] ➔ [3. Inspect Scene & Clues] ➔ [4. Photograph Evidence]
          ▲                                                                       │
          │                                                                       ▼
[8. Next Case] ◄── [7. Underwriting Score] ◄── [6. File Assessment Report] ◄── [5. Interview Witness & Spot Contradictions]
```

1. **Claim Arrives:** Dispatch briefing summarizes property address, policy limit, claimed amount, and the insured's initial story.
2. **Travel to Site (City as a Menu):** Rather than building an empty, sprawling open world, the city is treated as an interactive investigation map screen with case pins (Corner Bakery in West Quarter, Victorian Attic in North Hills, Waterfront Warehouse, etc.). Selecting a pin dispatches the adjuster directly to a focused, high-detail 3D scene diorama for that case.
3. **Inspect Scene & Find Clues:** Move through the environment. Hover and click objects carrying clue data IDs (`data-id`) to inspect physical evidence and add them to the notebook.
4. **Photograph Evidence:** Open camera viewfinder (`[C]`), frame physical clues in the crosshairs, and capture photo exhibits (`[SPACE]`).
5. **Interview Claimant / Witness:** Question witnesses using branching dialogue trees. Present discovered evidence to expose verbal contradictions.
6. **File Formal Assessment Report:** Complete Form AF-202:
   - Determine Origin & Cause of Loss (Peril mechanism)
   - Determine Fraud Verdict (Legitimate vs Fraudulent / Excluded)
   - Calculate Approved Indemnity Payout ($)
   - Attach supporting photographic evidence exhibits
7. **Underwriting Audit Scoring:** Pure evaluation function grades performance (0–100, Grade A+ to F).
8. **Next Case:** Load next claim from data file.

---

## 2. Camera System
- **Type:** Angled "2.5D" Top-Down Camera (Fixed Tilt, Smooth Follow).
- **Pitch Angle:** ~45° downward tilt.
- **Azimuth:** Aligned along the incident structure axis.
- **Distance:** 12 to 14 meters from player.
- **Controls:** Smooth synchronous tracking with player WASD position; optional right-drag 360° orbit inspection look.
- **Why this choice:** Highly forgiving, eliminates wall clipping bugs, clean interior cross-sections, and reliable raycasted mouse clicking.

---

## 3. Mechanics Breakdown
| ID | Mechanic | Description |
| :--- | :--- | :--- |
| **M1** | **Player Locomotion** | WASD / Arrow movement with capsule/skeletal model and AABB wall sliding collision. |
| **M2** | **Hover & Click Interaction** | Raycasted cursor highlight on interactive clue meshes. Clicking inspects and logs the clue into the notebook. |
| **M3** | **Loss Adjuster Notebook** | Tabbed leather notebook (`[N]`): Clues & Forensics, Photo Exhibits, Witness Statements & Contradictions. |
| **M4** | **Evidence Camera** | Viewfinder overlay (`[C]`) with crosshairs, grid lines, shutter flash animation, and snapshot generation. |
| **M5** | **Contradiction Interrogation** | Dialogue trees loaded from JSON. Clues unlock highlighted `[CONTRADICTION]` options to break witness stories. |
| **M6** | **Assessment Report Form** | Form AF-202 modal (`[R]`): Cause dropdown, Fraud toggle, Payout input, Evidence exhibit checkboxes, Notes. |
| **M7** | **Pure Scoring Engine** | Pure function `(report, case) => ScoreResult`. 30 pts Cause, 30 pts Fraud, 20 pts Payout, 20 pts Evidence. |
| **M8** | **Decorative Physics** | Optional physics (knocking over a glass or lamp) kept strictly decorative; game logic never depends on physics. |

---

## 4. Reference Case 1 (Complete Specification on Paper)

### General Information
- **Case ID:** `case_001_bakery_fire`
- **Case Number:** `CLM-2026-084`
- **Title:** The Golden Crust Inferno
- **Incident Type:** Commercial Property Fire & Smoke Damage
- **Claimant:** Pierre Laurent (Master Baker & Owner)
- **Property Address:** 14 Rue de la Boulangerie, West Quarter
- **Policy Coverage Limit:** $50,000
- **Claimed Amount:** $48,500

### Claimant's Initial Story
> *"I arrived at 4:00 AM to preheat the commercial deck oven for the morning baguettes. Suddenly, a violent electrical surge sparked behind the oven control panel and ignited our flour sacks! I barely escaped with my life. The oven and kitchen are a total loss ($48,500)!"*

### Physical Clues on Site
| Clue ID | Object Name | Category | Description | Contradicts |
| :--- | :--- | :--- | :--- | :--- |
| `clue_unplugged_oven` | Unplugged 240V Cable | Tampering | Heavy 3-phase plug is pulled out and lying cold on dry floor 40cm from socket. Zero electrical arcing marks. | Pierre's claim that oven surged while running at 450°F. |
| `clue_burn_pour_pattern` | Accelerant V-Burn Pattern | Burn Pattern | Localized V-shape charred pooling etched into floorboards with hydrocarbon rainbow sheen. | Pierre's claim of common grease/flour fire. |
| `clue_kerosene_canister` | Concealed Fuel Canister | Physical | 5-liter metal kerosene container hidden inside flour bin with loose cap and strong petroleum fumes. | Pierre's claim of purely culinary kitchen supplies. |
| `clue_late_rent_ledger` | Eviction Notice & Ledger | Document | Formal notice demanding $12,450 in past-due rent by Friday or eviction proceedings commence. | Establishes critical financial motive for insurance fraud. |
| `clue_undamaged_oven` | Intact Oven Chamber | Structural | Baking stones and heating elements inside the deck oven are pristine with only wipeable surface soot. | Pierre's claimed $35,000 oven destruction. Actual damage is $6,200. |

### Ground Truth (Solution)
- **True Cause:** `deliberate_arson_accelerant`
- **Is Fraud:** `true` (Arson & Intentional Misrepresentation)
- **Approved Payout:** `$0` (Claim Denied due to Fraud)
- **Actual Physical Damage:** `$6,200` (superficial floor repair)
- **Fraud Explanation:** Pierre Laurent intentionally poured kerosene behind the flour sacks to burn down his failing bakery and claim the $50,000 policy limit to pay off his $12,450 imminent eviction debts. The commercial deck oven was never plugged in or damaged.

---

## 5. Case JSON Schema
All cases must be defined as static JSON data so adding cases requires adding data files, never modifying engine code:
```json
{
  "id": "case_001_bakery_fire",
  "caseNumber": "CLM-2026-084",
  "title": "The Golden Crust Inferno",
  "incidentType": "Commercial Property Fire",
  "claimant": {
    "name": "Pierre Laurent",
    "role": "Master Baker & Owner",
    "address": "14 Rue de la Boulangerie"
  },
  "policy": {
    "limit": 50000,
    "claimedAmount": 48500
  },
  "dispatchBrief": "...",
  "claimantStatement": "...",
  "clues": [
    {
      "id": "clue_unplugged_oven",
      "name": "Unplugged 240V Cable",
      "category": "tampering",
      "description": "...",
      "inspectorNote": "...",
      "position": { "x": -3.8, "y": 0.25, "z": 2.2 },
      "requiresPhoto": true,
      "contradictsNodeId": "node_oven_claim"
    }
  ],
  "groundTruth": {
    "realCause": "deliberate_arson_accelerant",
    "realDamageAmount": 6200,
    "isFraud": true,
    "fraudReason": "...",
    "crucialClueIds": ["clue_unplugged_oven", "clue_kerosene_canister", "clue_burn_pour_pattern"]
  }
}
```

---

## 6. City-as-a-Menu Architecture & Asset Strategy

### A. The "City as a Menu" Scope Saver
* **Core Philosophy:** Do NOT build a massive, empty open world that tanks performance and balloons development time. Treat the city as an interactive municipal investigation map with district pins (a bakery, a Victorian house, a suburban villa, a downtown warehouse).
* **Case Loading:** Clicking a pin loads one dense, self-contained, highly optimized 3D scene diorama (e.g. 10m x 8m room with porch entrance and perimeter walls).
* **Future Street Expansion:** Walkable/drivable street segments can be added later as connecting transitions without altering any case logic.

### B. Asset Sourcing Pipeline (100% Free & CC0)
* **Kenney City & Modular Kits (CC0):**
  * *City Kit (Roads) v2.1:* Streets, road signs, traffic lights.
  * *Suburban & Commercial Kits:* Over 35 modular buildings, fences, trees, driveways in glTF format with matching chunky low-poly aesthetic.
  * *Furniture Kit:* Tables, chairs, desks, cabinets, appliances.
* **Complementary Repositories:**
  * *KayKit (City Builder Bits / Medieval/Modern):* Low-poly props.
  * *Quaternius & Poly Pizza:* Free CC0 props and characters.
  * *Mixamo:* Skeletal rigs & humanoid animations (walking, talking, arguing).

### C. Procedural Crime-Scene Decorators ("Faking Damage")
* **Ransacked Rooms:** Procedural helper function that applies randomized rotations (tilt ±15°), offsets, pulled-out drawers, and scattered paper debris planes.
* **Forced Doors / Broken Windows:** Cracked-glass material variants, displaced shard geometry, scraped lock plates.
* **Footprints & Forensic Stains:** Three.js floor decals / decal planes (charred accelerant pools, water seepage stains, muddy shoe treads).
* **Evidence Items:** Discrete low-poly props with emissive hover highlight and click inspection (built in Step 4).



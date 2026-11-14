import { InsuranceCase } from '../types';

export const case2RoofLeak: InsuranceCase = {
  id: 'case_002_roof_leak',
  caseNumber: 'CLM-2026-091',
  title: 'The Attic Deluge',
  incidentType: 'Residential Storm Inundation & Structural Collapse',
  claimantName: 'Eleanor Vance',
  claimantRole: 'Property Owner & Landlady',
  propertyAddress: '7 Willow Lane, North Hills',
  policyCoverageLimit: 40000,
  claimedAmount: 32000,
  initialDispatchBrief:
    'Homeowner Eleanor Vance filed an emergency storm damage claim. She reports that yesterday evening\'s sudden gale force thunderstorm ripped shingles off her roof, causing torrential rain to pour into her Victorian attic and master bedroom ceiling. She claims $32,000 for full roof rebuild and antique restoration.',
  claimantStatement:
    'A freak wind vortex hit our neighborhood yesterday at 6:00 PM! The wind peeled our slate tiles like paper, and water poured through the attic floor. Our roof was in mint condition before the storm!',

  initialDialogueNodeId: 'node_intro',
  dialogueNodes: {
    node_intro: {
      id: 'node_intro',
      speaker: 'Eleanor Vance',
      text: 'Good day, Loss Adjuster. It was terrifying! The roar of the storm wind was deafening. My Victorian home has stood for eighty years, but that storm completely wrecked our roof structure!',
      options: [
        {
          text: 'What was the exact condition of the roof timber prior to yesterday?',
          nextNodeId: 'node_timber_claim'
        },
        {
          text: 'What time did the severe wind gusts occur?',
          nextNodeId: 'node_weather_claim'
        },
        {
          text: 'I will inspect the attic rafters and structural timber first.',
          nextNodeId: 'node_inspect'
        }
      ]
    },
    node_timber_claim: {
      id: 'node_timber_claim',
      speaker: 'Eleanor Vance',
      text: 'Oh, absolutely immaculate! We had the rafters thoroughly inspected and maintained. It was rock solid until the violent wind sheared the main load-bearing joist!',
      isContradictionStatement: true,
      options: [
        {
          text: '[CONTRADICTION] Mrs. Vance, these joists are crumbling with Serpula lacrymans dry-rot fungus that takes at least 3 years of chronic neglect to develop!',
          nextNodeId: 'node_press_rot',
          requiredClueId: 'clue_dry_rot_spores',
          isPressingQuestion: true
        },
        {
          text: 'Let me inspect the fallen tiles and moisture stains.',
          nextNodeId: 'node_inspect'
        }
      ]
    },
    node_weather_claim: {
      id: 'node_weather_claim',
      speaker: 'Eleanor Vance',
      text: 'The meteorological storm front came in around 6:00 PM with violent sixty-mile-an-hour gusts!',
      isContradictionStatement: true,
      options: [
        {
          text: '[CONTRADICTION] Official meteorological radar logged maximum gusts of only 12 knots and 1.8mm of light drizzle yesterday across North Hills!',
          nextNodeId: 'node_press_weather',
          requiredClueId: 'clue_weather_log',
          isPressingQuestion: true
        },
        {
          text: 'I will review the physical evidence in the attic.',
          nextNodeId: 'node_inspect'
        }
      ]
    },
    node_press_rot: {
      id: 'node_press_rot',
      speaker: 'Eleanor Vance',
      text: '(Fidgeting nervously) Dry rot?! Well... anyone can have a little moisture in an old attic! But the storm finished it off!',
      options: [
        {
          text: '[CONTRADICTION] Here is a written contractor estimate from 18 months ago warning of imminent rot collapse, signed "REJECTED BY OWNER DUE TO COST".',
          nextNodeId: 'node_press_contractor',
          requiredClueId: 'clue_contractor_quote',
          isPressingQuestion: true
        },
        {
          text: 'Let me finish photographing the scene.',
          nextNodeId: 'node_inspect'
        }
      ]
    },
    node_press_weather: {
      id: 'node_press_weather',
      speaker: 'Eleanor Vance',
      text: 'Well, localized microbursts aren\'t always caught by the municipal radar stations!',
      options: [
        {
          text: '[CONTRADICTION] The tree branches right outside your attic window still have delicate blooming petals completely undisturbed.',
          nextNodeId: 'node_press_contractor',
          requiredClueId: 'clue_intact_branches',
          isPressingQuestion: true
        }
      ]
    },
    node_press_contractor: {
      id: 'node_press_contractor',
      speaker: 'Eleanor Vance',
      text: '(Sighs deeply and looks away) The contractor quoted me $18,000 two years ago... I simply didn\'t have the money. When the beam finally caved in during yesterday\'s rain, my brother suggested I claim it under the storm rider on my policy. I just couldn\'t afford the repairs on my pension...',
      options: [
        {
          text: 'I understand your difficult situation, Mrs. Vance, but insurance only covers sudden unforeseen perils, not chronic pre-existing rot.',
          nextNodeId: 'node_conclusion'
        }
      ]
    },
    node_inspect: {
      id: 'node_inspect',
      speaker: 'Eleanor Vance',
      text: 'Go ahead, Inspector. But please remember I am an elderly widow depending on this claim!',
      options: [
        {
          text: 'I will be thorough and fair.',
          nextNodeId: 'node_intro'
        }
      ]
    },
    node_conclusion: {
      id: 'node_conclusion',
      speaker: 'Eleanor Vance',
      text: 'I understand, Inspector Laurent. Do what your duty requires.',
      options: []
    }
  },

  clues: [
    {
      id: 'clue_dry_rot_spores',
      name: 'Advanced Dry-Rot Fungal Fruiting Body',
      category: 'structural',
      description: 'The collapsed attic beam is crumbly like charcoal with deep cubical cracking and rust-red spore dust from Serpula lacrymans. The wood core has lost 90% of tensile strength due to years of chronic moisture seepage.',
      inspectorNote: 'PRE-EXISTING DEFECT: Dry rot of this maturity requires 24 to 36 months of continuous unaddressed water condensation, not a 2-hour storm event.',
      scenePosition: { x: 2.8, y: 1.8, z: 1.4 },
      interactRadius: 2.2,
      requiresPhoto: true,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_timber_claim'
    },
    {
      id: 'clue_contractor_quote',
      name: 'Rejected Roofing Estimate (2024)',
      category: 'document',
      description: 'A formal invoice from "Apex Roofing Solutions" dated May 2024. Stamped: "WARNING: Severe dry-rot infestation in main attic purlin. Roof failure imminent without timber replacement." Marked in claimant handwriting: "Declined - Too expensive."',
      inspectorNote: 'MENS REA / INTENTIONAL FRAUD: The claimant was explicitly notified in writing 18 months ago that the roof was decaying and refused maintenance.',
      scenePosition: { x: -3.8, y: 0.9, z: -1.8 },
      interactRadius: 2.2,
      requiresPhoto: false,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_press_rot'
    },
    {
      id: 'clue_weather_log',
      name: 'Municipal Weather Radar Summary',
      category: 'document',
      description: 'Official Met Office data sheet for yesterday: Peak wind velocity: 12 knots (gentle breeze). Precipitation: 1.8mm. No severe storm alerts or wind advisories issued.',
      inspectorNote: 'PERIL DISPROVEN: The claimed storm event never physically occurred in this geographical district.',
      scenePosition: { x: -2.0, y: 0.85, z: 2.8 },
      interactRadius: 2.0,
      requiresPhoto: false,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_weather_claim'
    },
    {
      id: 'clue_intact_branches',
      name: 'Undisturbed Blooming Dogwood Branch',
      category: 'physical',
      description: 'The fragile tree branches touching the attic eave are full of delicate white blossoms. Not a single twig is snapped or stripped.',
      inspectorNote: 'ENVIRONMENTAL EVIDENCE: 60 MPH gale winds would have stripped all blossoms and snapped adjacent 1-inch limbs.',
      scenePosition: { x: 4.2, y: 2.2, z: -1.0 },
      interactRadius: 2.4,
      requiresPhoto: true,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_press_weather'
    },
    {
      id: 'clue_actual_leak_damage',
      name: 'Localized Ceiling Plaster Stains',
      category: 'structural',
      description: 'Water staining on 4 square meters of bedroom ceiling plaster directly below the caved purlin.',
      inspectorNote: 'DAMAGE ASSESSMENT: Minor cosmetic ceiling repair cost is approximately $3,800 to $4,500, but is excluded under standard policy exclusion for long-term dry rot wear.',
      scenePosition: { x: 0.0, y: 0.1, z: 0.0 },
      interactRadius: 2.0,
      requiresPhoto: true,
      discovered: false,
      photographed: false
    }
  ],

  groundTruth: {
    realCause: 'long_term_dry_rot_wear',
    realDamageAmount: 4500,
    isFraud: true,
    fraudReason: 'Claimant misrepresented chronic, pre-existing 3-year dry-rot fungal decay as a sudden storm peril. Met office records disprove the storm, and a 2024 contractor warning was knowingly ignored.',
    crucialClueIds: ['clue_dry_rot_spores', 'clue_contractor_quote', 'clue_weather_log'],
    keyContradictionNodeId: 'node_press_contractor'
  }
};


import { InsuranceCase } from '../types';

export const case1BakeryFire: InsuranceCase = {
  id: 'case_001_bakery_fire',
  caseNumber: 'CLM-2026-084',
  title: 'The Golden Crust Inferno',
  incidentType: 'Commercial Property Fire & Smoke Damage',
  claimantName: 'Pierre Laurent',
  claimantRole: 'Master Baker & Shop Owner',
  propertyAddress: '14 Rue de la Boulangerie, West Quarter',
  policyCoverageLimit: 50000,
  claimedAmount: 48500,
  initialDispatchBrief: 
    'A structural fire was reported in the rear kitchen of "Le Croissant Doré" bakery. Owner Pierre Laurent claims an electrical fault in his primary commercial deck oven ignited surrounding dry flour stock at 4:30 AM. He is claiming total loss of equipment and structural replacement ($48,500).',
  claimantStatement: 
    'I arrived at 4:00 AM to preheat the deck ovens for morning baguettes. Suddenly, sparks exploded from the oven control panel and the flames jumped to the flour sacks! I barely escaped with my life. The whole bakery is ruined!',
  
  initialDialogueNodeId: 'node_intro',
  dialogueNodes: {
    node_intro: {
      id: 'node_intro',
      speaker: 'Pierre Laurent',
      text: 'Ah, monsieur l\'Inspecteur! Thank heavens you arrived. Look at my beloved bakery! Everything is black with soot. The insurance will pay for all this, yes?',
      options: [
        {
          text: 'Walk me through exactly what happened when you arrived this morning.',
          nextNodeId: 'node_story'
        },
        {
          text: 'What was the exact state of the industrial deck oven when the fire started?',
          nextNodeId: 'node_oven_claim'
        },
        {
          text: 'I will inspect the scene and inspect the physical evidence first.',
          nextNodeId: 'node_inspect_prompt'
        }
      ]
    },
    node_story: {
      id: 'node_story',
      speaker: 'Pierre Laurent',
      text: 'I turned the master thermostat on the oven to 230°C. Within five minutes, I heard a loud ZAP, and a fireball shot out from behind the oven into the sack storage! It was an electrical disaster!',
      options: [
        {
          text: 'You claim the oven was actively running and preheating?',
          nextNodeId: 'node_oven_claim'
        },
        {
          text: 'I\'ll take a close look at the kitchen wiring and the oven itself.',
          nextNodeId: 'node_inspect_prompt'
        }
      ]
    },
    node_oven_claim: {
      id: 'node_oven_claim',
      speaker: 'Pierre Laurent',
      text: 'Oui! The deck oven was drawing full current! The power surge must have overheated the cables.',
      isContradictionStatement: true,
      options: [
        {
          text: '[CONTRADICTION] But Pierre, your commercial oven is completely unplugged from the 240V wall socket!',
          nextNodeId: 'node_press_oven',
          requiredClueId: 'clue_unplugged_oven',
          isPressingQuestion: true
        },
        {
          text: 'Where were the flour sacks stored relative to the ignition point?',
          nextNodeId: 'node_accelerant_inquiry'
        },
        {
          text: 'Let me continue examining the fire scene.',
          nextNodeId: 'node_inspect_prompt'
        }
      ]
    },
    node_press_oven: {
      id: 'node_press_oven',
      speaker: 'Pierre Laurent',
      text: '(Sweating profusely) W-what?! Unplugged?! Uh... I... I must have yanked the cord out while panicking and fleeing the blaze! Yes, that must be it!',
      options: [
        {
          text: '[CONTRADICTION] The heavy locking industrial plug has zero tension marks, and there is an empty kerosene canister in your dough bin!',
          nextNodeId: 'node_press_kerosene',
          requiredClueId: 'clue_kerosene_canister',
          isPressingQuestion: true
        },
        {
          text: 'How do you explain the distinctive petroleum pour patterns on the floor?',
          nextNodeId: 'node_accelerant_inquiry'
        }
      ]
    },
    node_accelerant_inquiry: {
      id: 'node_accelerant_inquiry',
      speaker: 'Pierre Laurent',
      text: 'Flour burns very fast, inspector! That is just common kitchen grease and baker\'s oil from making croissants!',
      options: [
        {
          text: '[CONTRADICTION] Croissant butter doesn\'t leave liquid petroleum rainbow pooling or V-burn patterns on hardwood floorboards.',
          nextNodeId: 'node_press_kerosene',
          requiredClueId: 'clue_burn_pour_pattern',
          isPressingQuestion: true
        },
        {
          text: 'Let me review the financial records and eviction letters.',
          nextNodeId: 'node_inspect_prompt'
        }
      ]
    },
    node_press_kerosene: {
      id: 'node_press_kerosene',
      speaker: 'Pierre Laurent',
      text: '(Drops his head into his hands, voice trembling) Mon dieu... the landlord raised my rent by 40%. The utility company cut my flour supplier line. I have $12,000 in past-due notices due this Friday! I... I thought the insurance would save me from bankruptcy. I never meant to hurt anyone...',
      options: [
        {
          text: 'Thank you for your honesty, Pierre. I have enough evidence to complete my official Loss Adjuster report.',
          nextNodeId: 'node_conclusion'
        }
      ]
    },
    node_inspect_prompt: {
      id: 'node_inspect_prompt',
      speaker: 'Pierre Laurent',
      text: 'Take your time, Inspector. But please certify the claim quickly, my livelihood depends on that $48,500 payout!',
      options: [
        {
          text: 'Understood. I will examine the burn marks and equipment.',
          nextNodeId: 'node_intro'
        }
      ]
    },
    node_conclusion: {
      id: 'node_conclusion',
      speaker: 'Pierre Laurent',
      text: 'I know what I did was wrong. The report is in your hands now, Inspector.',
      options: []
    }
  },

  clues: [
    {
      id: 'clue_unplugged_oven',
      name: 'Unplugged Industrial 240V Cable',
      category: 'tampering',
      description: 'The heavy 3-phase industrial power plug for the commercial deck oven is resting cleanly on the dry floor, 40cm from the wall socket. The copper prongs show zero arcing, electrical pitting, or heat distortion.',
      inspectorNote: 'CONTRADICTION: Pierre claimed the oven had an electrical surge while preheating at 230°C. An unpowered appliance cannot ignite an electrical fire.',
      scenePosition: { x: -3.8, y: 0.25, z: 2.2 },
      interactRadius: 2.2,
      requiresPhoto: true,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_oven_claim'
    },
    {
      id: 'clue_kerosene_canister',
      name: 'Concealed Kerosene Canister',
      category: 'physical',
      description: 'A 5-liter galvanized metal fuel canister hidden beneath empty canvas flour sacks inside a flour storage chest. The cap is loose, and strong petroleum vapors linger inside.',
      inspectorNote: 'CRITICAL ARSON EVIDENCE: Kerosene has no legitimate culinary use in a French artisan bakery. Hidden intentionally inside flour bins.',
      scenePosition: { x: 3.2, y: 0.35, z: 3.6 },
      interactRadius: 2.4,
      requiresPhoto: true,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_press_oven'
    },
    {
      id: 'clue_burn_pour_pattern',
      name: 'Accelerant V-Pattern & Puddle Sheen',
      category: 'burn_pattern',
      description: 'Irregular, localized charred puddle contours etched deep into the pine floorboards. Distinct multi-colored hydrocarbon sheen visible along unburnt char margins.',
      inspectorNote: 'FORENSIC EVIDENCE: Downward liquid pooling burn pattern typical of liquid accelerant poured onto the floor prior to ignition.',
      scenePosition: { x: 0.0, y: 0.05, z: 2.8 },
      interactRadius: 2.0,
      requiresPhoto: true,
      discovered: false,
      photographed: false,
      revealsContradictionWith: 'node_accelerant_inquiry'
    },
    {
      id: 'clue_late_rent_ledger',
      name: 'Final Eviction Notice & Debt Ledger',
      category: 'document',
      description: 'A formal letter from Municipal Realty dated 3 days ago: "Demand for immediate settlement of $12,450 back-rent or eviction proceedings commence Friday at noon."',
      inspectorNote: 'MOTIVE: Pierre is facing catastrophic personal bankruptcy. The insurance policy maximum payout of $50,000 matches his total outstanding debts.',
      scenePosition: { x: -4.5, y: 0.85, z: -2.0 },
      interactRadius: 2.2,
      requiresPhoto: false,
      discovered: false,
      photographed: false
    },
    {
      id: 'clue_intact_oven_interior',
      name: 'Undamaged Deck Oven Chamber',
      category: 'structural',
      description: 'The inside baking stones of the deck oven are pristine with no smoke soot or heat warping. Heating elements are completely intact.',
      inspectorNote: 'DAMAGE ASSESSMENT: The claimed $35,000 deck oven suffered only superficial exterior wipeable soot. Actual structural repair cost is at most $6,200 for floorboard replacement.',
      scenePosition: { x: -3.5, y: 1.1, z: 1.5 },
      interactRadius: 2.0,
      requiresPhoto: true,
      discovered: false,
      photographed: false
    }
  ],

  groundTruth: {
    realCause: 'deliberate_arson_accelerant',
    realDamageAmount: 6200,
    isFraud: true,
    fraudReason: 'Claimant intentionally staged an arson fire using kerosene accelerant to claim the $50,000 policy limit to pay off $12,450 in imminent eviction debts. The commercial oven was never plugged in or damaged.',
    crucialClueIds: ['clue_unplugged_oven', 'clue_kerosene_canister', 'clue_burn_pour_pattern'],
    keyContradictionNodeId: 'node_press_kerosene'
  }
};


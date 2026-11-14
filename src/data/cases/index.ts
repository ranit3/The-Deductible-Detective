import { InsuranceCase } from '../../logic/types';
import case1Json from './case_001_bakery_fire.json';
import case2Json from './case_002_roof_leak.json';
import case3Json from './case_003_warehouse_burglary.json';

export const ALL_CASES: InsuranceCase[] = [
  case1Json as unknown as InsuranceCase,
  case2Json as unknown as InsuranceCase,
  case3Json as unknown as InsuranceCase
];

export function getCaseById(caseId: string): InsuranceCase | undefined {
  return ALL_CASES.find(c => c.id === caseId);
}

export function getAllCases(): InsuranceCase[] {
  return ALL_CASES;
}


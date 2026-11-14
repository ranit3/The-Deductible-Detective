import { EvaluationResult, GroundTruth, ReportSubmission } from './types';

/**
 * PURE TYPESCRIPT SCORING ENGINE
 * Evaluates the Loss Adjuster's formal investigation report against ground truth.
 */
export class ScoringEngine {
  /**
   * Evaluates submission report and returns grade, score breakdown, and constructive feedback.
   */
  public static evaluate(submission: ReportSubmission, truth: GroundTruth): EvaluationResult {
    let causeScore = 0;
    let fraudScore = 0;
    let payoutScore = 0;
    let evidenceScore = 0;
    const feedback: string[] = [];

    // 1. Cause of Loss Accuracy (30 Points)
    const causeCorrect = submission.selectedCause === truth.realCause;
    if (causeCorrect) {
      causeScore = 30;
      feedback.push('✓ Origin & Cause: Correctly determined the physical mechanism of loss.');
    } else {
      causeScore = 0;
      feedback.push(`✗ Origin & Cause: Incorrect. The true cause was [${truth.realCause.replace(/_/g, ' ').toUpperCase()}].`);
    }

    // 2. Fraud Determination (30 Points)
    const fraudCorrect = submission.verdictFraud === truth.isFraud;
    if (fraudCorrect) {
      fraudScore = 30;
      feedback.push(truth.isFraud 
        ? '✓ Fraud Verdict: Successfully identified intentional misrepresentation / arson.' 
        : '✓ Fraud Verdict: Correctly verified this as a legitimate covered casualty.');
    } else {
      fraudScore = 0;
      feedback.push(truth.isFraud
        ? '✗ Fraud Verdict: FAILED. You approved a fraudulent claim! Insurer pays improper indemnification.'
        : '✗ Fraud Verdict: FAILED. You wrongfully accused an innocent insured of fraud.');
    }

    // 3. Payout Calculation Precision (20 Points)
    // If fraud, correct approved payout is $0 (claim denied); if legitimate, correct payout is realDamageAmount.
    const expectedPayout = truth.isFraud ? 0 : truth.realDamageAmount;
    const payoutVariance = Math.abs(submission.assessedPayout - expectedPayout);

    if (payoutVariance === 0) {
      payoutScore = 20;
      feedback.push(`✓ Financial Assessment: Exact dollar indemnity calculated ($${expectedPayout.toLocaleString()}).`);
    } else if (payoutVariance <= 1500) {
      payoutScore = 15;
      feedback.push(`✓ Financial Assessment: Close estimate (Variance: $${payoutVariance.toLocaleString()}).`);
    } else if (payoutVariance <= 5000) {
      payoutScore = 10;
      feedback.push(`⚠ Financial Assessment: Moderate deviation from audited actual cash value ($${expectedPayout.toLocaleString()}).`);
    } else {
      payoutScore = 0;
      feedback.push(`✗ Financial Assessment: Severe payout discrepancy ($${payoutVariance.toLocaleString()} off target).`);
    }

    // 4. Evidence Corroboration Exhibits (20 Points)
    const attachedSet = new Set(submission.attachedClueIds);
    let attachedCrucialCount = 0;
    for (const crucialId of truth.crucialClueIds) {
      if (attachedSet.has(crucialId)) {
        attachedCrucialCount++;
      }
    }

    const crucialRatio = truth.crucialClueIds.length > 0 
      ? attachedCrucialCount / truth.crucialClueIds.length 
      : 1;
    evidenceScore = Math.round(crucialRatio * 20);

    if (crucialRatio >= 1.0) {
      feedback.push('✓ Evidentiary Exhibits: All decisive forensic clues were attached to the dossier.');
    } else if (crucialRatio >= 0.5) {
      feedback.push('⚠ Evidentiary Exhibits: Key physical evidence exhibits were omitted from the report.');
    } else {
      feedback.push('✗ Evidentiary Exhibits: Insufficient forensic documentation attached to support the verdict.');
    }

    // Calculate Total & Letter Grade
    const totalScore = causeScore + fraudScore + payoutScore + evidenceScore;
    let grade: 'A+' | 'A' | 'B' | 'C' | 'F' = 'F';

    if (totalScore >= 95) grade = 'A+';
    else if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 50) grade = 'C';
    else grade = 'F';

    return {
      grade,
      totalScore,
      causeCorrect,
      fraudCorrect,
      payoutVariance,
      payoutScore,
      evidenceScore,
      feedback,
      groundTruthSummary: {
        realCause: truth.realCause.replace(/_/g, ' ').toUpperCase(),
        realDamage: truth.realDamageAmount,
        wasFraud: truth.isFraud,
        explanation: truth.fraudReason
      }
    };
  }
}


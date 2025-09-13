/**
 * Hyperbilirubinemia Risk Assessment calculator - Pure functions only
 *
 * This module contains pure calculation logic for hyperbilirubinemia assessment
 * with minimal safety validation. Clinical range validation handled by adapter layers.
 */

import { loadAllReferenceTables, getThresholdValue } from '../utils/aap-table-loader';
import {
  HyperbiliRiskInput,
  HyperbiliRiskResult,
  AapBilirubinThresholds,
  AapClinicalStatus,
  determineAapClinicalAction,
  BilirubinThresholdsInput,
  ClinicalStatusInput,
  ClinicalGuidanceInput,
  AapClinicalActionInput,
} from './hyperbili-risk-types';
import { HYPERBILI_THRESHOLDS } from '../constants/clinical-thresholds';
import { findFollowUpRule } from '../data/follow-up-rules';
import { InvalidInputError } from '../utils/error-handling';

// Re-export types and constants that are needed by other modules
export type {
  HyperbiliRiskInput,
  HyperbiliRiskResult,
  AapBilirubinThresholds,
  AapClinicalStatus,
};
export { AAP_NEUROTOXICITY_RISK_FACTORS } from './hyperbili-risk-types';
export type { AapNeurotoxicityRiskFactor } from './hyperbili-risk-types';

// =============================================================================
// INPUT VALIDATION - Ensure clinical parameters are within acceptable ranges
// =============================================================================

/**
 * Validate input parameters for hyperbilirubinemia risk assessment
 * @param input Input parameters to validate
 * @throws InvalidInputError if any parameter is outside acceptable clinical range
 */
function validateHyperbiliRiskInput(input: HyperbiliRiskInput): void {
  // Validate gestational age
  if (input.gestationalAge < HYPERBILI_THRESHOLDS.MIN_GESTATIONAL_AGE_WEEKS) {
    throw new InvalidInputError(
      `Gestational age ${input.gestationalAge} weeks is below the minimum of ${HYPERBILI_THRESHOLDS.MIN_GESTATIONAL_AGE_WEEKS} weeks. ` +
        `This calculator is only validated for infants ≥${HYPERBILI_THRESHOLDS.MIN_GESTATIONAL_AGE_WEEKS} weeks gestational age per AAP guidelines.`,
      {
        gestationalAge: input.gestationalAge,
        minimumGestationalAge: HYPERBILI_THRESHOLDS.MIN_GESTATIONAL_AGE_WEEKS,
        suggestion: 'For infants <35 weeks gestational age, consult NICU guidelines or specialized preterm calculators',
      },
    );
  }

  if (input.gestationalAge > HYPERBILI_THRESHOLDS.MAX_GESTATIONAL_AGE_WEEKS) {
    throw new InvalidInputError(
      `Gestational age ${input.gestationalAge} weeks exceeds the maximum of ${HYPERBILI_THRESHOLDS.MAX_GESTATIONAL_AGE_WEEKS} weeks. ` +
        `Please verify the gestational age is correct.`,
      {
        gestationalAge: input.gestationalAge,
        maximumGestationalAge: HYPERBILI_THRESHOLDS.MAX_GESTATIONAL_AGE_WEEKS,
        suggestion: 'Verify gestational age calculation or use alternative assessment for post-term infants',
      },
    );
  }

  // Validate current age in hours
  if (input.currentAgeHours < HYPERBILI_THRESHOLDS.MIN_AGE_HOURS) {
    throw new InvalidInputError(
      `Age ${input.currentAgeHours} hours is below the minimum of ${HYPERBILI_THRESHOLDS.MIN_AGE_HOURS} hour. ` +
        `Bilirubin assessment is typically not performed in the first hour of life.`,
      {
        currentAgeHours: input.currentAgeHours,
        minimumAgeHours: HYPERBILI_THRESHOLDS.MIN_AGE_HOURS,
        suggestion: 'Wait until infant is at least 1 hour old for meaningful bilirubin assessment',
      },
    );
  }

  if (input.currentAgeHours > HYPERBILI_THRESHOLDS.MAX_AGE_HOURS) {
    throw new InvalidInputError(
      `Age of ${input.currentAgeHours} hours exceeds AAP guideline maximum of ${HYPERBILI_THRESHOLDS.MAX_AGE_HOURS} hours (14 days). ` +
        `This calculator is only validated for infants ≤14 days old.`,
      {
        currentAgeHours: input.currentAgeHours,
        maxAgeHours: HYPERBILI_THRESHOLDS.MAX_AGE_HOURS,
        suggestion: 'For infants >14 days old, consult clinical guidelines or use alternative assessment tools',
      },
    );
  }

  // Validate TSB value
  if (input.currentTSB < HYPERBILI_THRESHOLDS.MIN_TSB_MG_DL) {
    throw new InvalidInputError(
      `Total Serum Bilirubin (TSB) ${input.currentTSB} mg/dL cannot be negative. ` +
        `Please verify the laboratory result.`,
      {
        currentTSB: input.currentTSB,
        minimumTSB: HYPERBILI_THRESHOLDS.MIN_TSB_MG_DL,
        suggestion: 'Verify laboratory result or check for transcription errors',
      },
    );
  }

  if (input.currentTSB > HYPERBILI_THRESHOLDS.MAX_TSB_MG_DL) {
    throw new InvalidInputError(
      `Total Serum Bilirubin (TSB) ${input.currentTSB} mg/dL exceeds the clinical maximum of ${HYPERBILI_THRESHOLDS.MAX_TSB_MG_DL} mg/dL. ` +
        `This level requires immediate medical attention and may indicate a laboratory error.`,
      {
        currentTSB: input.currentTSB,
        maximumTSB: HYPERBILI_THRESHOLDS.MAX_TSB_MG_DL,
        suggestion: 'Immediately verify laboratory result and consider urgent clinical intervention',
      },
    );
  }
}

// =============================================================================
// PURE FUNCTIONS - Composable hyperbilirubinemia assessment functions
// =============================================================================

/**
 * Calculate bilirubin thresholds for a patient (pure function)
 *
 * @param input Bilirubin threshold calculation parameters with improved naming
 * @returns All relevant bilirubin thresholds
 *
 * @example
 * ```typescript
 * const thresholds = calculateBilirubinThresholds({
 *   gestationalAgeWeeks: 38,
 *   ageHours: 48,
 *   hasNeurotoxicityRiskFactors: false
 * });
 * console.log(thresholds.phototherapy); // 12.5
 * ```
 */
export function calculateBilirubinThresholds(input: BilirubinThresholdsInput): AapBilirubinThresholds {
  // Destructure input parameters
  const { gestationalAgeWeeks, ageHours, hasNeurotoxicityRiskFactors } = input;

  // Load reference tables
  const tables = loadAllReferenceTables();

  // Ensure age is within table limits (AAP guidelines only apply up to 14 days)
  // Check for age outside valid range
  if (ageHours > HYPERBILI_THRESHOLDS.MAX_AGE_HOURS) {
    throw new InvalidInputError(
      `Age of ${ageHours} hours exceeds AAP guideline maximum of ${HYPERBILI_THRESHOLDS.MAX_AGE_HOURS} hours (14 days). ` +
        `This calculator is only validated for infants ≤14 days old.`,
      {
        ageHours,
        maxAgeHours: HYPERBILI_THRESHOLDS.MAX_AGE_HOURS,
        suggestion: 'For infants >14 days old, consult clinical guidelines or use alternative assessment tools',
      },
    );
  }

  const clampedAgeHours = ageHours;

  // Select appropriate tables based on risk factors
  const phototherapyTable = hasNeurotoxicityRiskFactors
    ? tables.phototherapyWithRisk
    : tables.phototherapyNoRisk;
  const exchangeTable = hasNeurotoxicityRiskFactors ? tables.exchangeWithRisk : tables.exchangeNoRisk;

  // Calculate thresholds
  const phototherapy = getThresholdValue(phototherapyTable, gestationalAgeWeeks, clampedAgeHours);
  const exchangeTransfusion = getThresholdValue(exchangeTable, gestationalAgeWeeks, clampedAgeHours);

  return {
    phototherapy,
    escalationOfCare: exchangeTransfusion - HYPERBILI_THRESHOLDS.ESCALATION_OFFSET_MG_DL,
    exchangeTransfusion,
    transcutaneousBilirubinConfirmation:
      phototherapy - HYPERBILI_THRESHOLDS.TCB_CONFIRMATION_OFFSET_MG_DL,
  };
}

/**
 * Determine clinical status based on TSB and thresholds (pure function)
 *
 * @param input Clinical status assessment parameters with improved naming
 * @returns Clinical status indicators
 *
 * @example
 * ```typescript
 * const status = assessClinicalStatus({
 *   bilirubinMgDl: 15.2,
 *   thresholds
 * });
 * console.log(status.requiresPhototherapy); // true
 * ```
 */
export function assessClinicalStatus(input: ClinicalStatusInput): AapClinicalStatus {
  // Destructure input parameters
  const { bilirubinMgDl, thresholds } = input;

  return {
    requiresPhototherapy: bilirubinMgDl >= thresholds.phototherapy,
    requiresIntensivePhototherapy: bilirubinMgDl >= thresholds.escalationOfCare,
    requiresExchangeTransfusion: bilirubinMgDl >= thresholds.exchangeTransfusion,
    requiresSerumConfirmationForTcB: bilirubinMgDl >= thresholds.transcutaneousBilirubinConfirmation,
  };
}

/**
 * Generate clinical guidance based on assessment (pure function)
 *
 * @param input Clinical guidance parameters with improved naming
 * @returns Clinical guidance recommendations
 *
 * @example
 * ```typescript
 * const guidance = generateClinicalGuidance({
 *   bilirubinMgDl: 15.2,
 *   thresholds,
 *   ageHours: 48
 * });
 * console.log(guidance.immediateAction); // 'Initiate phototherapy'
 * ```
 */
export function generateClinicalGuidance(input: ClinicalGuidanceInput): {
  immediateAction: string;
  followUpRecommendation: string;
  dischargeConsiderations?: string;
} {
  // Destructure input parameters
  const { bilirubinMgDl, thresholds, ageHours } = input;

  // Calculate threshold differences
  const phototherapyDiff = bilirubinMgDl - thresholds.phototherapy;

  // Determine immediate action
  const immediateAction = determineAapClinicalAction({ bilirubinMgDl, thresholds });

  // Determine follow-up recommendation
  let followUpRecommendation: string;
  if (phototherapyDiff >= 0) {
    followUpRecommendation = 'Phototherapy indicated - see clinical action';
  } else {
    // TSB below threshold - find appropriate follow-up rule
    const diffBelowThreshold = -phototherapyDiff;
    const rule = findFollowUpRule(diffBelowThreshold, ageHours);
    followUpRecommendation = rule.recommendation;
  }

  // Determine discharge considerations
  let dischargeConsiderations: string | undefined;
  if (
    ageHours < HYPERBILI_THRESHOLDS.DISCHARGE_WARNING_AGE_HOURS &&
    phototherapyDiff > -HYPERBILI_THRESHOLDS.TCB_CONFIRMATION_OFFSET_MG_DL
  ) {
    dischargeConsiderations = `Consider delaying discharge for infants <${HYPERBILI_THRESHOLDS.DISCHARGE_WARNING_AGE_HOURS} hours old when TSB is within ${HYPERBILI_THRESHOLDS.TCB_CONFIRMATION_OFFSET_MG_DL} mg/dL of phototherapy threshold`;
  }

  return {
    immediateAction,
    followUpRecommendation,
    dischargeConsiderations,
  };
}

/**
 * Complete hyperbilirubinemia risk assessment (pure function)
 *
 * @param input Patient data for assessment
 * @returns Complete hyperbilirubinemia assessment
 *
 * @example
 * ```typescript
 * const result = assessHyperbiliRisk({
 *   gestationalAge: 38,
 *   currentAgeHours: 48,
 *   currentTSB: 12.5,
 *   riskFactors: []
 * });
 * console.log(result.thresholds.phototherapy); // 12.5
 * console.log(result.clinicalStatus.requiresPhototherapy); // true
 * ```
 */
export function assessHyperbiliRisk(input: HyperbiliRiskInput): HyperbiliRiskResult {
  // Validate input parameters
  validateHyperbiliRiskInput(input);

  // Use age directly
  const ageHours = input.currentAgeHours;

  // Determine risk factors
  const presentRiskFactors = input.riskFactors ?? [];
  const hasNeurotoxicityRiskFactors = presentRiskFactors.length > 0;
  const aapFigureUsed = hasNeurotoxicityRiskFactors ? 3 : 2;

  // Calculate thresholds
  const thresholds = calculateBilirubinThresholds({
    gestationalAgeWeeks: input.gestationalAge,
    ageHours,
    hasNeurotoxicityRiskFactors,
  });

  // Assess clinical status
  const clinicalStatus = assessClinicalStatus({
    bilirubinMgDl: input.currentTSB,
    thresholds,
  });

  // Calculate threshold differences (positive = TSB above threshold)
  const thresholdDifferences = {
    fromPhototherapy: input.currentTSB - thresholds.phototherapy,
    fromEscalationOfCare: input.currentTSB - thresholds.escalationOfCare,
    fromExchangeTransfusion: input.currentTSB - thresholds.exchangeTransfusion,
  };

  // Generate clinical guidance
  const clinicalGuidance = generateClinicalGuidance({
    bilirubinMgDl: input.currentTSB,
    thresholds,
    ageHours,
  });

  // Construct the assessment result
  return {
    currentTSB: input.currentTSB,
    thresholds,
    clinicalStatus,
    thresholdDifferences,
    clinicalGuidance,
    assessmentContext: {
      hasNeurotoxicityRiskFactors,
      presentRiskFactors,
      aapFigureUsed,
      ageHours: input.currentAgeHours,
      gestationalAgeWeeks: input.gestationalAge,
    },
  };
}
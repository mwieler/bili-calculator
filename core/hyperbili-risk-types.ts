/**
 * AAP 2022-aligned types and interfaces for hyperbilirubinemia assessment
 *
 * These types follow the exact terminology and clinical decision points
 * from the AAP 2022 Clinical Practice Guideline.
 */

/**
 * AAP-defined neurotoxicity risk factors from Table 2
 * Note: Gestational age <38 weeks is NOT included as it's accounted for in the curves
 */
export const AAP_NEUROTOXICITY_RISK_FACTORS = {
  ALBUMIN_LOW: 'Serum albumin <3.0 g/dL',
  ISOIMMUNE_HEMOLYTIC_DISEASE: 'Isoimmune hemolytic disease (positive DAT)',
  G6PD_DEFICIENCY: 'G6PD deficiency',
  OTHER_HEMOLYTIC_CONDITIONS: 'Other hemolytic conditions',
  SEPSIS: 'Sepsis',
  CLINICAL_INSTABILITY: 'Significant clinical instability in the previous 24 hours',
} as const;

/**
 * Type for AAP risk factors
 */
export type AapNeurotoxicityRiskFactor =
  (typeof AAP_NEUROTOXICITY_RISK_FACTORS)[keyof typeof AAP_NEUROTOXICITY_RISK_FACTORS];

/**
 * Clinical thresholds as defined by AAP guidelines
 */
export interface AapBilirubinThresholds {
  /** Phototherapy initiation threshold (mg/dL) */
  phototherapy: number;

  /** Escalation of care threshold (exchange - 2 mg/dL) */
  escalationOfCare: number;

  /** Exchange transfusion threshold (mg/dL) */
  exchangeTransfusion: number;

  /** Threshold for confirming TcB with TSB (phototherapy - 2 mg/dL) */
  transcutaneousBilirubinConfirmation: number;
}

/**
 * Clinical status indicators based on TSB relative to thresholds
 */
export interface AapClinicalStatus {
  /** TSB ≥ phototherapy threshold */
  requiresPhototherapy: boolean;

  /** TSB ≥ escalation of care threshold (exchange - 2 mg/dL) */
  requiresIntensivePhototherapy: boolean;

  /** TSB ≥ exchange transfusion threshold */
  requiresExchangeTransfusion: boolean;

  /** TcB within 2 mg/dL of phototherapy threshold (requires serum confirmation) */
  requiresSerumConfirmationForTcB: boolean;
}

/**
 * AAP-aligned hyperbilirubinemia assessment result
 */
export interface HyperbiliRiskResult {
  /** Current total serum bilirubin value (mg/dL) */
  currentTSB: number;

  /** All relevant threshold values */
  thresholds: AapBilirubinThresholds;

  /** Boolean indicators for clinical decision points */
  clinicalStatus: AapClinicalStatus;

  /** Differences from key thresholds (for trending) */
  thresholdDifferences: {
    /** TSB below (-) or above (+) phototherapy threshold */
    fromPhototherapy: number;

    /** TSB below (-) or above (+) escalation threshold */
    fromEscalationOfCare: number;

    /** TSB below (-) or above (+) exchange threshold */
    fromExchangeTransfusion: number;
  };

  /** AAP-specific clinical guidance */
  clinicalGuidance: {
    /** Immediate intervention required (e.g., "Begin phototherapy") */
    immediateAction: string;

    /** Follow-up timing based on Figure 7 */
    followUpRecommendation: string;

    /** Discharge considerations for infants <24 hours */
    dischargeConsiderations?: string;
  };

  /** Assessment metadata */
  assessmentContext: {
    /** Patient has one or more neurotoxicity risk factors */
    hasNeurotoxicityRiskFactors: boolean;

    /** List of specific risk factors present */
    presentRiskFactors: string[];

    /** Which AAP figure was used (2 or 3) */
    aapFigureUsed: 2 | 3;

    /** Patient age in hours at time of assessment */
    ageHours: number;

    /** Gestational age in weeks */
    gestationalAgeWeeks: number;
  };
}

/**
 * Type for hyperbilirubinemia risk assessment input
 */
export interface HyperbiliRiskInput {
  /** Gestational age in whole weeks (35-42) */
  gestationalAge: number;

  /** Postnatal age in hours (1-336) */
  currentAgeHours: number;

  /** Total serum bilirubin in mg/dL (0-30) */
  currentTSB: number;

  /** Neurotoxicity risk factors from AAP Table 2 */
  riskFactors?: string[];
}

/**
 * Input parameters for calculating bilirubin thresholds
 */
export interface BilirubinThresholdsInput {
  /** Gestational age in whole weeks (35-42) */
  gestationalAgeWeeks: number;

  /** Postnatal age in hours (1-336) */
  ageHours: number;

  /** Whether patient has neurotoxicity risk factors */
  hasNeurotoxicityRiskFactors: boolean;
}

/**
 * Input parameters for assessing clinical status
 */
export interface ClinicalStatusInput {
  /** Total serum bilirubin in mg/dL */
  bilirubinMgDl: number;

  /** AAP bilirubin thresholds */
  thresholds: AapBilirubinThresholds;
}

/**
 * Input parameters for generating clinical guidance
 */
export interface ClinicalGuidanceInput {
  /** Total serum bilirubin in mg/dL */
  bilirubinMgDl: number;

  /** AAP bilirubin thresholds */
  thresholds: AapBilirubinThresholds;

  /** Postnatal age in hours */
  ageHours: number;
}

/**
 * Input parameters for determining AAP clinical action
 */
export interface AapClinicalActionInput {
  /** Total serum bilirubin in mg/dL */
  bilirubinMgDl: number;

  /** AAP bilirubin thresholds */
  thresholds: AapBilirubinThresholds;
}

/**
 * Clinical action determination based on AAP guidelines
 *
 * @internal This is an internal helper function used by assessClinicalStatus.
 * Use assessClinicalStatus or assessHyperbiliRisk for the public API.
 */
export function determineAapClinicalAction(input: AapClinicalActionInput): string {
  // Destructure input parameters
  const { bilirubinMgDl, thresholds } = input;

  if (bilirubinMgDl >= thresholds.exchangeTransfusion) {
    return 'Begin exchange transfusion';
  } else if (bilirubinMgDl >= thresholds.escalationOfCare) {
    return 'Begin intensive phototherapy and prepare for exchange transfusion';
  } else if (bilirubinMgDl >= thresholds.phototherapy) {
    return 'Begin phototherapy';
  } else {
    return 'No phototherapy required';
  }
}
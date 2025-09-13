/**
 * General Clinical Thresholds and Constants
 *
 * This module contains clinical thresholds that are used across multiple
 * calculators or are general clinical constants not specific to a single domain.
 */

/**
 * Hyperbilirubinemia (Jaundice) Thresholds
 * Based on AAP 2022 Clinical Practice Guideline Revision:
 * Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation
 *
 * @see https://doi.org/10.1542/peds.2022-058859
 * @see Kemper AR, et al. Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation. Pediatrics. 2022;150(3):e2022058859
 */
export const HYPERBILI_THRESHOLDS = {
  /**
   * Escalation threshold offset: when TSB is within this many mg/dL
   * below exchange transfusion threshold, consider escalation of care
   */
  ESCALATION_OFFSET_MG_DL: 2,

  /**
   * TCB (Transcutaneous Bilirubin) confirmation threshold:
   * when TCB is within this many mg/dL below phototherapy threshold,
   * confirm with TSB (Total Serum Bilirubin)
   */
  TCB_CONFIRMATION_OFFSET_MG_DL: 2,

  /**
   * Discharge warning age threshold:
   * infants discharged before this age (hours) need closer follow-up
   */
  DISCHARGE_WARNING_AGE_HOURS: 24,

  /** Minimum age for calculator (hours) */
  MIN_AGE_HOURS: 1,

  /** Maximum age for calculator (hours) - 14 days */
  MAX_AGE_HOURS: 336,

  /**
   * Follow-up age threshold:
   * different follow-up recommendations apply before/after this age (hours)
   */
  FOLLOW_UP_AGE_THRESHOLD_HOURS: 72,

  /** Minimum gestational age for calculator (weeks) - per AAP guidelines */
  MIN_GESTATIONAL_AGE_WEEKS: 35,

  /** Maximum gestational age for calculator (weeks) */
  MAX_GESTATIONAL_AGE_WEEKS: 42,

  /** Minimum TSB value (mg/dL) - cannot be negative */
  MIN_TSB_MG_DL: 0,

  /** Maximum TSB value (mg/dL) - clinically extreme upper limit */
  MAX_TSB_MG_DL: 30,
} as const;

/**
 * General Clinical Constants
 * Common values used across multiple clinical calculations
 */
export const CLINICAL_CONSTANTS = {
  /** Standard gestational age for full-term infant (weeks) */
  FULL_TERM_GESTATIONAL_AGE_WEEKS: 40,

  /** Preterm threshold (weeks) - infants born before this are considered preterm */
  PRETERM_THRESHOLD_WEEKS: 37,

  /** Late preterm threshold (weeks) - used for special considerations */
  LATE_PRETERM_THRESHOLD_WEEKS: 35,

  /** Hours in a day - used for age conversions */
  HOURS_PER_DAY: 24,

  /** Days in a week - used for age conversions */
  DAYS_PER_WEEK: 7,
} as const;

/**
 * Clinical Risk Categories
 * Standard risk stratification levels used across calculators
 */
export const RISK_CATEGORIES = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

/**
 * Type definitions
 */
export type RiskCategory = (typeof RISK_CATEGORIES)[keyof typeof RISK_CATEGORIES];
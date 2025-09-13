/**
 * Hyperbilirubinemia Follow-up Rules
 *
 * Based on AAP 2022 Clinical Practice Guideline Revision:
 * Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation
 *
 * These rules are derived from Figure 7 in the AAP guidelines and determine
 * follow-up recommendations based on the difference between TSB and phototherapy threshold.
 */

import { HYPERBILI_THRESHOLDS } from '../constants/clinical-thresholds';

/**
 * Structure for follow-up recommendation rules
 */
export interface FollowUpRule {
  /** Unique identifier for the rule */
  id: string;

  /** Minimum difference from phototherapy threshold (mg/dL) */
  minDifference: number;

  /** Maximum difference from phototherapy threshold (mg/dL) */
  maxDifference: number;

  /** Age condition for when this rule applies */
  ageCondition: {
    /** Minimum age in hours (inclusive), undefined means no minimum */
    minHours?: number;
    /** Maximum age in hours (exclusive), undefined means no maximum */
    maxHours?: number;
  };

  /** Clinical recommendation text */
  recommendation: string;

  /** Additional context or notes about the recommendation */
  notes?: string;
}

/**
 * Follow-up recommendation rules based on AAP 2022 Figure 7
 * Rules are ordered from smallest to largest difference ranges
 */
export const HYPERBILI_FOLLOW_UP_RULES: FollowUpRule[] = [
  // 0.1 - 2.0 mg/dL below threshold
  {
    id: 'rule_1a',
    minDifference: 0.1,
    maxDifference: 2.0,
    ageCondition: {
      maxHours: HYPERBILI_THRESHOLDS.DISCHARGE_WARNING_AGE_HOURS,
    },
    recommendation: 'Delay discharge, consider phototherapy, measure TSB in 4 to 8 hours',
    notes: 'For infants < 24 hours old who are very close to phototherapy threshold',
  },
  {
    id: 'rule_1b',
    minDifference: 0.1,
    maxDifference: 2.0,
    ageCondition: {
      minHours: HYPERBILI_THRESHOLDS.DISCHARGE_WARNING_AGE_HOURS,
    },
    recommendation:
      'Measure TSB in 4 to 24 hours. Options: delay discharge and consider phototherapy, discharge with home phototherapy if eligible, or discharge without phototherapy but with close follow-up',
    notes: 'For infants ≥ 24 hours old who are very close to phototherapy threshold',
  },

  // 2.0 - 3.5 mg/dL below threshold
  {
    id: 'rule_2',
    minDifference: 2.0,
    maxDifference: 3.5,
    ageCondition: {},
    recommendation: 'TSB or TcB in 4 to 24 hours',
    notes: 'Moderate risk zone requiring prompt follow-up',
  },

  // 3.5 - 5.5 mg/dL below threshold
  {
    id: 'rule_3',
    minDifference: 3.5,
    maxDifference: 5.5,
    ageCondition: {},
    recommendation: 'TSB or TcB in 1-2 days',
    notes: 'Lower risk zone with standard follow-up timing',
  },

  // 5.5 - 7.0 mg/dL below threshold
  {
    id: 'rule_4a',
    minDifference: 5.5,
    maxDifference: 7.0,
    ageCondition: {
      maxHours: HYPERBILI_THRESHOLDS.FOLLOW_UP_AGE_THRESHOLD_HOURS,
    },
    recommendation: 'Follow-up within 2 days; TcB or TSB according to clinical judgment',
    notes: 'For younger infants (< 72 hours) in the low risk zone',
  },
  {
    id: 'rule_4b',
    minDifference: 5.5,
    maxDifference: 7.0,
    ageCondition: {
      minHours: HYPERBILI_THRESHOLDS.FOLLOW_UP_AGE_THRESHOLD_HOURS,
    },
    recommendation: 'Clinical judgment',
    notes: 'For older infants (≥ 72 hours) in the low risk zone',
  },

  // > 7.0 mg/dL below threshold
  {
    id: 'rule_5a',
    minDifference: 7.0,
    maxDifference: Infinity,
    ageCondition: {
      maxHours: HYPERBILI_THRESHOLDS.FOLLOW_UP_AGE_THRESHOLD_HOURS,
    },
    recommendation: 'Follow-up within 3 days; TcB or TSB according to clinical judgment',
    notes: 'For younger infants (< 72 hours) in the very low risk zone',
  },
  {
    id: 'rule_5b',
    minDifference: 7.0,
    maxDifference: Infinity,
    ageCondition: {
      minHours: HYPERBILI_THRESHOLDS.FOLLOW_UP_AGE_THRESHOLD_HOURS,
    },
    recommendation: 'Clinical judgment',
    notes: 'For older infants (≥ 72 hours) in the very low risk zone',
  },
];

/**
 * Special case: when TSB is below threshold (negative difference)
 */
export const BELOW_THRESHOLD_RULE: FollowUpRule = {
  id: 'rule_negative',
  minDifference: -Infinity,
  maxDifference: 0,
  ageCondition: {},
  recommendation: 'TSB exceeds phototherapy threshold - phototherapy is indicated',
  notes: 'When TSB is at or above the phototherapy threshold',
};

/**
 * Helper function to find the appropriate follow-up rule
 * @param differenceFromThreshold TSB difference from phototherapy threshold (mg/dL)
 * @param ageHours Current age in hours
 * @returns The matching follow-up rule
 */
export function findFollowUpRule(differenceFromThreshold: number, ageHours: number): FollowUpRule {
  // Special case: TSB at or above threshold
  if (differenceFromThreshold <= 0) {
    return BELOW_THRESHOLD_RULE;
  }

  // Find matching rule based on difference and age
  const matchingRule = HYPERBILI_FOLLOW_UP_RULES.find((rule) => {
    const inDifferenceRange =
      differenceFromThreshold > rule.minDifference && differenceFromThreshold <= rule.maxDifference;

    const meetsAgeCondition =
      (rule.ageCondition.minHours === undefined || ageHours >= rule.ageCondition.minHours) &&
      (rule.ageCondition.maxHours === undefined || ageHours < rule.ageCondition.maxHours);

    return inDifferenceRange && meetsAgeCondition;
  });

  // This should never happen if rules are complete, but provide a fallback
  if (!matchingRule) {
    return {
      id: 'rule_fallback',
      minDifference: 0,
      maxDifference: Infinity,
      ageCondition: {},
      recommendation: 'Clinical judgment - consult AAP guidelines',
      notes: 'No specific rule found for this combination',
    };
  }

  return matchingRule;
}
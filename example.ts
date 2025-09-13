/**
 * Minimal Hyperbilirubinemia Risk Calculator Example
 *
 * This example demonstrates the pure core calculation function without
 * any FHIR, MCP, or external dependencies - just the essential logic.
 */

import { assessHyperbiliRisk } from './core/hyperbili-risk';

console.log('Pure calculation functions - zero external dependencies');
console.log('Based on AAP 2022 Clinical Practice Guidelines');
console.log();

// Example 1: Low-risk term infant
console.log('Example 1: Low-risk term infant');
console.log('Patient: 39-week infant, 48 hours old, TSB 10 mg/dL, no risk factors');

const result1 = assessHyperbiliRisk({
  gestationalAge: 39,
  currentAgeHours: 48,
  currentTSB: 10,
  riskFactors: []
});

console.log('Results:');
console.log(`• Current TSB: ${result1.currentTSB} mg/dL`);
console.log(`• Phototherapy threshold: ${result1.thresholds.phototherapy.toFixed(1)} mg/dL`);
console.log(`• Needs phototherapy: ${result1.clinicalStatus.requiresPhototherapy ? 'YES' : 'NO'}`);
console.log(`• Clinical action: ${result1.clinicalGuidance.immediateAction}`);
console.log(`• Follow-up: ${result1.clinicalGuidance.followUpRecommendation}`);
console.log();

// Example 2: High-risk preterm infant
console.log('Example 2: High-risk preterm infant');
console.log('Patient: 37-week infant, 72 hours old, TSB 15 mg/dL, G6PD deficiency');

const result2 = assessHyperbiliRisk({
  gestationalAge: 37,
  currentAgeHours: 72,
  currentTSB: 15,
  riskFactors: ['G6PD deficiency']
});

console.log('Results:');
console.log(`• Current TSB: ${result2.currentTSB} mg/dL`);
console.log(`• Phototherapy threshold: ${result2.thresholds.phototherapy.toFixed(1)} mg/dL (lower due to risk factors)`);
console.log(`• Needs phototherapy: ${result2.clinicalStatus.requiresPhototherapy ? 'YES' : 'NO'}`);
console.log(`• Exchange transfusion threshold: ${result2.thresholds.exchangeTransfusion.toFixed(1)} mg/dL`);
console.log(`• Clinical action: ${result2.clinicalGuidance.immediateAction}`);
console.log(`• AAP Figure used: ${result2.assessmentContext.aapFigureUsed} (with risk factors)`);
console.log();

// Example 3: Critical case requiring immediate intervention
console.log('Example 3: Critical case requiring intervention');
console.log('Patient: 38-week infant, 24 hours old, TSB 18 mg/dL, no risk factors');

const result3 = assessHyperbiliRisk({
  gestationalAge: 38,
  currentAgeHours: 24,
  currentTSB: 18,
  riskFactors: []
});

console.log('Results:');
console.log(`• Current TSB: ${result3.currentTSB} mg/dL`);
console.log(`• Phototherapy threshold: ${result3.thresholds.phototherapy.toFixed(1)} mg/dL`);
console.log(`• ABOVE phototherapy by: ${result3.thresholdDifferences.fromPhototherapy.toFixed(1)} mg/dL`);
console.log(`• Needs phototherapy: ${result3.clinicalStatus.requiresPhototherapy ? '⚠️  YES' : 'NO'}`);
console.log(`• Needs intensive phototherapy: ${result3.clinicalStatus.requiresIntensivePhototherapy ? 'YES' : 'NO'}`);
console.log(`• Clinical action: ${result3.clinicalGuidance.immediateAction}`);
console.log();

// Example 4: Show threshold details
console.log('Example 4: Understanding threshold calculations');
console.log('Patient: 39-week infant, 48 hours old, TSB 12 mg/dL');

const result4 = assessHyperbiliRisk({
  gestationalAge: 39,
  currentAgeHours: 48,
  currentTSB: 12,
  riskFactors: []
});

console.log('AAP 2022 Thresholds:');
console.log(`• Phototherapy: ${result4.thresholds.phototherapy.toFixed(1)} mg/dL`);
console.log(`• Escalation of care: ${result4.thresholds.escalationOfCare.toFixed(1)} mg/dL`);
console.log(`• Exchange transfusion: ${result4.thresholds.exchangeTransfusion.toFixed(1)} mg/dL`);
console.log(`• TcB confirmation: ${result4.thresholds.transcutaneousBilirubinConfirmation.toFixed(1)} mg/dL`);
console.log();

console.log('Clinical Status Indicators:');
console.log(`• Requires phototherapy: ${result4.clinicalStatus.requiresPhototherapy}`);
console.log(`• Requires intensive phototherapy: ${result4.clinicalStatus.requiresIntensivePhototherapy}`);
console.log(`• Requires exchange transfusion: ${result4.clinicalStatus.requiresExchangeTransfusion}`);
console.log(`• Requires serum confirmation for TcB: ${result4.clinicalStatus.requiresSerumConfirmationForTcB}`);
console.log();

console.log('Assessment Context:');
console.log(`• Has neurotoxicity risk factors: ${result4.assessmentContext.hasNeurotoxicityRiskFactors}`);
console.log(`• AAP Figure used: ${result4.assessmentContext.aapFigureUsed}`);
console.log(`• Patient age: ${result4.assessmentContext.ageHours} hours`);
console.log(`• Gestational age: ${result4.assessmentContext.gestationalAgeWeeks} weeks`);
console.log();

// Example 5: Error handling
console.log('Example 5: Error handling demonstration');
try {
  assessHyperbiliRisk({
    gestationalAge: 32, // Below minimum (35 weeks)
    currentAgeHours: 48,
    currentTSB: 10,
    riskFactors: []
  });
} catch (error) {
  console.log(`✓ Validation caught invalid gestational age: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

try {
  assessHyperbiliRisk({
    gestationalAge: 39,
    currentAgeHours: 400, // Above maximum (336 hours / 14 days)
    currentTSB: 10,
    riskFactors: []
  });
} catch (error) {
  console.log(`✓ Validation caught invalid age: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

try {
  assessHyperbiliRisk({
    gestationalAge: 38,
    currentAgeHours: 48,
    currentTSB: -2.5, // Negative TSB value
    riskFactors: []
  });
} catch (error) {
  console.log(`✓ Validation caught negative TSB: ${error instanceof Error ? error.message.split('.')[0] : 'Unknown error'}`);
}

try {
  assessHyperbiliRisk({
    gestationalAge: 38,
    currentAgeHours: 48,
    currentTSB: 35, // TSB above clinical maximum
    riskFactors: []
  });
} catch (error) {
  console.log(`✓ Validation caught excessive TSB: ${error instanceof Error ? error.message.split('.')[0] : 'Unknown error'}`);
}

console.log();
console.log('=== Summary ===');
console.log('This calculator demonstrates:');
console.log('• AAP 2022 guideline implementation with reference table lookup');
console.log('• Clinical decision support with Boolean indicators');
console.log('• Follow-up recommendations based on AAP Figure 7');
console.log('• Comprehensive input validation for clinical safety');
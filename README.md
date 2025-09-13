# Hyperbilirubinemia Risk Calculator

Prototype implementation of the AAP 2022 hyperbilirubinemia risk calculator.

## Quick Start

```bash
# Install TypeScript (only build dependency)
npm install

# Run the example
npm start
```

## Usage

```typescript
import { assessHyperbiliRisk } from './core/hyperbili-risk';

const result = assessHyperbiliRisk({
  gestationalAge: 39,      // weeks
  currentAgeHours: 48,     // hours
  currentTSB: 12.5,        // mg/dL
  riskFactors: []          // risk factors
});

console.log(`Phototherapy needed: ${result.clinicalStatus.requiresPhototherapy}`);
console.log(`Clinical action: ${result.clinicalGuidance.immediateAction}`);
```

## File Structure

```
minimal-hyperbili-calculator/
├── core/
│   ├── hyperbili-risk.ts          # Main calculation function
│   └── hyperbili-risk-types.ts    # Type definitions
├── utils/
│   ├── aap-table-loader.ts        # AAP reference table loader
│   └── error-handling.ts          # Error classes
├── constants/
│   └── clinical-thresholds.ts     # Clinical constants
├── data/
│   ├── follow-up-rules.ts         # AAP Figure 7 follow-up logic
│   └── aap-reference-tables/      # AAP 2022 reference data (JSON)
├── example.ts                     # Demonstration
├── package.json                   # Minimal config
└── tsconfig.json                  # TypeScript config
```

## Key Functions

- `assessHyperbiliRisk()` - Complete assessment with clinical decisions
- `calculateBilirubinThresholds()` - Calculate AAP thresholds
- `assessClinicalStatus()` - Determine clinical indicators
- `generateClinicalGuidance()` - Follow-up recommendations

## Dependencies

**Build time only:**
- TypeScript (for compilation)
- tsx (for running examples)

**Runtime:** None

## Clinical Context

This calculator implements the AAP 2022 Clinical Practice Guideline Revision for Management of Hyperbilirubinemia in the Newborn Infant ≥35 Weeks of Gestation, including:

- Phototherapy thresholds (with/without risk factors)
- Exchange transfusion thresholds
- Follow-up recommendations (AAP Figure 7)
- Neurotoxicity risk factor consideration
- Age-specific clinical guidance

## Validation Range

- **Gestational age:** 35-42 weeks
- **Age:** 1-336 hours (14 days)
- **TSB:** 0-30 mg/dL

## Disclaimer

Experimental software intended for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
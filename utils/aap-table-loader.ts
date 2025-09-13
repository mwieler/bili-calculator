/**
 * AAP Reference Table Loader
 *
 * Utilities for loading and accessing AAP 2022 reference tables for
 * hyperbilirubinemia threshold calculations.
 */

import { DataNotAvailableError, InvalidInputError, InternalError } from './error-handling';

// Import table data directly as modules for browser compatibility
import phototherapyNoRiskData from '../data/aap-reference-tables/supplemental-table-1-phototherapy-no-risk.json';
import phototherapyWithRiskData from '../data/aap-reference-tables/supplemental-table-2-phototherapy-with-risk.json';
import exchangeNoRiskData from '../data/aap-reference-tables/supplemental-table-3-exchange-no-risk.json';
import exchangeWithRiskData from '../data/aap-reference-tables/supplemental-table-4-exchange-with-risk.json';

/**
 * Structure of a single gestational age entry in reference tables
 */
export interface GestationalAgeThreshold {
  /** Description of this gestational age group */
  description: string;
  /** Hour at which plateau begins (after this hour, use plateauValue) */
  plateauHour: number;
  /** Constant threshold value used after plateauHour */
  plateauValue: number;
  /** Hourly threshold values from hour 1 to plateauHour */
  values: Record<string, number>;
}

/**
 * Structure of complete AAP reference table
 */
export interface AapReferenceTable {
  /** Table title */
  title: string;
  /** Table description */
  description: string;
  /** Source document reference */
  source: string;
  /** Units for threshold values (mg/dL) */
  units: string;
  /** Thresholds by gestational age */
  thresholds: Record<string, GestationalAgeThreshold>;
}

/**
 * Static reference table mapping
 */
const REFERENCE_TABLES: Record<string, AapReferenceTable> = {
  'supplemental-table-1-phototherapy-no-risk': phototherapyNoRiskData as AapReferenceTable,
  'supplemental-table-2-phototherapy-with-risk': phototherapyWithRiskData as AapReferenceTable,
  'supplemental-table-3-exchange-no-risk': exchangeNoRiskData as AapReferenceTable,
  'supplemental-table-4-exchange-with-risk': exchangeWithRiskData as AapReferenceTable,
};

/**
 * Load a specific AAP reference table
 * @param tableName Name of the table file (without .json extension)
 * @returns Parsed reference table
 */
export function loadReferenceTable(tableName: string): AapReferenceTable {
  const table = REFERENCE_TABLES[tableName];

  if (!table) {
    throw new DataNotAvailableError(
      `Failed to load AAP reference table '${tableName}': Table not found`,
      { tableName },
    );
  }

  try {
    // Validate table structure
    validateTableStructure(table, tableName);

    return table;
  } catch (error) {
    throw new InternalError(
      `Failed to load AAP reference table '${tableName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      { tableName, originalError: error instanceof Error ? error.message : String(error) },
    );
  }
}

/**
 * Validate the structure of a loaded reference table
 * @param table Table to validate
 * @param tableName Name of table for error messages
 */
function validateTableStructure(table: AapReferenceTable, tableName: string): void {
  if (!table.title || !table.description || !table.source || !table.units || !table.thresholds) {
    throw new InvalidInputError(`Invalid table structure in '${tableName}': missing required fields`, {
      tableName,
    });
  }

  if (table.units !== 'mg/dL') {
    throw new InvalidInputError(
      `Invalid units in '${tableName}': expected 'mg/dL', got '${table.units}'`,
      { tableName, units: table.units },
    );
  }

  // Validate each gestational age entry
  for (const [ga, threshold] of Object.entries(table.thresholds)) {
    if (
      !threshold.description ||
      typeof threshold.plateauHour !== 'number' ||
      typeof threshold.plateauValue !== 'number' ||
      !threshold.values
    ) {
      throw new InvalidInputError(`Invalid threshold structure for GA ${ga} in '${tableName}'`, {
        gestationalAge: ga,
        tableName,
      });
    }

    // Validate that values go from 1 to at least plateauHour
    const maxHour = Math.max(...Object.keys(threshold.values).map(Number));
    if (maxHour < threshold.plateauHour) {
      throw new InvalidInputError(
        `Invalid plateau hour for GA ${ga} in '${tableName}': values end at ${maxHour}, but plateau starts at ${threshold.plateauHour}`,
        { gestationalAge: ga, tableName, maxHour, plateauHour: threshold.plateauHour },
      );
    }
  }
}

/**
 * Get threshold value for specific gestational age and hour
 * @param table Reference table to query
 * @param gestationalAge Gestational age in weeks
 * @param ageHours Age in hours (1-336)
 * @returns Threshold value in mg/dL
 */
export function getThresholdValue(
  table: AapReferenceTable,
  gestationalAge: number,
  ageHours: number,
): number {
  // Determine gestational age key based on table groupings
  const gaKey = determineGestationalAgeKey(table, gestationalAge);

  const threshold = table.thresholds[gaKey];
  if (!threshold) {
    throw new DataNotAvailableError(
      `No threshold data found for gestational age ${gestationalAge} (key: ${gaKey})`,
      { gestationalAge, gaKey },
    );
  }

  // Clamp age hours to valid range (AAP tables start at hour 1)
  const clampedHours = Math.max(1, Math.min(336, Math.floor(ageHours)));

  // If beyond plateau hour, use plateau value
  if (clampedHours >= threshold.plateauHour) {
    return threshold.plateauValue;
  }

  // Look up exact hour value
  const hourKey = String(clampedHours);
  const value = threshold.values[hourKey];

  if (value === undefined) {
    throw new DataNotAvailableError(
      `No threshold value found for hour ${clampedHours} in GA ${gaKey}`,
      { hour: clampedHours, gestationalAge: gaKey },
    );
  }

  return value;
}

/**
 * Determine the correct gestational age key for table lookup
 * Different tables have different gestational age groupings
 * @param table Reference table
 * @param gestationalAge Gestational age in weeks
 * @returns String key for table lookup
 */
function determineGestationalAgeKey(table: AapReferenceTable, gestationalAge: number): string {
  const availableKeys = Object.keys(table.thresholds)
    .map(Number)
    .sort((a, b) => a - b);
  const maxKey = Math.max(...availableKeys);

  // For phototherapy without risk factors (includes 40+ grouping)
  if (table.title.includes('Without') && availableKeys.includes(40)) {
    if (gestationalAge >= 40) {
      return '40';
    }
  }

  // For phototherapy with risk factors (38+ grouping)
  if (table.title.includes('With') && table.title.includes('Phototherapy')) {
    if (gestationalAge >= 38) {
      return '38';
    }
  }

  // For exchange transfusion tables (38+ grouping for both)
  if (table.title.includes('Exchange')) {
    if (gestationalAge >= 38) {
      return '38';
    }
  }

  // For exact gestational ages
  const flooredGA = Math.floor(gestationalAge);
  if (availableKeys.includes(flooredGA)) {
    return String(flooredGA);
  }

  // If GA is above max available, use the highest
  if (flooredGA >= maxKey) {
    return String(maxKey);
  }

  // If GA is below min available, use the lowest
  const minKey = Math.min(...availableKeys);
  if (flooredGA <= minKey) {
    return String(minKey);
  }

  throw new InvalidInputError(
    `Unable to determine gestational age key for ${gestationalAge} in table with keys: ${availableKeys.join(', ')}`,
    { gestationalAge, availableKeys },
  );
}

/**
 * Load all four AAP reference tables
 * @returns Object containing all four reference tables
 */
export function loadAllReferenceTables() {
  return {
    phototherapyNoRisk: loadReferenceTable('supplemental-table-1-phototherapy-no-risk'),
    phototherapyWithRisk: loadReferenceTable('supplemental-table-2-phototherapy-with-risk'),
    exchangeNoRisk: loadReferenceTable('supplemental-table-3-exchange-no-risk'),
    exchangeWithRisk: loadReferenceTable('supplemental-table-4-exchange-with-risk'),
  };
}

/**
 * Clear the table cache (useful for testing)
 * Note: Currently using static imports, so this is a no-op
 */
export function clearTableCache(): void {
  // No-op since we're using static imports
}
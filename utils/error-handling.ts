/**
 * Error handling utilities for clinical calculators
 *
 * This module provides standardized error types following idiomatic TypeScript patterns.
 */

/**
 * Base class for all calculator-specific errors
 */
export abstract class BaseCalculatorError extends Error {
  /** Additional contextual data about the error */
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.context = context;
    // Maintains proper stack trace for where error was thrown
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when input validation fails
 */
export class InvalidInputError extends BaseCalculatorError {
  public readonly name = 'InvalidInputError';
}

/**
 * Factory function to create InvalidInputError
 */
export function createInvalidInputError(message: string, context?: Record<string, unknown>): InvalidInputError {
  return new InvalidInputError(message, context);
}

/**
 * Error thrown when required data is not available
 */
export class DataNotAvailableError extends BaseCalculatorError {
  public readonly name = 'DataNotAvailableError';
}

/**
 * Error thrown when calculation logic fails
 */
export class CalculationError extends BaseCalculatorError {
  public readonly name = 'CalculationError';
}

/**
 * Error thrown when FHIR data extraction fails
 */
export class ExtractionError extends BaseCalculatorError {
  public readonly name = 'ExtractionError';
}

/**
 * Error thrown for internal calculator implementation errors
 */
export class InternalError extends BaseCalculatorError {
  public readonly name = 'InternalError';
}

/**
 * Type guard to check if an error is a calculator error
 */
export function isCalculatorError(error: unknown): error is BaseCalculatorError {
  return error instanceof BaseCalculatorError;
}

// Export alias for backwards compatibility
export { BaseCalculatorError as CalculatorError };

/**
 * Helper function to ensure an error is a proper Error instance
 * @param error Original error object
 * @param context Optional additional context
 * @returns A proper Error instance
 */
export function ensureError(error: unknown, context?: Record<string, unknown>): Error {
  if (error instanceof Error) {
    // If it's already a calculator error with context, merge the new context
    if (isCalculatorError(error) && context) {
      return new InternalError(error.message, { ...error.context, ...context });
    }
    return error;
  }

  // Convert non-Error to InternalError
  const message = String(error);
  return new InternalError(message, context);
}
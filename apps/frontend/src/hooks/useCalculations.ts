'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { CalculationConfig, SlabRange } from '@/components/admin/master/CalculationEditor';

// ============================================================================
// Types
// ============================================================================

interface FieldValues {
    [key: string]: any;
}

interface CalculationResult {
    field_code: string;
    value: number | string | null;
    error?: string;
}

interface CalculatedFields {
    [field_code: string]: CalculationConfig;
}

interface UseCalculationsOptions {
    /** Field values from the form */
    fieldValues: FieldValues;
    /** Map of field_code to CalculationConfig from form structure */
    calculatedFields: CalculatedFields;
    /** Callback when a calculated field value changes */
    onValueChange?: (field_code: string, value: any) => void;
    /** API for lookup-based calculations */
    lookupApi?: (tableCode: string, matchColumn: string, matchValue: any, returnColumn: string) => Promise<any>;
}

// ============================================================================
// Built-in Functions
// ============================================================================

const BUILT_IN_FUNCTIONS: { [key: string]: (...args: any[]) => number } = {
    // Rounding
    ROUND: (value: number, decimals: number = 0) => {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    },
    FLOOR: (value: number) => Math.floor(value),
    CEIL: (value: number) => Math.ceil(value),

    // Math
    ABS: (value: number) => Math.abs(value),
    MIN: (...values: number[]) => Math.min(...values),
    MAX: (...values: number[]) => Math.max(...values),

    // Percentage
    PERCENTAGE_OF: (part: number, whole: number) => whole !== 0 ? (part / whole) * 100 : 0,

    // Date functions (return difference in specified unit)
    DATE_DIFF: (date1: string | Date, date2: string | Date, unit: 'days' | 'months' | 'years' = 'days') => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffMs = d2.getTime() - d1.getTime();

        switch (unit) {
            case 'days':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            case 'months':
                return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
            case 'years':
                return d2.getFullYear() - d1.getFullYear();
            default:
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
    },

    // Aggregates (for use with arrays)
    SUM: (...values: number[]) => values.reduce((acc, val) => acc + (val || 0), 0),
    AVG: (...values: number[]) => values.length > 0 ? values.reduce((acc, val) => acc + (val || 0), 0) / values.length : 0,
    COUNT: (...values: any[]) => values.filter(v => v !== null && v !== undefined && v !== '').length,
};

// ============================================================================
// Expression Parser & Evaluator
// ============================================================================

/**
 * Safely evaluate a mathematical expression with field values
 * Replaces field codes with their values and evaluates the expression
 */
function evaluateExpression(expression: string, fieldValues: FieldValues): number {
    if (!expression || expression.trim() === '') {
        return 0;
    }

    try {
        // Replace field codes with their numeric values
        let evalString = expression;

        // Find all potential field codes (uppercase with underscores)
        const fieldCodePattern = /\b[A-Z][A-Z0-9_]*\b/g;
        const matches = expression.match(fieldCodePattern) || [];

        console.log('[Calc Debug] Expression:', expression);
        console.log('[Calc Debug] Field values:', fieldValues);
        console.log('[Calc Debug] Matches:', matches);

        for (const match of matches) {
            // Skip built-in functions
            if (BUILT_IN_FUNCTIONS[match]) continue;

            const value = fieldValues[match];
            const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;

            console.log(`[Calc Debug] ${match} = ${value} -> ${numValue}`);

            // Replace all occurrences of this field code with its value
            evalString = evalString.replace(new RegExp(`\\b${match}\\b`, 'g'), numValue.toString());
        }

        // Replace built-in function calls with their implementations
        // Process function calls like ROUND(value, decimals)
        for (const [funcName, funcImpl] of Object.entries(BUILT_IN_FUNCTIONS)) {
            const funcPattern = new RegExp(`${funcName}\\s*\\(([^)]+)\\)`, 'g');
            evalString = evalString.replace(funcPattern, (match, args) => {
                try {
                    const argValues = args.split(',').map((arg: string) => {
                        const trimmed = arg.trim();
                        // If it's a quoted string, remove quotes
                        if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
                            return trimmed.slice(1, -1);
                        }
                        return parseFloat(trimmed) || 0;
                    });
                    return funcImpl(...argValues).toString();
                } catch {
                    return '0';
                }
            });
        }

        console.log('[Calc Debug] Eval string:', evalString);

        // Validate the expression only contains safe characters
        const safePattern = /^[\d\s+\-*/().]+$/;
        if (!safePattern.test(evalString)) {
            console.warn('[Calc Debug] Unsafe expression:', evalString);
            return 0;
        }

        // Evaluate using Function constructor (safer than eval)
        const result = new Function(`return ${evalString}`)();
        console.log('[Calc Debug] Result:', result);
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.warn('[Calc Debug] Expression evaluation error:', error);
        return 0;
    }
}

// ============================================================================
// Conditional Evaluator
// ============================================================================

/**
 * Evaluate a conditional calculation
 * Format: condition is "FIELD_CODE operator value"
 */
function evaluateConditional(
    config: CalculationConfig['conditional'],
    fieldValues: FieldValues
): number {
    if (!config) return 0;

    const { condition, if_true, if_false } = config;

    try {
        // Parse condition (format: "FIELD_CODE > 1000")
        const parts = condition.split(/\s+/);
        if (parts.length < 3) return 0;

        const [fieldCode, operator, ...valueParts] = parts;
        const compareValue = parseFloat(valueParts.join(' ')) || 0;
        const fieldValue = parseFloat(fieldValues[fieldCode]) || 0;

        let conditionResult = false;
        switch (operator) {
            case '>': conditionResult = fieldValue > compareValue; break;
            case '>=': conditionResult = fieldValue >= compareValue; break;
            case '<': conditionResult = fieldValue < compareValue; break;
            case '<=': conditionResult = fieldValue <= compareValue; break;
            case '==': conditionResult = fieldValue === compareValue; break;
            case '!=': conditionResult = fieldValue !== compareValue; break;
            default: conditionResult = false;
        }

        // Evaluate the appropriate branch
        const expressionToEval = conditionResult ? if_true : if_false;
        return evaluateExpression(expressionToEval, fieldValues);
    } catch (error) {
        console.warn('Conditional evaluation error:', error);
        return 0;
    }
}

// ============================================================================
// Slab Evaluator
// ============================================================================

/**
 * Evaluate slab-based calculation
 * Returns value/percentage based on which range the field value falls into
 */
function evaluateSlab(
    config: CalculationConfig['slabs'],
    fieldValues: FieldValues
): number {
    if (!config || !config.field || !config.ranges || config.ranges.length === 0) {
        return 0;
    }

    const fieldValue = parseFloat(fieldValues[config.field]) || 0;

    // Find matching range
    for (const range of config.ranges) {
        if (fieldValue >= range.min && fieldValue <= range.max) {
            // If percentage is defined, calculate percentage of field value
            if (range.percentage !== undefined) {
                return (fieldValue * range.percentage) / 100;
            }
            // If formula is defined, evaluate it
            if (range.formula) {
                return evaluateExpression(range.formula, fieldValues);
            }
            // Otherwise return fixed value
            return range.value || 0;
        }
    }

    // No matching range found
    return 0;
}

// ============================================================================
// Aggregate Evaluator
// ============================================================================

/**
 * Evaluate aggregate calculation (SUM, AVG, MIN, MAX, COUNT)
 */
function evaluateAggregate(
    config: CalculationConfig['aggregate'],
    fieldValues: FieldValues
): number {
    if (!config || !config.fields || config.fields.length === 0) {
        return 0;
    }

    const values = config.fields.map(fieldCode => {
        const val = fieldValues[fieldCode];
        return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    switch (config.operation) {
        case 'SUM':
            return values.reduce((acc, val) => acc + val, 0);
        case 'AVG':
            return values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0;
        case 'MIN':
            return values.length > 0 ? Math.min(...values) : 0;
        case 'MAX':
            return values.length > 0 ? Math.max(...values) : 0;
        case 'COUNT':
            return values.filter(v => v !== 0).length;
        default:
            return 0;
    }
}

// ============================================================================
// Apply Common Options
// ============================================================================

/**
 * Apply rounding, min, max constraints
 */
function applyCommonOptions(value: number, config: CalculationConfig): number {
    let result = value;

    // Apply rounding
    if (config.round_to !== undefined && config.round_to >= 0) {
        const factor = Math.pow(10, config.round_to);
        result = Math.round(result * factor) / factor;
    }

    // Apply min constraint
    if (config.min_value !== undefined) {
        result = Math.max(result, config.min_value);
    }

    // Apply max constraint
    if (config.max_value !== undefined) {
        result = Math.min(result, config.max_value);
    }

    return result;
}

// ============================================================================
// Main Calculator Function
// ============================================================================

/**
 * Calculate a single field's value based on its calculation config
 */
export function calculateFieldValue(
    config: CalculationConfig,
    fieldValues: FieldValues
): number {
    if (!config.enabled) {
        return 0;
    }

    let result = 0;

    switch (config.formula_type) {
        case 'expression':
            result = evaluateExpression(config.expression || '', fieldValues);
            break;

        case 'conditional':
            result = evaluateConditional(config.conditional, fieldValues);
            break;

        case 'slab':
            result = evaluateSlab(config.slabs, fieldValues);
            break;

        case 'aggregate':
            result = evaluateAggregate(config.aggregate, fieldValues);
            break;

        case 'lookup':
            // Lookup requires async API call, handled separately
            // Return current value or 0
            result = 0;
            break;

        default:
            result = 0;
    }

    // Apply common options (rounding, min, max)
    return applyCommonOptions(result, config);
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook to manage calculated field values
 * Automatically recalculates when dependent fields change
 */
export function useCalculations({
    fieldValues,
    calculatedFields,
    onValueChange,
    lookupApi,
}: UseCalculationsOptions) {
    const previousValuesRef = useRef<FieldValues>({});

    // Calculate all field values
    const calculatedValues = useMemo(() => {
        const results: { [key: string]: number } = {};

        for (const [fieldCode, config] of Object.entries(calculatedFields)) {
            if (config.enabled) {
                results[fieldCode] = calculateFieldValue(config, fieldValues);
            }
        }

        return results;
    }, [fieldValues, calculatedFields]);

    // Detect changes and trigger callbacks
    useEffect(() => {
        if (!onValueChange) return;

        for (const [fieldCode, newValue] of Object.entries(calculatedValues)) {
            const prevValue = previousValuesRef.current[fieldCode];
            if (prevValue !== newValue) {
                onValueChange(fieldCode, newValue);
            }
        }

        previousValuesRef.current = calculatedValues;
    }, [calculatedValues, onValueChange]);

    // Get fields that should trigger recalculation for a specific calculated field
    const getTriggerFields = useCallback((fieldCode: string): string[] => {
        const config = calculatedFields[fieldCode];
        if (!config) return [];

        // If trigger_on is explicitly set, use it
        if (config.trigger_on && config.trigger_on.length > 0) {
            return config.trigger_on;
        }

        // Otherwise, auto-detect from expression/config
        const triggers: string[] = [];

        if (config.formula_type === 'expression' && config.expression) {
            const fieldCodePattern = /\b[A-Z][A-Z0-9_]*\b/g;
            const matches = config.expression.match(fieldCodePattern) || [];
            matches.forEach(m => {
                if (!BUILT_IN_FUNCTIONS[m] && !triggers.includes(m)) {
                    triggers.push(m);
                }
            });
        }

        if (config.formula_type === 'conditional' && config.conditional) {
            const condition = config.conditional.condition;
            const fieldCode = condition.split(/\s+/)[0];
            if (fieldCode && !triggers.includes(fieldCode)) {
                triggers.push(fieldCode);
            }
        }

        if (config.formula_type === 'slab' && config.slabs?.field) {
            triggers.push(config.slabs.field);
        }

        if (config.formula_type === 'aggregate' && config.aggregate?.fields) {
            triggers.push(...config.aggregate.fields);
        }

        return triggers;
    }, [calculatedFields]);

    // Handle lookup calculations (async)
    const performLookup = useCallback(async (
        fieldCode: string,
        config: CalculationConfig
    ): Promise<any> => {
        if (!lookupApi || !config.lookup) {
            return null;
        }

        const { table_code, match_field, match_column, return_column } = config.lookup;
        const matchValue = fieldValues[match_field];

        if (matchValue === undefined || matchValue === null || matchValue === '') {
            return null;
        }

        try {
            return await lookupApi(table_code, match_column, matchValue, return_column);
        } catch (error) {
            console.error('Lookup error:', error);
            return null;
        }
    }, [fieldValues, lookupApi]);

    return {
        calculatedValues,
        getTriggerFields,
        performLookup,
        calculateFieldValue: (fieldCode: string) => {
            const config = calculatedFields[fieldCode];
            return config ? calculateFieldValue(config, fieldValues) : null;
        },
    };
}

// ============================================================================
// Utility Exports
// ============================================================================

export {
    evaluateExpression,
    evaluateConditional,
    evaluateSlab,
    evaluateAggregate,
    applyCommonOptions,
    BUILT_IN_FUNCTIONS,
};

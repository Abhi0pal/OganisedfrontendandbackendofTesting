import type { ServiceFormPlugin } from './_types';
import { parse } from 'date-fns';

/**
 * Service-specific plugin for: 971.0
 *
 * Task 1 — Auto-calculate age fields (date-based, in complete years):
 *   UK-FCL-03087_0 (Mother Age at Delivery)  = yearsBetween(UK-FCL-03234_0 DOB, UK-FCL-00281_0 Delivery Date)
 *   UK-FCL-03084_0 (Mothers Age at Marriage) = yearsBetween(UK-FCL-03234_0 DOB, UK-FCL-03235_0 Marriage Date)
 *
 * Task 2 — "Same as Above" checkbox (UK-FCL-03120_0):
 *   When checked, copy Permanent/Above address fields into Correspondence address fields.
 */

/**
 * Calculate the number of complete years between two date values.
 * Accepts Date objects, ISO strings, or any value parseable by parseDate().
 * Returns null if either date is missing or unparseable.
 */
function yearsBetween(a: any, b: any): number | null {
  const d1 = parseDate(a);
  const d2 = parseDate(b);
  if (!d1 || !d2) return null;
  const [start, end] = d1 <= d2 ? [d1, d2] : [d2, d1];
  let years = end.getFullYear() - start.getFullYear();
  if (
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
  ) {
    years--;
  }
  return years >= 0 ? years : 0;
}

/**
 * Extract the day of the week from a date value (Monday, Tuesday, etc.).
 * Accepts Date objects, ISO strings, or any value parseable by parseDate().
 * Returns null if the date is missing or unparseable.
 */
function getDayFromDate(d: any): string | null {
  const date = parseDate(d);
  if (!date) return null;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Helper to parse dates safely.
 * Handles multiple date formats: ISO (2026-04-12), DD/MM/YYYY, MM/DD/YYYY
 * Returns null if the date is missing or unparseable.
 */
function parseDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  
  const valueStr = String(d).trim();
  
  // Try ISO format first (2026-04-12 or 2026-04-12T...)
  if (valueStr.includes('-') && (valueStr.length === 10 || valueStr.includes('T'))) {
    try {
      const result = new Date(valueStr);
      if (!isNaN(result.getTime())) {
        return result;
      }
    } catch (e) {
      // Fall through to next format
    }
  }
  
  // Try DD/MM/YYYY format (most common in India/UK)
  try {
    const result = parse(valueStr, 'dd/MM/yyyy', new Date());
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Fall through to next format
  }
  
  // Try MM/DD/YYYY format (US format)
  try {
    const result = parse(valueStr, 'MM/dd/yyyy', new Date());
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Fall through to next format
  }
  
  // Fallback: try JavaScript's Date constructor
  try {
    const result = new Date(valueStr);
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Do nothing
  }
  
  return null;
}

const plugin: ServiceFormPlugin = {
  validateField(fieldCode, value, allValues) {
    // Validate: Date of Death (UK-FCL-03033_0) must be >= Date of Birth (UK-FCL-03021_0)
    if (fieldCode === 'UK-FCL-03033_0') {
      if (!value) return null; // Empty is allowed
      const dobDate = parseDate(allValues['UK-FCL-03021_0']);
      const deathDate = parseDate(value);
      
      console.debug('[971_0 validateField] Death Date validation:', {
        fieldCode,
        value,
        dobDate,
        deathDate,
        isValid: !deathDate || !dobDate || deathDate >= dobDate
      });
      
      if (!dobDate || !deathDate) return null; // Can't validate if either is missing/invalid
      if (deathDate < dobDate) {
        console.warn('[971_0 validateField] INVALID: Death date earlier than birth date', {
          deathDate: deathDate.toISOString(),
          dobDate: dobDate.toISOString()
        });
        return 'Date of Death cannot be earlier than Date of Birth.';
      }
    }
    return null;
  },

  /**
   * Fields that are auto-calculated — always readonly.
   */
  isFieldReadonly(fieldCode) {
    const readonlyFields = [
      'UK-FCL-03087_0', // Mother Age at Delivery
      'UK-FCL-03084_0', // Mothers Age at Marriage
      'UK-FCL-03034_0', // Day of Birth (auto-calculated from DOB)
    ];
    if (readonlyFields.includes(fieldCode)) return true;
    return undefined;
  },

  /**
   * Set default values for State and District fields.
   * State defaults to "Maharashtra", District defaults to "Nashik".
   * Returns the label (will be matched against options by the form).
   */
  getFieldDefaultValue(fieldCode, _values) {
    // State fields default to Maharashtra
    const stateFields = [
      'UK-FCL-03243_0', // Deceased's Address at the Time of Death - State
      'UK-FCL-03250_0', // Deceased's Permanent / Current Address - State
    ];
    
    // District fields default to Nashik
    const districtFields = [
      'UK-FCL-03124_0', // Deceased's Address at the Time of Death - District
      'UK-FCL-03251_0', // Deceased's Permanent / Current Address - District
    ];
    
    if (stateFields.includes(fieldCode)) {
      return 'Maharashtra';
    }
    
    if (districtFields.includes(fieldCode)) {
      return 'Nashik';
    }
    
    return undefined;
  },

  onFieldChange(fieldCode, value, allValues) {
    // ── Task: Date of Death validation ─────────────────────────────────────
    // UK-FCL-03021_0 = Date of Birth
    // UK-FCL-03033_0 = Date of Death
    // If Date of Death < Date of Birth, the field is not allowed
    if (fieldCode === 'UK-FCL-03033_0') {
      const dobDate = parseDate(allValues['UK-FCL-03021_0']);
      const deathDate = parseDate(value);
      
      console.debug('[971_0 onFieldChange] UK-FCL-03033_0 (Death Date) changed:', {
        value,
        dobDate,
        deathDate,
      });
      
      // If Death Date is provided and is less than DOB, reject it
      if (value && deathDate && dobDate && deathDate < dobDate) {
        console.warn('[971_0 onFieldChange] Clearing invalid Death Date', {
          deathDate: deathDate.toISOString(),
          dobDate: dobDate.toISOString(),
        });
        // Return cleared field - user cannot set invalid death date
        return {
          'UK-FCL-03033_0': null
        };
      }
      
      // Otherwise, proceed with extracting day of week from death date
      const current: Record<string, any> = { ...allValues, [fieldCode]: value };
      return {
        'UK-FCL-03034_0': getDayFromDate(value),
        'UK-FCL-03087_0': yearsBetween(current['UK-FCL-03234_0'], current['UK-FCL-00281_0']),
      };
    }

    // If Date of Birth changes, verify that existing Death Date is still valid
    if (fieldCode === 'UK-FCL-03021_0') {
      const dobDate = parseDate(value);
      const deathDate = parseDate(allValues['UK-FCL-03033_0']);
      
      console.debug('[971_0 onFieldChange] UK-FCL-03021_0 (Birth Date) changed:', {
        value,
        dobDate,
        deathDate,
      });
      
      // If Death Date exists and becomes earlier than new DOB, clear it
      if (deathDate && dobDate && deathDate < dobDate) {
        console.warn('[971_0 onFieldChange] Clearing Death Date due to new Birth Date', {
          deathDate: deathDate.toISOString(),
          dobDate: dobDate.toISOString(),
        });
        return {
          'UK-FCL-03033_0': null
        };
      }
    }

    // Mother Age at Delivery = years between Mother DOB and Child Delivery Date
    // Triggers on Mother DOB (UK-FCL-03234_0)
    if (fieldCode === 'UK-FCL-03234_0') {
      const current: Record<string, any> = { ...allValues, [fieldCode]: value };
      return {
        'UK-FCL-03087_0': yearsBetween(current['UK-FCL-03234_0'], current['UK-FCL-00281_0']),
      };
    }

    // Mothers Age at Marriage = years between Mothers DOB and Marriage Date
    // UK-FCL-03234_0 (Mothers DOB) is shared — handled in block above for delivery age.
    // UK-FCL-03235_0 = Mothers Date of Marriage
    if (fieldCode === 'UK-FCL-03235_0') {
      const current: Record<string, any> = { ...allValues, [fieldCode]: value };
      return {
        'UK-FCL-03084_0': yearsBetween(current['UK-FCL-03234_0'], current['UK-FCL-03235_0']),
      };
    }

    // ── Task 2: "Same as Above" checkbox ────────────────────────────────────
    // UK-FCL-03120_0 = "Select Same as Above" checkbox
    // When checked  → copy above-address fields into correspondence address fields
    // When unchecked → clear correspondence address fields
    // Auto-deselection: If a user changes any "above" field while checkbox is checked,
    //                   auto-deselect the checkbox
    if (fieldCode === 'UK-FCL-03120_0') {
      const checked = value === true || value === 'Y' || value === 1 || value === '1';

      if (checked) {
        return {
          'UK-FCL-03247_0': allValues['UK-FCL-03121_0'] ?? null,  // Address (Line 1)   ← UK-FCL-03121_0
          'UK-FCL-03248_0': allValues['UK-FCL-03122_0'] ?? null,  // Address (Line 2)   ← UK-FCL-03122_0
          'UK-FCL-03249_0': allValues['UK-FCL-03123_0'] ?? null,  // Any Landmark       ← UK-FCL-03123_0
          'UK-FCL-03250_0': allValues['UK-FCL-03243_0'] ?? null,  // State              ← UK-FCL-03243_0
          'UK-FCL-03251_0': allValues['UK-FCL-03124_0'] ?? null,  // District           ← UK-FCL-03124_0
          'UK-FCL-03252_0': allValues['UK-FCL-03125_0'] ?? null,  // Village / Town Type← UK-FCL-03125_0
          'UK-FCL-03253_0': allValues['UK-FCL-03114_0'] ?? null,  // Zone               ← UK-FCL-03114_0
          'UK-FCL-03254_0': allValues['UK-FCL-03118_0'] ?? null,  // Prabhag            ← UK-FCL-03118_0
          'UK-FCL-03255_0': allValues['UK-FCL-00017_0'] ?? null,  // Pin Code           ← UK-FCL-00017_0
        };
      } else {
        // Unchecked — clear the auto-filled fields
        return {
          'UK-FCL-03247_0': null,
          'UK-FCL-03248_0': null,
          'UK-FCL-03249_0': null,
          'UK-FCL-03250_0': null,
          'UK-FCL-03251_0': null,
          'UK-FCL-03252_0': null,
          'UK-FCL-03253_0': null,
          'UK-FCL-03254_0': null,
          'UK-FCL-03255_0': null,
        };
      }
    }

    // ── Auto-deselection logic ─────────────────────────────────────────────
    // If any address field (above OR below) changes while "Same as Above" is checked,
    // auto-deselect the checkbox so user can review changes
    const aboveAddressFields = [
      'UK-FCL-03121_0',  // Address (Line 1)
      'UK-FCL-03122_0',  // Address (Line 2)
      'UK-FCL-03123_0',  // Any Landmark
      'UK-FCL-03243_0',  // State
      'UK-FCL-03124_0',  // District
      'UK-FCL-03125_0',  // Village / Town Type
      'UK-FCL-03114_0',  // Zone
      'UK-FCL-03118_0',  // Prabhag
      'UK-FCL-00017_0',  // Pin Code
    ];

    const belowAddressFields = [
      'UK-FCL-03247_0',  // Address (Line 1) [Correspondence]
      'UK-FCL-03248_0',  // Address (Line 2) [Correspondence]
      'UK-FCL-03249_0',  // Any Landmark [Correspondence]
      'UK-FCL-03250_0',  // State [Correspondence]
      'UK-FCL-03251_0',  // District [Correspondence]
      'UK-FCL-03252_0',  // Village / Town Type [Correspondence]
      'UK-FCL-03253_0',  // Zone [Correspondence]
      'UK-FCL-03254_0',  // Prabhag [Correspondence]
      'UK-FCL-03255_0',  // Pin Code [Correspondence]
    ];

    if (aboveAddressFields.includes(fieldCode) || belowAddressFields.includes(fieldCode)) {
      // Check if "Same as Above" checkbox is currently checked
      const sameAsAboveChecked = allValues['UK-FCL-03120_0'] === true || 
                                  allValues['UK-FCL-03120_0'] === 'Y' || 
                                  allValues['UK-FCL-03120_0'] === 1 || 
                                  allValues['UK-FCL-03120_0'] === '1';
      
      if (sameAsAboveChecked) {
        // Auto-deselect the checkbox to alert user of change
        return {
          'UK-FCL-03120_0': false,
        };
      }
    }
  },

  async onBeforeSubmit(_values, _addMoreValues, _isLastPage) {
    return null;
  },

  isFieldVisible(_fieldCode, _values) {
    return undefined;
  },
};

export default plugin;

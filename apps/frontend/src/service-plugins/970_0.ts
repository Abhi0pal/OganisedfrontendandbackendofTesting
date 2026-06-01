import type { ServiceFormPlugin } from './_types';
import { parse } from 'date-fns';

/**
 * Service-specific plugin for: 970.0
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
    // Validate: Mother's Date of Marriage (UK-FCL-03015_0) must be >= Mother's DOB (UK-FCL-03234_0)
    if (fieldCode === 'UK-FCL-03015_0') {
      if (!value) return null; // Empty is allowed
      
      const dobDate = parseDate(allValues['UK-FCL-03234_0']);
      const marriageDate = parseDate(value);
      
      if (!dobDate || !marriageDate) return null; // Can't validate if either is missing/invalid
      
      if (marriageDate < dobDate) {
        return "Mother's age at marriage should be greater than DOB";
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
      'UK-FCL-03022_0', // Day of Birth (auto-calculated from DOB)
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
      'UK-FCL-03243_0', // Parents address at the time of Birth - State
      'UK-FCL-03189_0', // Parents Permanent / Current Address - State
      'UK-FCL-03320_0', // Mother's Permanent Residence (Hometown) - State
    ];
    
    // District fields default to Nashik
    const districtFields = [
      'UK-FCL-03124_0', // Parents address at the time of Birth - District
      'UK-FCL-03188_0', // Parents Permanent / Current Address - District
      'UK-FCL-03321_0', // Mother's Permanent Residence (Hometown) - District
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
    // ── Task 0 & 1: Day of Birth auto-fill + Age calculations ──────────────
    // UK-FCL-00281_0 = Date of Birth
    // UK-FCL-03022_0 = Day of Birth (auto-extract from DOB)
    // UK-FCL-03087_0 = Mother Age at Delivery
    if (fieldCode === 'UK-FCL-00281_0') {
      const current: Record<string, any> = { ...allValues, [fieldCode]: value };
      return {
        'UK-FCL-03022_0': getDayFromDate(value),
        'UK-FCL-03087_0': yearsBetween(current['UK-FCL-03234_0'], current['UK-FCL-00281_0']),
      };
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
    // UK-FCL-03015_0 = Mothers Date of Marriage
    if (fieldCode === 'UK-FCL-03015_0') {
      const current: Record<string, any> = { ...allValues, [fieldCode]: value };
      return {
        'UK-FCL-03084_0': yearsBetween(current['UK-FCL-03234_0'], current['UK-FCL-03015_0']),
      };
    }

    // ── Task 2: "Same as Above" checkbox ────────────────────────────────────
    // UK-FCL-03316_0 = "Select Same as Above" checkbox
    // When checked  → copy above-address fields into correspondence address fields
    // When unchecked → clear correspondence address fields
    // Auto-deselection: If a user changes any "above" field while checkbox is checked,
    //                   auto-deselect the checkbox
    if (fieldCode === 'UK-FCL-03316_0') {
      const checked = value === true || value === 'Y' || value === 1 || value === '1';

      if (checked) {
        return {
          'UK-FCL-03178_0': allValues['UK-FCL-03121_0'] ?? null,  // Address (Line 1)   ← UK-FCL-03121_0
          'UK-FCL-03179_0': allValues['UK-FCL-03122_0'] ?? null,  // Address (Line 2)   ← UK-FCL-03122_0
          'UK-FCL-03181_0': allValues['UK-FCL-03123_0'] ?? null,  // Any Landmark       ← UK-FCL-03123_0
          'UK-FCL-03189_0': allValues['UK-FCL-03243_0'] ?? null,  // State              ← UK-FCL-03243_0
          'UK-FCL-03188_0': allValues['UK-FCL-03124_0'] ?? null,  // District           ← UK-FCL-03124_0
          'UK-FCL-03182_0': allValues['UK-FCL-03125_0'] ?? null,  // Village / Town Type← UK-FCL-03125_0
          'UK-FCL-03186_0': allValues['UK-FCL-03114_0'] ?? null,  // Zone               ← UK-FCL-03114_0
          'UK-FCL-03242_0': allValues['UK-FCL-03118_0'] ?? null,  // Prabhag            ← UK-FCL-03118_0
          'UK-FCL-03187_0': allValues['UK-FCL-00017_0'] ?? null,  // Pin Code           ← UK-FCL-00017_0
        };
      } else {
        // Unchecked — clear the auto-filled fields
        return {
          'UK-FCL-03178_0': null,
          'UK-FCL-03179_0': null,
          'UK-FCL-03181_0': null,
          'UK-FCL-03189_0': null,
          'UK-FCL-03188_0': null,
          'UK-FCL-03182_0': null,
          'UK-FCL-03186_0': null,
          'UK-FCL-03242_0': null,
          'UK-FCL-03187_0': null,
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
      'UK-FCL-03178_0',  // Address (Line 1) [Correspondence]
      'UK-FCL-03179_0',  // Address (Line 2) [Correspondence]
      'UK-FCL-03181_0',  // Any Landmark [Correspondence]
      'UK-FCL-03189_0',  // State [Correspondence]
      'UK-FCL-03188_0',  // District [Correspondence]
      'UK-FCL-03182_0',  // Village / Town Type [Correspondence]
      'UK-FCL-03186_0',  // Zone [Correspondence]
      'UK-FCL-03242_0',  // Prabhag [Correspondence]
      'UK-FCL-03187_0',  // Pin Code [Correspondence]
    ];

    if (aboveAddressFields.includes(fieldCode) || belowAddressFields.includes(fieldCode)) {
      // Check if "Same as Above" checkbox is currently checked
      const sameAsAboveChecked = allValues['UK-FCL-03316_0'] === true || 
                                  allValues['UK-FCL-03316_0'] === 'Y' || 
                                  allValues['UK-FCL-03316_0'] === 1 || 
                                  allValues['UK-FCL-03316_0'] === '1';
      
      if (sameAsAboveChecked) {
        // Auto-deselect the checkbox to alert user of change
        return {
          'UK-FCL-03316_0': false,
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

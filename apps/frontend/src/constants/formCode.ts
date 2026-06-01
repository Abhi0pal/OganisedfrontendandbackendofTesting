// apps/frontend/src/constants/formCode.ts

// Single env value for current environment/state
export const STATE_PREFIX =
  (process.env.NEXT_PUBLIC_STATE_PREFIX || 'UK').trim().toUpperCase();

const FORM_CODE_REGEX = /-FRM-(\d{2})_(\d{2})$/;

/**
 * Build a form code for a service with a specific FRM index.
 * Example: UK-SR-193.0-FRM-01_01
 */
export function buildFormCode(serviceId: string, frmIndex: number = 1) {
  const normalizedServiceId = String(serviceId ?? '').trim(); // keeps "193.0"
  const idx = String(frmIndex).padStart(2, '0');
  return `${STATE_PREFIX}-SR-${normalizedServiceId}-FRM-${idx}_01`;
}

/**
 * Build NEXT available form code by scanning existing codes.
 * - Extracts max FRM-XX from existing codes and returns next.
 * - If none exist, returns FRM-01_01
 */
export function buildNextFormCode(serviceId: string, existingFormCodes: string[] = []) {
  const normalizedServiceId = String(serviceId ?? '').trim();

  let maxFrm = 0;
  for (const code of existingFormCodes) {
    if (!code) continue;

    // Ensure same service id is part of string to avoid collisions
    if (!code.includes(`-SR-${normalizedServiceId}-FRM-`)) continue;

    const match = code.match(FORM_CODE_REGEX);
    if (!match) continue;

    const frm = parseInt(match[1], 10);
    if (!Number.isNaN(frm)) maxFrm = Math.max(maxFrm, frm);
  }

  return buildFormCode(serviceId, maxFrm + 1);
}
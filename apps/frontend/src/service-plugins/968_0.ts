import type { ServiceFormPlugin } from './_types';
import { useAuthStore } from '@/store/authStore';
/* =========================
   PLACE YOUR FIELD CODES HERE
========================= */

// Groom
const GROOM_MARITAL_STATUS = 'UK-FCL-03039_0'; // select: Unmarried / Divorced / Widower
const GROOM_COURT_DECREE = 'UK-FCL-04017_0';
const GROOM_DEATH_CERTIFICATE = 'UK-FCL-03245_0';
const GROOM_RELIGION = 'UK-FCL-03027_0';

// Bride
const BRIDE_MARITAL_STATUS = 'UK-FCL-04018_0'; // select: Unmarried / Divorced / Widower
const BRIDE_COURT_DECREE = 'UK-FCL-03278_0';
const BRIDE_DEATH_CERTIFICATE = 'UK-FCL-03338_0';
const BRIDE_RELIGION = 'UK-FCL-03270_0';

// Nikahnama
const SOLEMNIZER_RELIGION = 'UK-FCL-03045_0'; // select
const NIKAHNAMA_UPLOAD = 'UK-FCL-04019_0';
const NIKAHNAMA_TRANSLATION = 'UK-FCL-04020_0';

// Religion conversion
const CONVERSION_CERTIFICATE = 'UK-FCL-04022_0';
const ADDITIONAL_DOCUMENTS_CATEGORY = 'UK-CAT-525_0';

/* =========================
   MARRIAGE INVITATION
========================= */
const MARRIAGE_INVITATION_FIELD = 'UK-FCL-03018_0'; // Yes/No field
const UPLOAD_INVITATION_CARD_FIELD = 'UK-FCL-03019_0'; // add field code later (Upload field)
const UPLOAD_GENERAL_STAMP_PAPER_FIELD = 'UK-FCL-04077_0'; // add field code later (Upload field)
const DEFAULT_INVITATION_YES_VALUE = '3048';
const APPLICANT_NAME_FIELD = 'UK-FCL-04059_0';
/**
 * Normalize select / multiselect value
 */
function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';

  let v: unknown = value;
  if (Array.isArray(v)) {
    v = v.length > 0 ? v[0] : '';
  }

  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    v = obj.value ?? obj.code ?? obj.id ?? obj.label ?? obj.name ?? '';
  }

  return String(v).trim().toLowerCase();
}

function isOneOf(value: unknown, candidates: string[]): boolean {
  const token = normalize(value);
  return candidates.some((c) => token === String(c).trim().toLowerCase());
}

function normalizeMaritalStatus(value: unknown): 'unmarried' | 'divorced' | 'widowed' | '' {
  const token = normalize(value).replace(/\s+/g, ' ');
  if (!token) return '';

  if (
    token.includes('unmarried') ||
    token.includes('never married') ||
    ['1', '21', '412872'].includes(token)
  ) {
    return 'unmarried';
  }

  if (
    token.includes('divorc') ||
    ['2', '31', '412873'].includes(token)
  ) {
    return 'divorced';
  }

  if (
    token.includes('widow') ||
    token.includes('widower') ||
    token.includes('widow(er)') ||
    token.includes('wndower') ||
    ['3', '41', '412874'].includes(token)
  ) {
    return 'widowed';
  }

  return '';
}

function isDivorcedStatus(value: unknown): boolean {
  return normalizeMaritalStatus(value) === 'divorced';
}

function isWidowedStatus(value: unknown): boolean {
  return normalizeMaritalStatus(value) === 'widowed';
}

function isMuslim(value: unknown): boolean {
  const tokens = getReligionTokens(value);
  return tokens.includes('religion:muslim') || tokens.includes('religion:index:2');
}

function shouldShowNikahnama(values: Record<string, any>): boolean {
  const solemnizerReligion = values[SOLEMNIZER_RELIGION];
  const groomReligion = values[GROOM_RELIGION];
  const brideReligion = values[BRIDE_RELIGION];

  if (isMuslim(solemnizerReligion)) return true;
  if (isMuslim(groomReligion) && isMuslim(brideReligion)) return true;
  return false;
}

function shouldShowConversionCertificate(values: Record<string, any>): boolean {
  const groomReligion = values[GROOM_RELIGION];
  const brideReligion = values[BRIDE_RELIGION];
  if (!groomReligion || !brideReligion) return false;
  return !areReligionsEquivalent(groomReligion, brideReligion);
}

function shouldShowAdditionalDocumentsCategory(values: Record<string, any>): boolean {
  return shouldShowNikahnama(values) || shouldShowConversionCertificate(values);
}

function normalizeReligionAlias(token: string): string {
  const t = String(token || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return '';

  // Canonical religion aliases (label-based + common coded values).
  if (t.includes('muslim') || t.includes('islam') || ['2', '13', '412876'].includes(t)) return 'religion:muslim';
  if (t.includes('hindu')) return 'religion:hindu';
  if (t.includes('christ')) return 'religion:christian';
  if (t.includes('sikh')) return 'religion:sikh';
  if (t.includes('jain')) return 'religion:jain';
  if (t.includes('buddh')) return 'religion:buddhist';
  if (t.includes('parsi') || t.includes('zoro')) return 'religion:parsi';
  if (t.includes('jew')) return 'religion:jewish';

  return t;
}

function getReligionIndexAliases(token: string): string[] {
  const t = String(token || '').trim().toLowerCase();
  if (!/^\d+$/.test(t)) return [];

  const n = Number(t);
  if (!Number.isInteger(n) || n <= 0) return [];

  const aliases = new Set<string>();

  // Common code families observed in this service:
  // family A: 1..20, family B: 12..31, family C: 412875..412930
  // Example Muslim mapping: 2 <-> 13 <-> 412876 (all map to index 2).
  if (n >= 1 && n <= 20) aliases.add(`religion:index:${n}`);
  if (n >= 12 && n <= 31) aliases.add(`religion:index:${n - 11}`);
  if (n >= 412875 && n <= 412930) aliases.add(`religion:index:${n - 412874}`);

  return Array.from(aliases);
}

function getReligionTokens(value: unknown): string[] {
  const out = new Set<string>();

  const push = (raw: unknown) => {
    if (raw === null || raw === undefined) return;
    const token = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!token) return;
    out.add(token);
    out.add(normalizeReligionAlias(token));
    getReligionIndexAliases(token).forEach((alias) => out.add(alias));
  };

  const visit = (input: unknown) => {
    if (input === null || input === undefined) return;

    if (Array.isArray(input)) {
      if (input.length > 0) visit(input[0]);
      return;
    }

    if (typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      push(obj.value);
      push(obj.code);
      push(obj.id);
      push(obj.label);
      push(obj.name);
      return;
    }

    push(input);
  };

  visit(value);
  return Array.from(out).filter(Boolean);
}

function hasAnyCommonToken(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const setA = new Set(a);
  return b.some((token) => setA.has(token));
}

function areReligionsEquivalent(left: unknown, right: unknown): boolean {
  const leftTokens = getReligionTokens(left);
  const rightTokens = getReligionTokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  return hasAnyCommonToken(leftTokens, rightTokens);
}

function getAllowedSolemnizerReligionTokens(values: Record<string, any>): string[] {
  const groomReligion = normalize(values?.[GROOM_RELIGION]);
  const brideReligion = normalize(values?.[BRIDE_RELIGION]);

  if (!groomReligion || !brideReligion) return [];
  if (groomReligion === brideReligion) return [groomReligion];

  return Array.from(new Set([groomReligion, brideReligion]));
}

function validateSolemnizerReligionSelection(
  solemnizerReligion: unknown,
  values: Record<string, any>,
): string | undefined {
  const solemnizerTokens = getReligionTokens(solemnizerReligion);
  if (solemnizerTokens.length === 0) return undefined;

  const groomTokens = getReligionTokens(values?.[GROOM_RELIGION]);
  const brideTokens = getReligionTokens(values?.[BRIDE_RELIGION]);
  if (groomTokens.length === 0 || brideTokens.length === 0) return undefined;

  const isSameReligion = hasAnyCommonToken(groomTokens, brideTokens);

  if (isSameReligion) {
    const valid = hasAnyCommonToken(solemnizerTokens, groomTokens) || hasAnyCommonToken(solemnizerTokens, brideTokens);
    if (valid) return undefined;
    return 'Solemnizer religion must be the same as Bride and Groom religion';
  }

  if (hasAnyCommonToken(solemnizerTokens, groomTokens) || hasAnyCommonToken(solemnizerTokens, brideTokens)) {
    return undefined;
  }

  return "Solemnizer religion must match either bride's or groom's religion";
}

type InvitationAnswer = 'yes' | 'no' | 'unknown';

function getInvitationTokens(value: unknown): string[] {
  const tokens: string[] = [];

  const pushToken = (raw: unknown) => {
    if (raw === null || raw === undefined) return;
    const token = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
    if (token) tokens.push(token);
  };

  const visit = (input: unknown) => {
    if (input === null || input === undefined) return;

    if (Array.isArray(input)) {
      if (input.length > 0) visit(input[0]);
      return;
    }

    if (typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      // Include both coded values and readable labels for robust matching.
      pushToken(obj.value);
      pushToken(obj.code);
      pushToken(obj.id);
      pushToken(obj.label);
      pushToken(obj.name);
      return;
    }

    pushToken(input);
  };

  visit(value);
  return Array.from(new Set(tokens));
}

function getInvitationAnswer(value: unknown): InvitationAnswer {
  const tokens = getInvitationTokens(value);
  if (tokens.length === 0) return 'unknown';

  // Master-data ids from the live 968.0 form config:
  // 3048 = Yes, I Have Invitation Card
  // 3049 = No, I Do Not Have Invitation Card
  if (tokens.includes('3048')) return 'yes';
  if (tokens.includes('3049')) return 'no';

  // Common generic master values.
  if (tokens.includes('1')) return 'yes';
  if (tokens.includes('2')) return 'no';

  const hasNoToken = tokens.some((token) =>
    token === 'no' ||
    token === 'n' ||
    token === '0' ||
    token === 'false' ||
    token === 'off' ||
    token.startsWith('no') ||
    token.includes('not available') ||
    token.includes("don't have") ||
    token.includes('do not have') ||
    token.includes('dont have')
  );
  if (hasNoToken) {
    return 'no';
  }

  const hasYesToken = tokens.some((token) =>
    ['yes', 'y', '1', 'true', 'on'].includes(token) ||
    token.startsWith('yes') ||
    ['available', 'invitation card available'].includes(token)
  );
  if (hasYesToken) {
    return 'yes';
  }

  return 'unknown';
}

function isInvitationYes(value: unknown): boolean {
  return getInvitationAnswer(value) === 'yes';
}

function isInvitationNo(value: unknown): boolean {
  return getInvitationAnswer(value) === 'no';
}

function shouldShowInvitationUpload(values: Record<string, any>): boolean {
  if (!MARRIAGE_INVITATION_FIELD) return false;
  return getInvitationAnswer(values[MARRIAGE_INVITATION_FIELD]) === 'yes';
}

function shouldShowStampPaperUpload(values: Record<string, any>): boolean {
  if (!MARRIAGE_INVITATION_FIELD) return false;
  return getInvitationAnswer(values[MARRIAGE_INVITATION_FIELD]) === 'no';
}

function hasText(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

function shouldDefaultInvitationToYes(values: Record<string, any> | undefined): boolean {
  const invitationAnswer = getInvitationAnswer(values?.[MARRIAGE_INVITATION_FIELD]);
  if (invitationAnswer !== 'unknown') return false;

  const hasInvitationUpload = hasText(values?.[UPLOAD_INVITATION_CARD_FIELD]);
  const hasStampPaperUpload = hasText(values?.[UPLOAD_GENERAL_STAMP_PAPER_FIELD]);
  return !hasInvitationUpload && !hasStampPaperUpload;
}

function getLoggedInApplicantName(): string {
  if (typeof window === 'undefined') return '';

  const user = useAuthStore.getState().user;
  if (!user) return '';

  const firstName = String(user.firstName || '').trim();
  const lastName = String(user.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (fullName) return fullName;
  if (firstName) return firstName;
  return String(user.email || '').trim();
}


const plugin: ServiceFormPlugin = {
  isFieldVisible(fieldCode, values) {
    const groomStatus = values[GROOM_MARITAL_STATUS];
    const brideStatus = values[BRIDE_MARITAL_STATUS];
    const groomReligion = values[GROOM_RELIGION];
    const brideReligion = values[BRIDE_RELIGION];

    /* =========================
       Groom marital status logic
    ========================= */

    if (fieldCode === GROOM_COURT_DECREE) {
      return isDivorcedStatus(groomStatus);
    }

    if (fieldCode === GROOM_DEATH_CERTIFICATE) {
      return isWidowedStatus(groomStatus);
    }

    /* =========================
       Bride marital status logic
    ========================= */

    if (fieldCode === BRIDE_COURT_DECREE) {
      return isDivorcedStatus(brideStatus);
    }

    if (fieldCode === BRIDE_DEATH_CERTIFICATE) {
      return isWidowedStatus(brideStatus);
    }

    /* =========================
       Nikahnama logic
    ========================= */

    if (fieldCode === NIKAHNAMA_UPLOAD) {
      return shouldShowNikahnama(values);
    }

    if (fieldCode === NIKAHNAMA_TRANSLATION) {
      return shouldShowNikahnama(values) && Boolean(values[NIKAHNAMA_UPLOAD]);
    }

    /* =========================
       Religion conversion logic
    ========================= */

    if (fieldCode === CONVERSION_CERTIFICATE) {
      if (!groomReligion || !brideReligion) return false;
      return !areReligionsEquivalent(groomReligion, brideReligion);
    }

    if (fieldCode === ADDITIONAL_DOCUMENTS_CATEGORY) {
      return shouldShowAdditionalDocumentsCategory(values);
    }

    /* =========================
       Marriage invitation logic
    ========================= */
    if (
      MARRIAGE_INVITATION_FIELD &&
      UPLOAD_INVITATION_CARD_FIELD &&
      fieldCode === UPLOAD_INVITATION_CARD_FIELD
    ) {
      return shouldShowInvitationUpload(values);
    }

    if (
      MARRIAGE_INVITATION_FIELD &&
      UPLOAD_GENERAL_STAMP_PAPER_FIELD &&
      fieldCode === UPLOAD_GENERAL_STAMP_PAPER_FIELD
    ) {
      return shouldShowStampPaperUpload(values);
    }


    /* =========================
       Default
    ========================= */

    return true;
  },

  onFieldChange(fieldCode, value, allValues) {
    const updates: Record<string, any> = {};
    const nextValues = { ...(allValues || {}), [fieldCode]: value };
    const loginApplicantName = getLoggedInApplicantName();
    const applicantNameInForm = nextValues[APPLICANT_NAME_FIELD];

    if (fieldCode === '__INIT__') {
      if (shouldDefaultInvitationToYes(allValues)) {
        updates[MARRIAGE_INVITATION_FIELD] = DEFAULT_INVITATION_YES_VALUE;
      }
      if (loginApplicantName && !hasText(allValues?.[APPLICANT_NAME_FIELD])) {
        updates[APPLICANT_NAME_FIELD] = loginApplicantName;
      }
      return Object.keys(updates).length ? updates : undefined;
    }

    if (
      fieldCode !== APPLICANT_NAME_FIELD &&
      loginApplicantName &&
      !hasText(applicantNameInForm)
    ) {
      updates[APPLICANT_NAME_FIELD] = loginApplicantName;
    }

    // Keep only the relevant upload field based on invitation answer.
    if (
      MARRIAGE_INVITATION_FIELD &&
      UPLOAD_INVITATION_CARD_FIELD &&
      UPLOAD_GENERAL_STAMP_PAPER_FIELD &&
      fieldCode === MARRIAGE_INVITATION_FIELD
    ) {
      const invitationAnswer = getInvitationAnswer(value);
      if (invitationAnswer === 'yes') updates[UPLOAD_GENERAL_STAMP_PAPER_FIELD] = null;
      if (invitationAnswer === 'no') updates[UPLOAD_INVITATION_CARD_FIELD] = null;
      if (invitationAnswer === 'unknown') {
        updates[UPLOAD_INVITATION_CARD_FIELD] = null;
        updates[UPLOAD_GENERAL_STAMP_PAPER_FIELD] = null;
      }
    }

    const groomStatus = fieldCode === GROOM_MARITAL_STATUS ? value : undefined;
    const brideStatus = fieldCode === BRIDE_MARITAL_STATUS ? value : undefined;

    if (fieldCode === GROOM_MARITAL_STATUS) {
      if (!isDivorcedStatus(groomStatus)) updates[GROOM_COURT_DECREE] = null;
      if (!isWidowedStatus(groomStatus)) updates[GROOM_DEATH_CERTIFICATE] = null;
      return updates;
    }

    if (fieldCode === BRIDE_MARITAL_STATUS) {
      if (!isDivorcedStatus(brideStatus)) updates[BRIDE_COURT_DECREE] = null;
      if (!isWidowedStatus(brideStatus)) updates[BRIDE_DEATH_CERTIFICATE] = null;
      return updates;
    }

    if (
      [SOLEMNIZER_RELIGION, GROOM_RELIGION, BRIDE_RELIGION].includes(fieldCode) &&
      !shouldShowNikahnama(nextValues)
    ) {
      return {
        [NIKAHNAMA_UPLOAD]: null,
        [NIKAHNAMA_TRANSLATION]: null,
      };
    }

    if (fieldCode === NIKAHNAMA_UPLOAD && !value) {
      return {
        [NIKAHNAMA_TRANSLATION]: null,
      };
    }

    return Object.keys(updates).length ? updates : undefined;
  },

  validateField(fieldCode, value, allValues) {
    const groomStatus = allValues?.[GROOM_MARITAL_STATUS];
    const brideStatus = allValues?.[BRIDE_MARITAL_STATUS];
    const invitationStatus = allValues?.[MARRIAGE_INVITATION_FIELD];

    if (fieldCode === GROOM_COURT_DECREE && isDivorcedStatus(groomStatus) && !value) {
      return 'Upload Court Decree is required';
    }

    if (fieldCode === GROOM_DEATH_CERTIFICATE && isWidowedStatus(groomStatus) && !value) {
      return 'Upload Death Certificate is required';
    }

    if (fieldCode === BRIDE_COURT_DECREE && isDivorcedStatus(brideStatus) && !value) {
      return 'Upload Court Decree is required';
    }

    if (fieldCode === BRIDE_DEATH_CERTIFICATE && isWidowedStatus(brideStatus) && !value) {
      return 'Upload Death Certificate is required';
    }

    if (fieldCode === UPLOAD_INVITATION_CARD_FIELD && isInvitationYes(invitationStatus) && !value) {
      return 'Upload Marriage Invitation Card is required';
    }

    if (
      fieldCode === UPLOAD_GENERAL_STAMP_PAPER_FIELD && isInvitationNo(invitationStatus) && !value) {
      return 'Upload General Stamp Paper is required';
    }

    if (fieldCode === SOLEMNIZER_RELIGION) {
      return validateSolemnizerReligionSelection(value, allValues || {});
    }

    return undefined;
  },

  isFieldRequired(fieldCode, values) {
    if (fieldCode === UPLOAD_INVITATION_CARD_FIELD) {
      return shouldShowInvitationUpload(values);
    }
    if (fieldCode === UPLOAD_GENERAL_STAMP_PAPER_FIELD) {
      return shouldShowStampPaperUpload(values);
    }

    return undefined;
  },
};

export default plugin;

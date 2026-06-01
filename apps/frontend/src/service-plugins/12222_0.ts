import type { ServiceFormPlugin } from './_types';

const FIELD = {
  contentType: 'UK-FCL-03329_0',
  contentTypeAlt: 'UK-FCL-03024_0',
  validityFrom: 'UK-FCL-03334_0',
  validityTill: 'UK-FCL-03335_0',
  knowledgeUrl: 'UK-FCL-03337_0',
};

const KNOWLEDGE_URL_TOKENS = new Set([
  'knowledgeurl',
  'knowledge',
  '412905', // <--- FIX: Added the ID found in your logs
]);

function isEmpty(v: any): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

function normalizeDateOnly(input: any): Date | null {
  if (isEmpty(input)) return null;
  const d = input instanceof Date ? new Date(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}


function normalizeToken(v: any): string {
  return String(v ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function flattenTokens(input: any, out: string[] = []): string[] {
  if (input === null || input === undefined) return out;
  if (Array.isArray(input)) {
    input.forEach((x) => flattenTokens(x, out));
    return out;
  }
  if (typeof input === 'object') {
    const obj = input as Record<string, any>;
    [obj.value, obj.label, obj.name, obj.code, obj.text, obj.title, obj.id].forEach((x) => {
      if (x !== undefined) flattenTokens(x, out);
    });
    return out;
  }
  const t = normalizeToken(input);
  if (t) out.push(t);
  return out;
}

function needsKnowledgeUrl(contentTypeValue: any): boolean {
  const candidates = flattenTokens(contentTypeValue);
  console.log('🔍 [ServicePlugin] Content Type Candidates:', candidates);
  return candidates.some((t) => KNOWLEDGE_URL_TOKENS.has(t));
}

const plugin: ServiceFormPlugin = {
  validateField(fieldCode, value, allValues) {
    if (fieldCode === FIELD.validityFrom && !isEmpty(value)) {
      const from = normalizeDateOnly(value);
      const today = normalizeDateOnly(new Date());

      if (from && today && from < today) {
        return 'Validity From Date cannot be in the past.';
      }

      const till = normalizeDateOnly(allValues?.[FIELD.validityTill]);
      if (from && till && till < from) {
        return 'Validity Till Date must be greater than or equal to Validity From Date.';
      }
    }

    if (fieldCode === FIELD.validityTill && !isEmpty(value)) {
      const till = normalizeDateOnly(value);
      const from = normalizeDateOnly(allValues?.[FIELD.validityFrom]);

      if (from && till && till < from) {
        return 'Validity Till Date must be greater than or equal to Validity From Date.';
      }
    }

    // Check if we are currently on the dropdown OR the URL field
    const isContentType = fieldCode === FIELD.contentType || fieldCode === FIELD.contentTypeAlt;
    const isKnowledgeUrl = fieldCode === FIELD.knowledgeUrl;

    if (isContentType || isKnowledgeUrl) {
      const contentType = isContentType ? value : (allValues[FIELD.contentType] ?? allValues[FIELD.contentTypeAlt]);
      const urlValue = isKnowledgeUrl ? value : allValues[FIELD.knowledgeUrl];

      if (needsKnowledgeUrl(contentType) && isEmpty(urlValue)) {
        return 'Knowledge URL is mandatory for Content Type: Knowledge Url.';
      }
    }
    return null;
  },

  onFieldChange(fieldCode, value, allValues) {
    if (fieldCode === FIELD.contentType || fieldCode === FIELD.contentTypeAlt) {
      console.log('🎯 [ServicePlugin] Content Type Changed:', { fieldCode, value });
      debugger;
      const isKnowledge = needsKnowledgeUrl(value);
      // If it's NOT a knowledge URL, clear the field.
      // If it IS a knowledge URL, we keep existing value but validation will now trigger.
      if (!isKnowledge) {
        return { [FIELD.knowledgeUrl]: null };
      }
    }
    return {};
  },

  async onBeforeSubmit(values) {
    const from = normalizeDateOnly(values?.[FIELD.validityFrom]);
    const till = normalizeDateOnly(values?.[FIELD.validityTill]);
    const today = normalizeDateOnly(new Date());

    if (from && today && from < today) {
      return 'Validity From Date cannot be in the past.';
    }

    if (from && till && till < from) {
      return 'Validity Till Date must be greater than or equal to Validity From Date.';
    }
    const contentType = values[FIELD.contentType] ?? values[FIELD.contentTypeAlt];
    const url = values[FIELD.knowledgeUrl];

    if (needsKnowledgeUrl(contentType) && isEmpty(url)) {
      return 'Knowledge URL is mandatory for Content Type: Knowledge Url.';
    }
    return null;
  },
};

export default plugin;
export type StoredDocumentEntry = {
  label: string;
  fileName: string;
  filePath: string;
  version: string;
  sourcePath?: string;
};

export const formatDocumentLabel = (key: string) => {
  if (!key) return 'Document';
  const segments = key
    .split(/[._]/)
    .map((segment) => segment.replace(/([A-Z])/g, ' $1'))
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (match) => match.toUpperCase()),
    );
  return segments.join(' · ') || 'Document';
};

export const extractDocumentVersionFromName = (fileName: string) => {
  if (!fileName) return '—';
  const match = fileName.match(/[VD]\d+(\.\d+)?/i);
  return match ? match[0].toUpperCase() : '—';
};

export const buildDocumentUrl = (filePath: string, baseApiUrl: string) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const normalized = baseApiUrl.replace(/\/$/, '');
  if (!normalized) return filePath.startsWith('/') ? filePath : `/${filePath}`;
  return filePath.startsWith('/')
    ? `${normalized}${filePath}`
    : `${normalized}/${filePath}`;
};

export const resolveStoredDocuments = (
  documents?: Record<string, string>,
): StoredDocumentEntry[] => {
  const docs = documents || {};
  return Object.entries(docs).reduce<StoredDocumentEntry[]>(
    (entries, [key, value]) => {
      const filePath = String(value || '').trim();
      if (!filePath) return entries;
      const fileName = filePath.split('/').pop() || 'Document';
      entries.push({
        label: formatDocumentLabel(key),
        fileName,
        filePath,
        version: extractDocumentVersionFromName(fileName),
        sourcePath: key,
      });
      return entries;
    },
    [],
  );
};

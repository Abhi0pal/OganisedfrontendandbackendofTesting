export const toPublicUrl = (documentPath: string) => {
  const base = process.env.PUBLIC_FILES_BASE_URL || 'http://localhost:3001';
  const cleaned = documentPath.replace(/^\/+/, ''); // remove leading slash
  return `${base}/files/${cleaned}`;
};

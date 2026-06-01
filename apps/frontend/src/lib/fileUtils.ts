export const resolveFileUrl = (path?: string | null) => {
  if (!path) return '#';

  const backendBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  return `${backendBaseUrl}${path}`;
};

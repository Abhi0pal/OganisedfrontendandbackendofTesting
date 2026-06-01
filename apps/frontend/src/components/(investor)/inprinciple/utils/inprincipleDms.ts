// Normalizes backend DMS payload to a consistent, frontend-friendly shape.
export const normalizeDmsTypes = (rawDms: any) => {
  const rawPayload = rawDms?.dms ?? rawDms ?? {};
  const payload =
    typeof rawPayload === 'string'
      ? (() => {
          try {
            return JSON.parse(rawPayload);
          } catch {
            return {};
          }
        })()
      : rawPayload;

  const types = Array.isArray(payload?.documentTypes) ? payload.documentTypes : [];
  return types.map((type: any) => ({
    id: Number(type.id),
    name: type.name || '',
    isRequired:
      !!type.isRequired ||
      (Array.isArray(type.checklists) && type.checklists.some((item: any) => !!item.isRequired)),
    checklists: Array.isArray(type.checklists)
      ? type.checklists.map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
          isRequired: !!item.isRequired,
        }))
      : [],
  }));
};

// apps/backend/prisma/seeds/utils/service-id.util.ts
export function normalizeServiceId(raw: any): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const parts = s.split('.');
  const intPart = String(parseInt(parts[0] || '0', 10));       // "001" -> "1"
  if (parts.length === 1) return `${intPart}.0`;               // "15"  -> "15.0"
  const decPart = String(parseInt(parts[1] || '0', 10));       // "06"  -> "6"
  return `${intPart}.${decPart}`;                              // "004.06" -> "4.6"
}

export const normalizeYesNo = (input: any) => {
  const text = String(input ?? '').trim().toLowerCase();
  if (text === 'yes' || text === 'y' || text === 'true' || text === '1') return 'yes';
  if (text === 'no' || text === 'n' || text === 'false' || text === '0') return 'no';
  return input;
};

export const toNumber = (value: any) => {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

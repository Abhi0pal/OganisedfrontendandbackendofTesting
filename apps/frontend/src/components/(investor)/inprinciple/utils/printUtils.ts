export const valueOrNA = (value: any) => {
  if (value === undefined || value === null || value === '') return 'N/A';
  return String(value);
};

export const getPathValue = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
};

export const formatAddress = (parts: Array<any>) => {
  return parts.filter((item) => item !== undefined && item !== null && item !== '').join(', ');
};

export const formatDateTime = (value: any) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return valueOrNA(value);
  return date.toLocaleString();
};

export const formatYesNo = (value: any) => {
  if (value === undefined || value === null || value === '') return 'N/A';
  const normalized = String(value).toLowerCase();
  if (normalized === 'yes' || normalized === 'y' || normalized === 'true' || normalized === '1') {
    return 'Yes';
  }
  if (normalized === 'no' || normalized === 'n' || normalized === 'false' || normalized === '0') {
    return 'No';
  }
  return String(value);
};

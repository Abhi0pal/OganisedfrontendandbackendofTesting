import { existsSync, readFileSync } from 'fs';

const LEGACY_USERS_CSV_PATH = 'C:/wamp64/www/nextjs/users.csv';
const LEGACY_DEPARTMENT_USERS_CSV_PATH =
  'C:/wamp64/www/nextjs/department_users.csv';
const LEGACY_SQL_USERS_CSV_PATH = 'C:/wamp64/www/nextjs/sql (4).csv';

export type LegacyUsersCsvRow = {
  id?: string;
  email?: string;
  password_hash?: string;
  user_type?: string;
  role_id?: string;
};

export type LegacyDepartmentUsersCsvRow = {
  id?: string;
  user_id?: string;
  full_name?: string;
  email?: string;
  dept_id?: string;
  district_id?: string;
  status?: string;
};

export type LegacySqlDepartmentUserRow = {
  uid?: string;
  department_name?: string;
  distric_name?: string;
  district_name?: string;
  full_name?: string;
  mobile?: string;
  login?: string;
  email?: string;
  role_id?: string;
  user_role?: string;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i += 1;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      i += 1;
      continue;
    }
    current += char;
    i += 1;
  }
  values.push(current);
  return values;
}

function parseCsvContent(content: string): Array<Record<string, string>> {
  const sanitized = content.replace(/^\uFEFF/, '');
  const lines = sanitized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) =>
    String(h || '')
      .trim()
      .replace(/^"|"$/g, ''),
  );

  const rows: Array<Record<string, string>> = [];
  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]).map((value) =>
      String(value || '')
        .trim()
        .replace(/^"|"$/g, ''),
    );
    const row: Record<string, string> = {};
    for (let col = 0; col < headers.length; col += 1) {
      row[headers[col]] = values[col] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function readCsvRows(path: string): Array<Record<string, string>> {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf-8');
  if (!raw.trim()) return [];
  return parseCsvContent(raw);
}

export function loadLegacyUsersCsvRows(): LegacyUsersCsvRow[] {
  return readCsvRows(LEGACY_USERS_CSV_PATH) as LegacyUsersCsvRow[];
}

export function loadLegacyDepartmentUsersCsvRows(): LegacyDepartmentUsersCsvRow[] {
  return readCsvRows(
    LEGACY_DEPARTMENT_USERS_CSV_PATH,
  ) as LegacyDepartmentUsersCsvRow[];
}

export function loadLegacySqlDepartmentUserRows(): LegacySqlDepartmentUserRow[] {
  return readCsvRows(LEGACY_SQL_USERS_CSV_PATH) as LegacySqlDepartmentUserRow[];
}


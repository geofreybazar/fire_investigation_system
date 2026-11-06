// CSV for spreadsheet programs. Values that start like a formula are
// prefixed with a quote so Excel shows them as text (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let text = value instanceof Date ? value.toISOString() : String(value);

  if (typeof value === 'string' && FORMULA_START.test(text)) {
    text = `'${text}`;
  }

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  // The byte order mark makes Excel read the file as UTF-8 (e.g. "ñ").
  return (
    '﻿' +
    [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') +
    '\r\n'
  );
}

import { csvCell, toCsv } from './csv.js';

describe('csv', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('12 Rizal St., Brgy. 1')).toBe('"12 Rizal St., Brgy. 1"');
    expect(csvCell('the "old" house')).toBe('"the ""old"" house"');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('neutralises values that would run as spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+63')).toBe("'+63");
    expect(csvCell('@sum')).toBe("'@sum");
  });

  it('keeps numbers, including negatives, and blanks out nulls', () => {
    expect(csvCell(-5)).toBe('-5');
    expect(csvCell(150000.5)).toBe('150000.5');
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('writes dates as ISO strings', () => {
    expect(csvCell(new Date('2026-03-15T02:00:00Z'))).toBe(
      '2026-03-15T02:00:00.000Z',
    );
  });

  it('starts with a byte order mark and uses CRLF rows', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('﻿A,B\r\n1,x\r\n');
  });
});

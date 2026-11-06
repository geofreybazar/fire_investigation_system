import { detectFileType, safeFileName } from './file-type.js';

const bytes = (...values: (number | string)[]) =>
  Buffer.concat(
    values.map((value) =>
      typeof value === 'string'
        ? Buffer.from(value, 'ascii')
        : Buffer.from([value]),
    ),
  );

describe('detectFileType', () => {
  it.each([
    ['JPEG', bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg'],
    ['PNG', bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a, 0x00), 'image/png'],
    ['WebP', bytes('RIFF', 0, 0, 0, 0, 'WEBPVP8 '), 'image/webp'],
    ['PDF', bytes('%PDF-1.7\n'), 'application/pdf'],
  ])('recognises %s by its signature', (_name, buffer, mimeType) => {
    expect(detectFileType(buffer)?.mimeType).toBe(mimeType);
  });

  it.each([
    ['HTML', bytes('<html><script>alert(1)</script>')],
    ['an executable', bytes('MZ', 0x90, 0x00)],
    ['a RIFF that is not WebP', bytes('RIFF', 0, 0, 0, 0, 'WAVEfmt ')],
    ['an empty file', Buffer.alloc(0)],
  ])('rejects %s', (_name, buffer) => {
    expect(detectFileType(buffer)).toBeNull();
  });
});

describe('safeFileName', () => {
  const pdf = { mimeType: 'application/pdf', extension: 'pdf' };

  it('drops any path and uses the detected extension', () => {
    expect(safeFileName('../../etc/passwd.pdf', pdf)).toBe('passwd.pdf');
    expect(safeFileName('C:\\fakepath\\report.exe', pdf)).toBe('report.pdf');
  });

  it('removes control characters and quotes', () => {
    expect(safeFileName('bad"\r\nname.pdf', pdf)).toBe('badname.pdf');
  });

  it('falls back to a default name', () => {
    expect(safeFileName('.pdf', pdf)).toBe('attachment.pdf');
  });

  it('keeps names short', () => {
    expect(safeFileName(`${'a'.repeat(400)}.pdf`, pdf)).toHaveLength(154);
  });
});

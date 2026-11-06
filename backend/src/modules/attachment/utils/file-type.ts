// Allowed attachment types (REQUIREMENTS.md Q-22), recognised by the file's
// first bytes. The type the client declares is never trusted.

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export interface DetectedType {
  mimeType: string;
  extension: string;
}

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, i) => buffer[offset + i] === byte);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

export function detectFileType(buffer: Buffer): DetectedType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (
    startsWith(buffer, ascii('RIFF')) &&
    startsWith(buffer, ascii('WEBP'), 8)
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  if (startsWith(buffer, ascii('%PDF-'))) {
    return { mimeType: 'application/pdf', extension: 'pdf' };
  }
  return null;
}

// A display name safe for headers and the UI: no path, no control
// characters, bounded length, and the extension of the detected type.
export function safeFileName(original: string, detected: DetectedType): string {
  const base =
    original
      .split(/[\\/]/)
      .pop()
      // eslint-disable-next-line no-control-regex
      ?.replace(/[\u0000-\u001f\u007f"]/g, '')
      .trim() ?? '';
  const stem = base.replace(/\.[^.]*$/, '').slice(0, 150) || 'attachment';

  return `${stem}.${detected.extension}`;
}

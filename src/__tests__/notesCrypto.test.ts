import { decryptNote, encryptNote } from '../domain/notesCrypto';

describe('notesCrypto', () => {
  const key = 'a'.repeat(64);

  it('round-trips a private note', () => {
    const cipher = encryptNote('hold the countdown', key);
    expect(cipher).not.toContain('hold the countdown');
    expect(decryptNote(cipher, key)).toBe('hold the countdown');
  });

  it('returns empty string for empty cipher', () => {
    expect(decryptNote('', key)).toBe('');
  });

  it('throws when the key is missing or decrypt fails', () => {
    expect(() => encryptNote('x', '')).toThrow('Encryption key missing');
    const cipher = encryptNote('secret', key);
    expect(() => decryptNote(cipher, 'b'.repeat(64))).toThrow('Unable to decrypt note');
  });
});

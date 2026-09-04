import CryptoJS from 'crypto-js';

export function encryptNote(plaintext: string, keyHex: string): string {
  if (!keyHex) throw new Error('Encryption key missing');
  return CryptoJS.AES.encrypt(plaintext, keyHex).toString();
}

export function decryptNote(cipher: string, keyHex: string): string {
  if (!cipher) return '';
  if (!keyHex) throw new Error('Encryption key missing');
  const bytes = CryptoJS.AES.decrypt(cipher, keyHex);
  const text = bytes.toString(CryptoJS.enc.Utf8);
  if (!text && cipher.length > 0) {
    throw new Error('Unable to decrypt note');
  }
  return text;
}

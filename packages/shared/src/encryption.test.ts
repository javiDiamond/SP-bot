import { describe, it, expect } from 'vitest';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption';

const KEY_64_HEX = 'a'.repeat(64);

describe('AES-256-GCM API key encryption', () => {
  it('round-trips an API key', () => {
    const { encrypted, iv, authTag } = encryptApiKey('wallex-secret-key', KEY_64_HEX);
    expect(encrypted).not.toContain('wallex-secret-key');
    expect(decryptApiKey(encrypted, iv, authTag, KEY_64_HEX)).toBe('wallex-secret-key');
  });

  it('produces a fresh IV per encryption (non-deterministic ciphertext)', () => {
    const a = encryptApiKey('same-key', KEY_64_HEX);
    const b = encryptApiKey('same-key', KEY_64_HEX);
    expect(a.iv).not.toBe(b.iv);
    expect(a.encrypted).not.toBe(b.encrypted);
  });

  it('fails tamper detection on modified ciphertext', () => {
    const { encrypted, iv, authTag } = encryptApiKey('secret', KEY_64_HEX);
    const tampered = (encrypted[0] === 'f' ? '0' : 'f') + encrypted.slice(1);
    expect(() => decryptApiKey(tampered, iv, authTag, KEY_64_HEX)).toThrow();
  });

  it('fails decryption with the wrong key', () => {
    const { encrypted, iv, authTag } = encryptApiKey('secret', KEY_64_HEX);
    expect(() => decryptApiKey(encrypted, iv, authTag, 'b'.repeat(64))).toThrow();
  });

  it('rejects a key of invalid length', () => {
    expect(() => encryptApiKey('secret', 'abcd')).toThrow();
  });
});

describe('maskApiKey', () => {
  it('masks the middle of long keys', () => {
    expect(maskApiKey('abcd1234efgh')).toBe('abcd****efgh');
  });

  it('fully masks short keys', () => {
    expect(maskApiKey('shorty')).toBe('******');
    expect(maskApiKey('12345678')).toBe('********');
  });
});

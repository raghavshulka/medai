import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { generateRecoveryCodes, matchRecoveryCode } from './totp';

describe('password hashing', () => {
  it('hashes and verifies a correct password', async () => {
    const hash = await hashPassword('s3cret-passw0rd');
    expect(hash).not.toBe('s3cret-passw0rd');
    expect(await verifyPassword('s3cret-passw0rd', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('s3cret-passw0rd');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('recovery codes', () => {
  it('generates codes whose hashes verify', () => {
    const { codes, hashes } = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    expect(hashes).toHaveLength(8);
    const first = codes[0];
    expect(first).toBeDefined();
    expect(matchRecoveryCode(first as string, hashes)).not.toBeNull();
    expect(matchRecoveryCode('0000-00000', hashes)).toBeNull();
  });
});

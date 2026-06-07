import { createHash, randomBytes } from 'node:crypto';
import { lazyEnv, z } from '@medai/config';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';

const env = lazyEnv(
  z.object({
    TOTP_ISSUER: z.string().default('MedAI'),
  }),
);

export interface TotpSetup {
  /** base32 secret to persist (encrypted/at rest) for the user. */
  secret: string;
  /** otpauth:// URL to render as a QR code. */
  otpauthUrl: string;
}

/** Generate a new TOTP secret + provisioning URL for an account. */
export function generateTotpSecret(accountName: string): TotpSetup {
  const { TOTP_ISSUER } = env();
  const secret = speakeasy.generateSecret({
    name: `${TOTP_ISSUER} (${accountName})`,
    issuer: TOTP_ISSUER,
  });
  return { secret: secret.base32, otpauthUrl: secret.otpauth_url ?? '' };
}

/** Render an otpauth URL as a data-URL PNG for the client to display. */
export function totpQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

/** Verify a 6-digit TOTP code against a base32 secret (±1 step of clock skew). */
export function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
}

export interface RecoveryCodes {
  /** Plaintext codes — shown to the user once, then discarded. */
  codes: string[];
  /** sha256 hashes — persisted for later verification. */
  hashes: string[];
}

const hashCode = (code: string): string =>
  createHash('sha256').update(code.replace(/-/g, '').toLowerCase()).digest('hex');

/** Generate single-use recovery codes (plaintext for display + hashes to store). */
export function generateRecoveryCodes(count = 10): RecoveryCodes {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = randomBytes(5).toString('hex'); // 10 hex chars
    const code = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    codes.push(code);
    hashes.push(hashCode(code));
  }
  return { codes, hashes };
}

/** Returns the matching hash if `code` is valid, else null (caller removes it). */
export function matchRecoveryCode(code: string, hashes: string[]): string | null {
  const target = hashCode(code);
  return hashes.includes(target) ? target : null;
}

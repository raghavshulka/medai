import {
  enable2faSchema,
  generateRecoveryCodes,
  generateTotpSecret,
  hashPassword,
  issueTokenPair,
  loginSchema,
  refreshSchema,
  registerSchema,
  secondsUntilExpiry,
  type TokenPair,
  totpQrCodeDataUrl,
  verifyPassword,
  verifyRefreshToken,
  verifyTotp,
} from '@medai/auth';
import { type UserDocument, UserModel } from '@medai/db';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import {
  isRefreshTokenValid,
  revokeRefreshToken,
  storeRefreshToken,
} from '../services/token-store';

export const authRouter: Router = Router();

function publicUser(user: UserDocument) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactor?.enabled ?? false,
  };
}

/** Issue a token pair and record the refresh jti in the Redis allowlist. */
async function issueAndStore(user: UserDocument): Promise<TokenPair> {
  const pair = issueTokenPair({
    sub: String(user._id),
    role: user.role ?? 'patient',
    tokenVersion: user.tokenVersion ?? 0,
  });
  const claims = verifyRefreshToken(pair.refreshToken);
  await storeRefreshToken(pair.refreshJti, String(user._id), secondsUntilExpiry(claims));
  return pair;
}

authRouter.post('/register', async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    email: input.email,
    name: input.name,
    passwordHash,
  });
  const tokens = await issueAndStore(user);
  res.status(201).json({ user: publicUser(user), ...tokens });
});

authRouter.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: input.email }).select(
    '+passwordHash +twoFactor.secret',
  );
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (user.twoFactor?.enabled) {
    if (!input.totp) {
      throw new HttpError(401, 'Two-factor code required', { twoFactorRequired: true });
    }
    if (!user.twoFactor.secret || !verifyTotp(user.twoFactor.secret, input.totp)) {
      throw new HttpError(401, 'Invalid two-factor code');
    }
  }

  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueAndStore(user);
  res.json({ user: publicUser(user), ...tokens });
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  let claims: ReturnType<typeof verifyRefreshToken>;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, 'Invalid refresh token');
  }
  if (!(await isRefreshTokenValid(claims.jti, claims.sub))) {
    throw new HttpError(401, 'Refresh token has been revoked');
  }
  const user = await UserModel.findById(claims.sub);
  if (!user || (user.tokenVersion ?? 0) !== claims.tokenVersion) {
    throw new HttpError(401, 'Refresh token no longer valid');
  }
  // Rotate: invalidate the presented token, issue a fresh pair.
  await revokeRefreshToken(claims.jti);
  const tokens = await issueAndStore(user);
  res.json(tokens);
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  try {
    const claims = verifyRefreshToken(refreshToken);
    await revokeRefreshToken(claims.jti);
  } catch {
    // Already invalid — nothing to revoke.
  }
  res.json({ success: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.user?.id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  res.json({ user: publicUser(user) });
});

authRouter.post('/2fa/setup', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.user?.id);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  const setup = generateTotpSecret(user.email);
  const qrCode = await totpQrCodeDataUrl(setup.otpauthUrl);
  user.twoFactor = { ...user.twoFactor, enabled: false, secret: setup.secret, recoveryCodes: [] };
  await user.save();
  res.json({ secret: setup.secret, otpauthUrl: setup.otpauthUrl, qrCode });
});

authRouter.post('/2fa/enable', requireAuth, async (req, res) => {
  const { token } = enable2faSchema.parse(req.body);
  const user = await UserModel.findById(req.user?.id).select('+twoFactor.secret');
  if (!user?.twoFactor?.secret) {
    throw new HttpError(400, 'Run /2fa/setup before enabling');
  }
  if (!verifyTotp(user.twoFactor.secret, token)) {
    throw new HttpError(401, 'Invalid two-factor code');
  }
  const { codes, hashes } = generateRecoveryCodes();
  user.twoFactor.enabled = true;
  user.twoFactor.recoveryCodes = hashes;
  await user.save();
  res.json({ enabled: true, recoveryCodes: codes });
});

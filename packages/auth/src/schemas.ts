import { z } from '@medai/config';

export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  /** Required when the account has 2FA enabled. */
  totp: z.string().min(6).max(10).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const enable2faSchema = z.object({
  token: z.string().length(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type Enable2faInput = z.infer<typeof enable2faSchema>;

import {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from 'mongoose';

export const USER_ROLES = ['patient', 'clinician', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const twoFactorSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    /** base32 TOTP secret — never selected by default. */
    secret: { type: String, select: false },
    /** sha256 hashes of single-use recovery codes. */
    recoveryCodes: { type: [String], select: false, default: [] },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    /** bcrypt hash — never selected by default. */
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'patient',
      index: true,
    },
    /** Bumped to invalidate all outstanding refresh tokens for this user. */
    tokenVersion: { type: Number, default: 0 },
    twoFactor: { type: twoFactorSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

// `models.User ?? model(...)` avoids OverwriteModelError under hot-reload / watch.
export const UserModel: Model<User> =
  (models.User as Model<User>) ?? model<User>('User', userSchema);

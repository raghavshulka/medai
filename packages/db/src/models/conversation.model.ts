import {
  type HydratedDocument,
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
  Types,
} from 'mongoose';

export const MESSAGE_ROLES = ['system', 'user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

const messageSchema = new Schema(
  {
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation', trim: true },
    /** Which provider/model produced this thread (e.g. anthropic / openai). */
    provider: { type: String, default: 'anthropic' },
    model: { type: String },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

export type Conversation = InferSchemaType<typeof conversationSchema>;
export type ConversationDocument = HydratedDocument<Conversation>;

export const ConversationModel: Model<Conversation> =
  (models.Conversation as Model<Conversation>) ??
  model<Conversation>('Conversation', conversationSchema);

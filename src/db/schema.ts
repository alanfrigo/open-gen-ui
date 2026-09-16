import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import type { Workspace } from '@/lib/types';
const dates = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
};
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  ...dates,
});
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...dates,
  },
  (t) => [index('session_user_idx').on(t.userId)],
);
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    ...dates,
  },
  (t) => [index('account_user_idx').on(t.userId)],
);
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    ...dates,
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);
export const workspace = pgTable('workspace', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<Workspace>().notNull(),
  ...dates,
});
export const asset = pgTable(
  'asset',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    key: text('key').notNull().unique(),
    name: text('name').notNull(),
    mime: text('mime').notNull(),
    projectId: text('project_id'),
    prompt: text('prompt'),
    ...dates,
  },
  (t) => [index('asset_user_created_idx').on(t.userId, t.createdAt)],
);
export const job = pgTable(
  'job',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerId: text('provider_id'),
    status: text('status').notNull(),
    prompt: text('prompt').notNull(),
    projectId: text('project_id'),
    assetId: text('asset_id').references(() => asset.id),
    ...dates,
  },
  (t) => [
    index('job_user_idx').on(t.userId),
    index('job_asset_idx').on(t.assetId),
  ],
);

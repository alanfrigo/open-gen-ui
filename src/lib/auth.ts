import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    rateLimit: { enabled: true },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
  });
}
let instance: ReturnType<typeof createAuth>;
export function getAuth() {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET)
    throw new Error('Configure DATABASE_URL e BETTER_AUTH_SECRET.');
  return (instance ??= createAuth());
}

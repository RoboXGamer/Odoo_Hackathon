import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db, ensureDb } from '../db';
import { schema } from '../db/schema';

await ensureDb();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: ['admin', 'manager', 'viewer'],
        required: false,
        defaultValue: 'admin',
        input: false,
      },
    },
  },
  trustedOrigins: [
    'http://localhost:4321',
    'http://127.0.0.1:4321',
  ],
});

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db, ensureDb } from '../db';
import { schema } from '../db/schema';
import { employees } from '../db/schema';
import { eq } from 'drizzle-orm';

await ensureDb();

const trustedOrigins = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  process.env.BETTER_AUTH_URL,
  process.env.URL,
  process.env.DEPLOY_PRIME_URL,
].filter((origin): origin is string => Boolean(origin));

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
        type: ['admin', 'asset_manager', 'department_head', 'employee'],
        required: false,
        defaultValue: 'employee',
        input: false,
      },
    },
  },
  trustedOrigins,
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const [employee] = await db.select().from(employees).where(eq(employees.email, createdUser.email));
          if (employee) {
            await db.update(employees).set({ userId: createdUser.id, role: 'employee' }).where(eq(employees.id, employee.id));
            return;
          }
          await db.insert(employees).values({
            id: `EMP-${createdUser.id.slice(0, 8).toUpperCase()}`,
            name: createdUser.name,
            email: createdUser.email,
            userId: createdUser.id,
            role: 'employee',
            department: 'Unassigned',
            status: 'Active',
          });
        },
      },
    },
  },
});

import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: int('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('admin'),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: int('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: int('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: int('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: int('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: int('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: int('createdAt', { mode: 'timestamp' }),
  updatedAt: int('updatedAt', { mode: 'timestamp' }),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  owner: text('owner').notNull(),
  updated: text('updated').notNull(),
});

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  head: text('head').notNull(),
  parent: text('parent').notNull(),
  employees: int('employees').notNull().default(0),
  status: text('status').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  count: int('count').notNull().default(0),
  status: text('status').notNull(),
});

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull(),
});

export const maintenance = sqliteTable('maintenance_requests', {
  id: text('id').primaryKey(),
  asset: text('asset').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull(),
  assignee: text('assignee').notNull(),
  date: text('date').notNull(),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  resource: text('resource').notNull(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
});

export const audits = sqliteTable('audits', {
  asset: text('asset').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  status: text('status').notNull(),
  note: text('note').notNull(),
});

export const transfers = sqliteTable('transfers', {
  id: text('id').primaryKey(),
  asset: text('asset').notNull(),
  to: text('to_employee').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
});

export const logs = sqliteTable('activity_logs', {
  id: int('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  time: text('time').notNull(),
  read: int('read', { mode: 'boolean' }).notNull().default(false),
});

export const schema = {
  user,
  session,
  account,
  verification,
  assets,
  departments,
  categories,
  employees,
  maintenance,
  bookings,
  audits,
  transfers,
  logs,
};

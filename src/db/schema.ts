import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: int('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('employee'),
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

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  head: text('head').notNull(),
  parent: text('parent').notNull(),
  employees: int('employees').notNull().default(0),
  status: text('status').notNull(),
}, (table) => [
  uniqueIndex('departments_name_unique').on(table.name),
]);

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  count: int('count').notNull().default(0),
  status: text('status').notNull(),
}, (table) => [
  uniqueIndex('categories_name_unique').on(table.name),
]);

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department').notNull().references(() => departments.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
  email: text('email').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  role: text('role').notNull().default('employee'),
  status: text('status').notNull(),
}, (table) => [
  uniqueIndex('employees_name_unique').on(table.name),
  uniqueIndex('employees_email_unique').on(table.email),
]);

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  serialNumber: text('serial_number').notNull().default(''),
  qrCode: text('qr_code').notNull().default(''),
  category: text('category').notNull().references(() => categories.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
  status: text('status').notNull(),
  condition: text('condition').notNull().default('Good'),
  acquisitionDate: text('acquisition_date').notNull().default(''),
  acquisitionCost: int('acquisition_cost').notNull().default(0),
  shared: int('shared', { mode: 'boolean' }).notNull().default(false),
  attachments: text('attachments').notNull().default(''),
  department: text('department').notNull().references(() => departments.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
  location: text('location').notNull(),
  owner: text('owner').notNull(),
  updated: text('updated').notNull(),
});

export const bookingResources = sqliteTable('booking_resources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
}, (table) => [
  uniqueIndex('booking_resources_name_unique').on(table.name),
]);

export const maintenance = sqliteTable('maintenance_requests', {
  id: text('id').primaryKey(),
  asset: text('asset').notNull().references(() => assets.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  title: text('title').notNull(),
  priority: text('priority').notNull().default('Medium'),
  requester: text('requester').notNull().default(''),
  photo: text('photo').notNull().default(''),
  status: text('status').notNull(),
  assignee: text('assignee').notNull(),
  date: text('date').notNull(),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  resource: text('resource').notNull().references(() => bookingResources.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  status: text('status').notNull().default('Upcoming'),
  requester: text('requester').notNull().default(''),
  department: text('department').notNull().default(''),
  reminderAt: text('reminder_at').notNull().default(''),
  cancelledAt: text('cancelled_at').notNull().default(''),
});

export const audits = sqliteTable('audits', {
  asset: text('asset').primaryKey().references(() => assets.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  name: text('name').notNull(),
  location: text('location').notNull(),
  status: text('status').notNull(),
  note: text('note').notNull(),
});

export const transfers = sqliteTable('transfers', {
  id: text('id').primaryKey(),
  asset: text('asset').notNull().references(() => assets.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  to: text('to_employee').notNull().references(() => employees.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  requestedAt: text('requested_at').notNull().default(''),
  decidedAt: text('decided_at').notNull().default(''),
});

export const allocations = sqliteTable('allocations', {
  id: text('id').primaryKey(),
  asset: text('asset').notNull().references(() => assets.id, { onDelete: 'restrict' }),
  holderType: text('holder_type').notNull(),
  holder: text('holder').notNull(),
  allocatedAt: text('allocated_at').notNull(),
  expectedReturn: text('expected_return').notNull().default(''),
  returnedAt: text('returned_at').notNull().default(''),
  status: text('status').notNull().default('Active'),
  checkInCondition: text('check_in_condition').notNull().default(''),
  checkInNotes: text('check_in_notes').notNull().default(''),
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
  bookingResources,
  maintenance,
  bookings,
  audits,
  transfers,
  allocations,
  logs,
};

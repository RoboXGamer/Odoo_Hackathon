import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { count } from 'drizzle-orm';
import * as tables from './schema';
import { seedData } from './seed';
import { type ResourceName, parseCreate, parseUpdate } from './validators';

const databaseUrl = process.env.DATABASE_URL ?? 'libsql://assetflow-roboxgamer.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

export const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle({ client });

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  await client.execute('PRAGMA foreign_keys = ON');
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'employee',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY NOT NULL,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY NOT NULL,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER,
      updatedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      serial_number TEXT NOT NULL DEFAULT '',
      qr_code TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL REFERENCES categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
      status TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'Good',
      acquisition_date TEXT NOT NULL DEFAULT '',
      acquisition_cost INTEGER NOT NULL DEFAULT 0,
      shared INTEGER NOT NULL DEFAULT 0,
      attachments TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL REFERENCES departments(name) ON UPDATE CASCADE ON DELETE RESTRICT,
      location TEXT NOT NULL,
      owner TEXT NOT NULL,
      updated TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      head TEXT NOT NULL,
      parent TEXT NOT NULL,
      employees INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      UNIQUE(name)
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      UNIQUE(name)
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL REFERENCES departments(name) ON UPDATE CASCADE ON DELETE RESTRICT,
      email TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      status TEXT NOT NULL,
      UNIQUE(name)
    );
    CREATE TABLE IF NOT EXISTS booking_resources (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL REFERENCES assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      title TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      requester TEXT NOT NULL DEFAULT '',
      photo TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      assignee TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY NOT NULL,
      resource TEXT NOT NULL REFERENCES booking_resources(name) ON UPDATE CASCADE ON DELETE RESTRICT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Upcoming',
      requester TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      reminder_at TEXT NOT NULL DEFAULT '',
      cancelled_at TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS audits (
      asset TEXT PRIMARY KEY NOT NULL REFERENCES assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL,
      cycle_id TEXT NOT NULL DEFAULT 'AUDIT-Q3'
    );
    CREATE TABLE IF NOT EXISTS audit_cycles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      auditors TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      closed_at TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL REFERENCES assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      to_employee TEXT NOT NULL REFERENCES employees(name) ON UPDATE CASCADE ON DELETE RESTRICT,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL DEFAULT '',
      decided_at TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS allocations (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      holder_type TEXT NOT NULL,
      holder TEXT NOT NULL,
      allocated_at TEXT NOT NULL,
      expected_return TEXT NOT NULL DEFAULT '',
      returned_at TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      check_in_condition TEXT NOT NULL DEFAULT '',
      check_in_notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      time TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );
  `);

  for (const statement of [
    "ALTER TABLE employees ADD COLUMN user_id TEXT REFERENCES user(id) ON DELETE SET NULL",
    "ALTER TABLE employees ADD COLUMN role TEXT NOT NULL DEFAULT 'employee'",
    "ALTER TABLE assets ADD COLUMN serial_number TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE assets ADD COLUMN qr_code TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE assets ADD COLUMN condition TEXT NOT NULL DEFAULT 'Good'",
    "ALTER TABLE assets ADD COLUMN acquisition_date TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE assets ADD COLUMN acquisition_cost INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE assets ADD COLUMN shared INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE assets ADD COLUMN attachments TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE transfers ADD COLUMN requested_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE transfers ADD COLUMN decided_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'Upcoming'",
    "ALTER TABLE bookings ADD COLUMN requester TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN department TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN reminder_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN cancelled_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE maintenance_requests ADD COLUMN priority TEXT NOT NULL DEFAULT 'Medium'",
    "ALTER TABLE maintenance_requests ADD COLUMN requester TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE maintenance_requests ADD COLUMN photo TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE audits ADD COLUMN cycle_id TEXT NOT NULL DEFAULT 'AUDIT-Q3'",
  ]) {
    try {
      await client.execute(statement);
    } catch (error) {
      if (!String(error).toLowerCase().includes('duplicate column')) throw error;
    }
  }

  const [{ value }] = await db.select({ value: count() }).from(tables.assets);
  await db.insert(tables.departments).values(seedData.departments).onConflictDoNothing();
  await db.insert(tables.categories).values(seedData.categories).onConflictDoNothing();
  await db.insert(tables.employees).values(seedData.employees).onConflictDoNothing();
  await db.insert(tables.assets).values(seedData.assets).onConflictDoNothing();
  await db.insert(tables.bookingResources).values(seedData.bookingResources).onConflictDoNothing();
  await db.insert(tables.maintenance).values(seedData.maintenance).onConflictDoNothing();
  await db.insert(tables.bookings).values(seedData.bookings).onConflictDoNothing();
  await db.insert(tables.audits).values(seedData.audits).onConflictDoNothing();
  await db.insert(tables.auditCycles).values({ id: 'AUDIT-Q3', name: 'Engineering asset audit', department: 'Engineering', location: '', startDate: '2026-07-01', endDate: '2026-07-15', auditors: 'A. Rao, S. Iqbal', status: 'Open', closedAt: '' }).onConflictDoNothing();
  if (seedData.transfers.length) {
    await db.insert(tables.transfers).values(seedData.transfers).onConflictDoNothing();
  }

  if (value === 0) {
    await db.insert(tables.logs).values(seedData.logs);
  }

  initialized = true;
}

export async function getAppState() {
  await ensureDb();
  const allocationRows = await db.select().from(tables.allocations);
  const today = new Date().toISOString().slice(0, 10);
  return {
    assets: await db.select().from(tables.assets),
    departments: await db.select().from(tables.departments),
    categories: await db.select().from(tables.categories),
    employees: await db.select().from(tables.employees),
    bookingResources: await db.select().from(tables.bookingResources),
    maintenance: await db.select().from(tables.maintenance),
    bookings: await db.select().from(tables.bookings),
    audits: await db.select().from(tables.audits),
    auditCycles: await db.select().from(tables.auditCycles),
    transfers: await db.select().from(tables.transfers),
    allocations: allocationRows.map((item) => ({ ...item, overdue: item.status !== 'Returned' && Boolean(item.expectedReturn) && item.expectedReturn < today })),
    logs: await db.select({
      id: tables.logs.id,
      type: tables.logs.type,
      title: tables.logs.title,
      detail: tables.logs.detail,
      time: tables.logs.time,
      read: tables.logs.read,
    }).from(tables.logs),
  };
}

const resourceConfig = {
  assets: { table: tables.assets, idColumn: tables.assets.id },
  departments: { table: tables.departments, idColumn: tables.departments.id },
  categories: { table: tables.categories, idColumn: tables.categories.id },
  employees: { table: tables.employees, idColumn: tables.employees.id },
  bookingResources: { table: tables.bookingResources, idColumn: tables.bookingResources.id },
  maintenance: { table: tables.maintenance, idColumn: tables.maintenance.id },
  bookings: { table: tables.bookings, idColumn: tables.bookings.id },
  audits: { table: tables.audits, idColumn: tables.audits.asset },
  auditCycles: { table: tables.auditCycles, idColumn: tables.auditCycles.id },
  transfers: { table: tables.transfers, idColumn: tables.transfers.id },
  allocations: { table: tables.allocations, idColumn: tables.allocations.id },
  logs: { table: tables.logs, idColumn: tables.logs.id },
} as const;

async function exists(resource: ResourceName, id: string) {
  return Boolean(await getResourceItem(resource, id));
}

async function existsByName(table: any, nameColumn: any, name: string) {
  const [item] = await db.select().from(table).where(eq(nameColumn, name));
  return Boolean(item);
}

async function assertReferences(resource: ResourceName, values: Record<string, any>) {
  if (resource === 'assets') {
    if (values.category && !(await existsByName(tables.categories, tables.categories.name, values.category))) {
      throw new Error(`Unknown category: ${values.category}`);
    }
    if (values.department && !(await existsByName(tables.departments, tables.departments.name, values.department))) {
      throw new Error(`Unknown department: ${values.department}`);
    }
    if (values.owner && !['-', '—'].includes(values.owner) && !(await existsByName(tables.employees, tables.employees.name, values.owner))) {
      throw new Error(`Unknown owner employee: ${values.owner}`);
    }
  }

  if (resource === 'employees' && values.department && !(await existsByName(tables.departments, tables.departments.name, values.department))) {
    throw new Error(`Unknown department: ${values.department}`);
  }

  if (resource === 'departments') {
    if (values.parent && !['-', '—'].includes(values.parent) && !(await existsByName(tables.departments, tables.departments.name, values.parent))) {
      throw new Error(`Unknown parent department: ${values.parent}`);
    }
    if (values.head && !['-', ''].includes(values.head) && !(await existsByName(tables.employees, tables.employees.name, values.head))) {
      throw new Error(`Unknown department head employee: ${values.head}`);
    }
  }

  if ((resource === 'maintenance' || resource === 'audits' || resource === 'transfers' || resource === 'allocations') && values.asset && !(await exists('assets', values.asset))) {
    throw new Error(`Unknown asset: ${values.asset}`);
  }

  if (resource === 'bookings' && values.resource && !(await existsByName(tables.bookingResources, tables.bookingResources.name, values.resource))) {
    throw new Error(`Unknown booking resource: ${values.resource}`);
  }

  if (resource === 'transfers' && values.to && !(await existsByName(tables.employees, tables.employees.name, values.to))) {
    throw new Error(`Unknown destination employee: ${values.to}`);
  }
}

async function countByName(table: any, column: any, name: string) {
  const [{ value }] = await db.select({ value: count() }).from(table).where(eq(column, name));
  return value;
}

async function assertCanDelete(resource: ResourceName, existing: Record<string, any>) {
  if (resource === 'departments') {
    const assetCount = await countByName(tables.assets, tables.assets.department, existing.name);
    const employeeCount = await countByName(tables.employees, tables.employees.department, existing.name);
    if (assetCount || employeeCount) {
      throw new Error(`Department is in use by ${assetCount} asset(s) and ${employeeCount} employee(s). Reassign them before deleting.`);
    }
  }

  if (resource === 'categories') {
    const assetCount = await countByName(tables.assets, tables.assets.category, existing.name);
    if (assetCount) {
      throw new Error(`Category is in use by ${assetCount} asset(s). Reassign them before deleting.`);
    }
  }
}

export async function listResource(resource: ResourceName) {
  await ensureDb();
  return db.select().from(resourceConfig[resource].table as any);
}

export async function getResourceItem(resource: ResourceName, id: string) {
  await ensureDb();
  const config = resourceConfig[resource];
  const [item] = await db.select().from(config.table as any).where(eq(config.idColumn as any, id));
  return item ?? null;
}

export async function createResourceItem(resource: ResourceName, payload: unknown) {
  await ensureDb();
  const config = resourceConfig[resource];
  const values = parseCreate(resource, payload) as Record<string, any>;
  if (resource === 'assets' && !values.id) {
    const rows = await db.select({ id: tables.assets.id }).from(tables.assets);
    const next = rows.reduce((max, row) => Math.max(max, Number(row.id.match(/^AF-(\d+)$/)?.[1] ?? 0)), 0) + 1;
    values.id = `AF-${String(next).padStart(4, '0')}`;
  }
  if (resource === 'assets' && !values.qrCode) values.qrCode = values.id;
  if (resource === 'allocations') {
    const [asset] = await db.select().from(tables.assets).where(eq(tables.assets.id, values.asset));
    if (!asset || asset.status !== 'Available') throw new Error(`Asset is currently held by ${asset?.owner || 'another holder'}. Submit a transfer request instead.`);
    if (values.holderType === 'Employee' && !(await existsByName(tables.employees, tables.employees.name, values.holder))) throw new Error(`Unknown employee: ${values.holder}`);
    if (values.holderType === 'Department' && !(await existsByName(tables.departments, tables.departments.name, values.holder))) throw new Error(`Unknown department: ${values.holder}`);
  }
  if (resource === 'bookings') {
    const existing = await db.select().from(tables.bookings);
    if (existing.some((booking) => booking.status !== 'Cancelled' && booking.resource === values.resource && booking.date === values.date && values.start < booking.end && values.end > booking.start)) {
      throw new Error('This slot overlaps with an existing booking. Choose another time.');
    }
  }
  if (resource === 'maintenance') values.status = 'Pending';
  await assertReferences(resource, values as Record<string, any>);
  await db.insert(config.table as any).values(values as any);
  if (resource === 'allocations') {
    await db.update(tables.assets).set({ status: 'Allocated', owner: values.holderType === 'Employee' ? values.holder : '-', department: values.holderType === 'Department' ? values.holder : (await db.select().from(tables.employees).where(eq(tables.employees.name, values.holder)))[0]?.department ?? 'Unassigned', updated: 'Just now' }).where(eq(tables.assets.id, values.asset));
  }
  return getResourceItem(resource, String((values as any).id ?? (values as any).asset));
}

export async function updateResourceItem(resource: ResourceName, id: string, payload: unknown) {
  await ensureDb();
  const config = resourceConfig[resource];
  const values = parseUpdate(resource, payload);
  if (Object.keys(values).length === 0) return getResourceItem(resource, id);
  await assertReferences(resource, values as Record<string, any>);
  if (resource === 'bookings' && ((values as any).date || (values as any).start || (values as any).end || (values as any).resource)) {
    const current = await getResourceItem('bookings', id) as Record<string, any>;
    const candidate = { ...current, ...(values as Record<string, any>) } as {
      resource: string;
      date: string;
      start: string;
      end: string;
    };
    const existing = await db.select().from(tables.bookings);
    if (existing.some((booking) => booking.id !== id && booking.status !== 'Cancelled' && booking.resource === candidate.resource && booking.date === candidate.date && candidate.start < booking.end && candidate.end > booking.start)) throw new Error('This slot overlaps with an existing booking. Choose another time.');
  }

  await db.update(config.table as any).set(values as any).where(eq(config.idColumn as any, id));
  if (resource === 'transfers' && (values as any).status === 'Approved') {
    const [transfer] = await db.select().from(tables.transfers).where(eq(tables.transfers.id, id));
    const [employee] = await db.select().from(tables.employees).where(eq(tables.employees.name, transfer.to));
    await db.update(tables.allocations).set({ status: 'Returned', returnedAt: new Date().toISOString() }).where(eq(tables.allocations.asset, transfer.asset));
    await db.insert(tables.allocations).values({ id: `AL-${Date.now()}`, asset: transfer.asset, holderType: 'Employee', holder: transfer.to, allocatedAt: new Date().toISOString(), expectedReturn: '', returnedAt: '', status: 'Active', checkInCondition: '', checkInNotes: '' });
    await db.update(tables.assets).set({ status: 'Allocated', owner: transfer.to, department: employee?.department ?? 'Unassigned', updated: 'Just now' }).where(eq(tables.assets.id, transfer.asset));
    await db.update(tables.transfers).set({ status: 'Completed', decidedAt: new Date().toISOString() }).where(eq(tables.transfers.id, id));
  }
  if (resource === 'allocations' && (values as any).status === 'Returned') {
    const [allocation] = await db.select().from(tables.allocations).where(eq(tables.allocations.id, id));
    await db.update(tables.allocations).set({ returnedAt: (values as any).returnedAt || new Date().toISOString() }).where(eq(tables.allocations.id, id));
    await db.update(tables.assets).set({ status: 'Available', owner: '-', updated: 'Just now', condition: (values as any).checkInCondition || 'Good' }).where(eq(tables.assets.id, allocation.asset));
  }
  if (resource === 'maintenance' && ['Approved', 'Resolved'].includes((values as any).status)) {
    const [request] = await db.select().from(tables.maintenance).where(eq(tables.maintenance.id, id));
    await db.update(tables.assets).set({ status: (values as any).status === 'Approved' ? 'Under Maintenance' : 'Available', updated: 'Just now' }).where(eq(tables.assets.id, request.asset));
  }
  if (resource === 'auditCycles' && (values as any).status === 'Closed') {
    const items = await db.select().from(tables.audits).where(eq(tables.audits.cycleId, id));
    for (const item of items.filter((audit) => audit.status === 'Missing')) {
      await db.update(tables.assets).set({ status: 'Lost', updated: 'Just now' }).where(eq(tables.assets.id, item.asset));
    }
    await db.update(tables.auditCycles).set({ closedAt: new Date().toISOString() }).where(eq(tables.auditCycles.id, id));
  }
  if (resource === 'employees' && (values as any).role) {
    const [employee] = await db.select().from(tables.employees).where(eq(tables.employees.id, id));
    if (employee?.userId) {
      await db.update(tables.user).set({ role: (values as any).role, updatedAt: new Date() }).where(eq(tables.user.id, employee.userId));
    }
  }
  return getResourceItem(resource, id);
}

export async function deleteResourceItem(resource: ResourceName, id: string) {
  await ensureDb();
  const config = resourceConfig[resource];
  const existing = await getResourceItem(resource, id);
  if (!existing) return null;
  await assertCanDelete(resource, existing as Record<string, any>);

  await db.delete(config.table as any).where(eq(config.idColumn as any, id));
  return existing;
}

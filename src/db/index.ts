import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { count } from 'drizzle-orm';
import * as tables from './schema';
import { seedData } from './seed';
import { type ResourceName, parseCreate, parseUpdate } from './validators';

const dbPath = resolve(process.env.DATABASE_PATH ?? './data/assetflow.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new DatabaseSync(dbPath);
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec('PRAGMA journal_mode = WAL');

export const db = drizzle({ client: sqlite });

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
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
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      department TEXT NOT NULL,
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
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      assignee TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY NOT NULL,
      resource TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audits (
      asset TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY NOT NULL,
      asset TEXT NOT NULL,
      to_employee TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL
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

  const [{ value }] = await db.select({ value: count() }).from(tables.assets);
  if (value === 0) {
    await db.insert(tables.assets).values(seedData.assets);
    await db.insert(tables.departments).values(seedData.departments);
    await db.insert(tables.categories).values(seedData.categories);
    await db.insert(tables.employees).values(seedData.employees);
    await db.insert(tables.maintenance).values(seedData.maintenance);
    await db.insert(tables.bookings).values(seedData.bookings);
    await db.insert(tables.audits).values(seedData.audits);
    await db.insert(tables.logs).values(seedData.logs);
  }

  initialized = true;
}

export async function getAppState() {
  await ensureDb();
  return {
    assets: await db.select().from(tables.assets),
    departments: await db.select().from(tables.departments),
    categories: await db.select().from(tables.categories),
    employees: await db.select().from(tables.employees),
    maintenance: await db.select().from(tables.maintenance),
    bookings: await db.select().from(tables.bookings),
    audits: await db.select().from(tables.audits),
    transfers: await db.select().from(tables.transfers),
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
  maintenance: { table: tables.maintenance, idColumn: tables.maintenance.id },
  bookings: { table: tables.bookings, idColumn: tables.bookings.id },
  audits: { table: tables.audits, idColumn: tables.audits.asset },
  transfers: { table: tables.transfers, idColumn: tables.transfers.id },
  logs: { table: tables.logs, idColumn: tables.logs.id },
} as const;

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
  const values = parseCreate(resource, payload);
  await db.insert(config.table as any).values(values as any);
  return getResourceItem(resource, String((values as any).id ?? (values as any).asset));
}

export async function updateResourceItem(resource: ResourceName, id: string, payload: unknown) {
  await ensureDb();
  const config = resourceConfig[resource];
  const values = parseUpdate(resource, payload);
  if (Object.keys(values).length === 0) return getResourceItem(resource, id);

  await db.update(config.table as any).set(values as any).where(eq(config.idColumn as any, id));
  return getResourceItem(resource, id);
}

export async function deleteResourceItem(resource: ResourceName, id: string) {
  await ensureDb();
  const config = resourceConfig[resource];
  const existing = await getResourceItem(resource, id);
  if (!existing) return null;

  await db.delete(config.table as any).where(eq(config.idColumn as any, id));
  return existing;
}

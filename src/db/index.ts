import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { count } from 'drizzle-orm';
import * as tables from './schema';
import { seedData } from './seed';

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
      type: tables.logs.type,
      title: tables.logs.title,
      detail: tables.logs.detail,
      time: tables.logs.time,
      read: tables.logs.read,
    }).from(tables.logs),
  };
}

export async function replaceAppState(state: Record<string, any[]>) {
  await ensureDb();
  await db.delete(tables.assets);
  await db.delete(tables.departments);
  await db.delete(tables.categories);
  await db.delete(tables.employees);
  await db.delete(tables.maintenance);
  await db.delete(tables.bookings);
  await db.delete(tables.audits);
  await db.delete(tables.transfers);
  await db.delete(tables.logs);

  if (state.assets?.length) await db.insert(tables.assets).values(state.assets as any);
  if (state.departments?.length) await db.insert(tables.departments).values(state.departments as any);
  if (state.categories?.length) await db.insert(tables.categories).values(state.categories as any);
  if (state.employees?.length) await db.insert(tables.employees).values(state.employees as any);
  if (state.maintenance?.length) await db.insert(tables.maintenance).values(state.maintenance as any);
  if (state.bookings?.length) await db.insert(tables.bookings).values(state.bookings as any);
  if (state.audits?.length) await db.insert(tables.audits).values(state.audits as any);
  if (state.transfers?.length) await db.insert(tables.transfers).values(state.transfers as any);
  if (state.logs?.length) await db.insert(tables.logs).values(state.logs as any);
}

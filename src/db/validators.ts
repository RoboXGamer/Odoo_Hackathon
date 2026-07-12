import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const status = <T extends [string, ...string[]]>(values: T) => z.enum(values);

export const assetSchema = z.object({
  id: requiredText,
  name: requiredText,
  category: requiredText,
  status: status(['Available', 'Allocated', 'Maintenance', 'Retired']),
  department: requiredText,
  location: requiredText,
  owner: z.string().trim().default('-'),
  updated: z.string().trim().default('Just now'),
});

export const departmentSchema = z.object({
  id: requiredText,
  name: requiredText,
  head: z.string().trim().default(''),
  parent: z.string().trim().default('-'),
  employees: z.coerce.number().int().nonnegative().default(0),
  status: status(['Active', 'Inactive']),
});

export const categorySchema = z.object({
  id: requiredText,
  name: requiredText,
  count: z.coerce.number().int().nonnegative().default(0),
  status: status(['Active', 'Inactive']),
});

export const employeeSchema = z.object({
  id: requiredText,
  name: requiredText,
  department: requiredText,
  email: z.email(),
  status: status(['Active', 'Inactive']),
});

export const maintenanceSchema = z.object({
  id: requiredText,
  asset: requiredText,
  title: requiredText,
  status: status(['Pending', 'Approved', 'Technician assigned', 'In progress', 'Resolved']),
  assignee: z.string().trim().default('Unassigned'),
  date: z.string().trim().default('Just now'),
});

export const bookingSchema = z.object({
  id: requiredText,
  resource: requiredText,
  title: requiredText,
  date: z.iso.date(),
  start: z.iso.time({ precision: -1 }),
  end: z.iso.time({ precision: -1 }),
}).refine((value) => value.end > value.start, {
  message: 'End time must be after start time.',
  path: ['end'],
});

export const auditSchema = z.object({
  asset: requiredText,
  name: requiredText,
  location: requiredText,
  status: status(['Verified', 'Missing', 'Damaged']),
  note: z.string().trim().default(''),
});

export const transferSchema = z.object({
  id: requiredText,
  asset: requiredText,
  to: requiredText,
  reason: requiredText,
  status: status(['Pending', 'Approved', 'Rejected', 'Completed']).default('Pending'),
});

export const logSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  type: requiredText,
  title: requiredText,
  detail: z.string().trim().default(''),
  time: z.string().trim().default('Just now'),
  read: z.coerce.boolean().default(false),
});

export const resourceSchemas = {
  assets: assetSchema,
  departments: departmentSchema,
  categories: categorySchema,
  employees: employeeSchema,
  maintenance: maintenanceSchema,
  bookings: bookingSchema,
  audits: auditSchema,
  transfers: transferSchema,
  logs: logSchema,
} as const;

export type ResourceName = keyof typeof resourceSchemas;
export const resourceNames = Object.keys(resourceSchemas) as ResourceName[];

export function isResourceName(value: string): value is ResourceName {
  return resourceNames.includes(value as ResourceName);
}

export function parseCreate(resource: ResourceName, payload: unknown) {
  return resourceSchemas[resource].parse(payload);
}

export function parseUpdate(resource: ResourceName, payload: unknown) {
  return resourceSchemas[resource].partial().parse(payload);
}

export function zodErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
  }

  return error instanceof Error ? error.message : 'Invalid request';
}

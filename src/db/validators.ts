import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const status = <T extends [string, ...string[]]>(values: T) => z.enum(values);
const blankAsDash = z.string().trim().transform((value) => value || '-');
const normalizedDepartment = z.string().trim().transform((value) => ['-', '—'].includes(value) ? 'Unassigned' : value).pipe(requiredText);
const timeText = z.string().trim().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Expected time in HH:mm format');

export const assetSchema = z.object({
  id: requiredText.optional(),
  name: requiredText,
  serialNumber: z.string().trim().default(''),
  qrCode: z.string().trim().default(''),
  category: requiredText,
  status: status(['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed']).default('Available'),
  condition: status(['New', 'Good', 'Fair', 'Damaged']).default('Good'),
  acquisitionDate: z.string().trim().default(''),
  acquisitionCost: z.coerce.number().nonnegative().default(0),
  shared: z.coerce.boolean().default(false),
  attachments: z.string().trim().default(''),
  department: normalizedDepartment,
  location: requiredText,
  owner: blankAsDash.default('-'),
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
  department: normalizedDepartment,
  email: z.email(),
  userId: z.string().trim().nullable().optional(),
  role: status(['admin', 'asset_manager', 'department_head', 'employee']).default('employee'),
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
  start: timeText,
  end: timeText,
}).refine((value) => value.end > value.start, {
  message: 'End time must be after start time.',
  path: ['end'],
});

export const bookingResourceSchema = z.object({
  id: requiredText,
  name: requiredText,
  type: status(['Room', 'Asset', 'Vehicle', 'Equipment']),
  status: status(['Active', 'Inactive']),
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

export const allocationSchema = z.object({
  id: requiredText,
  asset: requiredText,
  holderType: status(['Employee', 'Department']),
  holder: requiredText,
  allocatedAt: z.string().trim().default(() => new Date().toISOString()),
  expectedReturn: z.string().trim().default(''),
  returnedAt: z.string().trim().default(''),
  status: status(['Active', 'Returned']).default('Active'),
  checkInCondition: z.string().trim().default(''),
  checkInNotes: z.string().trim().default(''),
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
  bookingResources: bookingResourceSchema,
  maintenance: maintenanceSchema,
  bookings: bookingSchema,
  audits: auditSchema,
  transfers: transferSchema,
  allocations: allocationSchema,
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

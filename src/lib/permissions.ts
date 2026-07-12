import type { APIContext } from 'astro';
import { auth } from './auth';
import type { ResourceName } from '../db/validators';

type Action = 'read' | 'create' | 'update' | 'delete';
type Role = 'admin' | 'asset_manager' | 'department_head' | 'employee';

const managerWritable: ResourceName[] = [
  'assets',
  'departments',
  'categories',
  'employees',
  'bookingResources',
  'maintenance',
  'bookings',
  'audits',
  'transfers',
  'logs',
];

function can(role: Role, resource: ResourceName, action: Action) {
  if (role === 'admin') return true;
  if (['departments', 'categories', 'employees'].includes(resource)) return action === 'read';
  if (role === 'employee') {
    return action === 'read' || (action === 'create' && ['bookings', 'maintenance', 'transfers'].includes(resource));
  }
  if (action === 'read') return true;
  if (action === 'delete') return false;
  return managerWritable.includes(resource);
}

export async function authorizeResourceRequest(context: APIContext, resource: ResourceName, action: Action) {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (!session) {
    return Response.json({ ok: false, error: 'Authentication required' }, { status: 401 });
  }

  const role = ((session.user as { role?: string }).role ?? 'employee') as Role;
  if (!can(role, resource, action)) {
    return Response.json({ ok: false, error: 'You do not have permission to perform this action' }, { status: 403 });
  }

  return null;
}

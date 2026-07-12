import type { APIRoute } from 'astro';
import { deleteResourceItem, getResourceItem, updateResourceItem } from '../../../db';
import { isResourceName, zodErrorMessage } from '../../../db/validators';

export const prerender = false;

function notFound(message: string) {
  return Response.json({ ok: false, error: message }, { status: 404 });
}

export const GET: APIRoute = async ({ params }) => {
  const { resource, id } = params;
  if (!resource || !isResourceName(resource)) return notFound(`Unknown resource: ${resource ?? ''}`);
  if (!id) return notFound('Missing item id');

  const item = await getResourceItem(resource, id);
  if (!item) return notFound(`${resource} item not found`);

  return Response.json(item);
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const { resource, id } = params;
  if (!resource || !isResourceName(resource)) return notFound(`Unknown resource: ${resource ?? ''}`);
  if (!id) return notFound('Missing item id');

  try {
    const item = await updateResourceItem(resource, id, await request.json());
    if (!item) return notFound(`${resource} item not found`);
    return Response.json({ ok: true, item });
  } catch (error) {
    return Response.json({ ok: false, error: zodErrorMessage(error) }, { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { resource, id } = params;
  if (!resource || !isResourceName(resource)) return notFound(`Unknown resource: ${resource ?? ''}`);
  if (!id) return notFound('Missing item id');

  const item = await deleteResourceItem(resource, id);
  if (!item) return notFound(`${resource} item not found`);

  return Response.json({ ok: true, item });
};

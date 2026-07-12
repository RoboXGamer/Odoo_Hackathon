import type { APIRoute } from 'astro';
import { createResourceItem, listResource } from '../../../db';
import { isResourceName, zodErrorMessage } from '../../../db/validators';

export const prerender = false;

function notFound(resource: string) {
  return Response.json({ ok: false, error: `Unknown resource: ${resource}` }, { status: 404 });
}

export const GET: APIRoute = async ({ params }) => {
  const resource = params.resource;
  if (!resource || !isResourceName(resource)) return notFound(resource ?? '');

  return Response.json(await listResource(resource));
};

export const POST: APIRoute = async ({ params, request }) => {
  const resource = params.resource;
  if (!resource || !isResourceName(resource)) return notFound(resource ?? '');

  try {
    const item = await createResourceItem(resource, await request.json());
    return Response.json({ ok: true, item }, { status: 201 });
  } catch (error) {
    return Response.json({ ok: false, error: zodErrorMessage(error) }, { status: 400 });
  }
};

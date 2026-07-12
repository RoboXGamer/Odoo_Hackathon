import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async () => {
  return Response.json(
    { ok: false, error: 'Use resource CRUD endpoints under /api/:resource instead.' },
    { status: 410 },
  );
};

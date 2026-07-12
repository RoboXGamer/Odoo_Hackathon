import type { APIRoute } from 'astro';
import { replaceAppState } from '../../db';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
  try {
    const state = await request.json();
    await replaceAppState(state);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save state';
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
};

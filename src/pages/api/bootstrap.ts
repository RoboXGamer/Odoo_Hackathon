import type { APIRoute } from 'astro';
import { getAppState } from '../../db';

export const prerender = false;

export const GET: APIRoute = async () => {
  return Response.json(await getAppState());
};

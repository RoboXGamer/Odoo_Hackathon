import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

const publicPaths = ['/login', '/signup'];

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isAuthApi = path.startsWith('/api/auth');
  const isPublicAsset = path.startsWith('/favicon') || path.startsWith('/_astro');
  const isPublicPage = publicPaths.includes(path);

  if (isAuthApi || isPublicAsset) return next();

  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (!session && !isPublicPage) {
    return context.redirect('/login');
  }

  if (session && isPublicPage) {
    return context.redirect('/');
  }

  return next();
});

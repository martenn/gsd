import { defineMiddleware } from 'astro:middleware';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

const PROTECTED_ROUTES = ['/app'];
const PUBLIC_ROUTES = ['/', '/auth', '/privacy', '/terms', '/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );

  if (!isProtectedRoute || isPublicRoute) {
    return next();
  }

  try {
    const cookies = context.request.headers.get('cookie') || '';

    const authResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
        cookie: cookies,
      },
      credentials: 'include',
    });

    if (!authResponse.ok) {
      return context.redirect('/', 302);
    }

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return context.redirect('/', 302);
  }
});

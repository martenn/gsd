import { defineMiddleware } from 'astro:middleware';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

const PROTECTED_ROUTES = ['/app'];
const PUBLIC_ROUTES = ['/', '/auth', '/privacy', '/terms', '/logout'];

function addSecurityHeaders(response: Response): void {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' " +
      (API_URL || 'http://localhost:3000') +
      '; ' +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );

  if (!isProtectedRoute || isPublicRoute) {
    const response = await next();
    addSecurityHeaders(response);
    return response;
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

    const response = await next();
    addSecurityHeaders(response);
    return response;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return context.redirect('/', 302);
  }
});

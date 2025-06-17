import { NextRequest, NextResponse } from 'next/server';
import i18nConfig, { type SupportedLocale, getDefaultLocale } from './i18nconfig';

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return i18nConfig.locales.includes(locale as SupportedLocale);
}

function getPreferredLocale(request: NextRequest): SupportedLocale {
  const cookieLocale = request.cookies.get('preferred-locale')?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Use dynamic default based on Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  return getDefaultLocale(acceptLanguage || undefined);
}

function extractLocaleFromPathname(pathname: string): {
  locale: string | null;
  isValid: boolean;
  pathWithoutLocale: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (potentialLocale && isSupportedLocale(potentialLocale)) {
    return {
      locale: potentialLocale,
      isValid: true,
      pathWithoutLocale: '/' + segments.slice(1).join('/')
    };
  }
  
  return {
    locale: potentialLocale || null,
    isValid: false,
    pathWithoutLocale: pathname
  };
}

function createRedirectWithCookie(
  url: string, 
  request: NextRequest, 
  locale: SupportedLocale
): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url));
  
  // Always set/update the cookie on redirects
  response.cookies.set('preferred-locale', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/' // Ensure cookie is available site-wide
  });
  
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Handle root path - redirect based on system preference
  if (pathname === '/') {
    const preferredLocale = getPreferredLocale(request);
    return createRedirectWithCookie(`/${preferredLocale}`, request, preferredLocale);
  }

  // Extract and validate locale from pathname
  const { locale, isValid, pathWithoutLocale } = extractLocaleFromPathname(pathname);
  
  // If no locale in path, redirect with preferred locale
  if (!locale) {
    const preferredLocale = getPreferredLocale(request);
    return createRedirectWithCookie(`/${preferredLocale}${pathname}`, request, preferredLocale);
  }
  
  // If invalid locale in path, redirect with preferred locale
  if (!isValid) {
    const preferredLocale = getPreferredLocale(request);
    return createRedirectWithCookie(`/${preferredLocale}${pathWithoutLocale}`, request, preferredLocale);
  }

  // Valid locale found - update cookie if different from current preference
  const currentCookieLocale = request.cookies.get('preferred-locale')?.value;
  if (currentCookieLocale !== locale) {
    const response = NextResponse.next();
    response.cookies.set('preferred-locale', locale as SupportedLocale, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // More specific matcher to avoid unnecessary middleware calls
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ]
};

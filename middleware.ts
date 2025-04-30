import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/me'];

// Middleware para proteção de rotas
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se o caminho atual é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth/') || pathname.startsWith('/_next/')
  );
  
  // Se for uma rota pública, permite o acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Verificar se o usuário tem um cookie de sessão
  const hasCookie = request.cookies.has('dash_session');
  
  // Se não tiver cookie e não for rota pública, redireciona para login
  if (!hasCookie) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // Caso contrário, permite o acesso
  return NextResponse.next();
}

// Configurar quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  const authRequiredPages = ['/dashboard', '/generate-invite'];
  const authPages = ['/login', '/signup', '/admin-login'];

  // Se serve autenticazione e non c'è sessione → vai su login
  if (!session && authRequiredPages.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Verifica se admin sta accedendo a pagina protetta
  if (session && authRequiredPages.includes(path)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Se non è admin → vai su login
    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Se utente è autenticato e accede a login/signup → vai a dashboard
  if (session && authPages.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard', '/generate-invite', '/login', '/signup', '/admin-login'],
};

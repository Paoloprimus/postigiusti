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
  const authPages = ['/login', '/signup'];

  // 🔐 Caso 1 - Accesso a pagina protetta SENZA sessione
  if (!session && authRequiredPages.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ✅ Caso 2 - Accesso a pagina pubblica MA hai già sessione
  if (session && authPages.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ✅ Caso 3 - Sei loggato e stai accedendo a pagina protetta
  if (session && authRequiredPages.includes(path)) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      // Reindirizza se non sei admin
      return NextResponse.redirect(new URL('/login?notAdmin=1', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard', '/generate-invite', '/login', '/signup'],
};

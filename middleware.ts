// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Pagine che richiedono autenticazione
  const authRequiredPages = ['/dashboard', '/generate-invite'];
  // Pagine per utenti non autenticati
  const authPages = ['/login', '/signup'];

  // Redirect a login se non autenticato e prova ad accedere a pagine protette
  if (!session && authRequiredPages.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Redirect a dashboard se già autenticato e prova ad accedere a pagine di login
  if (session && authPages.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard', '/generate-invite', '/login', '/signup'],
};// Middleware per la gestione dell'autenticazione
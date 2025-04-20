// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ListingCard from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import { Listing, Review, Filters } from '../lib/types';
import Link from 'next/link';
import AdminLink from '../components/AdminLink';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  /* stato auth */
  const [sessionReady, setSessionReady]   = useState(false);   // sappiamo di avere / non avere la sessione
  const [sessionUser,  setSessionUser]    = useState<any>(null);
  const [isAdmin,      setIsAdmin]        = useState<boolean | null>(null); // null = verifica in corso

  /* stato dati */
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews,  setReviews]  = useState<{[k:string]:Review[]}>({});
  const [loading,  setLoading]  = useState(true);

  /* ─────────────────────────────  AUTH  ───────────────────────────── */
  useEffect(() => {
    // 1. sessione al primo render
    supabase.auth.getSession().then(({ data:{session} }) => {
      setSessionUser(session?.user ?? null);
      setSessionReady(true);
    });

    // 2. listener runtime (login / logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSessionUser(sess?.user ?? null);
      setSessionReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ───────────────────  controllo ruolo admin + fetch  ────────────── */
  useEffect(() => {
    if (!sessionUser) {                // non loggato
      setIsAdmin(false);
      return;
    }

    // verifica ruolo
    const check = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUser.id)
        .single();

      if (error || !data || data.role !== 'admin') {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        fetchListings();               // carica dati solo se admin
      }
    };
    check();
  }, [sessionUser]);

  /* ───────────────────────────  query listings  ───────────────────── */
  const fetchListings = async (filters: Filters = {}) => {
    setLoading(true);

    let q = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending:false });

    if (filters.location) q = q.ilike('location', `%${filters.location}%`);
    if (filters.school)   q = q.ilike('school',   `%${filters.school}%`);
    if (filters.maxPrice) q = q.lte ('price',     filters.maxPrice);
    if (filters.minBeds)  q = q.gte ('beds',      filters.minBeds);

    const { data, error } = await q;
    if (data && !error) {
      setListings(data);

      if (data.length) {
        const ids = data.map(l => l.id);
        const { data:rev } = await supabase
          .from('reviews')
          .select('*')
          .in('listing_id', ids)
          .order('created_at', { ascending:true });

        if (rev) {
          const byListing = rev.reduce((acc:any, r:Review) => {
            (acc[r.listing_id] ||= []).push(r);
            return acc;
          }, {});
          setReviews(byListing);
        }
      }
    }
    setLoading(false);
  };

  const handleFilter = (f:Filters) => fetchListings(f);

  /* ───────────────────────────  RENDER  ──────────────────────────── */
  if (!sessionReady) {
    return <Layout title="Attendere…"><p className="p-6 text-center">Caricamento…</p></Layout>;
  }

  if (!sessionUser) {
    return (
      <Layout title="Accesso richiesto">
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Devi effettuare il login</h1>
          <Link href="/login" className="text-blue-600 underline">Torna alla pagina di accesso</Link>
        </div>
      </Layout>
    );
  }

  if (isAdmin === false) {
    return (
      <Layout title="Accesso negato">
        <div className="p-6 text-center text-red-600">
          <h1 className="text-xl font-semibold mb-2">Accesso riservato agli amministratori</h1>
        </div>
      </Layout>
    );
  }

  if (isAdmin === null) {
    return <Layout title="Verifica permessi…"><p className="p-6 text-center">Verifica dei permessi…</p></Layout>;
  }

  /* ───────────────  qui siamo certi di essere ADMIN  ─────────────── */
  return (
    <Layout title="AlloggiPrecari - Dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Alloggi per Precari della Scuola</h1>
        <p className="text-gray-600">Piattaforma dedicata allo scambio di informazioni su alloggi per docenti e personale&nbsp;ATA precario.</p>
      </div>

      <SearchFilters onFilter={handleFilter} />

      {loading ? (
        <div className="text-center py-10"><p>Caricamento annunci in corso…</p></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">Nessun annuncio trovato</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(l => (
            <ListingCard key={l.id} listing={l} initialReviews={reviews[l.id] || []}/>
          ))}
        </div>
      )}

      <div className="mt-8 text-sm text-right"><AdminLink/></div>
    </Layout>
  );
}

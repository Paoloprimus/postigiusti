// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ListingCard from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import { useSession } from '@supabase/auth-helpers-react';
import { Listing, Review, Filters } from '../lib/types';
import Link from 'next/link';
import AdminLink from '../components/AdminLink';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null: in attesa

  const session = useSession();
  const isLoggedIn = !!session;

  useEffect(() => {
    if (session) {
      checkAdmin();
      fetchListings();
    }
  }, [session]);

  const checkAdmin = async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session?.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
  };

  const fetchListings = async (filters: Filters = {}) => {
    setLoading(true);

    let query = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.school) {
      query = query.ilike('school', `%${filters.school}%`);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.minBeds) {
      query = query.gte('beds', filters.minBeds);
    }

    const { data, error } = await query;

    if (data && !error) {
      setListings(data);

      if (data.length > 0) {
        const listingIds = data.map((listing) => listing.id);
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: true });

        if (reviewsData) {
          const reviewsByListing = reviewsData.reduce((acc, review) => {
            if (!acc[review.listing_id]) {
              acc[review.listing_id] = [];
            }
            acc[review.listing_id].push(review);
            return acc;
          }, {} as { [key: string]: Review[] });

          setReviews(reviewsByListing);
        }
      }
    }

    setLoading(false);
  };

  const handleFilter = (filters: Filters) => {
    fetchListings(filters);
  };

  if (!isLoggedIn) {
    return (
      <Layout title="Accesso richiesto">
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Devi effettuare il login</h1>
          <Link href="/login" className="text-blue-600 underline">
            Torna alla pagina di accesso
          </Link>
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
    return (
      <Layout title="Caricamento...">
        <div className="p-6 text-center">
          <p>Verifica dei permessi in corso...</p>
        </div>
      </Layout>
    );
  }

  // ✅ Accesso valido
  return (
    <Layout title="AlloggiPrecari - Home">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Alloggi per Precari della Scuola</h1>
        <p className="text-gray-600">
          Piattaforma dedicata allo scambio di informazioni su alloggi per docenti e personale ATA precario.
        </p>
      </div>

      <SearchFilters onFilter={handleFilter} />

      {loading ? (
        <div className="text-center py-10">
          <p>Caricamento annunci in corso...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">Nessun annuncio trovato</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              initialReviews={reviews[listing.id] || []}
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-sm text-right">
        <AdminLink />
      </div>
    </Layout>
  );
}

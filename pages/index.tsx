// pages/index.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ListingCard from '../components/ListingCard';
import SearchFilters from '../components/SearchFilters';
import { supabase } from '../lib/supabase';
import { Listing, Review } from '../lib/types';
import Link from 'next/link';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<{[key: string]: Review[]}>({});
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    
    checkSession();
    fetchListings();
  }, []);

  const fetchListings = async (filters = {}) => {
    setLoading(true);
    
    let query = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Applica i filtri
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
      
      // Fetch reviews for all listings
      if (data.length > 0) {
        const listingIds = data.map(listing => listing.id);
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .in('listing_id', listingIds)
          .order('created_at', { ascending: true });
          
        if (reviewsData) {
          // Group reviews by listing_id
          const reviewsByListing = reviewsData.reduce((acc, review) => {
            if (!acc[review.listing_id]) {
              acc[review.listing_id] = [];
            }
            acc[review.listing_id].push(review);
            return acc;
          }, {});
          
          setReviews(reviewsByListing);
        }
      }
    }
    
    setLoading(false);
  };

  const handleFilter = (filters) => {
    fetchListings(filters);
  };

  return (
    <Layout title="AlloggiPrecari - Home">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Alloggi per Precari della Scuola</h1>
        <p className="text-gray-600">
          Piattaforma dedicata allo scambio di informazioni su alloggi per docenti e personale ATA precario.
        </p>
      </div>
      
      {!isLoggedIn && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Benvenuto su AlloggiPrecari
          </h2>
          <p className="mb-3">
            Questa piattaforma è riservata ai precari della scuola. 
            Per accedere hai bisogno di un invito da un membro esistente.
          </p>
          <div>
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block mr-2"
            >
              Accedi
            </Link>
            <Link 
              href="/signup" 
              className="bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 inline-block"
            >
              Registrati con invito
            </Link>
          </div>
        </div>
      )}
      
      <SearchFilters onFilter={handleFilter} />
      
      {loading ? (
        <div className="text-center py-10">
          <p>Caricamento annunci in corso...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-600">Nessun annuncio trovato</p>
          {isLoggedIn && (
            <p className="mt-2">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:underline"
              >
                Pubblica il primo annuncio
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              initialReviews={reviews[listing.id] || []}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

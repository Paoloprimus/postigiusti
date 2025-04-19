// components/ListingCard.tsx
import { useState } from 'react';
import { Listing, Review } from '../lib/types';
import { supabase } from '../lib/supabase';

interface ListingCardProps {
  listing: Listing;
  initialReviews?: Review[];
}

export default function ListingCard({ listing, initialReviews = [] }: ListingCardProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showReviews, setShowReviews] = useState(false);
  const [newReview, setNewReview] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.trim().length === 0 || newReview.length > 124) return;
    
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        listing_id: listing.id,
        content: newReview.trim()
      })
      .select('*')
      .single();
      
    if (data && !error) {
      setReviews([...reviews, data]);
      setNewReview('');
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{listing.location}</h3>
          <p className="text-gray-500 text-sm">
            Pubblicato il {formatDate(listing.created_at)}
            {listing.school && ` • Scuola: ${listing.school}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-blue-600">{listing.price}€/mese</p>
          <p className="text-sm">{listing.beds} {listing.beds > 1 ? 'posti' : 'posto'}</p>
        </div>
      </div>
      
      <p className="my-2 text-gray-700">{listing.description}</p>
      
      <div className="text-sm text-gray-600 italic mt-2">
        Contatto: {listing.contact_info}
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <button 
          onClick={() => setShowReviews(!showReviews)}
          className="text-blue-600 text-sm hover:underline"
        >
          {showReviews ? 'Nascondi valutazioni' : `Mostra valutazioni (${reviews.length})`}
        </button>
        
        {showReviews && (
          <div className="mt-2">
            {reviews.length > 0 ? (
              <div className="space-y-2">
                {reviews.map(review => (
                  <div key={review.id} className="text-sm bg-gray-50 p-2 rounded">
                    <p>{review.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessuna valutazione disponibile</p>
            )}
            
            <form onSubmit={handleAddReview} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                maxLength={124}
                placeholder="Aggiungi una valutazione (max 124 caratteri)"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                disabled={newReview.trim().length === 0}
              >
                Invia
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
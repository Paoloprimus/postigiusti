export interface Listing {
    id: string;
    created_at: string;
    user_id: string;
    location: string;
    school?: string;
    price: number;
    beds: number;
    description: string;
    contact_info: string;
  }
  
  export interface Review {
    id: string;
    listing_id: string;
    user_id: string;
    content: string;
    created_at: string;
  }
  
export interface InviteRow {
  id: string;
  token: string;
  email: string | null;
  invited_by: string;            // chi ha creato l'invito
  approved_by: string | null;    // admin che lo approva
  used_by: string | null;        // nuovo membro che lo usa
  approved: boolean;             // true quando l'admin approva
  used: boolean;                 // true dopo la registrazione

  created_at: string;            // ISO timestamp
}

  export type Filters = {
    location?: string;
    school?: string;
    maxPrice?: number;
    minBeds?: number;
  }

 export type Report = {
  id: string;
  reported_by: string;
  reported_user: string;
  item_type: 'post' | 'comment';
  item_id: string;
  content_excerpt: string;
  status: 'open' | 'reviewed' | 'dismissed';
  created_at: string;
};


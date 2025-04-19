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
  
  export interface Invite {
    id: string;
    created_at: string;
    invited_by: string;
    email?: string;
    token: string;
    used: boolean;
    used_by?: string;
  }

  export type Filters = {
    location?: string;
    school?: string;
    maxPrice?: number;
    minBeds?: number;
  }
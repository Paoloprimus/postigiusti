// pages/api/reviews.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });
  
  // Verifica autenticazione
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return res.status(401).json({
      error: 'Non autorizzato'
    });
  }

  // Gestisci le diverse operazioni
  switch (req.method) {
    case 'POST':
      return handleCreateReview(req, res, supabase, session);
    default:
      return res.status(405).json({ error: 'Metodo non permesso' });
  }
}

async function handleCreateReview(req, res, supabase, session) {
  const { listing_id, content } = req.body;
  
  // Validazione
  if (!listing_id || !content) {
    return res.status(400).json({ error: 'Dati incompleti' });
  }
  
  if (content.length > 124) {
    return res.status(400).json({ error: 'Contenuto troppo lungo (max 124 caratteri)' });
  }
  
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: session.user.id,
      listing_id,
      content
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(201).json(data);
}
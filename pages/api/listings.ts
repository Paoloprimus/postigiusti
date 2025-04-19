// pages/api/listings.ts
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
    case 'GET':
      return handleGetListings(req, res, supabase, session);
    case 'POST':
      return handleCreateListing(req, res, supabase, session);
    default:
      return res.status(405).json({ error: 'Metodo non permesso' });
  }
}

async function handleGetListings(req, res, supabase, session) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json(data);
}

async function handleCreateListing(req, res, supabase, session) {
  const { location, school, price, beds, description, contact_info } = req.body;
  
  // Validazione
  if (!location || !price || !description || !contact_info) {
    return res.status(400).json({ error: 'Dati incompleti' });
  }
  
  if (description.length > 252) {
    return res.status(400).json({ error: 'Descrizione troppo lunga (max 252 caratteri)' });
  }
  
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: session.user.id,
      location,
      school: school || null,
      price: parseFloat(price),
      beds: parseInt(beds || '1'),
      description,
      contact_info
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(201).json(data);
}
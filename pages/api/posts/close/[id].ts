// pages/api/posts/close/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('✅ ENTERED API /api/posts/close/[id]');

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { id } = req.query;
  const numericId = Number(id);

  if (isNaN(numericId)) {
    return res.status(400).json({ error: 'ID non valido' });
  }

  // 🔥 Recupera il token passato dal client
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    console.error('❌ Token mancante nella richiesta');
    return res.status(401).json({ error: 'Token mancante' });
  }

  // 🔥 Crea il client autenticato con il token dell'utente
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // 🔥 Aggiorna il campo "closed" = true
  const { error: updateError } = await supabase
    .from('posts')
    .update({ closed: true })
    .eq('id', numericId);

  if (updateError) {
    console.error('❌ Errore durante l\'update:', updateError);
    return res.status(500).json({ error: 'Errore durante l\'update' });
  }

  // 🔥 Legge il post aggiornato
  const { data, error: fetchError } = await supabase
    .from('posts')
    .select('id, closed')
    .eq('id', numericId)
    .single();

  if (fetchError) {
    console.error('❌ Errore nel recupero:', fetchError);
    return res.status(500).json({ error: 'Errore nella lettura post' });
  }

  console.log('📦 Post aggiornato correttamente:', data);
  return res.status(200).json({ message: 'Post barrato con successo', updated: data });
}

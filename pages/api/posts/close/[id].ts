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

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 🔁 Fase 1: aggiornamento
  const { error: updateError } = await supabase
    .from('posts')
    .update({ closed: true })
    .eq('id', numericId);

  if (updateError) {
    console.error('❌ Errore durante update:', updateError);
    return res.status(500).json({ error: 'Errore durante update' });
  }

  // 🔍 Fase 2: verifica
  const { data, error: fetchError } = await supabase
    .from('posts')
    .select('id, closed')
    .eq('id', numericId)
    .single();

  if (fetchError) {
    console.error('❌ Errore nel recupero:', fetchError);
    return res.status(500).json({ error: 'Errore nella lettura post' });
  }

  console.log('📦 Post aggiornato:', data);
  return res.status(200).json({ message: 'Post barrato', updated: data });
}

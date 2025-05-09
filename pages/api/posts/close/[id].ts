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
  console.log('👉 id:', id, 'as number:', Number(id));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error: updateError } = await supabase
    .from('posts') // 🔥 assicurato: tabella vera
    .update({ closed: true })
    .eq('id', Number(id));

  if (updateError) {
    console.error('❌ Update error:', updateError);
    return res.status(500).json({ error: 'Errore durante la barratura del post' });
  }

  console.log('✅ Post aggiornato con successo');
  return res.status(200).json({ message: 'Post barrato con successo' });
}

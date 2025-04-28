// pages/api/posts/[postId]/close.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { postId } = req.query;

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  const { error: updateError } = await supabase
    .from('posts')
    .update({ closed: true })
    .eq('id', Number(postId))

  if (updateError) {
    return res.status(500).json({ error: 'Errore durante la barratura del post' });
  }

  return res.status(200).json({ message: 'Post barrato con successo' });
}

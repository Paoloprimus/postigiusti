// pages/api/comments/[commentId]/replies.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Recupera url e anon key da env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

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

  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Contenuto della risposta mancante o non valido.' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ error: 'Errore nel recupero del profilo utente' });
  }

  const { error: insertError } = await supabase.from('replies').insert({
    comment_id: Number(commentId),
    content,
    author: user.id,
    nickname: profile.nickname,
  });

  if (insertError) {
    return res.status(500).json({ error: 'Errore durante il salvataggio della risposta' });
  }

  return res.status(200).json({ message: 'Risposta salvata con successo' });
}

// pages/api/comments/[commentId]/replies.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { commentId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Recupera dati dalla richiesta
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Contenuto della risposta mancante o non valido.' });
  }

  // Recupera il token utente (se disponibile)
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', '') || '');

  if (sessionError || !sessionData?.user) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  const userId = sessionData.user.id;

  // Recupera il nickname dell'utente loggato
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ error: 'Errore nel recupero del profilo utente' });
  }

  // Inserisce la risposta nella tabella replies
  const { error: insertError } = await supabase.from('replies').insert({
    comment_id: Number(commentId),
    content,
    author: userId,
    nickname: profile.nickname,
  });

  if (insertError) {
    return res.status(500).json({ error: 'Errore durante il salvataggio della risposta' });
  }

  return res.status(200).json({ message: 'Risposta salvata con successo' });
}

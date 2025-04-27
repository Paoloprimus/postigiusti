// pages/api/comments/replies.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { commentIds } = req.query;

  if (!commentIds || typeof commentIds !== 'string') {
    return res.status(400).json({ error: 'Parametri non validi' });
  }

  const idsArray = commentIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

  if (idsArray.length === 0) {
    return res.status(400).json({ error: 'Nessun ID valido' });
  }

  const { data, error } = await supabase
    .from('replies')
    .select('id, comment_id, content, author, nickname, created_at')
    .in('comment_id', idsArray)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Errore nel recupero delle risposte' });
  }

  return res.status(200).json(data);
}

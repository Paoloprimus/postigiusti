import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';  // import assoluto

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parametro dinamico provinceId
  const { provinceId } = req.query;
  if (!provinceId || Array.isArray(provinceId)) {
    return res.status(400).json({ error: 'Invalid provinceId' });
  }
  const pid = parseInt(provinceId, 10);
  if (isNaN(pid)) {
    return res.status(400).json({ error: 'provinceId is not a number' });
  }

  // Controllo sessione
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { title, content } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid title' });
  }

  // Inserimento nuovo post
  const { data, error } = await supabase
    .from('listings')  // o il nome della tabella dei post
    .insert({
      province_id: pid,
      title,
      content,
      author_id: session.user.id,
    })
    .select('*');

  if (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data![0]);
}

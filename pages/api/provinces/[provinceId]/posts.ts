// pages/api/provinces/[provinceId]/posts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provinceId } = req.query;
  if (!provinceId || Array.isArray(provinceId)) {
    return res.status(400).json({ error: 'Invalid provinceId' });
  }
  const pid = parseInt(provinceId, 10);
  if (isNaN(pid)) {
    return res.status(400).json({ error: 'provinceId is not a number' });
  }

  // --- GET branch semplificato ---
  if (req.method === 'GET') {
    try {
      // selezioniamo SOLO i campi base e l'id dell'autore
      const limit = typeof req.query.limit === 'string'
        ? parseInt(req.query.limit, 10)
        : undefined;

      let query = supabase
        .from('listings')
        .select('id, title, author_id, created_at, isDeleted')
        .eq('province_id', pid)
        .order('created_at', { ascending: false });

      if (limit && !isNaN(limit)) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- POST branch rimane identico ---
  if (req.method === 'POST') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { title, content } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid title' });
    }
    const { data, error } = await supabase
      .from('listings')
      .insert({
        province_id: pid,
        title,
        content: content || '',
        author_id: session.user.id,
      })
      .select('*');

    if (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data![0]);
  }

  res.setHeader('Allow', ['GET','POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

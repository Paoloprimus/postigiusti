// pages/api/provinces/[provinceId]/posts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Controllo provinceId
  const { provinceId } = req.query;
  if (!provinceId || Array.isArray(provinceId)) {
    return res.status(400).json({ error: 'Invalid provinceId' });
  }
  const pid = parseInt(provinceId, 10);
  if (isNaN(pid)) {
    return res.status(400).json({ error: 'provinceId is not a number' });
  }

  // GET /api/provinces/:provinceId/posts?limit=5
  if (req.method === 'GET') {
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 0;
    const query = supabase
      .from('listings')
      .select('id,title,author:profiles(id,nickname),created_at,isDeleted')
      .eq('province_id', pid)
      .order('created_at', { ascending: false });
    if (limit && !isNaN(limit)) {
      query.limit(limit);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
  }

  // POST /api/provinces/:provinceId/posts
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
      .select('id,title,author:profiles(id,nickname),created_at,isDeleted');
    if (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data![0]);
  }

  // Metodo non supportato
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

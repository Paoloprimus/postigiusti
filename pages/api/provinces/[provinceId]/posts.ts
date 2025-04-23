// pages/api/provinces/[provinceId]/posts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Validazione provinceId
  const { provinceId } = req.query;
  if (!provinceId || Array.isArray(provinceId)) {
    return res.status(400).json({ error: 'Invalid provinceId' });
  }
  const pid = parseInt(provinceId, 10);
  if (isNaN(pid)) {
    return res.status(400).json({ error: 'provinceId is not a number' });
  }

  // 2) GET /api/provinces/:provinceId/posts?limit=5
  if (req.method === 'GET') {
    try {
      const limit = typeof req.query.limit === 'string'
        ? parseInt(req.query.limit, 10)
        : undefined;

      let query = supabase
        .from('posts')            // la tua tabella dei post
        .select('id,content,author,created_at,province_id')
        .eq('province_id', pid)
        .order('created_at', { ascending: false });

      if (limit && !isNaN(limit)) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase GET error:', error);
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json(data ?? []);
    } catch (err: any) {
      console.error('Unexpected GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 3) POST /api/provinces/:provinceId/posts
  if (req.method === 'POST') {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, content } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid title' });
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        province_id: pid,
        content: title,        // se usi content per testo
        author: session.user.id,
      })
      .select('id,content,author,created_at,province_id');

    if (error) {
      console.error('Supabase POST error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data![0]);
  }

  // 4) Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

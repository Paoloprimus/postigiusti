// pages/api/provinces/[provinceId]/posts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provinceId } = req.query;
  if (!provinceId || Array.isArray(provinceId)) {
    return res.status(400).json({ error: 'Invalid provinceId' });
  }

  const pid = parseInt(provinceId as string, 10);
  if (isNaN(pid)) {
    return res.status(400).json({ error: 'provinceId is not a number' });
  }

  // Branch GET aggiornato usando la vista posts_with_authors
  if (req.method === 'GET') {
    try {
      const limit = typeof req.query.limit === 'string'
        ? parseInt(req.query.limit, 10)
        : undefined;

      let query = supabase
        .from('posts_with_authors')
        .select('*')
        .eq('province_id', pid)
        .order('created_at', { ascending: false });

      if (limit && !isNaN(limit)) query = query.limit(limit);

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

  // Branch POST lasciato uguale
  if (req.method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, type } = req.body;
    if (
      !title || typeof title !== 'string' ||
      !type || !['cerco', 'offro'].includes(type)
    ) {
      return res.status(400).json({ error: 'Missing or invalid title/type' });
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        province_id: pid,
        content: title,
        author: user.id,
        type,
      })
        .select(`
          id,
          content,
          author,
          created_at,
          province_id,
          type,
          closed,
          profiles (
            role,
            nickname,
            agency_name
          )
        `)

    if (error) {
      console.error('Supabase POST error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data![0]);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

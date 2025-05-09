// /pages/api/posts/[postId]/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Client “server-side” per poter fare join su profiles
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // se manca la service-role usa l'anon key
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as { postId: string };
  const postIdNumber = Number(postId);
  console.log('Post ID ricevuto:', postIdNumber);

  switch (req.method) {
    // ------------------------------------------------ GET commenti
    case 'GET': {
      const { data, error } = await supabase
        .from('comments_with_authors')
        .select('*')
        .eq('post_id', postIdNumber)
        .order('created_at', { ascending: false });

      console.log('DATA RICEVUTI DA SUPABASE:', data);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // ------------------------------------------------ POST nuovo commento
    case 'POST': {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Non autenticato' });

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser(token);
      if (authErr || !user)
        return res.status(401).json({ error: 'Non autenticato' });

      const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const { content } = req.body as { content: string };
      if (!content?.trim())
        return res.status(400).json({ error: 'Commento vuoto' });

      const { error } = await supabaseUser.from('comments').insert({
        post_id: postId,
        author: user.id,
        content: content.trim(),
      });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).end();
    }

    // ------------------------------------------------ metodi non ammessi
    default:
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).end();
  }
}

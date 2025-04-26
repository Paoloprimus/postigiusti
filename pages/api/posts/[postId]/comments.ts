// /pages/api/posts/[postId]/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';     // se usi la gen di tipi

// Client “server-side” per poter fare join su profiles
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!        // variabile solo backend
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as { postId: string };

  switch (req.method) {
    /** GET /api/posts/{id}/comments
     *  => lista di commenti con nickname autore
     */
    case 'GET': {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at,
          author:profiles!comments_author_fkey(id, nickname, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at');

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    /** POST /api/posts/{id}/comments
     *  body: { content: string }
     */
    case 'POST': {
      // 1. Autenticazione utente
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user)
        return res.status(401).json({ error: 'Non autenticato' });

      const { content } = req.body;
      if (!content?.trim())
        return res.status(400).json({ error: 'Commento vuoto' });

      // 2. Inserimento
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        author: user.id,          // uuid dello user loggato
        content: content.trim(),
      });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).end();               // 201 Created
    }

    /** Metodi non ammessi */
    default:
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).end();
  }
}

// pages/dashboard.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CreatePostForm from '../components/CreatePostForm';

type Post = {
  id: number;
  content: string;
  created_at: string;
  author: string;
  // se in futuro salverai anche l'user_id, aggiungilo qui:
  // user_id?: string;
};

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  // Carica i post al primo accesso
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      setPosts(data as Post[]);
    }
  }

  // Funzione per segnalare un post
  async function handleReport(post: Post) {
    if (!confirm('Sei sicuro di voler segnalare questo contenuto?')) return;

    // Prendiamo un estratto dei primi 100 caratteri
    const excerpt = post.content.slice(0, 100);

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Se in futuro avrai user_id nella tabella posts, mettilo qui:
        reported_user: post.author,
        item_type: 'post',
        item_id: post.id,
        content_excerpt: excerpt,
      }),
    });

    if (res.ok) {
      alert('Segnalazione inviata con successo.');
    } else {
      const err = await res.json();
      alert('Errore durante la segnalazione: ' + err.error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Bacheca Postigiusti
      </h1>

      <div className="space-y-4 mb-8">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border rounded p-4 shadow-sm bg-white relative"
          >
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-600">
                {post.author} ·{' '}
                {new Date(post.created_at).toLocaleString('it-IT')}
              </div>
              <button
                onClick={() => handleReport(post)}
                className="text-red-600 hover:underline text-sm"
              >
                🚩 Segnala
              </button>
            </div>
            <p className="mt-2 text-gray-800">{post.content}</p>
          </div>
        ))}
      </div>

      <CreatePostForm onPostCreated={fetchPosts} />
    </div>
  );
}

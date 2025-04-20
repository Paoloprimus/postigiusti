// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CreatePostForm from '../components/CreatePostForm';

type Post = {
  id: number;
  content: string;
  created_at: string;
  author: string;
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

    if (!error && data) setPosts(data as Post[]);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">🧾 Bacheca Postigiusti</h1>

      <div className="space-y-4 mb-8">
        {posts.map((post) => (
          <div key={post.id} className="border rounded p-3 shadow">
            <div className="text-sm text-gray-600">{post.author} · {new Date(post.created_at).toLocaleString()}</div>
            <p className="mt-2">{post.content}</p>
          </div>
        ))}
      </div>

      <CreatePostForm onPostCreated={fetchPosts} />
    </div>
  );
}

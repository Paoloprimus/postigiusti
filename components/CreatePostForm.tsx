// components/CreatePostForm.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(''); // puoi legarlo alla sessione utente

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const { error } = await supabase.from('posts').insert([{ content, author }]);
    if (!error) {
      setContent('');
      onPostCreated();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Il tuo nome o nickname"
        className="w-full border p-2 rounded"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        required
      />
      <textarea
        className="w-full border p-2 rounded"
        placeholder="Scrivi qui il tuo messaggio..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Pubblica
      </button>
    </form>
  );
}

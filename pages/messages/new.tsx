// pages/messages/new.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function NewMessagePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        router.replace('/login');
        return;
      }

      if (!user.email_confirmed_at) {
        router.replace('/email-verifica'); // oppure mostra un messaggio
        return;
      }

      const to = router.query.to as string;
      if (to) {
        setNickname(to);
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('nickname', to)
          .single();

        if (error || !data) {
          setError('Utente non trovato.');
        } else {
          setReceiverId(data.id);
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleSend = async () => {
    setError('');
    setSuccess(false);

    if (!content.trim()) {
      setError('Il messaggio è vuoto.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !receiverId) {
      setError('Errore nel recupero degli utenti.');
      return;
    }

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    });

    if (insertError) {
      setError('Errore nell’invio del messaggio.');
    } else {
      setSuccess(true);
      setContent('');
    }
  };

  return (
    <Layout title="Invia un messaggio">
      <div className="max-w-xl mx-auto mt-6 p-4 border rounded bg-white shadow">
        <h1 className="text-xl font-bold mb-4">Messaggio a: {nickname}</h1>

        {error && <p className="text-red-600 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">Messaggio inviato con successo.</p>}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Scrivi il tuo messaggio..."
          className="w-full border rounded p-2 h-32 mb-3"
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Invia messaggio
        </button>
      </div>
    </Layout>
  );
}

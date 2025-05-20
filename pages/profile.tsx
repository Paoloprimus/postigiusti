// pages/profile.tsx

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import ListingCard from '../components/ListingCard';

type Invite = {
  id: string;
  email: string;
  used: boolean;
  created_at: string;
  created_by: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: string;
  // puoi aggiungere altri campi se ListingCard li richiede
};

type Message = {
  id: string;
  content: string;
  created_at: string;
  recipient: string;
};

export default function ProfilePage() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (session) {
      fetchInvites();
      fetchMyPosts();
      fetchMessages();
    }
  }, [session]);

  async function fetchInvites() {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setInvites(data);
  }

  async function fetchMyPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setMyPosts(data);
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setMessages(data);
  }

  if (!session) {
    return (
      <Layout>
        <p className="p-4">Devi essere loggato per vedere il tuo profilo.</p>
      </Layout>
    );
  }

  const user = session.user;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-10">

        {/* DATI UTENTE */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Dati personali</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID Utente:</strong> {user.id}</p>
            <p><strong>Data iscrizione:</strong> {new Date(user.created_at!).toLocaleDateString()}</p>
          </div>
        </section>

        {/* LINK INVITA UN AMICO */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Invita un amico</h2>
          <a href="/generate-invite" className="text-blue-600 underline">
            Vai alla pagina di invito
          </a>
        </section>

        {/* INVITI INVIATI */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Inviti inviati</h2>
          {invites.length > 0 ? (
            <ul className="list-disc pl-5">
              {invites.map(invite => (
                <li key={invite.id}>
                  {invite.email} – <em>{invite.used ? 'Usato' : 'Non ancora usato'}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nessun invito inviato.</p>
          )}
        </section>

        {/* I TUOI ANNUNCI */}
        <section>
          <h2 className="text-xl font-semibold mb-2">I tuoi annunci</h2>
          {myPosts.length > 0 ? (
            <div className="space-y-4">
              {myPosts.map(post => (
                <ListingCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p>Non hai ancora pubblicato annunci.</p>
          )}
        </section>

        {/* NOTIFICHE PERSONALI */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Notifiche ricevute</h2>
          {messages.length > 0 ? (
            <ul className="list-disc pl-5">
              {messages.map(m => (
                <li key={m.id}>
                  <strong>{new Date(m.created_at).toLocaleDateString()}:</strong> {m.content}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nessuna notifica ricevuta dall'admin.</p>
          )}
        </section>

      </div>
    </Layout>
  );
}

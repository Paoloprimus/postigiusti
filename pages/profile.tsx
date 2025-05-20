// pages/profile.tsx

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import ListingCard from '../components/ListingCard';

// Tipi locali
type Invite = {
  id: string;
  email: string;
  used: boolean;
  created_at: string;
  created_by: string;
};

type Listing = {
  id: string;
  location: string;
  description: string;
  created_at: string;
  user_id: string;
  price: number;
  beds: number;
  contact_info: string;
  school?: string;
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
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (session) {
      fetchInvites();
      fetchMyListings();
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

  async function fetchMyListings() {
    const { data, error } = await supabase
      .from('posts')
      .select('id, location, description, created_at, user_id, price, beds, contact_info, school')
      .eq('author', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setMyListings(data);
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
  const nickname = user.user_metadata?.nickname || '—';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6 space-y-10">

        {/* DATI UTENTE */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Dati personali</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Nickname:</strong> {nickname}</p>
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
          {myListings.length > 0 ? (
            <div className="space-y-4">
              {myListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
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

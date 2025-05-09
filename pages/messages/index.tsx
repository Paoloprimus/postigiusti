// pages/messages/index.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import Link from 'next/link';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender: { nickname: string };
  receiver: { nickname: string };
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchMessages = async (user_id: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(nickname), receiver:profiles!messages_receiver_id_fkey(nickname)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);

      // 🔔 Marca come letti i messaggi ricevuti non letti
      const unreadIds = data
        .filter((msg) => msg.receiver_id === user_id && msg.read === false)
        .map((msg) => msg.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
    }
  };

  useEffect(() => {
    let user_id: string;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      user_id = user.id;
      setUserId(user_id);
      await fetchMessages(user_id);

      // 🔁 Subscription: aggiorna in tempo reale
      supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user_id}`,
          },
          () => {
            fetchMessages(user_id);
          }
        )
        .subscribe();
    };

    init();
  }, []);

  return (
    <Layout title="Messaggi">
      <div className="max-w-2xl mx-auto mt-6 p-4 bg-white border rounded shadow">
        <h1 className="text-2xl font-bold mb-4">I tuoi messaggi</h1>

        {messages.length === 0 ? (
          <p className="text-gray-600">Nessun messaggio.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg) => {
              const isSent = msg.sender_id === userId;
              const otherNickname = isSent ? msg.receiver.nickname : msg.sender.nickname;
              const label = isSent ? 'A' : 'Da';

              return (
                <li key={msg.id} className="border-b pb-2">
                  <p className="text-gray-700">{msg.content}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {label}:{' '}
                    <Link href={`/messages/new?to=${otherNickname}`}>
                      <a className="text-blue-600 hover:underline">{otherNickname}</a>
                    </Link>{' '}
                    • {new Date(msg.created_at).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Layout>
  );
}

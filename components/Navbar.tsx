// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Home } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let userIdTemp: string | null = null;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        userIdTemp = currentUser.id;
        fetchNickname(userIdTemp);
        fetchUnreadMessages(userIdTemp);

        supabase
          .channel('unread-messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${userIdTemp}`,
            },
            () => {
              fetchUnreadMessages(userIdTemp!);
            }
          )
          .subscribe();
      }
    };

    setup();
  }, []);

  const fetchNickname = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setNickname(data.nickname);
    }
  };

  const fetchUnreadMessages = async (userId: string) => {
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (!error && typeof count === 'number') {
      setUnreadCount(count);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-blue-600 text-white py-3">
      <div className="w-full px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        {/* Logo e titolo */}
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold whitespace-nowrap">Posti Giusti</h1>
        </div>

        {/* Menu visibile sempre, responsivo */}
        {user && (
          <div className="flex flex-wrap justify-start sm:justify-end gap-3 text-sm">
            <Link href="/dashboard">
              <span className="hover:underline cursor-pointer">Bacheca</span>
            </Link>
            <Link href="/messages">
              <span className="hover:underline cursor-pointer relative">
                Messaggi
                {unreadCount > 0 && (
                  <sup className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">
                    {unreadCount}
                  </sup>
                )}
              </span>
            </Link>
            <Link href="/notice">
              <span className="hover:underline cursor-pointer">Notifiche</span>
            </Link>
            <Link href="/profile">
              <span className="hover:underline cursor-pointer">
                {nickname || 'Profilo'}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              className="hover:underline cursor-pointer"
            >
              Esci
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Home } from 'lucide-react'; // Importa l'icona Home da lucide-react

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchNickname(currentUser.id);
        fetchUnreadMessages(currentUser.id);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchNickname(currentUser.id);
        fetchUnreadMessages(currentUser.id);
      }
    });

    return () => subscription?.unsubscribe();
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
    <nav className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Brand title with Home icon */}
        <div className="flex items-center">
          <Home className="w-6 h-6 mr-2 text-white" />
          <h1 className="text-xl font-bold">Posti Giusti</h1>
        </div>

        {/* Menu for authenticated users */}
        {user && (
          <div className="flex items-center space-x-4">
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
            <button onClick={handleSignOut} className="hover:underline cursor-pointer">
              Esci
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

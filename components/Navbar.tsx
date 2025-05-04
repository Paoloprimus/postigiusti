// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchNickname(session.user.id);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchNickname(currentUser.id);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Brand title */}
        <h1 className="text-xl font-bold">Posti Giusti</h1>

        {/* Menu for authenticated users */}
        {user && (
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <span className="hover:underline cursor-pointer">Bacheca</span>
            </Link>
            <Link href="/messages">
              <span className="hover:underline cursor-pointer">Messaggi</span>
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

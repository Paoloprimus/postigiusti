// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

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
            <Link href="/announcements">
              <span className="hover:underline cursor-pointer">Bacheca</span>
            </Link>
            <Link href="/messages">
              <span className="hover:underline cursor-pointer">Messaggi</span>
            </Link>
            <Link href="/notice">
              <span className="hover:underline cursor-pointer">Notifiche</span>
            </Link>
            <button onClick={handleSignOut} className="hover:underline cursor-pointer">
              Esci
            </button>
            <Link href="/profilo">
              <span className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 hover:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.121 17.804z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

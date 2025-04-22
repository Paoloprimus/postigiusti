// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setUser(session.user);
        else setUser(null);
      }
    );

    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
    checkUser();

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/">
          <span className="text-xl font-bold cursor-pointer">Posti Giusti</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <span className="hover:underline cursor-pointer">Annuncia</span>
              </Link>
              <Link href="/generate-invite">
                <span className="hover:underline cursor-pointer">Invita</span>
              </Link>

              <button onClick={handleSignOut}>
                Esci
              </button>

              <Link href="/profilo">
                {/* Inline SVG User Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 hover:text-gray-200 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A5 5 0 0112 21a5 5 0 016.879-3.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <span className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 cursor-pointer">
                Accedi
              </span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

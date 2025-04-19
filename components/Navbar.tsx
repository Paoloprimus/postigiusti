import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">

        <Link href="/">
          <span className="text-xl font-bold cursor-pointer">AlloggiPrecari</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <span className="hover:underline cursor-pointer">Dashboard</span>
              </Link>
              <Link href="/generate-invite">
                <span className="hover:underline cursor-pointer">Invita</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
              >
                Esci
              </button>
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

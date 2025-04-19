import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserInvites } from '../lib/inviteUtils';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Carica i dati all'avvio
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      loadInvites();
    };
    
    checkAuth();
  }, []);

  // Carica gli inviti generati dall'utente
  const loadInvites = async () => {
    setLoading(true);
    
    const { invites, success } = await getUserInvites();
    
    if (success && invites) {
      setInvites(invites);
    }
    
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {user && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Il tuo profilo</h2>
          <p>Email: {user.email}</p>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">I tuoi inviti</h2>
          <Link href="/generate-invite">
            <a className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Genera nuovo invito
            </a>
          </Link>
        </div>
        
        {loading ? (
          <p>Caricamento in corso...</p>
        ) : invites.length === 0 ? (
          <p>Non hai ancora generato inviti.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Data</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Stato</th>
                  <th className="py-2 px-4 border-b">Link</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="py-2 px-4 border-b">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {invite.email || 'Nessuna email specificata'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {invite.used ? (
                        <span className="text-green-500">Utilizzato</span>
                      ) : (
                        <span className="text-blue-500">Disponibile</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {!invite.used && (
                        <button
                          onClick={() => {
                            const inviteUrl = `${window.location.origin}/signup?token=${invite.token}`;
                            navigator.clipboard.writeText(inviteUrl);
                            alert('Link copiato negli appunti!');
                          }}
                          className="text-blue-500 hover:underline"
                        >
                          Copia link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
// pages/generate-invite.tsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

interface LocalInvite {
  id: string;
  token: string;
  email: string | null;
  invited_by: string;
  approved_by: string | null;
  used_by: string | null;
  approved: boolean;
  used: boolean;
  created_at: string;
}

export default function GenerateInvite() {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<LocalInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const router = useRouter();

  // ✅ Blocco accesso se non autenticato
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // o altra pagina desiderata
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('invited_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedInvites: LocalInvite[] = (data || []).map(item => ({
        id: item.id,
        token: item.token,
        email: item.email,
        invited_by: item.invited_by,
        approved_by: item.approved_by,
        used_by: item.used_by,
        approved: !!item.approved,
        used: !!item.used,
        created_at: item.created_at
      }));

      setInvites(typedInvites);
    } catch (err) {
      console.error('Error fetching invites:', err);
    }

    setLoading(false);
  };

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Devi specificare un’email per generare l’invito.');
      setGenerating(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessione non valida');
      }

      const pendingCount = invites.filter(i => !i.used && !i.approved).length;
      if (pendingCount >= 3) {
        setError('Hai già 3 inviti in sospeso/non usati');
        setGenerating(false);
        return;
      }

      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = { error: 'Risposta non valida dal server (nessun JSON)' };
      }

      if (!response.ok) {
        if (response.status === 403) {
          setError('Hai già generato il numero massimo di 3 inviti.');
        } else {
          setError(result.error || 'Errore dal server');
        }
        setGenerating(false);
        return;
      }

      const typedNewInvite: LocalInvite = {
        id: result.id,
        token: result.token,
        email: result.email,
        invited_by: result.invited_by,
        approved_by: result.approved_by || null,
        used_by: result.used_by || null,
        approved: !!result.approved,
        used: !!result.used,
        created_at: result.created_at
      };

      setInvites([typedNewInvite, ...invites]);
      setSuccess('Invito generato con successo!');
      setEmail('');
    } catch (err: any) {
      console.error('Errore generazione invito:', err);
      setError(err.message || 'Errore durante la generazione dell\'invito');
    }

    setGenerating(false);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(link)
      .then(() => setCopySuccess('Link copiato!'))
      .catch(() => setCopySuccess('Errore copia link'));
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const pendingCount = invites.filter(i => !i.used && !i.approved).length;
  const hasReachedLimit = pendingCount >= 3;

  return (
    <Layout title="AlloggiPrecari - Genera invito">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Genera inviti</h1>
        <p className="text-gray-600">
          Invita altri precari della scuola a unirsi alla piattaforma.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">Genera un nuovo invito</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{success}</div>}
        <form onSubmit={generateInvite}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email del destinatario (opzionale)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="email@esempio.com"
              required
              disabled={hasReachedLimit}
            />
            <p className="text-xs text-gray-500 mt-1">
              L’invito sarà valido solo per questa email
            </p>
          </div>
          <button
            type="submit"
            disabled={generating || hasReachedLimit}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {generating ? 'Generazione in corso...' : 'Genera invito'}
          </button>
        </form>
        {hasReachedLimit && (
          <p className="text-sm text-red-500 mt-2">
            Hai già utilizzato tutti e 3 gli inviti disponibili.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">I tuoi inviti</h2>
        {loading ? (
          <p>Caricamento inviti...</p>
        ) : invites.length === 0 ? (
          <p className="text-gray-500">Non hai ancora generato inviti</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map(inv => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-2">{new Date(inv.created_at).toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-2">{inv.email || 'Non specificata'}</td>
                    <td className="px-4 py-2">
                      {inv.used
                        ? <span className="text-green-700">Utilizzato</span>
                        : inv.approved
                          ? <span className="text-yellow-700">Approvato</span>
                          : <span className="text-gray-500">In attesa</span>}
                    </td>
                    <td className="px-4 py-2">
                      {inv.approved && !inv.used &&
                        <button onClick={() => copyInviteLink(inv.token)} className="text-blue-600 hover:underline">
                          {copySuccess || 'Copia link'}
                        </button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

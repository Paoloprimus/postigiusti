// pages/generate-invite.tsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Invite } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function GenerateInvite() {
  const [email, setEmail]       = useState('');
  const [invites, setInvites]   = useState<Invite[]>([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGen]    = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [copyMsg, setCopyMsg]   = useState('');

  /* ─────────── fetch miei inviti ─────────── */
  useEffect(() => { fetchInvites(); }, []);

  const fetchInvites = async () => {
    setLoading(true);
    const { data:{session} } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('invited_by', session.user.id)
      .order('created_at', { ascending:false });

    if (data) setInvites(data);
    setLoading(false);
  };

  /* ─────────── genera invito ─────────── */
  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGen(true); setError(''); setSuccess('');

    const { data:{session} } = await supabase.auth.getSession();
    if (!session) { setError('Sessione scaduta'); setGen(false); return; }

    /* limite 3 inviti non approvati/non usati */
    const pendings = invites.filter(i => !i.approved || !i.used);
    if (pendings.length >= 3) {
      setError('Hai già 3 inviti in sospeso / non usati');
      setGen(false); return;
    }

    /* evita duplice mail non usata */
    if (invites.some(i => i.email === email && !i.used)) {
      setError('Hai già un invito aperto per questa email');
      setGen(false); return;
    }

    const token = uuidv4();

    const { data, error } = await supabase
      .from('invites')
      .insert({
        token,
        email: email || null,
        invited_by: session.user.id,   // 👈 campo obbligatorio per RLS
        approved: false                // default, ma lo specifichiamo
      })
      .select()
      .single();

    if (error || !data) {
      setError('Errore durante la generazione');
      console.error(error);
    } else {
      setInvites([data, ...invites]);
      setSuccess('Invito creato. In attesa di approvazione.');
      setEmail('');
    }
    setGen(false);
  };

  /* ─────────── copia link (solo se approvato) ─────────── */
  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(url).then(
      () => { setCopyMsg('Link copiato!');   setTimeout(()=>setCopyMsg(''),2000); },
      () => { setCopyMsg('Errore copia');    setTimeout(()=>setCopyMsg(''),2000); }
    );
  };

  /* ─────────── UI ─────────── */
  return (
    <Layout title="AlloggiPrecari – Inviti">
      <h1 className="text-2xl font-bold mb-4">Genera inviti</h1>

      {/* form */}
      <div className="bg-white p-6 mb-6 rounded shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Nuovo invito</h2>

        {error   && <p className="bg-red-50 text-red-600 p-3 mb-4 rounded">{error}</p>}
        {success && <p className="bg-green-50 text-green-600 p-3 mb-4 rounded">{success}</p>}

        <form onSubmit={generateInvite}>
          <label className="block text-sm font-medium mb-1">
            Email destinatario (opzionale)
          </label>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            placeholder="email@esempio.com"
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {generating ? 'Creo…' : 'Genera invito'}
          </button>
        </form>
      </div>

      {/* lista */}
      <h2 className="text-lg font-semibold mb-4">I tuoi inviti</h2>

      {loading ? (
        <p>Caricamento…</p>
      ) : invites.length === 0 ? (
        <p className="text-gray-500">Nessun invito generato</p>
      ) : (
        <div className="bg-white border rounded shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Stato</th>
                <th className="px-4 py-2 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2">{new Date(inv.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-2">{inv.email || '—'}</td>
                  <td className="px-4 py-2">
                    {inv.used
                      ? <span className="text-green-700">Utilizzato</span>
                      : inv.approved
                        ? <span className="text-yellow-700">Approvato</span>
                        : <span className="text-gray-500">In attesa</span>}
                  </td>
                  <td className="px-4 py-2">
                    {inv.approved && !inv.used && (
                      <button
                        onClick={()=>copyInviteLink(inv.token)}
                        className="text-blue-600 hover:underline"
                      >
                        {copyMsg && inv.token.startsWith(copyMsg) ? copyMsg : 'Copia link'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

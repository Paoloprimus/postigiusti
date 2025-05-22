// pages/signup.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [fiscalCode, setFiscalCode] = useState('');
  const [role, setRole] = useState('precari');
  const [agencyName, setAgencyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data: invites, error: inviteErr } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token.trim())
      .eq('used', false);

    const invite = invites?.[0];

    if (inviteErr) {
      setError('Errore nel controllo dell’invito. Riprova più tardi.');
      return;
    }

    if (!invite) {
      setError('Token di invito non valido o già utilizzato. Assicurati che il codice sia corretto e non sia già stato usato.');
      return;
    }

    const { data: existingNick } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle();

    if (existingNick) {
      setError('Questo nickname è già in uso. Scegline un altro.');
      return;
    }

    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://www.postigiusti.com/dashboard',
      },
    });

    if (authErr) {
      setError('Errore registrazione: ' + authErr.message);
      setLoading(false);
      return;
    }

    await supabase
      .from('invites')
      .update({ used: true, used_by: authData.user?.id })
      .eq('token', token);

    await supabase.from('profiles').insert({
      id: authData.user?.id,
      email,
      nickname,
      role,
      full_name: fullName,
      codice_fiscale: fiscalCode,
      agency_name: role === 'agenzie' ? agencyName : null,
      invited_by: invite.invited_by,
    });

    setLoading(false);
    setIsComplete(true);
  };

  return (
    <Layout title="Posti Giusti – Registrazione">
      <div className="bg-gray-100 text-center py-2">
        Posti Giusti è una piattaforma su invito per lavoratori precari
        della scuola dedicata allo scambio di info su alloggi arredati in tutta Italia.
      </div>
      <div className="max-w-md mx-auto mt-6 p-6 border rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Registrati</h1>

        {isComplete ? (
          <p className="text-green-600 text-center text-lg">
            Registrazione completata! Controlla la tua email e clicca sul link per attivare il tuo account.
          </p>
        ) : (
          <>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleSignup} className="space-y-4">

              <div>
                <label className="block text-sm mb-1">Token di invito</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Nome e Cognome</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={fiscalCode}
                  onChange={(e) => setFiscalCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Categoria</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="precari">Precari</option>
                  <option value="proprietari">Proprietari</option>
                  <option value="agenzie">Agenzie</option>
                </select>
              </div>

              {role === 'agenzie' && (
                <div>
                  <label className="block text-sm mb-1">Nome Agenzia</label>
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border px-3 py-2 rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Nickname</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border px-3 py-2 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Registrazione...' : 'Registrati'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm">
              Hai già un account?{' '}
              <Link href="/login">
                <a className="text-blue-600 hover:underline">Accedi</a>
              </Link>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}

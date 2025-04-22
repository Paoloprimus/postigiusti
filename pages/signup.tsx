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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Inserisci un token di invito valido.');
      return;
    }
    setLoading(true);

    // Verifica token
    const { data: invite, error: inviteErr } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used_by', null)
      .single();

    if (inviteErr || !invite) {
      setError('Token non valido o già utilizzato.');
      setLoading(false);
      return;
    }

    // Crea account
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authErr || !authData.user) {
      setError('Errore registrazione: ' + authErr?.message);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Aggiorna invite
    await supabase
      .from('invites')
      .update({ used_by: userId })
      .eq('token', token);

    // Crea profilo
    await supabase
      .from('profiles')
      .insert({ id: userId, email, nickname, invited_by: invite.invited_by || null, role: 'user' });

    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <Layout title="PostiGiusti - Registrazione">
      <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Registrazione</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Token di invito</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Hai già un account?{' '}
          <Link href="/login">
            <a className="text-blue-600 hover:underline">Accedi</a>
          </Link>
        </p>
      </div>
    </Layout>
  );
}

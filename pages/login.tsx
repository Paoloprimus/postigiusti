// pages/login.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 1) verifica token invito non usato
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('id, invited_by')
      .eq('token', token)
      .eq('used_by', null)
      .single();
    if (inviteError || !invite) {
      setError('Token d\'invito non valido o già utilizzato.');
      return;
    }
    // 2) registra utente
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || 'Errore durante la registrazione.');
      return;
    }
    const userId = signUpData.user.id;
    // 3) marca invito come usato
    await supabase
      .from('invites')
      .update({ used_by: userId })
      .eq('id', invite.id);
    // 4) crea record profilo
    await supabase
      .from('profiles')
      .insert({ id: userId, email, nickname, invited_by: invite.invited_by, role: 'active' });
    // 5) reindirizza a dashboard
    router.push('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Registrazione</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Token d'invito:</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Nickname:</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Registrati
        </button>
      </form>
    </div>
  );
}

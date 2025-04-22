// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { data, error: loginError } = 
      await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.session) {
      setError('Email o password non validi.');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <Layout title="PostiGiusti – Login">
      <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Accedi</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Accedi
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Non hai un account?{' '}
          <Link href="/signup">
            <a className="text-blue-600 hover:underline">Registrati (solo con token d'invito)</a>
          </Link>
        </p>
      </div>
    </Layout>
  );
}

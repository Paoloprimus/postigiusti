import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ Controllo se l'email è autorizzata nella tabella "invites"
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (inviteError) {
        setError('Errore nella verifica dell’invito.');
        setLoading(false);
        return;
      }

      if (!invite) {
        setError('Questa email non è autorizzata. Richiedi un invito.');
        setLoading(false);
        return;
      }

      // ✅ Login vero e proprio
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('DATA:', data);
      console.log('ERROR:', error);
      console.error('Errore da Supabase:', error);
      console.log('Dati restituiti:', data);
      console.log('Risposta Supabase:', { data, error });


      if (error) {
        console.error('Errore login:', error.message); // <== aggiunto
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      setError('Errore inaspettato durante l’accesso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Accedi</h1>

      {error && (
        <div className="bg-red-100 p-4 rounded mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>

      <div className="mt-6">
        <p>
          Non hai un account?{' '}
          <Link href="/signup" className="text-blue-500 hover:underline">
          Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

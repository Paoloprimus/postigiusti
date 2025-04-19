// pages/signup.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Controlla se c'è un token di invito nell'URL
    const { token } = router.query;
    if (token && typeof token === 'string') {
      setInviteToken(token);
      validateInviteToken(token);
    } else {
      setCheckingToken(false);
    }
  }, [router.query]);

  const validateInviteToken = async (token: string) => {
    setCheckingToken(true);
    
    // Verifica che il token esista e non sia già stato utilizzato
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();
      
    if (data && !error) {
      setTokenValid(true);
      setEmail(data.email || ''); // Precompila l'email se presente nell'invito
    } else {
      setTokenValid(false);
      setError('Token di invito non valido o già utilizzato');
    }
    
    setCheckingToken(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenValid) {
      setError('È necessario un invito valido per registrarsi');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 1. Crea l'account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      console.error('Error signing up:', authError);
      setError('Errore durante la registrazione: ' + authError.message);
      setLoading(false);
      return;
    }
    
    // 2. Segna l'invito come utilizzato
    if (authData.user) {
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ used: true, used_by: authData.user.id })
        .eq('token', inviteToken);
        
      if (inviteError) {
        console.error('Error updating invite:', inviteError);
      }
    }
    
    // 3. Reindirizza alla dashboard o mostra un messaggio di successo
    setLoading(false);
    router.push('/dashboard?welcome=true');
  };

  if (checkingToken) {
    return (
      <Layout title="AlloggiPrecari - Verifica invito">
        <div className="max-w-md mx-auto text-center py-10">
          <p>Verifica del token di invito in corso...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="AlloggiPrecari - Registrazione">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Registrazione</h1>
        
        {!router.query.token && !tokenValid ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Hai bisogno di un invito
            </h2>
            <p>
              Per registrarti su AlloggiPrecari hai bisogno di un invito da un membro esistente.
              Se hai ricevuto un link di invito, assicurati di utilizzare quello.
            </p>
            <div className="mt-3">
              <Link 
                href="/login" 
                className="text-blue-600 hover:underline"
              >
                Hai già un account? Accedi qui
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {tokenValid && (
              <div className="bg-green-50 text-green-700 p-3 rounded mb-4">
                Invito valido! Completa la registrazione.
              </div>
            )}
            
            <form onSubmit={handleSignup} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                  disabled={!!router.query.email}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Almeno 6 caratteri
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="inviteToken" className="block text-sm font-medium text-gray-700 mb-1">
                  Token di invito
                </label>
                <input
                  id="inviteToken"
                  type="text"
                  value={inviteToken}
                  onChange={(e) => {
                    setInviteToken(e.target.value);
                    setTokenValid(false);
                  }}
                  required
                  className="w-full border rounded px-3 py-2"
                  disabled={!!router.query.token}
                />
                {!router.query.token && inviteToken && !tokenValid && (
                  <button
                    type="button"
                    onClick={() => validateInviteToken(inviteToken)}
                    className="text-sm text-blue-600 hover:underline mt-1"
                  >
                    Verifica token
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading || !tokenValid}
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </button>
            </form>
            
            <p className="text-center mt-4 text-sm">
              Hai già un account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Accedi qui
              </Link>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}// Pagina di registrazione tramite invito
// pages/generate-invite.tsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Invite } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function GenerateInvite() {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;
    
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('invited_by', session.user.id)
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      setInvites(data);
    }
    
    setLoading(false);
  };

  const generateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess('');
    
    // Verifica che non ci siano già inviti per questa email
    const existingInvites = invites.filter(invite => 
      invite.email === email && !invite.used
    );
    
    if (existingInvites.length > 0) {
      setError('Hai già inviato un invito a questa email');
      setGenerating(false);
      return;
    }
    
    // Generate a new invite token
    const token = uuidv4();
    
    const { data, error } = await supabase
      .from('invites')
      .insert({
        email: email,
        token: token
      })
      .select()
      .single();
      
    if (data && !error) {
      setInvites([data, ...invites]);
      setSuccess('Invito generato con successo!');
      setEmail('');
    } else {
      setError('Errore durante la generazione dell\'invito');
      console.error('Error generating invite:', error);
    }
    
    setGenerating(false);
  };

  const copyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(inviteLink).then(
      () => {
        setCopySuccess(`Link copiato!`);
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        setCopySuccess('Errore nella copia');
      }
    );
  };

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
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={generateInvite}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email del destinatario (opzionale)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="email@esempio.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se specificata, l'invito sarà valido solo per questa email
            </p>
          </div>
          
          <button
            type="submit"
            disabled={generating}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {generating ? 'Generazione in corso...' : 'Genera invito'}
          </button>
        </form>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invite.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.email || 'Non specificata'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invite.used ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Utilizzato
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Non utilizzato
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!invite.used && (
                        <button
                          onClick={() => copyInviteLink(invite.token)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {copySuccess ? copySuccess : 'Copia link'}
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
    </Layout>
  );
}
// Pagina per generazione inviti
// pages/admin/storico-sponsor.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function StoricoSponsor() {
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('sponsor_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else setHistory(data);
    })();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Storico Annunci Sponsor</h1>

      {error && <p className="text-red-600">Errore: {error}</p>}

      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="px-2 py-1">Destinazione</th>
            <th className="px-2 py-1">Testo</th>
            <th className="px-2 py-1">Link</th>
            <th className="px-2 py-1">Creato il</th>
          </tr>
        </thead>
        <tbody>
          {history.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-2 py-1">{s.province ?? s.region ?? s.country ?? '—'}</td>
              <td className="px-2 py-1">{s.text}</td>
              <td className="px-2 py-1">
                {s.link ? (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {s.link}
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-2 py-1">{new Date(s.created_at).toLocaleString('it-IT')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

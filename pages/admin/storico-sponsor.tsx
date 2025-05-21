// pages/admin/storico-sponsor.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

interface Sponsor {
  id: string;
  country: string | null;
  region: string | null;
  province: string | null;
  text: string;
  link: string | null;
  created_at: string;
  deleted_at: string;
}

export default function StoricoSponsor() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSponsors = async () => {
      const { data, error } = await supabase
        .from('sponsor_history')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) setError(error.message);
      else setSponsors(data || []);

      setLoading(false);
    };

    loadSponsors();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-4">
        Storico Annunci Sponsor
        <a
          href="/admin/dashboard"
          className="text-blue-600 text-sm underline hover:text-blue-800"
        >
          Torna alla Admin Dashboard
        </a>
      </h1>

      {loading ? (
        <p>Caricamento in corso...</p>
      ) : error ? (
        <p className="text-red-600">Errore: {error}</p>
      ) : sponsors.length === 0 ? (
        <p className="text-gray-500 italic">Nessun annuncio storico disponibile.</p>
      ) : (
        <table className="w-full text-left border">
          <thead>
            <tr>
              <th className="px-2 py-1">Destinazione</th>
              <th className="px-2 py-1">Testo</th>
              <th className="px-2 py-1">Link</th>
              <th className="px-2 py-1">Creato il</th>
              <th className="px-2 py-1">Cancellato il</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s) => (
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
                <td className="px-2 py-1">
                  {new Date(s.created_at).toLocaleString('it-IT')}
                </td>
                <td className="px-2 py-1">
                  {new Date(s.deleted_at).toLocaleString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

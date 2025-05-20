// pages/admin/dashboard.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

// Tipi per i dati degli utenti e inviti
type Profile = {
  id: string;
  email: string;
  nickname: string;
  role: string;
  invited_by: string | null;
};

type Invite = {
  id: string;
  token: string;
  invited_by: string;
  used_by: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  const [level, setLevel] = useState<'national' | 'region' | 'province'>('national');
  const [country, setCountry] = useState('IT');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      // Controlla sessione
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/admin-login');
        return;
      }

      // Verifica ruolo admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profileError || profile.role !== 'admin') {
        router.push('/admin-login');
        return;
      }

      // Carica tutti i profili
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*');
      setProfiles(allProfiles || []);
      setPendingProfiles(
        (allProfiles || []).filter((p) => p.role === 'pending')
      );

      // Carica tutti gli inviti
      const { data: allInvites } = await supabase
        .from('invites')
        .select('*');
      setInvites(allInvites || []);
    })();
  }, [router]);

  const handleSubmitSponsor = async () => {
    if (!text.trim()) return setMessage('⚠️ Il campo testo è obbligatorio.');

    const insertData: any = {
      text,
      link: link.trim() || null,
      active: true,
    };

    if (level === 'national') {
      insertData.country = country;
    } else if (level === 'region') {
      insertData.country = country;
      insertData.region = region;
    } else if (level === 'province') {
      insertData.country = country;
      insertData.region = region;
      insertData.province = province;
    }

    const { error } = await supabase
      .from('sponsor_announcements')
      .upsert([insertData], { onConflict: 'country,region,province' });

    if (error) {
      setMessage('❌ Errore: ' + error.message);
    } else {
      setMessage('✅ Annuncio salvato correttamente!');
      setText('');
      setLink('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="p-4 border rounded bg-gray-50 max-w-xl mb-8">
        <h2 className="text-lg font-bold mb-2">Gestione Annunci Sponsor</h2>

        <label className="block mb-1 font-medium">Livello geografico</label>
        <select
          className="mb-2 border p-1 w-full"
          value={level}
          onChange={(e) => setLevel(e.target.value as any)}
        >
          <option value="national">Italia</option>
          <option value="region">Regione</option>
          <option value="province">Provincia</option>
        </select>

        {level !== 'national' && (
          <input
            className="mb-2 border p-1 w-full"
            placeholder="Regione es. Veneto"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        )}

        {level === 'province' && (
          <input
            className="mb-2 border p-1 w-full"
            placeholder="Provincia es. Verona"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        )}

        <textarea
          className="mb-2 border p-1 w-full"
          rows={3}
          placeholder="Testo dell'annuncio (obbligatorio)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          className="mb-2 border p-1 w-full"
          placeholder="Link (opzionale)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleSubmitSponsor}
        >
          Salva annuncio
        </button>

        {message && <p className="mt-2 text-sm">{message}</p>}
      </div>

      <h2 className="text-xl font-semibold mt-6">Membri</h2>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="px-2 py-1">Email</th>
            <th className="px-2 py-1">Nickname</th>
            <th className="px-2 py-1">Invitati</th>
            <th className="px-2 py-1">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-2 py-1">{p.email}</td>
              <td className="px-2 py-1">{p.nickname}</td>
              <td className="px-2 py-1">
                {invites.filter((inv) => inv.invited_by === p.id).length}
              </td>
              <td className="px-2 py-1 space-x-2">
                <button className="text-sm text-red-600">Banna</button>
                <button className="text-sm text-blue-600">Msg</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6">Nuovi Membri</h2>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="px-2 py-1">Email</th>
            <th className="px-2 py-1">Nickname</th>
            <th className="px-2 py-1">Invitato da</th>
            <th className="px-2 py-1">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {pendingProfiles.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-2 py-1">{p.email}</td>
              <td className="px-2 py-1">{p.nickname}</td>
              <td className="px-2 py-1">{p.invited_by}</td>
              <td className="px-2 py-1 space-x-2">
                <button className="text-sm text-green-600">Approva</button>
                <button className="text-sm text-red-600">Rifiuta</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6">Inviti Admin</h2>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="px-2 py-1">Token</th>
            <th className="px-2 py-1">Creato il</th>
            <th className="px-2 py-1">Usato da</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="px-2 py-1">{inv.token}</td>
              <td className="px-2 py-1">
                {new Date(inv.created_at).toLocaleString('it-IT')}
              </td>
              <td className="px-2 py-1">{inv.used_by || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

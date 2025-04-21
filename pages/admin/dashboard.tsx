// pages/admin/dashboard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

// Tipi per i dati degli utenti e inviti
interface Profile {
  id: string;
  email: string;
  nickname: string;
  invited_by: string | null;
}

interface Invite {
  id: string;
  token: string;
  invited_by: string;
  used_by: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Controllo autenticazione e ruolo admin
  useEffect(() => {
    (async () => {
      const user = supabase.auth.user();
      if (!user) {
        router.push('/admin-login');
        return;
      }
      // Verifica ruolo admin nel profilo
      const { data: profile } = await supabase
        .from<Profile>('profiles')
        .select('nickname')
        .eq('id', user.id)
        .eq('role', 'admin')
        .single();
      if (!profile) {
        router.push('/admin-login');
        return;
      }
      loadData();
    })();
  }, []);

  // Carica dati
  async function loadData() {
    // Tutti i membri
    const { data: allProfiles } = await supabase
      .from<Profile>('profiles')
      .select('id, email, nickname, invited_by');
    setProfiles(allProfiles || []);

    // Profili pending
    const { data: pendings } = await supabase
      .from<Profile>('profiles')
      .select('id, email, nickname, invited_by')
      .eq('status', 'pending');
    setPendingProfiles(pendings || []);

    // Inviti generati dall'admin
    const { data: adminInvites } = await supabase
      .from<Invite>('invites')
      .select('id, token, invited_by, used_by, created_at')
      .eq('invited_by', supabase.auth.user()?.id);
    setInvites(adminInvites || []);
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Bottoni rapido accesso */}
        <div className="flex space-x-4">
          <Link href="/dashboard">
            <a className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Bacheca</a>
          </Link>
          <Link href="/admin/inviti">
            <a className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Invia Inviti</a>
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Tabella Membri */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Membri</h2>
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Nickname</th>
                <th className="px-4 py-2">Invitato da</th>
                <th className="px-4 py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.nickname}</td>
                  <td className="px-4 py-2">{p.invited_by}</td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline mr-2">Messaggia</button>
                    <button className="text-red-600 hover:underline">Banna</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tabella Nuovi Membri */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Nuovi Membri (Pending)</h2>
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Nickname</th>
                <th className="px-4 py-2">Invitato da</th>
                <th className="px-4 py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pendingProfiles.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.nickname}</td>
                  <td className="px-4 py-2">{p.invited_by}</td>
                  <td className="px-4 py-2">
                    <button className="text-green-600 hover:underline mr-2">Approva</button>
                    <button className="text-red-600 hover:underline">Rifiuta</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tabella Inviti Admin */}
        <section>
          <h2 className="text-xl font-semibold mb-2">I Tuoi Inviti</h2>
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Token</th>
                <th className="px-4 py-2">Usato da</th>
                <th className="px-4 py-2">Creato il</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2 font-mono break-all">{inv.token}</td>
                  <td className="px-4 py-2">{inv.used_by || '-'}</td>
                  <td className="px-4 py-2">{new Date(inv.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  );
}

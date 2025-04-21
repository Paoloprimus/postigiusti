// pages/admin/dashboard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

// Tipi per i dati
interface Profile {
  id: string;
  email: string;
  nickname: string;
  invited_by?: string;
}

interface Invite {
  id: string;
  token: string;
  invited_by: string;
  used_by?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function checkAndLoad() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setRole('admin');
      await fetchData(session.user.id);
    }
    checkAndLoad();
  }, [router]);

  async function fetchData(adminId: string) {
    const { data: profiles } = await supabase
      .from<Profile>('profiles')
      .select('id, email, nickname, invited_by');
    setMembers(profiles || []);

    // TODO: Filtra pendingMembers basandoti su flag/stato
    setPendingMembers([]);

    const { data: inv } = await supabase
      .from<Invite>('invites')
      .select('*')
      .eq('invited_by', adminId);
    setInvites(inv || []);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleBan = (memberId: string) => {
    if (!confirm('Vuoi veramente bannare questo utente?')) return;
    alert('Funzione ban da implementare.');
  };

  const handleMessage = (memberId: string) => {
    alert(`Funzione messaggio a utente ${memberId} da implementare.`);
  };

  if (role !== 'admin') {
    return (
      <Layout title="Verifica in corso...">
        <p>Caricamento...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="flex space-x-4 mb-6">
        <Link href="/dashboard">
          <a className="px-4 py-2 bg-blue-600 text-white rounded">Bacheca</a>
        </Link>
        <Link href="/generate-invite">
          <a className="px-4 py-2 bg-green-600 text-white rounded">Inviare Inviti</a>
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Tabella Membri */}
        <div>
          <h2 className="text-xl font-bold mb-2">Membri</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Nickname</th>
                <th className="px-4 py-2 border">Inviti</th>
                <th className="px-4 py-2 border">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 border">{m.email}</td>
                  <td className="px-4 py-2 border">{m.nickname}</td>
                  <td className="px-4 py-2 border">-</td>
                  <td className="px-4 py-2 border space-x-2">
                    <button
                      onClick={() => handleMessage(m.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Msg
                    </button>
                    <button
                      onClick={() => handleBan(m.id)}
                      className="text-red-600 hover:underline"
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabella Nuovi Membri */}
        <div>
          <h2 className="text-xl font-bold mb-2">Nuovi Membri</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Nickname</th>
                <th className="px-4 py-2 border">Invitante</th>
                <th className="px-4 py-2 border">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pendingMembers.length > 0 ? (
                pendingMembers.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 border">{m.email}</td>
                    <td className="px-4 py-2 border">{m.nickname}</td>
                    <td className="px-4 py-2 border">{m.invited_by}</td>
                    <td className="px-4 py-2 border">
                      <button className="text-green-600 hover:underline">
                        Approva
                      </button>
                      <button className="text-red-600 hover:underline ml-2">
                        Rifiuta
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                    Nessun nuovo membro da approvare
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tabella Inviti */}
        <div>
          <h2 className="text-xl font-bold mb-2">Inviti dell'Admin</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Token</th>
                <th className="px-4 py-2 border">Usato da</th>
                <th className="px-4 py-2 border">Creato il</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 border font-mono text-sm">
                    {inv.token}
                  </td>
                  <td className="px-4 py-2 border">
                    {inv.used_by || '-'}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(inv.created_at).toLocaleString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

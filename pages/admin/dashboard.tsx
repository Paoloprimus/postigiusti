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
  role: string;
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

  useEffect(() => {
    (async () => {
      // Ottieni sessione e utente
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/admin-login');
        return;
      }
      // Verifica ruolo admin
      const { data: profile, error: profileError } = await supabase
        .from<Profile>('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError || profile.role !== 'admin') {
        router.push('/admin-login');
        return;
      }

      // Carica dati iniziali
      const { data: allProfiles } = await supabase
        .from<Profile>('profiles')
        .select('*');
      const { data: allInvites } = await supabase
        .from<Invite>('invites')
        .select('*');

      setProfiles(allProfiles || []);
      setInvites(allInvites || []);
      // Profili nuovi (role pending)
      setPendingProfiles(
        (allProfiles || []).filter((p) => p.role === 'pending')
      );
    })();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">
          Admin Dashboard
        </h1>
        <div className="flex gap-4 mb-6">
          <Link href="/dashboard">
            <a className="px-4 py-2 bg-gray-200 rounded">Bacheca Pubblica</a>
          </Link>
          <Link href="/admin/inviti">
            <a className="px-4 py-2 bg-blue-600 text-white rounded">
              Invia Inviti
            </a>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Logout
          </button>
        </div>

        {/* Tabella Membri */}
        <h2 className="text-2xl font-semibold mb-2">Membri</h2>
        <table className="w-full mb-6 table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Nickname</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Invitati</th>
              <th className="border px-2 py-1">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{p.email}</td>
                <td className="border px-2 py-1">{p.nickname}</td>
                <td className="border px-2 py-1">{p.role}</td>
                <td className="border px-2 py-1">
                  {/* conteggio placeholder */}
                  NA
                </td>
                <td className="border px-2 py-1">
                  <button className="text-red-600 hover:underline">
                    Banna
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabella Nuovi Membri */}
        <h2 className="text-2xl font-semibold mb-2">Nuove Iscrizioni</h2>
        <table className="w-full mb-6 table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Nickname</th>
              <th className="border px-2 py-1">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {pendingProfiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{p.email}</td>
                <td className="border px-2 py-1">{p.nickname}</td>
                <td className="border px-2 py-1">
                  <button className="text-green-600 hover:underline mr-2">
                    Approva
                  </button>
                  <button className="text-red-600 hover:underline">
                    Rifiuta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabella Inviti */}
        <h2 className="text-2xl font-semibold mb-2">Inviti Generati</h2>
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Token</th>
              <th className="border px-2 py-1">Invitante</th>
              <th className="border px-2 py-1">Usato da</th>
              <th className="border px-2 py-1">Creato il</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1 truncate max-w-xs">{i.token}</td>
                <td className="border px-2 py-1">{i.invited_by}</td>
                <td className="border px-2 py-1">{i.used_by || '—'}</td>
                <td className="border px-2 py-1">
                  {new Date(i.created_at).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

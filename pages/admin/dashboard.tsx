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
      // Controlla sessione
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/admin-login');
        return;
      }
      // Verifica ruolo admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
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
      // Carica inviti admin
      const { data: adminInvites } = await supabase
        .from('invites')
        .select('*');
      setInvites(adminInvites || []);
    })();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex gap-2 mb-4">
        <Link href="/dashboard">
          <a className="px-3 py-1 bg-gray-200 rounded">Bacheca</a>
        </Link>
        <Link href="/generate-invite">
          <a className="px-3 py-1 bg-gray-200 rounded">Invia Inviti</a>
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          Logout
        </button>
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
              <td className="px-2 py-1">{/* da implementare conteggio */}</td>
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

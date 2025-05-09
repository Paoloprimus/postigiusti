// pages/announcements.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import AnnouncementsTree from '../components/AnnouncementsTree';

export default function AnnouncementsPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;

      if (!session) {
        router.replace('/login');
        return;
      }

      const user = session.user;

      // 🔍 Controlla se esiste già un profilo
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Nessun profilo trovato → lo creiamo
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: 'member',
          nickname: user.email?.split('@')[0] || 'utente',
        });
      }
    });
  }, [router]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold my-4">Bacheca</h1>
      <AnnouncementsTree />
    </Layout>
  );
}

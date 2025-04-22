// pages/announcements.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import AnnouncementsTree from '../components/AnnouncementsTree';

export default function AnnouncementsPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold my-4">Annunci</h1>
      <AnnouncementsTree />
    </Layout>
  );
}

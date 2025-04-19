// pages/admin/inviti.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

export default function InvitiAdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
      } else {
        setRole('admin');
      }
    };

    checkAdmin();
  }, [router]);

  if (role !== 'admin') return <Layout title="Controllo..."><p>Verifica in corso...</p></Layout>;

  return (
    <Layout title="Gestione Inviti">
      <h1 className="text-2xl font-bold mb-4">Area Riservata – Gestione Inviti</h1>
      <p>Qui potrai vedere e generare inviti (in arrivo).</p>
    </Layout>
  );
}

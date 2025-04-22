// pages/announcements.tsx
import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import AnnouncementsTree from '../components/AnnouncementsTree';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default function AnnouncementsPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold my-4">Annunci</h1>
      <AnnouncementsTree />
    </Layout>
  );
}

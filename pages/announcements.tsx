// pages/announcements.tsx
import Layout from '../components/Layout';
import AnnouncementsTree from '../components/AnnouncementsTree';

export default function AnnouncementsPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold my-4">Annunci</h1>
      <AnnouncementsTree />
    </Layout>
  );
}

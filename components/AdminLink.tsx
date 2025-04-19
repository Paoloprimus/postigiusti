// components/AdminLink.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function AdminLink() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setRole(profile?.role || null);
    };

    fetchRole();
  }, []);

  if (role !== 'admin') return null;

  return (
    <Link
      href="/admin/inviti"
      className="text-blue-600 underline hover:text-blue-800"
    >
      Vai all’Area Amministratore
    </Link>
  );
}

// hooks/useSponsor.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSponsor() {
  const [sponsor, setSponsor] = useState<{ text: string; link: string | null } | null>(null);

  useEffect(() => {
    const fetchSponsor = async () => {
      const province = localStorage.getItem('selectedProvince')?.toLowerCase() ?? null;
      const region = localStorage.getItem('selectedRegionName')?.toLowerCase() ?? null;

      const { data, error } = await supabase
        .from('sponsor_announcements')
        .select('text, link, country, region, province')
        .eq('active', true);

      if (error) {
        console.error('❌ Errore fetch sponsor:', error);
        setSponsor(null);
        return;
      }

      const clean = (val: string | null) =>
        typeof val === 'string' ? val.trim().toLowerCase() : null;

      const national = data.find(
        (s) => clean(s.country) === 'it' && !clean(s.region) && !clean(s.province)
      );

      const regional = data.find(
        (s) => clean(s.region) === region && !clean(s.province)
      );

      const local = data.find((s) => clean(s.province) === province);

      setSponsor(local ?? regional ?? national ?? null);
    };

    fetchSponsor();
  }, []);

  return sponsor;
}

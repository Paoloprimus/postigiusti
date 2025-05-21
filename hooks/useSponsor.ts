// hooks/useSponsor.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSponsor(regionId: number | null, provinceId: number | null) {
  const [sponsor, setSponsor] = useState<{ text: string; link: string | null } | null>(null);

  useEffect(() => {
    const fetchSponsor = async () => {
      let regionName: string | null = null;
      let provinceName: string | null = null;

      // recupera i nomi solo se disponibili
      if (regionId !== null) {
        const { data } = await supabase
          .from('regions')
          .select('name')
          .eq('id', regionId)
          .maybeSingle();
        regionName = data?.name?.toLowerCase() ?? null;
      }

      if (provinceId !== null) {
        const { data } = await supabase
          .from('provinces')
          .select('name')
          .eq('id', provinceId)
          .maybeSingle();
        provinceName = data?.name?.toLowerCase() ?? null;
      }

      const { data: announcements, error } = await supabase
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

      const match = announcements.find((s) => clean(s.province) === provinceName)
        ?? announcements.find((s) => clean(s.region) === regionName && !s.province)
        ?? announcements.find((s) => clean(s.country) === 'it' && !s.region && !s.province);

      if (match) {
        setSponsor({ text: match.text, link: match.link });
      } else {
        setSponsor(null);
      }
    };

    fetchSponsor();
  }, [regionId, provinceId]);

  return sponsor;
}

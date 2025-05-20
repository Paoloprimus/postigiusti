// hooks/useSponsor.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSponsor(regionId: number | null, provinceId: number | null) {
  const [sponsor, setSponsor] = useState<{ text: string; link: string | null } | null>(null);

  useEffect(() => {
  const fetchSponsor = async () => {
    let regionName: string | null = null;
    let provinceName: string | null = null;
  
    if (regionId !== null) {
      const { data: regionData } = await supabase
        .from('regions')
        .select('name')
        .eq('id', regionId)
        .single();
  
      regionName = regionData?.name?.toLowerCase() ?? null;
    }
  
    if (provinceId !== null) {
      const { data: provinceData } = await supabase
        .from('provinces')
        .select('name')
        .eq('id', provinceId)
        .single();
  
      provinceName = provinceData?.name?.toLowerCase() ?? null;
    }
  
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
        (s) => clean(s.region) === regionName && !clean(s.province)
      );

      const local = data.find((s) => clean(s.province) === provinceName);

      setSponsor(local ?? regional ?? national ?? null);
    };

    fetchSponsor();
  }, [regionId, provinceId]);

  return sponsor;
}

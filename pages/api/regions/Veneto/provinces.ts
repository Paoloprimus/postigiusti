// pages/api/regions/[regionId]/provinces.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 2) Estraggo e converto regionId
  const rawRegionId = req.query.regionId
  if (!rawRegionId || Array.isArray(rawRegionId)) {
    return res.status(400).json({ error: 'Invalid regionId' })
  }
  const regionId = parseInt(rawRegionId, 10)
  if (isNaN(regionId)) {
    return res.status(400).json({ error: 'regionId is not a number' })
  }
  console.log('[DEBUG] Fetching provinces for regionId =', regionId)

  // 3) Query a Supabase
  const { data, error } = await supabase
    .from('provinces')
    .select('id,name')
    .eq('region_id', regionId)
    .order('name', { ascending: true })

  if (error) {
    console.error('[DEBUG] Supabase error fetching provinces:', error)
    // restituisco tutto l’oggetto error per debug
    return res.status(500).json({ error: error.message, details: error })
  }

  // 4) Se non ci sono dati, avviso
  if (!data) {
    return res.status(404).json({ error: 'No provinces found' })
  }

  return res.status(200).json(data)
}

// pages/api/regions/[regionId]/provinces.ts
import type { NextApiRequest, NextApiResponse } from 'next'
// devi risalire quattro livelli: [regionId] → regions → api → pages → <root>
import { supabase } from '../../../../lib/supabase'  // verifica il path!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { regionId } = req.query
  if (!regionId || Array.isArray(regionId)) {
    return res.status(400).json({ error: 'Invalid regionId' })
  }

  const { data, error } = await supabase
    .from('provinces')             // la tabella delle province
    .select('id,name')
    .eq('region_id', regionId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}

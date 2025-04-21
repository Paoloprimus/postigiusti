// pages/api/reports.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createReport } from '../../lib/reportUtils';
import { NewReport, Report } from '../../lib/types';

type ErrorResponse = { error: string };
type SuccessResponse = { report: Report };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // 1) Inizializza Supabase client lato server
  const supabase = createServerSupabaseClient({ req, res });

  // 2) Verifica il metodo e l’autenticazione
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // 3) Estrai e valida il payload
  const body = req.body as Partial<NewReport>;
  const required = ['reported_user', 'item_type', 'item_id', 'content_excerpt'] as const;
  for (const field of required) {
    if (typeof body[field] !== 'string' || body[field].length === 0) {
      return res
        .status(400)
        .json({ error: `Missing or invalid field: ${field}` });
    }
  }

  // 4) Costruisci il nuovo report
  const newReport: NewReport = {
    reported_by: session.user.id,
    reported_user: body.reported_user,
    item_type: (body.item_type === 'post' ? 'post' : 'comment'),
    item_id: body.item_id,
    content_excerpt: body.content_excerpt,
  };

  try {
    // 5) Inserisci su DB
    const report = await createReport(newReport);
    return res.status(201).json({ report });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return res
      .status(500)
      .json({ error: error.message ?? 'Internal server error' });
  }
}

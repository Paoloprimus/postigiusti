// lib/reportUtils.ts

import { supabase } from './supabase';
import { Report } from './types';

/**
 * Tipo per l'inserimento di un nuovo report:
 * esclude i campi generati automaticamente da DB.
 */
export type NewReport = Omit<
  Report,
  'id' | 'status' | 'created_at'
>;

/**
 * Crea una nuova segnalazione.
 *
 * @param input  i campi necessari per l'inserimento:
 *   - reported_by: UUID di chi segnala
 *   - reported_user: UUID dell'autore del contenuto
 *   - item_type: 'post' | 'comment'
 *   - item_id: UUID del post/commento segnalato
 *   - content_excerpt: estratto di testo o link
 * @returns       il Report creato (con id, status, created_at)
 */
export async function createReport(
  input: NewReport
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')        // nessun generico
    .insert(input)          // inserisce NewReport
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Report creation failed');
  }

  // Castiamo il risultato a Report
  return data as Report;
}

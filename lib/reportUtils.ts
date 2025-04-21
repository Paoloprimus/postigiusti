import { supabase } from './supabase';
import { Report } from './types';

export async function createReport(input: {
  reported_by: string;
  reported_user: string;
  item_type: 'post' | 'comment';
  item_id: string;
  content_excerpt: string;
}): Promise<Report> {
  const { data, error } = await supabase
    .from<Report>('reports')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

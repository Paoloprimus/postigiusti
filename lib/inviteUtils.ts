import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Genera un nuovo invito
export async function generateInvite(email?: string) {
  try {
    // Ottieni l'ID dell'utente corrente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utente non autenticato');
    }
    
    // Genera un token unico
    const token = uuidv4();
    
    // Salva l'invito nel database
    const { data, error } = await supabase
      .from('invites')
      .insert([
        { 
          invited_by: user.id,
          email: email || null,
          token: token
        }
      ]);
      
    if (error) {
      throw error;
    }
    
    return { token, success: true };
  } catch (error) {
    console.error('Errore durante la generazione dell\'invito:', error);
    return { success: false, error };
  }
}

// Verifica che un token di invito sia valido
export async function verifyInvite(token: string) {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();
      
    if (error || !data) {
      return { valid: false };
    }
    
    return { valid: true, invite: data };
  } catch (error) {
    console.error('Errore durante la verifica dell\'invito:', error);
    return { valid: false, error };
  }
}

// Marca un invito come utilizzato
export async function markInviteAsUsed(token: string, userId: string) {
  try {
    const { error } = await supabase
      .from('invites')
      .update({ used: true, used_by: userId })
      .eq('token', token);
      
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'invito:', error);
    return { success: false, error };
  }
}

// Ottieni gli inviti generati dall'utente corrente
export async function getUserInvites() {
  try {
    // Ottieni l'ID dell'utente corrente
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utente non autenticato');
    }
    
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return { invites: data, success: true };
  } catch (error) {
    console.error('Errore durante il recupero degli inviti:', error);
    return { success: false, error };
  }
}
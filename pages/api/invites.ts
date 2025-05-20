// pages/api/invites.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ Estrai token dall’Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  // ✅ Verifica token
  const { data: user, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  console.log('👉 Metodo ricevuto:', req.method);

  // Gestione metodi
  switch (req.method) {
    case 'POST':
      return handleCreateInvite(req, res, user.user);
    default:
      return res.status(405).json({ error: 'Metodo non permesso' });
  }
}

async function handleCreateInvite(req, res, user) {
  console.log('✅ Entrato in handleCreateInvite con:', user);

  const { email } = req.body;
  const token = uuidv4();

  // ✅ Controlla quanti inviti ha già creato l'utente
  const { data: existingInvites, error: inviteCheckError } = await supabase
    .from('invites')
    .select('id', { count: 'exact', head: true })
    .eq('invited_by', user.id);

  if (inviteCheckError) {
    console.error('❌ Errore controllo inviti:', inviteCheckError);
    return res.status(500).json({ error: 'Errore durante il controllo inviti esistenti.' });
  }

  if ((existingInvites?.length || 0) >= 3) {
    return res.status(403).json({ error: 'Hai raggiunto il limite massimo di 3 inviti.' });
  }

  const { data, error } = await supabase
    .from('invites')
    .insert({
      invited_by: user.id,
      email,
      token,
      used: false
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Errore inserimento invito:', error);
    return res.status(500).json({ error: error.message });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Sei stato invitato su Posti Giusti',
    text: `Ciao,

sei stato invitato a unirti a Posti Giusti.

Visita il sito https://postigiusti.com/signup
e inserisci la seguente chiave di invito:

${token}

A presto!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email inviata a', email);
  } catch (emailError) {
    console.error('❌ Errore invio email:', emailError);
    return res.status(500).json({ error: 'Errore durante l’invio dell’email di invito.' });
  }

  return res.status(201).json(data);
}

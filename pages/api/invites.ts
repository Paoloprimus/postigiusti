// pages/api/invites.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createServerSupabaseClient({ req, res });
  
  // Verifica autenticazione
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return res.status(401).json({
      error: 'Non autorizzato'
    });
  }

  // Gestisci le diverse operazioni
  switch (req.method) {
    case 'POST':
      return handleCreateInvite(req, res, supabase, session);
    case 'GET':
      return handleGetInvites(req, res, supabase, session);
    default:
      return res.status(405).json({ error: 'Metodo non permesso' });
  }
}

async function handleCreateInvite(req, res, supabase, session) {
  const { email } = req.body;
  
  // Genera token unico
  const token = uuidv4();
  
  const { data, error } = await supabase
    .from('invites')
    .insert({
      invited_by: session.user.id,
      email: email || null,
      token: token,
      used: false
    })
    .select()
    .single();
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // cambia qui
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });


  // Costruisci e invia l’email
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
  console.log('📤 Tentativo di invio email a', email);
  await transporter.sendMail(mailOptions);
  console.log('✅ Email inviata con successo a', email);
} catch (emailError) {
  console.error('❌ Errore invio email:', emailError);
  return res.status(500).json({ error: 'Errore durante l’invio dell’email di invito.' });
}


  return res.status(201).json(data);
}


async function handleGetInvites(req, res, supabase, session) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('invited_by', session.user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  return res.status(200).json(data);
}

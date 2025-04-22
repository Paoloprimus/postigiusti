// components/Layout.tsx
import Head from 'next/head';
import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Posti Giusti' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Piattaforma di scambio info su alloggi arredati per lavoratori precari" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Posti Giusti - Tutti i diritti riservati
      </footer>
    </>
  );
}

// pages/index.tsx
import Link from 'next/link';

export default function PublicLandingPage() {
  return (
    <main className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">AlloggiPrecari</h1>
      <p className="mb-6">
        Una piattaforma riservata per condividere alloggi tra docenti e personale ATA precario.
        L’accesso è consentito solo tramite invito.
      </p>
      <Link
        href="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Accedi con invito
      </Link>
    </main>
  );
}

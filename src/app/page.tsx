import { Dashboard } from '@/components/dashboard/dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PriceWise Dashboard',
  description: 'Compare prices from multiple marketplaces efficiently.',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  );
}

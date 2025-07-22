import { Dashboard } from '@/components/dashboard/dashboard';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PriceTrack Dashboard',
  description: 'Compare prices from multiple marketplaces efficiently.',
};

export default function Home() {
  return (
    <SidebarProvider>
      <main className="min-h-screen">
        <Dashboard />
      </main>
    </SidebarProvider>
  );
}

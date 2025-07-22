import { Dashboard } from '@/components/dashboard/dashboard';
import type { Metadata } from 'next';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'PriceTrack Dashboard',
  description: 'Compare prices from multiple marketplaces efficiently.',
};

export default function Home() {
  return (
    <SidebarProvider>
      <main className="min-h-screen bg-background">
        <Dashboard />
      </main>
    </SidebarProvider>
  );
}

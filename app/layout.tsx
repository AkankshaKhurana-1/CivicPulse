import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/components/dashboard/RoleContext';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'CivicPulse — AI-Powered Civic Infrastructure & Accountability Platform',
  description: 'Every civic issue deserves action. Every action deserves accountability. Connect citizen reporting with geospatial intelligence, multi-agency routing, evidence verification, and root-cause dependency tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50">
        <RoleProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </RoleProvider>
      </body>
    </html>
  );
}

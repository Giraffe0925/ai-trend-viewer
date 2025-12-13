import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI & Science Trends',
  description: 'Automated trend tracker for AI, Science, and Philosophy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen relative overflow-hidden bg-[url('/noise.png')]">
          <Header />
          <main className="container pb-20 pt-8 relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

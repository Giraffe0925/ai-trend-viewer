import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '日々知読',
  description: '科学・哲学・テクノロジー。世界の最先端研究を、分かりやすく日本語でお届けします。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3433420842549448"
          crossOrigin="anonymous"
        />
        <meta name="google-adsense-account" content="ca-pub-3433420842549448" />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QZN4ZHMLCK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QZN4ZHMLCK');
          `}
        </Script>
      </head>
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

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import AppShell from '@/components/layout/AppShell';
import ThemeInit from '@/components/layout/ThemeInit';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '영어 배우기',
  description: '영유 복습용 아이 영어 학습 앱',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          background: 'linear-gradient(135deg, var(--bg-page-from), var(--bg-page-via), var(--bg-page-to))',
          color: 'var(--text-primary)',
        }}
      >
        <ThemeInit />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

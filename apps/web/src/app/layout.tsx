import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallex Grid Bot - Dashboard',
  description: 'Professional grid trading bot for Wallex Exchange',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

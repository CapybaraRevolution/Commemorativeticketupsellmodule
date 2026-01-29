import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Commemorative Ticket Module Demo',
  description: 'Demo of the commemorative ticket upsell module for theater ticketing',
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

import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'OpenGenUI — Your imagination, in motion',
  description:
    'An open-source creative workspace for AI images, videos, and your own assistants.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

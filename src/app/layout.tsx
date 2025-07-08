import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppProvider } from '@/context/app-provider';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Noteworthy',
  description: 'A modern note-taking application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0KOV3CQDEZwgpcK7hBUYfPROZkMmnPAI7GVREmbYWIz5p2iz6TvrY" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <AppProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </AppProvider>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "AI Publishing Platform",
  description: "Conversational AI Publishing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header
              className="border-b"
              style={{ borderColor: "var(--ink-border)" }}
            >
              <NavBar />
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
              {children}
            </main>
          </div>

          {/* Vercel Analytics */}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}

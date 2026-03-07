import type { Metadata } from "next";
import Link from "next/link";
import FloatingChat from "@/components/FloatingChat";
import "./globals.css";

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
        <div className="flex flex-col min-h-screen">
          <header className="border-b" style={{ borderColor: 'var(--ink-border)' }}>
            <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="font-semibold text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
              >
                ✦ AI Platform ✦
              </Link>
              <div className="flex gap-6 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                <Link href="/blog" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--ink)' }}>
                  Blog
                </Link>
                <Link href="/studio" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--ink)' }}>
                  Studio
                </Link>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
            {children}
          </main>
          <FloatingChat />
        </div>
      </body>
    </html>
  );
}

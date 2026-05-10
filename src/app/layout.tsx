import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Upload, BookOpen, CreditCard, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interactive Dictionary",
  description: "An interactive dictionary that turns documents into flashcards.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dictionary",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          <main className="content">{children}</main>
          <nav className="nav-bar glass-panel">
            <Link href="/" className="nav-item">
              <Upload size={24} />
              <span>Upload</span>
            </Link>
            <Link href="/reader" className="nav-item">
              <BookOpen size={24} />
              <span>Reader</span>
            </Link>
            <Link href="/flashcards" className="nav-item">
              <CreditCard size={24} />
              <span>Cards</span>
            </Link>
            <Link href="/settings" className="nav-item">
              <Settings size={24} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}

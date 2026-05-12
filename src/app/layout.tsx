"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, History, CreditCard, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Upload, label: "Upload" },
    { href: "/history", icon: History, label: "History" },
    { href: "/flashcards", icon: CreditCard, label: "Cards" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Interactive Dictionary</title>
        <meta name="description" content="An interactive dictionary that turns documents into flashcards." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Dictionary" />
        <meta name="theme-color" content="#121212" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <div className="app-container">
          <nav className="sidebar">
            <div className="sidebar-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/app_logo.png" alt="Logo" className="sidebar-logo-img" />
            </div>
            <div className="sidebar-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    title={item.label}
                  >
                    <div className={`sidebar-icon-wrapper ${isActive ? "active" : ""}`}>
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span className="sidebar-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}

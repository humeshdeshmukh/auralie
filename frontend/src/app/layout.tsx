'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header, Footer } from "@/components";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// export const metadata: Metadata = {
//   title: "Auralie - Women's Health & Wellness Technology",
//   description: "Track your cycle, predict patterns, and take control of your health with personalized insights and community support.",
//   keywords: "women's health, menstrual cycle tracking, fertility, wellness, health technology",
//   authors: [{ name: "Auralie Team" }],
//   viewport: "width=device-width, initial-scale=1",
// };

// Client-side only code to remove Grammarly attributes
export function removeGrammarlyAttributes() {
  if (typeof window !== 'undefined') {
    document.body.removeAttribute('data-new-gr-c-s-check-loaded');
    document.body.removeAttribute('data-gr-ext-installed');
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Remove Grammarly attributes on client-side
  if (typeof window !== 'undefined') {
    removeGrammarlyAttributes();
  }

  return (
    <html lang="en">
      <body 
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

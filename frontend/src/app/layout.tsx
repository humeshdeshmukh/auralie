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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs'
import "./globals.css";
import AppShell from "@/app/components/providers/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: metadata export doesn't work in client components
// For SEO, consider moving metadata to a server component wrapper if needed
// export const metadata: Metadata = {
//   title: "Flipbook App - Create and Manage Your Flipbooks",
//   description: "Create, manage, and share interactive flipbooks with ease",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SignedIn>
            <AppShell>{children}</AppShell>
          </SignedIn>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center">{children}</div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
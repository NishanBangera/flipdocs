"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "../globals.css";
import { ThemeProvider } from "../components/providers/theme.provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <head>
          <title>Flipbook Viewer</title>
          <meta name="description" content="Interactive flipbook viewing experience" />
          <meta name="robots" content="index, follow" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
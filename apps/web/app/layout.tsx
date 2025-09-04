"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { LayoutContent } from "./components/layout-content";
import { ThemeProvider } from "./components/providers/theme.provider";
import { RootProvider } from "./components/providers/root-provider";
import { Toaster } from "sonner";

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

// Check if we have valid Clerk keys (only check public key since secret key won't be in build)
const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_build_placeholder" &&
                         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider>
            <LayoutContent>{children}</LayoutContent>
          </RootProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if we have valid keys
  if (hasValidClerkKeys) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    );
  }

  // During build or when keys are placeholders, render without ClerkProvider
  return content;
}
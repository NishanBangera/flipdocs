"use client";

import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import AppShell from "./providers/app-shell";
import { LoadingSpinner } from "./ui/loading";

const FULLSCREEN_ROUTES = ['/sign-in', '/view'];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser();
  const pathname = usePathname();

  const isFullScreenRoute = FULLSCREEN_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For public routes (sign-in, sign-up), render without AppShell
  if (isFullScreenRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {children}
      </div>
    );
  }

  // For authenticated users, render with AppShell
  return <AppShell>{children}</AppShell>;
}
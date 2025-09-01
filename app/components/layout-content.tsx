"use client";

import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import AppShell from "./providers/app-shell";
import { LoadingSpinner } from "./ui/loading";

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/sign-in', '/sign-up'];
// Routes that should render without AppShell (full-screen experience)
const FULLSCREEN_ROUTES = ['/view'];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  const isFullscreenRoute = FULLSCREEN_ROUTES.some(route => 
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
  if (isPublicRoute || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {children}
      </div>
    );
  }

  // For fullscreen routes (view), render without AppShell but allow full access
  if (isFullscreenRoute) {
    return <>{children}</>;
  }

  // For authenticated users, render with AppShell
  return <AppShell>{children}</AppShell>;
}
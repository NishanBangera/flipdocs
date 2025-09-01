"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconLogout } from "@tabler/icons-react";
import { CircleUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useSidebar } from "@/components/ui/sidebar";

function UserDetailsCard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { state } = useSidebar();

  const displayName =
    (user?.firstName && user.firstName.trim()) ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "User";

  const avatarFallback = displayName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      // Sign out without immediate redirect to prevent race conditions
      await signOut();
      // Use replace instead of push to prevent back navigation issues
      router.replace("/sign-in");
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect in case of error
      router.replace("/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, signOut, router]);

  // Don't render if not loaded yet
  if (!isLoaded) {
    return (
      <div className="w-full">
        <div className={`flex items-center ${state === "collapsed" ? "justify-center" : "justify-between"} w-full overflow-hidden`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            {state === "expanded" && <div className="w-20 h-4 bg-muted animate-pulse rounded" />}
          </div>
        </div>
      </div>
    );
  }

  if (state === "collapsed") {
    return (
      <div className="w-full flex justify-center">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Sign out"
          className={`cursor-pointer hover:bg-accent rounded-md p-2 transition-colors ${
            isLoggingOut ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.imageUrl || ""} alt={displayName} />
            <AvatarFallback className="text-xs">{avatarFallback || <CircleUser size={16} />}</AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full overflow-hidden">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.imageUrl || ""} alt={displayName} />
            <AvatarFallback className="text-sm">{avatarFallback || <CircleUser size={16} />}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">
            {isSignedIn ? displayName : "User"}
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Sign out"
          className={`cursor-pointer hover:bg-accent rounded-md p-1.5 transition-colors ${
            isLoggingOut ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <IconLogout size={16} />
        </button>
      </div>
    </div>
  );
}

export default UserDetailsCard;

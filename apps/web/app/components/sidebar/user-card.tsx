"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLogout } from "@tabler/icons-react";
import { CircleUser, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open user menu"
              className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.imageUrl || ""} alt={displayName} />
                <AvatarFallback className="text-xs">{avatarFallback || <CircleUser size={16} />}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {isSignedIn ? displayName : "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <IconLogout className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

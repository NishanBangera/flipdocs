"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconLogout } from "@tabler/icons-react";
import { CircleUser } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useClerk, useUser } from "@clerk/nextjs";

function UserDetailsCard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    (user?.firstName && user.firstName.trim()) ||
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "User";

  const avatarFallback = displayName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await signOut({ redirectUrl: "/sign-in" });
      // Fallback in case redirect doesn't happen immediately
      router.push("/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full">
      <Separator className="bg-gray-medium mb-2" />
      <div className="flex items-center justify-between w-full overflow-hidden">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={user?.imageUrl || ""} alt={displayName} />
            <AvatarFallback>{avatarFallback || <CircleUser />}</AvatarFallback>
          </Avatar>
          <div className="text-base font-medium">
            {!isLoaded ? "" : isSignedIn ? displayName : "User"}
          </div>
        </div>

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className={`cursor-pointer hover:bg-accent rounded-md p-1.5 transition-colors ${
            isLoggingOut ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <IconLogout size={18} />
        </button>
      </div>
    </div>
  );
}

export default UserDetailsCard;

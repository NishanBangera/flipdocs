"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconLogout } from "@tabler/icons-react";
import { CircleUser } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useContext } from "react";
import { Separator } from "@/components/ui/separator";

function UserDetailsCard() {
  const params = useParams();
  const id = params.id as string;
  

  return (
    <div className="w-full">
      <Separator className="bg-gray-medium mb-2" />
      <div className="flex items-center justify-between w-full overflow-hidden">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={""} />
            <AvatarFallback>
              <CircleUser />
            </AvatarFallback>
          </Avatar>
          <div className="text-base font-medium">
            {"User"}
          </div>
        </div>

        <div
        //   onClick={handleLogout}
        //   className={`cursor-pointer hover:bg-accent rounded-md p-1.5 ${isLoggingOut ? "opacity-50 pointer-events-none" : ""}`}
        >
          <IconLogout size={18} />
        </div>
      </div>
    </div>
  );
}

export default UserDetailsCard;

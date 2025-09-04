"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarArrowToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hover:bg-accent absolute top-[20vh] -right-[12px] rounded-md w-[24px] h-[24px] border dark:border-[#303030] hover:text-white text-white/40 bg-border cursor-pointer transition-all ease-in-out"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight size={14} />
      ) : (
        <ChevronLeft size={14} />
      )}
    </Button>
  );
}
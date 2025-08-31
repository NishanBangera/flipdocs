"use client";

import Sidebar from "../sidebar/sidebar";
import { RootProvider } from "./root-provider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <div className="flex w-full h-screen">
        {/* Static sidebar for md+ screens */}
        <div className="hidden md:block overflow-y-auto dark:bg-secondary-foreground w-[220px] border">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="w-0 flex-grow h-full flex flex-col">
          {/* Mobile top bar with menu button */}
          <div className="md:hidden flex items-center gap-2 p-2 border-b">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-base">Flipbook</span>
          </div>

          <div className="flex-grow w-full h-0 overflow-auto">{children}</div>
        </div>
      </div>
    </RootProvider>
  );
}
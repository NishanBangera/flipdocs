"use client";

import AppSidebar from "../sidebar/sidebar";
import { RootProvider } from "./root-provider";
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from "@/components/ui/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header with trigger */}
          <div className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <span className="font-semibold text-lg">Dashboard</span>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RootProvider>
  );
}
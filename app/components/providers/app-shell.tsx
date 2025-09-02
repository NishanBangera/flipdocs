
import AppSidebar from "../sidebar/sidebar";
import { 
  SidebarProvider, 
  SidebarInset 
} from "@/components/ui/sidebar";
import { DynamicHeader } from "../layout/dynamic-header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        {/* Dynamic Header with breadcrumbs */}
        <DynamicHeader />

        {/* Main content */}
        <div className="flex-grow overflow-auto p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
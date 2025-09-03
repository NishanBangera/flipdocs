
import AppSidebar from "../sidebar/sidebar";
import { 
  SidebarProvider, 
  SidebarInset 
} from "@/components/ui/sidebar";
import { DynamicHeader } from "../layout/dynamic-header";
import { PublishProvider } from "./publish.provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <PublishProvider>
          {/* Dynamic Header with breadcrumbs */}
          <DynamicHeader />

          {/* Main content */}
          <div className="flex-grow p-4">
            {children}
          </div>
        </PublishProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
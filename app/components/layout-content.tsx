"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar/sidebar";
import { RootProvider } from "./providers/root-provider";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in");
  
  if (isAuthPage) {
    return (
      <div className="flex justify-center items-center h-screen">{children}</div>
    );
  }

  return (
    <RootProvider>
      <div className="flex w-full h-screen">
        <div className="overflow-y-auto dark:bg-secondary-foreground w-[220px] border-2 border-yellow-500">
          <Sidebar />
        </div>
        <div className="w-0 flex-grow h-full flex flex-col border border-blue-800">
          {/* Top Header */}
          {/* <Header /> */}
          <div className="flex-grow w-full h-0 overflow-auto border-2 border-red-700">{children}</div>
        </div>
      </div>
    </RootProvider>
  );
}
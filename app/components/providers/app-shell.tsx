"use client";

import Sidebar from "../sidebar/sidebar";
import { RootProvider } from "./root-provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <div className="flex w-full h-screen">
        <div className="overflow-y-auto dark:bg-secondary-foreground w-[220px] border">
          <Sidebar />
        </div>
        <div className="w-0 flex-grow h-full flex flex-col">
          <div className="flex-grow w-full h-0 overflow-auto">{children}</div>
        </div>
      </div>
    </RootProvider>
  );
}
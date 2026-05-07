import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { AppShellProvider } from "@/components/AppShell";

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const household = useApi(() => api.getHousehold(), []);
  const summary = useApi(() => api.getDashboardSummary(), []);

  return (
    <AppShellProvider>
      <div className="min-h-screen flex bg-surface-muted">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar
            ownerName={household.data?.ownerName}
            unreadAlerts={summary.data?.unreadAlerts ?? 0}
          />
          <main className="flex-1 px-4 lg:px-8 py-6">{children}</main>
        </div>
      </div>
    </AppShellProvider>
  );
}

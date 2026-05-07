// Root-level provider that owns the global modal stack + toast container.
// Hooks live in @/hooks/useAppShell so Fast Refresh keeps working.

import { ReactNode, useEffect, useMemo, useState } from "react";
import { CommandPalette } from "@/components/widgets/CommandPalette";
import { AddDeviceWizard } from "@/components/widgets/AddDeviceWizard";
import { HelpSupportPanel } from "@/components/widgets/HelpSupportPanel";
import { SettingsPanel } from "@/components/widgets/SettingsPanel";
import { ToastBubble } from "@/components/ui/Toast";
import { useToastList } from "@/hooks/useToast";
import {
  AppShellContext,
  type AppShellApi,
  type HelpTab,
  type SettingsSection,
} from "@/hooks/useAppShell";

interface ProviderProps { children: ReactNode }

export function AppShellProvider({ children }: ProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("help");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("profile");

  const api = useMemo<AppShellApi>(() => ({
    openSearch:     () => setSearchOpen(true),
    closeSearch:    () => setSearchOpen(false),
    openAddDevice:  () => setAddDeviceOpen(true),
    closeAddDevice: () => setAddDeviceOpen(false),
    openHelp:       (tab) => { if (tab) setHelpTab(tab); setHelpOpen(true); },
    closeHelp:      () => setHelpOpen(false),
    openSettings:   (section) => { if (section) setSettingsSection(section); setSettingsOpen(true); },
    closeSettings:  () => setSettingsOpen(false),
  }), []);

  // Global Cmd/Ctrl+K shortcut for search; "/" focuses search when not typing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      const target = e.target as HTMLElement | null;
      const editable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "/" && !editable && !meta) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AppShellContext.Provider value={api}>
      {children}
      <CommandPalette  open={searchOpen}     onClose={api.closeSearch} />
      <AddDeviceWizard open={addDeviceOpen}  onClose={api.closeAddDevice} />
      <HelpSupportPanel open={helpOpen}      tab={helpTab} setTab={setHelpTab} onClose={api.closeHelp} />
      <SettingsPanel    open={settingsOpen}  section={settingsSection} setSection={setSettingsSection} onClose={api.closeSettings} />
      <ToastTray />
    </AppShellContext.Provider>
  );
}

function ToastTray() {
  const { toasts, dismiss } = useToastList();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastBubble toast={t} onClose={dismiss} />
        </div>
      ))}
    </div>
  );
}

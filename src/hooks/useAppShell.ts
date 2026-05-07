// Hook for opening modals/toasts via the AppShellProvider.
// Lives in its own file so React Fast Refresh stays happy
// (it requires hook-only and component-only modules to be separate).

import { createContext, useContext, useCallback } from "react";

export type SettingsSection =
  | "profile" | "household" | "notifications" | "energy"
  | "privacy" | "appearance" | "region" | "voice" | "security" | "about";

export type HelpTab = "help" | "contact" | "chat";

export interface AppShellApi {
  openSearch:     () => void;
  closeSearch:    () => void;
  openAddDevice:  () => void;
  closeAddDevice: () => void;
  openHelp:       (tab?: HelpTab) => void;
  closeHelp:      () => void;
  openSettings:   (section?: SettingsSection) => void;
  closeSettings:  () => void;
}

export const AppShellContext = createContext<AppShellApi | null>(null);

export function useAppShell(): AppShellApi {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used inside <AppShellProvider>");
  return ctx;
}

export function useShellAction<K extends keyof AppShellApi>(name: K): AppShellApi[K] {
  const api = useAppShell();
  return useCallback(api[name], [api, name]) as AppShellApi[K];
}

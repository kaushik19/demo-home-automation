import { useEffect, useRef, useState } from "react";
import { Bell, Search, Plus, Wifi, ChevronDown, Settings as SettingsIcon, HelpCircle, LogOut, User } from "lucide-react";
import { isMockMode } from "@/services";
import { useAppShell } from "@/hooks/useAppShell";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import type { AlertItem } from "@/types";
import { fmtRelative } from "@/utils/format";
import { toast } from "@/hooks/useToast";
import { useSettings } from "@/hooks/useSettings";

interface Props {
  ownerName?: string;
  unreadAlerts?: number;
}

export function Topbar({ ownerName, unreadAlerts = 0 }: Props) {
  const shell = useAppShell();
  const { settings } = useSettings();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click / Esc
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setBellOpen(false); setMenuOpen(false); }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const displayName = ownerName ?? settings.profile.name ?? "Aryan Sharma";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-surface-sunken">
      <div className="flex items-center gap-3 px-4 lg:px-8 py-3">
        <div className="lg:hidden">
          <img
            src="/babcom-logo-black.png"
            alt="Babcom"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/babcom-logo-black.svg";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base lg:text-lg font-semibold text-brand-500 truncate m-0">
            {greeting}, {displayName.split(" ")[0]}
          </h1>
          <p className="text-xs text-ink-500 hidden sm:block">
            {now.toLocaleDateString(settings.region.language, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        <button
          onClick={shell.openSearch}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-muted w-72 text-left hover:bg-surface-sunken transition-colors"
          aria-label="Open search"
        >
          <Search className="w-4 h-4 text-ink-500" />
          <span className="text-sm text-ink-500 flex-1 truncate">Search devices, rooms, scenes…</span>
          <span className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface text-[10px] font-mono font-semibold text-ink-700 border border-surface-sunken">
            {isMac() ? "⌘" : "Ctrl"} K
          </span>
        </button>
        <button
          onClick={shell.openSearch}
          className="md:hidden w-10 h-10 grid place-items-center rounded-xl hover:bg-surface-muted"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-ink-700" />
        </button>

        {isMockMode && (
          <span className="hidden md:inline-flex chip bg-accent-amber/15 text-accent-amber" title="Currently using in-memory mock data. Set VITE_USE_MOCK=false to go live.">
            <Wifi className="w-3 h-3" /> Mock mode
          </span>
        )}

        <button onClick={shell.openAddDevice} className="btn-soft hidden md:inline-flex">
          <Plus className="w-4 h-4" /> Add device
        </button>

        {/* Bell with notifications popover */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative w-10 h-10 grid place-items-center rounded-xl hover:bg-surface-muted"
            aria-label="Notifications"
            aria-expanded={bellOpen}
          >
            <Bell className="w-5 h-5 text-ink-700" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center text-[10px] font-bold text-white bg-accent-red rounded-full">
                {unreadAlerts}
              </span>
            )}
          </button>
          {bellOpen && <NotificationsPopover onClose={() => setBellOpen(false)} />}
        </div>

        {/* Avatar with menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 pr-1 pl-1 py-1 rounded-full hover:bg-surface-muted transition-colors"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <span className="w-9 h-9 grid place-items-center rounded-full bg-brand-500 text-white text-sm font-bold">
              {initials}
            </span>
            <ChevronDown className="w-4 h-4 text-ink-500 hidden sm:inline" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-pop border border-surface-sunken overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-surface-sunken">
                <p className="text-sm font-semibold text-ink-900 truncate">{displayName}</p>
                <p className="text-xs text-ink-500 truncate">{settings.profile.email}</p>
              </div>
              <ul className="py-1.5">
                <MenuItem icon={User}        label="Profile"  onClick={() => { setMenuOpen(false); shell.openSettings("profile"); }} />
                <MenuItem icon={SettingsIcon} label="Settings" onClick={() => { setMenuOpen(false); shell.openSettings(); }} />
                <MenuItem icon={HelpCircle}  label="Help & Support" onClick={() => { setMenuOpen(false); shell.openHelp(); }} />
              </ul>
              <div className="py-1.5 border-t border-surface-sunken">
                <MenuItem
                  icon={LogOut}
                  label="Sign out"
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    toast.info("Signed out", "This is a demo — no actual session was changed.");
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon, label, onClick, destructive,
}: { icon: typeof Bell; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold transition-colors
          ${destructive ? "text-accent-red hover:bg-accent-red/10" : "text-ink-700 hover:bg-surface-muted"}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    </li>
  );
}

function NotificationsPopover({ onClose }: { onClose: () => void }) {
  const { data, loading, refresh, setData } = useApi<AlertItem[]>(() => api.getAlerts(), []);
  const ack = async (id: string) => {
    await api.acknowledgeAlert(id);
    setData((prev) => prev?.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };
  const items = (data ?? []).slice().sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged));
  const unread = items.filter((a) => !a.acknowledged).length;

  return (
    <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] bg-surface rounded-2xl shadow-pop border border-surface-sunken overflow-hidden z-30">
      <header className="px-4 py-3 border-b border-surface-sunken flex items-center gap-2">
        <p className="text-sm font-semibold text-brand-500">Notifications</p>
        {unread > 0 && <span className="chip bg-accent-red/10 text-accent-red">{unread} unread</span>}
        <button onClick={refresh} className="ml-auto text-xs font-semibold text-brand-500 hover:underline">Refresh</button>
      </header>
      <div className="max-h-[360px] overflow-y-auto p-2">
        {loading ? (
          <p className="text-sm text-ink-500 px-3 py-6 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-ink-500 px-3 py-6 text-center">No notifications.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((a) => (
              <li
                key={a.id}
                className={`p-3 rounded-xl text-sm ${a.acknowledged ? "bg-surface-muted/60" : "bg-brand-50"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink-900">{a.title}</p>
                  <span className="text-[11px] text-ink-500 shrink-0">{fmtRelative(a.createdAt)}</span>
                </div>
                <p className="text-xs text-ink-700 mt-0.5">{a.detail}</p>
                {!a.acknowledged && (
                  <button onClick={() => ack(a.id)} className="mt-1.5 text-xs font-semibold text-brand-500 hover:underline">
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="px-4 py-2.5 border-t border-surface-sunken text-right">
        <button onClick={onClose} className="text-xs font-semibold text-ink-500 hover:underline">Close</button>
      </footer>
    </div>
  );
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

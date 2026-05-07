import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Leaf,
  BarChart3,
  Home,
  HelpCircle,
  Settings,
} from "lucide-react";
import { useAppShell } from "@/hooks/useAppShell";

const navItems = [
  { to: "/",            label: "Dashboard",      icon: LayoutDashboard },
  { to: "/energy",      label: "Energy Saving",  icon: Leaf            },
  { to: "/utilisation", label: "Utilisation",    icon: BarChart3       },
  { to: "/smart-home",  label: "Smart Home",     icon: Home            },
];

export function Sidebar() {
  const shell = useAppShell();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface border-r border-surface-sunken h-screen sticky top-0">
      <div className="px-6 pt-6 pb-5">
        <img
          src="/babcom-logo-black.png"
          alt="Babcom"
          className="h-10 w-auto select-none object-contain"
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/babcom-logo-black.svg";
          }}
        />
        <p className="mt-3 text-[11px] font-bold tracking-[0.18em] uppercase text-brand-500">
          Home Automation
        </p>
      </div>

      <nav className="px-3 mt-2 flex-1">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 pb-6 space-y-1">
        <button onClick={() => shell.openHelp()} className="nav-item w-full">
          <HelpCircle className="w-5 h-5" />
          <span>Help & Support</span>
        </button>
        <button onClick={() => shell.openSettings()} className="nav-item w-full">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

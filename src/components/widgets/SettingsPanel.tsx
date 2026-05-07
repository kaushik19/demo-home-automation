// Comprehensive Settings panel — modeled on what major home-automation
// products expose to end users. All values persist via useSettings().

import { ReactNode, useEffect, useState } from "react";
import {
  User,
  Users,
  Bell,
  Zap,
  Shield,
  Palette,
  Globe,
  Mic,
  Lock,
  Info,
  Trash2,
  RotateCcw,
  Mail,
  Phone,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { useSettings, defaultSettings, type HouseholdMember } from "@/hooks/useSettings";
import { toast } from "@/hooks/useToast";
import { api } from "@/services";

export type SettingsSection =
  | "profile" | "household" | "notifications" | "energy"
  | "privacy" | "appearance" | "region" | "voice" | "security" | "about";

interface Props {
  open: boolean;
  onClose: () => void;
  section: SettingsSection;
  setSection: (s: SettingsSection) => void;
}

const NAV: Array<{ key: SettingsSection; label: string; icon: typeof User; group: string }> = [
  { key: "profile",       label: "Profile",          icon: User,    group: "Account" },
  { key: "household",     label: "Household",        icon: Users,   group: "Account" },
  { key: "notifications", label: "Notifications",    icon: Bell,    group: "Preferences" },
  { key: "energy",        label: "Energy & Tariff",  icon: Zap,     group: "Preferences" },
  { key: "privacy",       label: "Privacy & Data",   icon: Shield,  group: "Preferences" },
  { key: "appearance",    label: "Appearance",       icon: Palette, group: "Preferences" },
  { key: "region",        label: "Language & Region",icon: Globe,   group: "Preferences" },
  { key: "voice",         label: "Voice Assistants", icon: Mic,     group: "Integrations" },
  { key: "security",      label: "Security",         icon: Lock,    group: "Integrations" },
  { key: "about",         label: "About",            icon: Info,    group: "System" },
];

const APP_VERSION = "0.1.0";

export function SettingsPanel({ open, onClose, section, setSection }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      padded={false}
      title={
        <span className="inline-flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-500" />
          Settings
        </span>
      }
      subtitle="Manage your home, account and preferences"
    >
      <div className="flex flex-col md:flex-row min-h-0 max-h-full">
        <nav className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-surface-sunken p-3 md:p-4 overflow-x-auto">
          <SettingsNav active={section} onSelect={setSection} />
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {section === "profile"       && <ProfileSection />}
          {section === "household"     && <HouseholdSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "energy"        && <EnergySection />}
          {section === "privacy"       && <PrivacySection />}
          {section === "appearance"    && <AppearanceSection />}
          {section === "region"        && <RegionSection />}
          {section === "voice"         && <VoiceSection />}
          {section === "security"      && <SecuritySection />}
          {section === "about"         && <AboutSection />}
        </div>
      </div>
    </Modal>
  );
}

function SettingsNav({ active, onSelect }: { active: SettingsSection; onSelect: (s: SettingsSection) => void }) {
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <div className="flex md:flex-col gap-1">
      {groups.map((g) => (
        <div key={g} className="md:mb-2 shrink-0">
          <div className="hidden md:block px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            {g}
          </div>
          <div className="flex md:flex-col gap-1">
            {NAV.filter((n) => n.group === g).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors
                  ${active === key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-ink-700 hover:bg-surface-muted"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Reusable bits ----------------

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <h3 className="m-0 text-base font-semibold text-brand-500">{title}</h3>
        {description && <p className="text-sm text-ink-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </label>
  );
}

function ToggleRow({
  title, description, checked, onChange, disabled,
}: { title: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start gap-4 p-3.5 rounded-xl bg-surface-muted">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        {description && <p className="text-xs text-ink-500 mt-0.5 leading-snug">{description}</p>}
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function Saved() {
  return (
    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-green">
      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
    </span>
  );
}

// ---------------- Sections ----------------

function ProfileSection() {
  const { settings, update } = useSettings();
  const p = settings.profile;
  return (
    <Section title="Profile" description="How Babcom addresses you across the app.">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 grid place-items-center rounded-full bg-brand-500 text-white text-2xl font-bold">
          {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div>
          <p className="text-base font-semibold text-ink-900">{p.name}</p>
          <p className="text-xs text-ink-500 inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{p.email}</p>
          <p className="text-xs text-ink-500 inline-flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5" />{p.phone}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full name">
          <input className="input" value={p.name} onChange={(e) => update({ profile: { name: e.target.value } })} />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={p.email} onChange={(e) => update({ profile: { email: e.target.value } })} />
        </Field>
        <Field label="Phone">
          <input type="tel" className="input" value={p.phone} onChange={(e) => update({ profile: { phone: e.target.value } })} />
        </Field>
      </div>
    </Section>
  );
}

function HouseholdSection() {
  const { settings, update } = useSettings();
  const h = settings.household;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<HouseholdMember["role"]>("family");

  const removeMember = (id: string) => {
    if (h.members.find((m) => m.id === id)?.role === "owner") return;
    update({ household: { members: h.members.filter((m) => m.id !== id) } });
    toast.info("Household member removed");
  };

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const m: HouseholdMember = {
      id: `m_${Math.random().toString(36).slice(2, 8)}`,
      name: inviteEmail.split("@")[0],
      role: inviteRole,
      email: inviteEmail.trim(),
      status: "invited",
      avatarColor: pickAvatarColor(),
    };
    update({ household: { members: [...h.members, m] } });
    setInviteEmail("");
    toast.success("Invitation sent", `${m.email} • role: ${m.role}`);
  };

  return (
    <Section title="Household" description="Members of your home and their access.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Household name">
          <input className="input" value={h.name} onChange={(e) => update({ household: { name: e.target.value } })} />
        </Field>
        <Field label="Address" hint="Used for sunrise/sunset automations and weather.">
          <input className="input" value={h.address} onChange={(e) => update({ household: { address: e.target.value } })} />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-ink-900 m-0">Members ({h.members.length})</h4>
          <Saved />
        </div>
        <ul className="space-y-2">
          {h.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
              <div
                className="w-9 h-9 grid place-items-center rounded-full text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 truncate">{m.name}</p>
                <p className="text-xs text-ink-500 truncate">{m.email}</p>
              </div>
              <span className={`chip ${
                m.role === "owner"  ? "bg-brand-500 text-white"
                : m.role === "family" ? "bg-brand-50 text-brand-600"
                : "bg-accent-amber/15 text-accent-amber"
              }`}>{m.role}</span>
              <span className={`chip ${m.status === "active" ? "bg-accent-green/15 text-accent-green" : "bg-surface-sunken text-ink-700"}`}>
                {m.status}
              </span>
              <button
                onClick={() => removeMember(m.id)}
                disabled={m.role === "owner"}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-surface-sunken text-ink-500 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Remove member"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={invite} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-stretch">
        <input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="invitee@email.com"
          className="input"
        />
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as HouseholdMember["role"])} className="input">
          <option value="family">Family</option>
          <option value="guest">Guest</option>
        </select>
        <button type="submit" className="btn-primary"><Plus className="w-4 h-4" /> Invite</button>
      </form>
    </Section>
  );
}

function NotificationsSection() {
  const { settings, update } = useSettings();
  const n = settings.notifications;
  return (
    <Section title="Notifications" description="Choose how Babcom reaches you.">
      <div>
        <h4 className="text-sm font-semibold text-ink-900 mb-2 m-0">Channels</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ToggleRow title="Email"     checked={n.channels.email} onChange={(v) => update({ notifications: { channels: { email: v } } })} />
          <ToggleRow title="Push"      checked={n.channels.push}  onChange={(v) => update({ notifications: { channels: { push:  v } } })} />
          <ToggleRow title="SMS"       checked={n.channels.sms}   onChange={(v) => update({ notifications: { channels: { sms:   v } } })} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-900 mb-2 m-0">Categories</h4>
        <div className="space-y-2">
          <ToggleRow title="Security alerts"    description="Locks, cameras, motion in armed mode" checked={n.categories.security}     onChange={(v) => update({ notifications: { categories: { security:     v } } })} />
          <ToggleRow title="Energy"             description="Budget overruns, anomalies, savings"  checked={n.categories.energy}       onChange={(v) => update({ notifications: { categories: { energy:       v } } })} />
          <ToggleRow title="Devices"            description="Offline, firmware, low battery"        checked={n.categories.devices}      onChange={(v) => update({ notifications: { categories: { devices:      v } } })} />
          <ToggleRow title="Automations"        description="When automations and scenes run"       checked={n.categories.automations}  onChange={(v) => update({ notifications: { categories: { automations:  v } } })} />
          <ToggleRow title="Tips & offers"      description="Personalised saving tips and product news" checked={n.categories.tipsAndOffers} onChange={(v) => update({ notifications: { categories: { tipsAndOffers: v } } })} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-900 mb-2 m-0">Quiet hours</h4>
        <ToggleRow
          title="Mute non-critical notifications at night"
          description="Security alerts always come through."
          checked={n.quietHours.enabled}
          onChange={(v) => update({ notifications: { quietHours: { enabled: v } } })}
        />
        {n.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-sm">
            <Field label="From">
              <input type="time" className="input" value={n.quietHours.from} onChange={(e) => update({ notifications: { quietHours: { from: e.target.value } } })} />
            </Field>
            <Field label="To">
              <input type="time" className="input" value={n.quietHours.to} onChange={(e) => update({ notifications: { quietHours: { to: e.target.value } } })} />
            </Field>
          </div>
        )}
      </div>
    </Section>
  );
}

function EnergySection() {
  const { settings, update } = useSettings();
  const e = settings.energy;
  return (
    <Section title="Energy & Tariff" description="Tune the financial side of your home.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Currency">
          <select className="input" value={e.currency} onChange={(ev) => update({ energy: { currency: ev.target.value } })}>
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">Pound (£)</option>
            <option value="AED">UAE Dirham (د.إ)</option>
          </select>
        </Field>
        <Field label="Tariff per kWh" hint="Used to compute live cost on Dashboard and Energy Saving.">
          <input type="number" min={0} step="0.01" className="input" value={e.tariffPerKwh}
                 onChange={(ev) => update({ energy: { tariffPerKwh: Number(ev.target.value) } })} />
        </Field>
        <Field label="Monthly budget (kWh)">
          <input type="number" min={1} className="input" value={e.monthlyBudgetKwh}
                 onChange={(ev) => update({ energy: { monthlyBudgetKwh: Number(ev.target.value) } })} />
        </Field>
        <Field label="Peak window">
          <div className="flex items-center gap-2">
            <input type="time" className="input" value={e.peakStart} onChange={(ev) => update({ energy: { peakStart: ev.target.value } })} />
            <span className="text-ink-500 text-sm">to</span>
            <input type="time" className="input" value={e.peakEnd} onChange={(ev) => update({ energy: { peakEnd: ev.target.value } })} />
          </div>
        </Field>
      </div>
      <ToggleRow
        title="Show savings banner on Energy Saving page"
        checked={e.showSavingsBanner}
        onChange={(v) => update({ energy: { showSavingsBanner: v } })}
      />
    </Section>
  );
}

function PrivacySection() {
  const { settings, update } = useSettings();
  const p = settings.privacy;
  return (
    <Section title="Privacy & Data" description="You stay in control of what we collect.">
      <ToggleRow
        title="Share anonymised usage stats"
        description="Helps us improve the product. No personal data leaves your hub."
        checked={p.shareUsageStats}
        onChange={(v) => update({ privacy: { shareUsageStats: v } })}
      />
      <ToggleRow
        title="Cloud voice transcription"
        description="Off by default. When enabled, voice commands are processed in the cloud for better accuracy."
        checked={p.voiceRecording}
        onChange={(v) => update({ privacy: { voiceRecording: v } })}
      />
      <ToggleRow
        title="Location services"
        description="Lets geofencing automations (e.g., Away Mode) work from your phone."
        checked={p.locationServices}
        onChange={(v) => update({ privacy: { locationServices: v } })}
      />
      <ToggleRow
        title="Camera motion notifications"
        description="Send a notification when cameras detect motion."
        checked={p.cameraNotifications}
        onChange={(v) => update({ privacy: { cameraNotifications: v } })}
      />
      <div className="p-3 rounded-xl bg-surface-muted text-xs text-ink-700">
        <p className="font-semibold text-ink-900">Export & delete</p>
        <p className="mt-1">You can request a full data export or delete your account from <a className="text-brand-500 hover:underline" href="https://babcom.in/privacy" target="_blank" rel="noreferrer">babcom.in/privacy</a>.</p>
      </div>
    </Section>
  );
}

function AppearanceSection() {
  const { settings, update } = useSettings();
  const a = settings.appearance;
  return (
    <Section title="Appearance" description="Look and feel of the dashboard.">
      <div>
        <h4 className="text-sm font-semibold text-ink-900 mb-2 m-0">Theme</h4>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {(["light", "dark", "auto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { update({ appearance: { theme: t } }); toast.info(`Theme: ${t}`, t === "auto" ? "Follows system." : undefined); }}
              className={`p-3 rounded-xl border-2 text-sm font-semibold capitalize transition-colors
                ${a.theme === t ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-sunken text-ink-700 hover:border-brand-200"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-ink-500 mt-2">Dark mode coming next release; shows light styling for now.</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-ink-900 mb-2 m-0">Density</h4>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {(["comfortable", "compact"] as const).map((d) => (
            <button
              key={d}
              onClick={() => update({ appearance: { density: d } })}
              className={`p-3 rounded-xl border-2 text-sm font-semibold capitalize transition-colors
                ${a.density === d ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-sunken text-ink-700 hover:border-brand-200"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

function RegionSection() {
  const { settings, update } = useSettings();
  const r = settings.region;
  const timezones = [
    "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London",
    "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Australia/Sydney",
  ];
  const languages = [
    { code: "en-IN", label: "English (India)" },
    { code: "en-US", label: "English (US)" },
    { code: "hi-IN", label: "हिन्दी" },
    { code: "ta-IN", label: "தமிழ்" },
    { code: "ar-AE", label: "العربية" },
  ];
  return (
    <Section title="Language & Region" description="Locale, timezone and units.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Language">
          <select className="input" value={r.language} onChange={(e) => update({ region: { language: e.target.value } })}>
            {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </Field>
        <Field label="Timezone">
          <select className="input" value={r.timezone} onChange={(e) => update({ region: { timezone: e.target.value } })}>
            {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
          </select>
        </Field>
        <Field label="Temperature">
          <select className="input" value={r.tempUnit} onChange={(e) => update({ region: { tempUnit: e.target.value as "C" | "F" } })}>
            <option value="C">Celsius (°C)</option>
            <option value="F">Fahrenheit (°F)</option>
          </select>
        </Field>
        <Field label="Distance">
          <select className="input" value={r.distanceUnit} onChange={(e) => update({ region: { distanceUnit: e.target.value as "metric" | "imperial" } })}>
            <option value="metric">Metric (m, km)</option>
            <option value="imperial">Imperial (ft, mi)</option>
          </select>
        </Field>
        <Field label="Time format">
          <select className="input" value={r.timeFormat} onChange={(e) => update({ region: { timeFormat: e.target.value as "12h" | "24h" } })}>
            <option value="24h">24-hour (14:30)</option>
            <option value="12h">12-hour (2:30 PM)</option>
          </select>
        </Field>
        <Field label="Week starts on">
          <select className="input" value={r.weekStartsOn} onChange={(e) => update({ region: { weekStartsOn: Number(e.target.value) as 0 | 1 } })}>
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}

function VoiceSection() {
  const { settings, update } = useSettings();
  const v = settings.voiceAssistants;
  const items = [
    { key: "alexa",   label: "Amazon Alexa",        desc: "Echo, Fire TV and Alexa Auto." },
    { key: "google",  label: "Google Home",         desc: "Nest speakers, displays and Android." },
    { key: "siri",    label: "Apple Siri Shortcuts",desc: "Run scenes from iPhone, Watch, HomePod." },
    { key: "homekit", label: "Apple HomeKit",       desc: "Native Apple Home app integration." },
  ] as const;
  return (
    <Section title="Voice Assistants" description="Babcom plays nicely with the major voice ecosystems.">
      <div className="space-y-2">
        {items.map((it) => (
          <ToggleRow
            key={it.key}
            title={it.label}
            description={it.desc}
            checked={v[it.key]}
            onChange={(val) => {
              update({ voiceAssistants: { [it.key]: val } as Partial<typeof v> });
              toast.success(`${it.label} ${val ? "connected" : "disconnected"}`);
            }}
          />
        ))}
      </div>
      <div className="p-3 rounded-xl bg-surface-muted text-xs text-ink-700">
        <p className="font-semibold text-ink-900">Privacy note</p>
        <p className="mt-1">Voice recordings are processed on-device by default. Cloud transcription can be enabled in Privacy.</p>
      </div>
    </Section>
  );
}

function SecuritySection() {
  const { settings, update } = useSettings();
  const s = settings.security;
  return (
    <Section title="Security" description="Keep your home and data safe.">
      <ToggleRow
        title="Two-factor authentication"
        description="Required for login from new devices."
        checked={s.twoFactor}
        onChange={(v) => update({ security: { twoFactor: v } })}
      />
      <ToggleRow
        title="Biometric unlock on mobile"
        description="Face/fingerprint to open the app."
        checked={s.biometric}
        onChange={(v) => update({ security: { biometric: v } })}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Auto-lock after (minutes of inactivity)">
          <input type="number" min={1} max={60} className="input" value={s.autoLockMinutes}
                 onChange={(e) => update({ security: { autoLockMinutes: Number(e.target.value) } })} />
        </Field>
        <Field label="Panic scene" hint="Activated by long-pressing the home button.">
          <PanicSceneSelect
            value={s.panicScene}
            onChange={(v) => update({ security: { panicScene: v } })}
          />
        </Field>
      </div>
      <div className="p-3 rounded-xl bg-accent-amber/10 text-xs text-ink-700">
        <p className="font-semibold text-ink-900">Active sessions</p>
        <p className="mt-1">3 devices have signed in: Pixel 8 Pro (Bengaluru, just now), MacBook Air (Bengaluru, 2h ago), iPad (Goa, 3d ago).</p>
        <button onClick={() => toast.success("Signed out of other sessions")} className="mt-2 text-brand-500 font-semibold hover:underline">
          Sign out of other devices
        </button>
      </div>
    </Section>
  );
}

function PanicSceneSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [scenes, setScenes] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let active = true;
    api.getScenes().then((s) => { if (active) setScenes(s.map(({ id, name }) => ({ id, name }))); });
    return () => { active = false; };
  }, []);
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {scenes.length === 0 && <option value={value}>{value}</option>}
      {scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );
}

function AboutSection() {
  const { reset } = useSettings();
  const confirmReset = () => {
    const ok = window.confirm("Reset all Babcom preferences to defaults? This cannot be undone.");
    if (!ok) return;
    reset();
    toast.success("Settings reset to defaults");
  };
  return (
    <Section title="About">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Tile label="App version" value={APP_VERSION} />
        <Tile label="Hub firmware" value="2.4.1" />
        <Tile label="Region" value="IN" />
        <Tile label="Hub serial" value="BAB-1402-0091" />
        <Tile label="Subscription" value="Pro (renews 12 May)" />
        <Tile label="Devices on plan" value="35 / 50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a target="_blank" rel="noreferrer" href="https://babcom.in/terms" className="block p-3 rounded-xl bg-surface-muted hover:bg-brand-50/60 text-sm font-semibold text-ink-900">
          Terms of service
        </a>
        <a target="_blank" rel="noreferrer" href="https://babcom.in/privacy" className="block p-3 rounded-xl bg-surface-muted hover:bg-brand-50/60 text-sm font-semibold text-ink-900">
          Privacy policy
        </a>
        <a target="_blank" rel="noreferrer" href="https://babcom.in/eula" className="block p-3 rounded-xl bg-surface-muted hover:bg-brand-50/60 text-sm font-semibold text-ink-900">
          End-user license
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => toast.success("Backup uploaded", "1 MB sent to encrypted Babcom Cloud")} className="btn-soft text-sm">
          <RotateCcw className="w-4 h-4" /> Back up now
        </button>
        <button onClick={confirmReset} className="btn-ghost text-sm text-accent-red hover:bg-accent-red/10">
          <Trash2 className="w-4 h-4" /> Reset all settings
        </button>
      </div>
      <p className="text-[11px] text-ink-500">© 2026 Babcom Technologies. Defaults: {Object.keys(defaultSettings).length} preference groups.</p>
    </Section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface-muted">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-sm font-semibold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}

function pickAvatarColor(): string {
  const palette = ["#14587F", "#1FA971", "#7C5CFA", "#F5A623", "#3F83A5", "#E5484D"];
  return palette[Math.floor(Math.random() * palette.length)];
}

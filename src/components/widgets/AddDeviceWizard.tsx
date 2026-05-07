// Multi-step "Add device" wizard with simulated discovery + pairing.
// Persists into the active HomeApi adapter (mock or HTTP).

import { useCallback, useEffect, useState } from "react";
import {
  Wifi,
  QrCode,
  Settings as SettingsIcon,
  Lightbulb,
  Snowflake,
  Wind,
  Tv,
  Speaker,
  Camera,
  Lock,
  Plug,
  Activity,
  Refrigerator,
  Blinds,
  Thermometer,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services";
import { toast } from "@/hooks/useToast";
import type { Device, DeviceType, NewDeviceInput, Room } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Method = "auto" | "qr" | "manual";

interface DiscoveredDevice {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  signal: number; // 0-100
}

const TYPE_OPTIONS: Array<{ type: DeviceType; label: string; icon: typeof Lightbulb; sample: string }> = [
  { type: "light",      label: "Smart light",      icon: Lightbulb,    sample: "Philips Hue White A19" },
  { type: "ac",         label: "Air conditioner",  icon: Snowflake,    sample: "Daikin Inverter 1.5T" },
  { type: "fan",        label: "Smart fan",        icon: Wind,         sample: "Atomberg Renesa+" },
  { type: "tv",         label: "Smart TV",         icon: Tv,           sample: "Samsung Crystal 4K" },
  { type: "speaker",    label: "Speaker / soundbar", icon: Speaker,    sample: "Sonos Beam (Gen 2)" },
  { type: "camera",     label: "Camera",           icon: Camera,       sample: "TP-Link Tapo C220" },
  { type: "lock",       label: "Smart lock",       icon: Lock,         sample: "Yale YDM 4109A" },
  { type: "plug",       label: "Smart plug",       icon: Plug,         sample: "Wipro 16A Smart Plug" },
  { type: "sensor",     label: "Sensor",           icon: Activity,     sample: "Aqara Motion Sensor P2" },
  { type: "appliance",  label: "Appliance",        icon: Refrigerator, sample: "Bosch 660L Side-by-side" },
  { type: "blinds",     label: "Blinds / curtains", icon: Blinds,      sample: "IKEA FYRTUR" },
  { type: "thermostat", label: "Thermostat",       icon: Thermometer,  sample: "Honeywell T6 Pro" },
];

type Step = "method" | "discover" | "type" | "configure" | "pair" | "done";

export function AddDeviceWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<Method>("auto");
  const [type, setType] = useState<DeviceType>("light");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([]);
  const [discoverProgress, setDiscoverProgress] = useState(0);
  const [pairProgress, setPairProgress] = useState(0);
  const [pairStatus, setPairStatus] = useState<"idle" | "pairing" | "ok" | "error">("idle");
  const [createdDevice, setCreatedDevice] = useState<Device | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setStep("method");
    setMethod("auto");
    setType("light");
    setName("");
    setDiscovered([]);
    setDiscoverProgress(0);
    setPairProgress(0);
    setPairStatus("idle");
    setCreatedDevice(null);
    api.getRooms().then((r) => {
      setRooms(r);
      if (!roomId && r.length > 0) setRoomId(r[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Step transitions ---------------------------------------------------------
  const next = () => {
    if (step === "method") {
      if (method === "manual") setStep("type");
      else setStep("discover");
    } else if (step === "discover") {
      setStep("configure");
    } else if (step === "type") {
      setStep("configure");
    } else if (step === "configure") {
      void runPairing();
    }
  };

  const back = () => {
    if (step === "discover" || step === "type") setStep("method");
    else if (step === "configure") setStep(method === "manual" ? "type" : "discover");
    else if (step === "pair") {
      if (pairStatus === "pairing") return;
      setStep("configure");
    }
  };

  // Discovery simulation -----------------------------------------------------
  useEffect(() => {
    if (step !== "discover") return;
    setDiscovered([]);
    setDiscoverProgress(0);
    const finds: DiscoveredDevice[] = mockDiscoveryPool(method);
    let i = 0;
    const interval = setInterval(() => {
      setDiscoverProgress((p) => Math.min(100, p + 8));
      if (Math.random() < 0.55 && i < finds.length) {
        const next = finds[i++];
        setDiscovered((prev) => [...prev, next]);
      }
    }, 240);
    const stopper = setTimeout(() => clearInterval(interval), 4500);
    return () => { clearInterval(interval); clearTimeout(stopper); };
  }, [step, method]);

  // Pairing ------------------------------------------------------------------
  const runPairing = async () => {
    setStep("pair");
    setPairStatus("pairing");
    setPairProgress(0);
    const tick = setInterval(() => {
      setPairProgress((p) => Math.min(95, p + 7 + Math.random() * 6));
    }, 150);
    try {
      const input: NewDeviceInput = {
        name: name.trim() || defaultName(type),
        type,
        roomId,
      };
      const created = await api.addDevice(input);
      clearInterval(tick);
      setPairProgress(100);
      setCreatedDevice(created);
      setPairStatus("ok");
      toast.success("Device added", `${created.name} • ${rooms.find((r) => r.id === created.roomId)?.name ?? ""}`);
      setTimeout(() => setStep("done"), 350);
    } catch (e) {
      clearInterval(tick);
      setPairStatus("error");
      toast.error("Pairing failed", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const selectDiscovered = (d: DiscoveredDevice) => {
    setType(d.type);
    setName(d.name);
    setStep("configure");
  };

  // Stable close handler so we don't pass an inline arrow to <Modal>; this
  // also blocks closing while a pairing handshake is in flight.
  const handleClose = useCallback(() => {
    if (pairStatus === "pairing") return;
    onClose();
  }, [pairStatus, onClose]);

  // ---------------- Render ----------------
  const titleByStep: Record<Step, string> = {
    method:    "Add a new device",
    discover:  "Discovering devices…",
    type:      "Pick the device type",
    configure: "Configure your device",
    pair:      "Pairing your device",
    done:      "Device added",
  };
  const subtitleByStep: Record<Step, string> = {
    method:    "Choose how you want to bring this device into your home",
    discover:  method === "auto" ? "Scanning your local network and Bluetooth…" : "Point your camera at the QR code on the device",
    type:      "Don’t see your device on the network? Pick the closest match.",
    configure: "Give it a friendly name and assign a room",
    pair:      "Securely linking the device to your hub",
    done:      "Your device is online and ready to use",
  };

  const canNext = (() => {
    if (step === "method") return true;
    if (step === "type") return true;
    if (step === "configure") return Boolean(name.trim() && roomId);
    if (step === "discover") return false;
    return false;
  })();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={titleByStep[step]}
      subtitle={subtitleByStep[step]}
    >
      {/* Stepper */}
      <Stepper step={step} method={method} />

      {/* Body */}
      <div className="mt-5">
        {step === "method" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MethodCard
              active={method === "auto"}
              onClick={() => setMethod("auto")}
              icon={Wifi}
              title="Auto-discover"
              desc="Scan Wi-Fi + Bluetooth for devices near your hub"
            />
            <MethodCard
              active={method === "qr"}
              onClick={() => setMethod("qr")}
              icon={QrCode}
              title="QR code"
              desc="Scan the code on the device or its packaging"
            />
            <MethodCard
              active={method === "manual"}
              onClick={() => setMethod("manual")}
              icon={SettingsIcon}
              title="Manual"
              desc="Pick the type, name and room yourself"
            />
          </div>
        )}

        {step === "discover" && (
          <div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 text-brand-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">
                Searching… we’ll show devices as soon as they respond.
              </p>
              <button
                onClick={() => { setDiscovered([]); setDiscoverProgress(0); }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Rescan
              </button>
            </div>
            <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-brand-500 transition-all"
                style={{ width: `${discoverProgress}%` }}
              />
            </div>
            <ul className="space-y-2">
              {discovered.length === 0 && (
                <li className="text-sm text-ink-500 px-1">
                  Nothing found yet. Make sure the device is in pairing mode.
                </li>
              )}
              {discovered.map((d) => {
                const Icon = TYPE_OPTIONS.find((o) => o.type === d.type)?.icon ?? Lightbulb;
                return (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-surface-sunken hover:border-brand-200 hover:bg-brand-50/40 transition-colors"
                  >
                    <div className="w-10 h-10 grid place-items-center rounded-xl bg-brand-50 text-brand-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900 truncate">{d.name}</p>
                      <p className="text-xs text-ink-500">{d.manufacturer} • {d.model} • {d.signal}% signal</p>
                    </div>
                    <button
                      onClick={() => selectDiscovered(d)}
                      className="btn-soft text-xs"
                    >
                      Pair
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {step === "type" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TYPE_OPTIONS.map((t) => {
              const Icon = t.icon;
              const active = type === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => setType(t.type)}
                  className={`text-left p-3 rounded-xl border-2 transition-all
                    ${active ? "border-brand-500 bg-brand-50" : "border-surface-sunken hover:border-brand-200"}`}
                >
                  <div className={`w-10 h-10 grid place-items-center rounded-xl ${active ? "bg-brand-500 text-white" : "bg-surface-muted text-brand-500"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink-900">{t.label}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5">{t.sample}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === "configure" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Device type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceType)}
                className="input"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Device name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName(type)}
                className="input"
              />
            </Field>
            <Field label="Room">
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Firmware">
              <input value="1.0.0" disabled className="input opacity-70 cursor-not-allowed" />
            </Field>

            <div className="md:col-span-2 p-3 rounded-xl bg-surface-muted text-xs text-ink-700">
              <p className="font-semibold text-ink-900">Babcom Secure Pairing</p>
              <p className="mt-1">
                Devices are linked over an encrypted Wi-Fi/BLE handshake to your hub.
                You can revoke or rename a device any time from <span className="font-semibold">Smart Home</span>.
              </p>
            </div>
          </div>
        )}

        {step === "pair" && (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto grid place-items-center rounded-full bg-brand-50 text-brand-500">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <p className="mt-4 font-semibold text-ink-900">Pairing {name || defaultName(type)}…</p>
            <p className="text-xs text-ink-500 mt-1">This usually takes a few seconds.</p>
            <div className="mt-4 max-w-sm mx-auto h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all"
                style={{ width: `${pairProgress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-500 tabular-nums">{Math.round(pairProgress)}%</p>
          </div>
        )}

        {step === "done" && createdDevice && (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto grid place-items-center rounded-full bg-accent-green/15 text-accent-green">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="mt-4 text-lg font-semibold text-ink-900">{createdDevice.name} is online</p>
            <p className="text-sm text-ink-500 mt-1">
              Added to <span className="font-semibold">{rooms.find((r) => r.id === createdDevice.roomId)?.name ?? ""}</span>.
              You can control it from the Smart Home page.
            </p>
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-ink-500">
              <span className="chip bg-accent-green/10 text-accent-green">online</span>
              <span className="chip bg-brand-50 text-brand-500">type: {createdDevice.type}</span>
              <span className="chip bg-surface-muted text-ink-700">id: {createdDevice.id}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={back}
          disabled={step === "method" || pairStatus === "pairing" || step === "done"}
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step === "done" ? (
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        ) : (
          <button
            onClick={next}
            disabled={!canNext}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === "configure" ? <><Plus className="w-4 h-4" /> Add device</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </Modal>
  );
}

function Stepper({ step, method }: { step: Step; method: Method }) {
  const linear: Step[] = method === "manual"
    ? ["method", "type", "configure", "pair", "done"]
    : ["method", "discover", "configure", "pair", "done"];
  const idx = linear.indexOf(step);
  const labels: Record<Step, string> = {
    method:    "Method",
    discover:  "Discover",
    type:      "Type",
    configure: "Configure",
    pair:      "Pair",
    done:      "Done",
  };
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {linear.map((s, i) => (
        <div key={s} className="flex items-center gap-2 shrink-0">
          <span
            className={`grid place-items-center w-7 h-7 rounded-full text-xs font-bold
              ${i < idx ? "bg-accent-green text-white" : i === idx ? "bg-brand-500 text-white" : "bg-surface-muted text-ink-500"}`}
          >
            {i < idx ? "✓" : i + 1}
          </span>
          <span className={`text-xs font-semibold ${i === idx ? "text-brand-500" : "text-ink-500"}`}>
            {labels[s]}
          </span>
          {i < linear.length - 1 && <span className="w-6 h-px bg-surface-sunken" />}
        </div>
      ))}
    </div>
  );
}

function MethodCard({
  active, onClick, icon: Icon, title, desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wifi;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border-2 transition-all
        ${active ? "border-brand-500 bg-brand-50 shadow-sm" : "border-surface-sunken hover:border-brand-200"}`}
    >
      <div className={`w-11 h-11 grid place-items-center rounded-xl ${active ? "bg-brand-500 text-white" : "bg-surface-muted text-brand-500"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
      <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function defaultName(type: DeviceType): string {
  const sample = TYPE_OPTIONS.find((t) => t.type === type)?.label ?? "Device";
  return sample;
}

function mockDiscoveryPool(method: Method): DiscoveredDevice[] {
  const base: DiscoveredDevice[] = [
    { id: "u1", name: "Hue Floor Lamp",     type: "light",    manufacturer: "Philips Hue", model: "LCA001", signal: 78 },
    { id: "u2", name: "Bedroom AC",         type: "ac",       manufacturer: "Daikin",      model: "FTKM35U", signal: 64 },
    { id: "u3", name: "Front Door Cam",     type: "camera",   manufacturer: "TP-Link",     model: "Tapo C220", signal: 89 },
    { id: "u4", name: "Kitchen Plug",       type: "plug",     manufacturer: "Wipro",       model: "16A-WP01", signal: 55 },
    { id: "u5", name: "Window Blinds",      type: "blinds",   manufacturer: "IKEA",        model: "FYRTUR",  signal: 47 },
    { id: "u6", name: "Smart Geyser",       type: "appliance",manufacturer: "AO Smith",    model: "HSE-VAS-X25", signal: 71 },
  ];
  if (method === "qr") return base.slice(0, 1);
  return base;
}

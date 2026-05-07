// Help & Support modal: searchable Babcom FAQ, contact channels, and a
// live chat with a smart bot (mocked). Pure client-side; no network calls.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Search,
  Send,
  ChevronDown,
  Sparkles,
  User,
  Users,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/hooks/useToast";

type Tab = "help" | "contact" | "chat";

interface Props {
  open: boolean;
  onClose: () => void;
  tab: Tab;
  setTab: (t: Tab) => void;
}

interface FaqArticle {
  id: string;
  category: "Getting started" | "Devices" | "Energy" | "Automations" | "Billing" | "Security" | "Troubleshooting";
  question: string;
  answer: string;
  tags: string[];
}

const FAQ: FaqArticle[] = [
  {
    id: "f1",
    category: "Getting started",
    question: "How do I set up my Babcom hub for the first time?",
    answer:
      "Plug the hub into power and Ethernet, open the Babcom app, sign in, and tap “Add a hub”. The app pairs over Bluetooth and walks you through Wi-Fi setup, household creation and OTA firmware. Most users finish in under 4 minutes.",
    tags: ["hub", "setup", "first time", "onboarding"],
  },
  {
    id: "f2",
    category: "Devices",
    question: "How do I add a new smart device?",
    answer:
      "Tap the + button in the top bar (or run the “Add a new device” quick action from search). Pick Auto-discover for Wi-Fi/BLE devices on your network, QR for the code on the box, or Manual to enter the details yourself. Babcom uses an encrypted handshake; pairing keys never leave your hub.",
    tags: ["add device", "pair", "qr", "discovery"],
  },
  {
    id: "f3",
    category: "Devices",
    question: "A device shows as offline — what should I check?",
    answer:
      "1) Confirm the device has power and is within Wi-Fi range. 2) Restart the device (most accept a 5-second power-cycle). 3) From Smart Home, open the device and tap “Re-pair”. 4) If the issue persists, run a hub reboot from Settings → Security → Restart hub.",
    tags: ["offline", "wifi", "troubleshoot", "device down"],
  },
  {
    id: "f4",
    category: "Energy",
    question: "How is my monthly energy cost calculated?",
    answer:
      "We multiply the kWh recorded by each device by the tariff you’ve set in Settings → Energy & Tariff (default ₹8.40/kWh). For TOU plans, peak hours (configurable) use a higher slab. The Energy Saving page shows a live estimate and the breakdown by category.",
    tags: ["energy", "bill", "cost", "tariff", "kwh"],
  },
  {
    id: "f5",
    category: "Energy",
    question: "Why does my live power draw fluctuate?",
    answer:
      "Modern appliances cycle power continuously (compressors, defrost, fan stages). The dashboard samples every 3 seconds, so small jitter is normal. A sustained jump usually indicates a device turning on/off — check Activity Feed.",
    tags: ["live power", "fluctuate", "watt", "spike"],
  },
  {
    id: "f6",
    category: "Automations",
    question: "What is a scene and how is it different from an automation?",
    answer:
      "A scene is a one-tap arrangement of multiple devices (e.g., “Movie Night” dims the living-room lights, lowers the AC and switches the TV input). An automation runs scenes or device commands automatically when a trigger fires (time, motion, geofence, sensor).",
    tags: ["scene", "automation", "trigger", "routine"],
  },
  {
    id: "f7",
    category: "Automations",
    question: "Can I run automations only on weekdays?",
    answer:
      "Yes. Open Smart Home → Automations, edit the trigger, and choose the days. You can also exclude public holidays from Settings → Region.",
    tags: ["automation", "schedule", "weekdays", "calendar"],
  },
  {
    id: "f8",
    category: "Billing",
    question: "Where can I download my invoices?",
    answer:
      "Settings → About → Manage subscription. Invoices for the last 24 months are available as PDFs and are also emailed to your registered address each cycle.",
    tags: ["billing", "invoice", "subscription", "payment"],
  },
  {
    id: "f9",
    category: "Security",
    question: "Is my voice data sent to Babcom servers?",
    answer:
      "Voice recordings are processed on-device by default and never leave your home unless you explicitly enable cloud transcription in Settings → Privacy. We never sell or share voice data with third parties.",
    tags: ["voice", "privacy", "data", "alexa", "google"],
  },
  {
    id: "f10",
    category: "Security",
    question: "How do I add a family member or guest?",
    answer:
      "Settings → Household → Invite member. Guests get time-limited access to a subset of scenes and devices. You stay the owner and can revoke access any time from the same screen.",
    tags: ["household", "family", "guest", "invite", "permissions"],
  },
  {
    id: "f11",
    category: "Troubleshooting",
    question: "The app feels slow on my phone — anything I can do?",
    answer:
      "Toggle Settings → Appearance → Density to “Compact”. If you have hundreds of devices, enable Settings → Privacy → “Light analytics”. A factory reset of the hub fixes most lingering issues; your scenes and automations are restored from cloud backup.",
    tags: ["slow", "performance", "reset", "lag"],
  },
];

const CONTACT = {
  phone:   "1800-200-9182",
  whatsapp:"+91 80471 22113",
  email:   "support@babcom.in",
  enterprise: "enterprise@babcom.in",
  hours:   "Mon–Sat, 9:00 – 21:00 IST",
  emergency: "24×7 for security alerts (lock & camera)",
};

export function HelpSupportPanel({ open, onClose, tab, setTab }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      padded={false}
      title={
        <span className="inline-flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-brand-500" />
          Help & Support
        </span>
      }
      subtitle="Babcom is here for you, 24×7"
    >
      <div className="flex flex-col md:flex-row min-h-0 max-h-full">
        <nav className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-surface-sunken p-3 md:p-4 flex md:flex-col gap-1 overflow-x-auto">
          <TabBtn active={tab === "help"} onClick={() => setTab("help")} icon={HelpCircle} label="Help center" />
          <TabBtn active={tab === "contact"} onClick={() => setTab("contact")} icon={Phone} label="Contact us" />
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageCircle} label="Live chat" />
          <div className="hidden md:block mt-auto">
            <div className="mt-6 p-3 rounded-xl bg-brand-50 text-xs text-brand-700">
              <p className="font-semibold">Babcom Care</p>
              <p className="mt-1 text-brand-600">{CONTACT.hours}</p>
            </div>
          </div>
        </nav>

        <div className="min-w-0 flex-1 min-h-0">
          {tab === "help" && <HelpCenterTab />}
          {tab === "contact" && <ContactTab />}
          {tab === "chat" && <LiveChatTab />}
        </div>
      </div>
    </Modal>
  );
}

function TabBtn({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: typeof HelpCircle; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors
        ${active ? "bg-brand-500 text-white shadow-sm" : "text-ink-700 hover:bg-surface-muted"}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ===================== Help Center =====================

function HelpCenterTab() {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return FAQ;
    return FAQ.filter((a) =>
      a.question.toLowerCase().includes(query) ||
      a.answer.toLowerCase().includes(query) ||
      a.tags.some((t) => t.includes(query)) ||
      a.category.toLowerCase().includes(query)
    );
  }, [q]);

  const grouped = useMemo(() => {
    const map = new Map<FaqArticle["category"], FaqArticle[]>();
    for (const a of filtered) {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-muted">
        <Search className="w-4 h-4 text-ink-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Babcom help center…"
          className="bg-transparent outline-none text-sm flex-1"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {(["Getting started", "Devices", "Energy", "Automations", "Billing", "Security", "Troubleshooting"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setQ(c)}
            className="text-left px-3 py-2 rounded-xl border border-surface-sunken hover:border-brand-200 hover:bg-brand-50/50 text-xs"
          >
            <span className="font-semibold text-ink-900">{c}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 text-center text-sm text-ink-500">
          No articles match “{q}”. Try the <button onClick={() => setQ("")} className="text-brand-500 font-semibold hover:underline">full list</button> or open <span className="font-semibold">Live chat</span>.
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {grouped.map(([cat, items]) => (
            <section key={cat}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">{cat}</h4>
              <ul className="space-y-2">
                {items.map((a) => {
                  const openA = openId === a.id;
                  return (
                    <li
                      key={a.id}
                      className="rounded-xl border border-surface-sunken overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenId(openA ? null : a.id)}
                        aria-expanded={openA}
                        className="w-full flex items-start justify-between gap-3 p-3 text-left hover:bg-surface-muted"
                      >
                        <span className="text-sm font-semibold text-ink-900">{a.question}</span>
                        <ChevronDown className={`w-4 h-4 text-ink-500 transition-transform ${openA ? "rotate-180" : ""}`} />
                      </button>
                      {openA && (
                        <div className="px-3 pb-3 text-sm text-ink-700 leading-relaxed">
                          {a.answer}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {a.tags.map((t) => (
                              <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Contact =====================

function ContactTab() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    const id = `BAB-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicket(id);
    setSubmitting(false);
    toast.success(`Ticket ${id} raised`, "We’ll email you within 24 hours.");
    setSubject("");
    setDetails("");
  };

  return (
    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
      <section className="space-y-3">
        <h3 className="m-0 text-sm font-semibold text-brand-500">Talk to a human</h3>
        <ContactRow icon={Phone} label="Toll-free care line" value={CONTACT.phone} />
        <ContactRow icon={MessageCircle} label="WhatsApp" value={CONTACT.whatsapp} />
        <ContactRow icon={Mail} label="Email" value={CONTACT.email} />
        <ContactRow icon={Users} label="Enterprise" value={CONTACT.enterprise} />
        <ContactRow icon={Clock} label="Hours" value={CONTACT.hours} />
        <div className="p-3 rounded-xl bg-accent-amber/10 text-xs text-ink-700">
          <p className="font-semibold text-ink-900">Security emergencies</p>
          <p className="mt-1">{CONTACT.emergency}. Dial the care line and press 9 for priority routing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-soft text-xs" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
            <Phone className="w-3.5 h-3.5" /> Call now
          </a>
          <a className="btn-soft text-xs" href={`mailto:${CONTACT.email}`}>
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
          <a className="btn-soft text-xs" href="https://babcom.in/help" target="_blank" rel="noreferrer">
            <ExternalLink className="w-3.5 h-3.5" /> Help portal
          </a>
        </div>
      </section>

      <section>
        <h3 className="m-0 text-sm font-semibold text-brand-500">Raise a ticket</h3>
        <p className="text-xs text-ink-500 mt-1">We typically reply within 24 hours.</p>
        {ticket ? (
          <div className="mt-4 p-4 rounded-xl bg-accent-green/10 text-ink-900">
            <div className="flex items-center gap-2 text-accent-green">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">Ticket {ticket} created</p>
            </div>
            <p className="text-xs text-ink-700 mt-1">
              You’ll receive a confirmation email shortly. Reference this ID when you call.
            </p>
            <button onClick={() => setTicket(null)} className="mt-3 text-xs font-semibold text-brand-500 hover:underline">
              Raise another ticket
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={120} className="input mt-1.5" placeholder="Quick summary" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Details</span>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} required rows={6} className="input mt-1.5" placeholder="Tell us what happened. Include device names if relevant." />
            </label>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function ContactRow({
  icon: Icon, label, value,
}: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-muted">
      <div className="w-9 h-9 grid place-items-center rounded-lg bg-brand-50 text-brand-500 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</p>
        <p className="text-sm font-semibold text-ink-900 break-all">{value}</p>
      </div>
    </div>
  );
}

// ===================== Live Chat =====================

interface ChatMessage {
  id: string;
  role: "bot" | "user" | "system";
  text: string;
  at: number;
  suggestions?: string[];
}

function LiveChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage()]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [agentRequested, setAgentRequested] = useState(false);
  const [queueSec, setQueueSec] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Agent queue countdown
  useEffect(() => {
    if (!agentRequested) return;
    const i = setInterval(() => setQueueSec((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [agentRequested]);

  const sendUserMessage = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: ChatMessage = { id: rid(), role: "user", text: t, at: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    const delay = 500 + Math.random() * 900;
    setTimeout(() => {
      const reply = generateBotReply(t, () => {
        setAgentRequested(true);
        setQueueSec(0);
      });
      setTyping(false);
      setMessages((prev) => [...prev, { id: rid(), role: "bot", at: Date.now(), ...reply }]);
    }, delay);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendUserMessage(input);
  };

  return (
    <div className="flex flex-col min-h-0 h-full max-h-full">
      <div className="px-4 sm:px-5 py-3 border-b border-surface-sunken flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 grid place-items-center rounded-full bg-brand-500 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-surface" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">Babcom Assistant</p>
          <p className="text-[11px] text-ink-500">
            {agentRequested
              ? `Connecting you to a human agent • position 2 in queue (${formatQueue(queueSec)})`
              : "Average reply time: 8 seconds"}
          </p>
        </div>
        {!agentRequested && (
          <button
            onClick={() => {
              setAgentRequested(true);
              setQueueSec(0);
              setMessages((prev) => [
                ...prev,
                { id: rid(), role: "system", at: Date.now(), text: "You requested a human agent. Avg wait time today is 2 minutes." },
              ]);
            }}
            className="btn-soft text-xs"
          >
            Talk to human
          </button>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-surface-muted/40">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} onSuggest={sendUserMessage} />
        ))}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 grid place-items-center rounded-full bg-brand-500 text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm bg-surface shadow-card inline-flex gap-1">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink-300" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink-300" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-ink-300" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-surface-sunken px-3 sm:px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about devices, energy, scenes, billing…"
          className="input flex-1"
        />
        <button type="submit" disabled={!input.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <Send className="w-4 h-4" /> Send
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message, onSuggest }: { message: ChatMessage; onSuggest: (s: string) => void }) {
  if (message.role === "system") {
    return (
      <div className="text-center text-[11px] text-ink-500 italic py-1">{message.text}</div>
    );
  }
  const isUser = message.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 grid place-items-center rounded-full bg-brand-500 text-white shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="max-w-[80%]">
        <div
          className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-card whitespace-pre-wrap
            ${isUser
              ? "bg-brand-500 text-white rounded-br-sm"
              : "bg-surface text-ink-900 rounded-bl-sm"}`}
        >
          {message.text}
        </div>
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggest(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 grid place-items-center rounded-full bg-ink-700 text-white shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}

function rid() { return Math.random().toString(36).slice(2, 10); }

function formatQueue(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")} elapsed`;
}

function initialBotMessage(): ChatMessage {
  return {
    id: rid(),
    role: "bot",
    at: Date.now(),
    text: "Hi! I’m your Babcom Assistant. I can help with devices, energy, scenes, billing, security and more. What can I help you with today?",
    suggestions: [
      "My device is offline",
      "How can I save more energy?",
      "Set up a scene",
      "Talk to a human",
    ],
  };
}

// Keyword-routed canned responses. Deterministic enough to feel intelligent
// but not so heavy that it hurts the bundle.
function generateBotReply(
  text: string,
  requestAgent: () => void,
): { text: string; suggestions?: string[] } {
  const t = text.toLowerCase();

  if (/^hi\b|^hello\b|^hey\b|namaste/.test(t)) {
    return {
      text: "Hi! 👋 I’m Babcom Assistant. Tell me what’s going on — for example, “Living AC won’t turn on” or “Why is my bill higher this month?”.",
      suggestions: ["My device is offline", "How can I save energy?", "Add a new device"],
    };
  }

  if (/agent|human|representative|support exec/.test(t)) {
    requestAgent();
    return {
      text: "I’ve queued you for a human agent. Average wait time today is about 2 minutes. While you wait, anything I can try first?",
      suggestions: ["Cancel", "Tell me more about my issue"],
    };
  }

  if (/offline|not work|won.?t turn|won.?t connect|disconnect|red dot|unresponsive/.test(t)) {
    return {
      text:
        "Let’s get that device back online:\n" +
        "1. Make sure it has power and is within Wi-Fi range.\n" +
        "2. Restart the device by power-cycling for 5 seconds.\n" +
        "3. Open Smart Home → tap the device → “Re-pair”.\n" +
        "4. If still offline, restart the hub from Settings → Security.\n\n" +
        "Want me to open the device list, or contact a human agent?",
      suggestions: ["Open Smart Home", "Talk to a human"],
    };
  }

  if (/save energy|saving|reduce bill|lower bill|tariff|consumption/.test(t)) {
    return {
      text:
        "Three things move the needle the most:\n" +
        "• Raise your AC by 1 °C (saves ~6%/month).\n" +
        "• Schedule the geyser to run only 6:30–7:30 AM.\n" +
        "• Auto-off lights after 5 minutes of no motion.\n\n" +
        "All three are pre-built tips on the Energy Saving page. Want me to open it?",
      suggestions: ["Open Energy Saving", "Show this month’s breakdown"],
    };
  }

  if (/bill|invoice|charge|payment|refund|subscription/.test(t)) {
    return {
      text: "Invoices for the last 24 months are in Settings → About → Manage subscription. For payment failures, our finance team replies within 4 working hours at billing@babcom.in.",
      suggestions: ["Open Settings", "Email billing@babcom.in"],
    };
  }

  if (/scene|automation|routine|schedule|trigger/.test(t)) {
    return {
      text:
        "A scene is a one-tap arrangement (e.g., Movie Night). An automation runs scenes or device commands when a trigger fires.\n\nYou can build both from the Smart Home page. The most-loved automations are: Sunset Lights, Eco AC and Geyser Pre-heat.",
      suggestions: ["Open Smart Home", "Suggest an automation for me"],
    };
  }

  if (/add.*device|pair|new device|onboard|qr/.test(t)) {
    return {
      text:
        "Tap the “+ Add device” button at the top, or run “add device” from search. Auto-discover scans Wi-Fi/BLE; QR works for any device with a Babcom-compatible QR. Pairing keys never leave your hub.",
      suggestions: ["Open Add device", "Which devices are compatible?"],
    };
  }

  if (/voice|alexa|google|siri|homekit/.test(t)) {
    return {
      text: "Yes! Babcom integrates with Alexa, Google Home, Siri Shortcuts and Apple HomeKit. Toggle them in Settings → Voice Assistants. Voice recordings stay on-device by default.",
      suggestions: ["Open Settings", "Privacy controls"],
    };
  }

  if (/security|2fa|two.?factor|password|biometric|fingerprint|hack/.test(t)) {
    return {
      text:
        "We strongly recommend enabling 2FA and biometric unlock in Settings → Security. We use AES-256 over TLS for all hub-to-cloud traffic and never store plaintext credentials. If you suspect a breach, change your password and call our care line immediately.",
      suggestions: ["Open Security settings", "Talk to a human"],
    };
  }

  if (/privacy|data|personal info|gdpr|delete account/.test(t)) {
    return {
      text:
        "You own your data. From Settings → Privacy you can opt out of analytics, disable cloud transcription and request a full data export. Account deletion is a one-tap option on the same screen — we honour it within 30 days as required by law.",
      suggestions: ["Open Privacy settings"],
    };
  }

  if (/cancel/.test(t) ) {
    return {
      text: "No problem — cancellation request noted. Anything else I can help with?",
      suggestions: ["My device is offline", "How can I save energy?"],
    };
  }

  if (t.length < 4) {
    return {
      text: "Could you tell me a bit more? For example, the device name or what you were trying to do.",
    };
  }

  // Fallback
  return {
    text:
      "I’m not 100% sure I understood. I can help with devices, energy, scenes, automations, billing, voice assistants, privacy and security. Want me to forward you to a human?",
    suggestions: ["Talk to a human", "Open Help center"],
  };
}

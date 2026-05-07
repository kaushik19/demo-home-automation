interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, size = "md", disabled, label }: Props) {
  const w = size === "sm" ? "w-9" : "w-11";
  const h = size === "sm" ? "h-5" : "h-6";
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative shrink-0 inline-flex ${w} ${h} items-center rounded-full transition-colors
        ${checked ? "bg-brand-500" : "bg-ink-300/40"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className="inline-block rounded-full bg-white shadow transform transition-transform"
        style={{
          width: size === "sm" ? 14 : 18,
          height: size === "sm" ? 14 : 18,
          transform: `translateX(${checked ? (size === "sm" ? 18 : 22) : 2}px)`,
        }}
      />
    </button>
  );
}

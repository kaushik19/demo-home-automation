interface Props {
  className?: string;
}

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-surface-sunken via-brand-50 to-surface-sunken ${className}`}
      style={{ backgroundSize: "200% 100%" }}
    />
  );
}

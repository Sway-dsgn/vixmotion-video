export function Logo({ className = "", size }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo-icon.png"
      alt="VixMotion"
      className={className}
      width={size}
      height={size}
    />
  );
}

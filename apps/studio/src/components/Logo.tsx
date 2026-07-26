export function Logo({ className = "", size }: { className?: string; size?: number }) {
  return (
    <img
      src="/vixmotion-logo.png"
      alt="VixMotion"
      className={className}
      width={size}
      height={size}
    />
  );
}

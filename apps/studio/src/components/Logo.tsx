export function Logo({ className = "", size }: { className?: string; size?: number }) {
  const style: React.CSSProperties = {
    backgroundColor: "currentColor",
    mask: "url(/vixmotion-logo.png) center/contain no-repeat",
    WebkitMask: "url(/vixmotion-logo.png) center/contain no-repeat",
  };
  if (size) {
    style.width = size;
    style.height = size;
  }
  return (
    <div
      className={className}
      aria-label="VixMotion"
      role="img"
      style={style}
    />
  );
}

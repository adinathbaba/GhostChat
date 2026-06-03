import { useState, useRef } from "react";

interface GhostButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "amber" | "crimson";
  fullWidth?: boolean;
  type?: "button" | "submit";
}

function GhostButton({
  children,
  onClick,
  className = "",
  variant = "secondary",
  fullWidth = false,
  type = "button",
}: GhostButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [ghostEmoji, setGhostEmoji] = useState<{ id: number; x: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const variantStyles: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:from-amber-400 hover:via-orange-400 hover:to-red-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-600/50",
    secondary:
      "bg-gradient-to-r from-amber-900/40 to-orange-900/30 backdrop-blur-sm border border-amber-700/30 text-amber-200 hover:from-amber-900/60 hover:to-orange-900/50 hover:text-amber-100 hover:border-amber-600/50 hover:shadow-[0_0_20px_rgba(217,119,6,0.2)]",
    danger:
      "bg-gradient-to-r from-yellow-600 to-amber-600 border border-yellow-500/50 text-black hover:from-yellow-500 hover:to-amber-500 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]",
    ghost:
      "bg-transparent border border-amber-800/30 text-amber-400/70 hover:text-amber-300 hover:border-amber-600/50 hover:bg-amber-900/20 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]",
    amber:
      "bg-gradient-to-br from-amber-700 to-yellow-700 border border-amber-500/40 text-amber-100 hover:from-amber-600 hover:to-yellow-600 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    crimson:
      "bg-gradient-to-r from-red-900/60 to-rose-900/40 border border-red-700/30 text-red-200 hover:from-red-800/60 hover:to-rose-800/40 hover:border-red-600/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    const ghostId = Date.now();
    const randomX = Math.random() * 80 + 10;
    setGhostEmoji({ id: ghostId, x: randomX });
    setTimeout(() => setGhostEmoji(null), 800);

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-xl font-semibold uppercase tracking-wider
        transition-all duration-300 ease-out cursor-pointer
        ${fullWidth ? "w-full" : ""}
        ${variantStyles[variant]}
        ${isClicked ? "animate-[press-down_0.3s_ease]" : ""}
        active:scale-95
        group
        ${className}
      `}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute top-0 -left-full w-1/2 h-full bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12 group-hover:animate-[slide-shine_0.6s_ease]" />
      </div>

      {/* Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/25 animate-[ripple_0.6s_ease-out] pointer-events-none"
          style={{
            left: ripple.x - 5,
            top: ripple.y - 5,
            width: 10,
            height: 10,
          }}
        />
      ))}

      {/* Ghost pop */}
      {ghostEmoji && (
        <span
          className="absolute -top-2 text-lg animate-[ghost-appear_0.8s_ease-out_forwards] pointer-events-none"
          style={{ left: `${ghostEmoji.x}%` }}
        >
          👻
        </span>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

export default GhostButton;
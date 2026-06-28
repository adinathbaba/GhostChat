import { useEffect, useRef } from "react";

const CyberpunkCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // --- FIX: Detect touch devices and exit early ---
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) {
      return; // Do nothing if the user is on mobile/touch screen
    }
    // ------------------------------------------------

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hide default cursor globally
    document.body.style.cursor = "none";
    // Also hide on all elements
    const style = document.createElement("style");
    style.textContent = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    resize();

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Animation loop
    const animate = () => {
      const { x, y } = mouseRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw a symbol at cursor
      ctx.save();
      ctx.shadowBlur = 20;          // optional glow
      ctx.shadowColor = "red";      // red glow
      ctx.font = "36px 'Segoe UI Symbol', 'Arial Unicode MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "red";
      ctx.fillText("👆", x, y);     // change to any symbol
      ctx.restore();

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      document.body.style.cursor = "";
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // We can also add a Tailwind class like 'hidden md:block' to physically hide the canvas on small screens, 
  // but the JS check above is what stops the logic from running.
  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default CyberpunkCursor;
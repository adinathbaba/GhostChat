import Navbar from "../components/Navbar";
import GhostButton from "../components/ghostbuttons";
import { useEffect, useState, useRef, useCallback } from "react";
import { generateCode } from "../utils/codeGenerator";
import { socket } from "../socket/socket";
import ChatPage from "./chatpage";

// ============================================================
// CYBERPUNK BACKGROUND (Canvas) – Performance optimized
// ============================================================
function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);


  useEffect(() => {

    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let resizeTimeout: number; // 👈 browser timer returns number

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    resize();

    // Symbols (including 👻)
    const symbols = [
      "◆", "◇", "●", "○", "◈", "◉", "◊", "▸", "▹", "◂", "◃", "★", "☆", "✦", "✧",
      "⌘", "⌂", "⎔", "⊞", "⊟", "⊠", "⊡", "⬡", "⬢", "⬣",
      "⏣", "⏥", "⏦", "⏧", "⏨", "⏩", "⏪", "⏫", "⏬",
      "☠", "☮", "☯", "♠", "Ω", "♤", "♣", "♧", "♥", "♡", "♦", "♢",
  "♔", "♕", "♚", "♛", "⚜", "★", "☆", "✮", "✯", "☄", "☾", "☽",
  "☼", "☀", "☁", "☂", "☃", "☻", "☺", "☹", "۞",
      "♩", "♪", "♫", "♬", "♭", "♮", "♯",
       "♠", "♡", "♢", "♣", "♤", "♥", "♦", "♧", "✉", "❤", "👻",
    ];

    class Particle {
      x: number;
      y: number;
      symbol: string;
      size: number;
      speed: number;
      opacity: number;
      opacitySpeed: number;
      rotation: number;
      rotationSpeed: number;
      color: string;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h - h;
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        this.size = 12 + Math.random() * 20;
        this.speed = 0.5 + Math.random() * 1.5;
        this.opacity = 0.3 + Math.random() * 0.5;
        this.opacitySpeed = 0.001 + Math.random() * 0.005;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        const hue = Math.random() < 0.33 ? 180 : Math.random() < 0.66 ? 320 : 280;
        this.color = `hsla(${hue}, 100%, 70%, `;
      }

      update(w: number, h: number) {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        this.opacity += this.opacitySpeed * (Math.random() - 0.5);
        this.opacity = Math.max(0.1, Math.min(1, this.opacity));

        if (this.y > h + 50) {
          this.y = -50;
          this.x = Math.random() * w;
          this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
          this.size = 12 + Math.random() * 20;
          this.speed = 0.5 + Math.random() * 1.5;
          this.opacity = 0.3 + Math.random() * 0.5;
          const hue = Math.random() < 0.33 ? 180 : Math.random() < 0.66 ? 320 : 280;
          this.color = `hsla(${hue}, 100%, 70%, `;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.font = `${this.size}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = this.color + this.opacity + ")";
        ctx.shadowColor = this.color + "0.8)";
        ctx.shadowBlur = 15;
        ctx.fillText(this.symbol, 0, 0);
        ctx.restore();
      }
    }

    // Adaptive particle count (fewer on small screens)
    const baseCount = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const particles: Particle[] = [];
    for (let i = 0; i < baseCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    const draw = () => {
      time += 0.01;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, w, h);

      const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      gradient.addColorStop(0, "rgba(180, 0, 255, 0.08)");
      gradient.addColorStop(0.5, "rgba(0, 200, 255, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.update(w, h);
        p.draw(ctx);
      }

      if (time % 0.5 < 0.01) {
        const streakX = Math.random() * w;
        const streakY = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(streakX, streakY);
        ctx.lineTo(streakX + 100, streakY - 50);
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.02 + Math.random() * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

    


  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0" />;
}

// ============================================================
// MAIN HOMEPAGE
// ============================================================
function HomePage() {
  const [userCode, setUserCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [inChat, setInChat] = useState(false);
  const [requestCode, setRequestCode] = useState("");
  const [incomingRequest, setIncomingRequest] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [notification, setNotification] = useState("");
  const [blockedCodes, setBlockedCodes] = useState<string[]>([]);

  // Ref to store status timeout ID (browser timer returns number)
  const statusTimeoutRef = useRef<number | null>(null);
  const notificationTimeoutRef = useRef<number | null>(null);

  // ============================================================
  // 1. Load / generate user code
  // ============================================================
  useEffect(() => {
    const savedCode = localStorage.getItem("ghostchat-code");
    if (savedCode) {
      setUserCode(savedCode);
    } else {
      const newCode = generateCode();
      localStorage.setItem("ghostchat-code", newCode);
      setUserCode(newCode);
    }
  }, []);

  // ============================================================
  // 2. Notification auto-dismiss (5 seconds)
  // ============================================================
  

  // ============================================================
  // 3. Load blocked codes from localStorage
  // ============================================================
  useEffect(() => {
    const saved = localStorage.getItem("blocked-codes");
    if (saved) {
      setBlockedCodes(JSON.parse(saved));
    }
  }, []);

  // ============================================================
  // 4. Register code with server when connected
  // ============================================================
  useEffect(() => {
    if (userCode && connected) {
      socket.emit("register-code", userCode);
    }
  }, [userCode, connected]);

  // ============================================================
  // 5. Cleanup queue on browser close
  // ============================================================
  useEffect(() => {
    const cleanup = () => {
      socket.emit("leave-queue");
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  // ============================================================
  // 6. Socket listeners (with fixed status timeouts)
  // ============================================================
  useEffect(() => {
    const setStatusWithTimeout = (msg: string, duration: number) => {
      // Clear any pending timeout
      if (statusTimeoutRef.current !== null) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
      setRequestStatus(msg);
      statusTimeoutRef.current = setTimeout(() => {
        setRequestStatus("");
        statusTimeoutRef.current = null;
      }, duration);
    };

    socket.on("connect", () => {
      setConnected(true);
      const savedCode = localStorage.getItem("ghostchat-code");
      if (savedCode) {
        socket.emit("register-code", savedCode);
        console.log("Re-registered:", savedCode);
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("welcome", (msg) => console.log(msg));
    socket.on("waiting", () => setWaiting(true));
    socket.on("queue-left", () => setWaiting(false));
    socket.on("matched", (data) => {
      setWaiting(false);
      setRoomId(data.roomId);
      setPartnerCode(data.partnerCode);
      setInChat(true);
    });
    socket.on("chat-request", ({ senderCode }) => {
      setIncomingRequest(senderCode);
    });
    socket.on("request-pending", () => {
      setStatusWithTimeout("Pending...", 3000);
    });
    socket.on("request-rejected", () => {
      setStatusWithTimeout("👻 Rejected — your phantom declined", 4000);
    });
    socket.on("request-blocked", () => {
      setStatusWithTimeout("🚫 Blocked — you cannot reach this spirit", 4000);
    });
    socket.on("request-error", (msg) => {
      setStatusWithTimeout(msg, 4000);
    });
    socket.on("request-accepted", (data) => {
      setRoomId(data.roomId);
      setPartnerCode(data.partnerCode);
      setInChat(true);
      setRequestStatus("");
      setRequestCode("");
      setIncomingRequest("");
      // Clear any pending status timeout
      if (statusTimeoutRef.current !== null) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("welcome");
      socket.off("waiting");
      socket.off("queue-left");
      socket.off("matched");
      socket.off("chat-request");
      socket.off("request-pending");
      socket.off("request-rejected");
      socket.off("request-blocked");
      socket.off("request-error");
      socket.off("request-accepted");
      if (statusTimeoutRef.current !== null) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // 7. Callbacks (memoized to avoid unnecessary renders)
  // ============================================================
  const startRandomChat = useCallback(() => {
    socket.emit("join-random");
    setWaiting(true);
  }, []);

  const leaveQueue = useCallback(() => {
    socket.emit("leave-queue");
    setWaiting(false);
  }, []);

  const sendRequest = useCallback(() => {
    if (!requestCode.trim()) return;
    const code = requestCode.trim().toUpperCase();
    socket.emit("send-request", code);
    setRequestStatus("Pending...");
    setRequestCode("");
  }, [requestCode]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [userCode]);

  const regenerateCode = useCallback(() => {
    const newCode = generateCode();
    localStorage.setItem("ghostchat-code", newCode);
    setUserCode(newCode);
  }, []);

  const unblockCode = useCallback((code: string) => {
    const updated = blockedCodes.filter((c) => c !== code);
    setBlockedCodes(updated);
    localStorage.setItem("blocked-codes", JSON.stringify(updated));
  }, [blockedCodes]);

  // ============================================================
  // 8. Handle chat exit (from ChatPage)
  // ============================================================
  const handleLeaveChat = useCallback((reason?: string) => {
  setInChat(false);
  setRoomId("");
  setWaiting(false);
  setPartnerCode("");
  setRequestStatus("");
  setIncomingRequest("");

  if (reason === "partner-left") {
    setNotification(" Your phantom has vanished from the séance...");

    // Clear any previous timeout
    if (notificationTimeoutRef.current !== null) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Set new timeout to clear after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification("");
      notificationTimeoutRef.current = null;
    }, 5000);
  }
}, []);

  // ============================================================
  // 9. Early return: show ChatPage when in chat
  // ============================================================
  if (inChat && roomId) {
    return (
      <ChatPage
        roomId={roomId}
        userCode={userCode}
        partnerCode={partnerCode}
        onLeave={handleLeaveChat}
      />
    );
  }

  // ============================================================
  // 10. Main UI
  // ============================================================
  return (
    <>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(20px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.05); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.15); }
        }
        .glass-card {
          background: rgba(10, 10, 20, 0.7);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 0, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .glass-card:hover {
          border-color: rgba(0, 255, 255, 0.4);
          box-shadow: 0 8px 48px rgba(0, 255, 255, 0.12), 0 0 60px rgba(255, 0, 255, 0.05);
          transform: translateY(-2px);
        }
        .glass-input {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 0, 255, 0.2);
          color: #e0f0ff;
          transition: all 0.3s ease;
          font-weight: 300;
        }
        .glass-input:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
          outline: none;
        }
        .glass-input::placeholder {
          color: rgba(255, 0, 255, 0.3);
        }
        .primary-btn {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(255, 0, 255, 0.15));
          border: 1px solid rgba(0, 240, 255, 0.3);
          color: #00f0ff;
          transition: all 0.3s ease;
          font-weight: 500;
          letter-spacing: 0.03em;
        }
        .primary-btn:hover {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.35), rgba(255, 0, 255, 0.25));
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.2), 0 0 60px rgba(255, 0, 255, 0.1);
          transform: scale(1.02);
          border-color: #00f0ff;
        }
        .secondary-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 0, 255, 0.15);
          color: #ff66ff;
          transition: all 0.3s ease;
        }
        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 240, 255, 0.4);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.08);
        }
        .glow-text {
          text-shadow: 0 0 40px rgba(0, 240, 255, 0.2), 0 0 80px rgba(255, 0, 255, 0.1);
        }
        .background-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 30% 40%, rgba(255, 0, 255, 0.06), transparent 60%),
                      radial-gradient(circle at 70% 60%, rgba(0, 240, 255, 0.04), transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
        .code-block {
          font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
        }
      `}</style>

      <div className="relative min-h-screen bg-[#0a0a14] text-cyan-100 font-sans selection:bg-pink-500 selection:text-white z-0 overflow-hidden">
        {/* Cyberpunk background – key forces remount when leaving chat */}
        {!inChat && <CyberpunkBackground key={inChat ? 'chat' : 'main'} />}
        <div className="background-overlay z-0"></div>

        <Navbar connected={connected} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 animate-[float-up_0.6s_ease-out]">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-3 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-pink-300 to-purple-300 glow-text">
            Whisper to a Ghost
          </h2>

          <p className="text-cyan-300/40 mb-10 italic tracking-wider font-light">
            ◈ Zero accounts. Zero memory. Pure ether. ◈
          </p>

          {/* Code Card */}
          <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
            <p className="text-pink-400/50 mb-2 uppercase tracking-[0.3em] text-sm font-semibold">
              ◈ Summoning Key ◈
            </p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.15em] text-cyan-100 break-all glow-text code-block">
                {userCode}
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={copyCode}
                  disabled={copied}
                  className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                    copied
                      ? "bg-cyan-600/40 text-white border border-cyan-400/40 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                      : "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(0,240,255,0.08)]"
                  }`}
                >
                  {copied ? "✔ Copied" : "⟡ Copy"}
                </button>
                <GhostButton
                  variant="ghost"
                  onClick={regenerateCode}
                  className="px-4 py-2 border border-purple-400/20 text-purple-300 hover:bg-purple-500/20 hover:shadow-[0_0_30px_rgba(180,0,255,0.08)]"
                >
                  ⟳ Regen
                </GhostButton>
              </div>
            </div>
          </div>

          {/* Random Chat */}
          <button
            onClick={startRandomChat}
            className="w-full py-5 text-xl mb-4 tracking-widest primary-btn rounded-2xl"
          >
            ⟡ Wander The Void ⟡
          </button>

          {waiting && (
            <div className="text-center mb-4">
              <p className="text-cyan-300 animate-pulse mb-2">Searching for Ghost...</p>
              <button
                onClick={leaveQueue}
                className="bg-zinc-800/40 px-4 py-2 rounded-xl hover:bg-zinc-700/50 transition-colors border border-zinc-700/40 text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}

          {roomId && (
            <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <p className="text-cyan-200">Connected</p>
              <p className="text-sm text-cyan-300/60">Room: {roomId}</p>
            </div>
          )}

          {/* Connect by Code */}
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden mt-8">
            <h3 className="text-2xl font-light mb-6 text-cyan-100 glow-text flex items-center gap-2">
              <span className="text-pink-400">⟡</span> Join A Séance
            </h3>

            <input
              type="text"
              value={requestCode}
              onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
              placeholder="WHISPER CODE"
              maxLength={6}
              className="w-full mb-6 px-5 py-4 rounded-xl glass-input uppercase tracking-widest code-block"
            />

            <button
              onClick={sendRequest}
              className="w-full py-4 rounded-xl secondary-btn font-medium tracking-wider"
            >
              ◈ Summon ◈
            </button>

            {requestStatus && (
              <p className="text-sm text-pink-300/50 mt-3 text-center italic">
                {requestStatus}
              </p>
            )}
          </div>

          {/* Block List */}
          <div className="glass-card rounded-2xl p-8 mt-6 relative overflow-hidden">
            <h3 className="text-xl font-light mb-4 text-cyan-100 flex items-center gap-2">
              <span className="text-red-400">⊘</span>
              <span>Blocked Spirits</span>
            </h3>

            {blockedCodes.length === 0 ? (
              <p className="text-cyan-400/30 text-sm italic">
                No spirits have been blocked from the void.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedCodes.map((code) => (
                  <div
                    key={code}
                    className="flex items-center justify-between bg-zinc-800/30 border border-zinc-700/20 rounded-xl px-4 py-2 backdrop-blur-sm"
                  >
                    <span className="text-cyan-200 font-mono tracking-wider">
                      ◈ {code}
                    </span>
                    <button
                      onClick={() => unblockCode(code)}
                      className="bg-zinc-700/30 hover:bg-zinc-600/40 px-3 py-1 rounded-lg text-sm text-pink-300 transition-colors border border-zinc-600/20"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-cyan-500/20 mt-10 text-sm tracking-widest">
            ◈ Vanish upon exit. No strings attached. ◈
          </p>

          {/* Incoming request modal */}
          {incomingRequest && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-[float-up_0.3s_ease-out]">
              <div className="glass-card rounded-2xl p-6 w-[90%] max-w-sm border-cyan-400/30 shadow-[0_0_60px_rgba(0,240,255,0.08)]">
                <h3 className="text-lg font-light mb-2 text-cyan-200 glow-text">
                  ◈ Chat Request
                </h3>
                <p className="text-cyan-300/60 mb-5">
                  From: <span className="text-pink-300 font-mono font-medium">{incomingRequest}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      socket.emit("request-response", {
                        senderCode: incomingRequest,
                        response: "yes",
                      });
                      setIncomingRequest("");
                    }}
                    className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 py-2 rounded-xl font-medium transition-colors border border-cyan-400/30 text-cyan-200"
                  >
                    YES
                  </button>
                  <button
                    onClick={() => {
                      socket.emit("request-response", {
                        senderCode: incomingRequest,
                        response: "no",
                      });
                      setIncomingRequest("");
                    }}
                    className="flex-1 bg-zinc-700/30 hover:bg-zinc-600/40 py-2 rounded-xl font-medium transition-colors border border-zinc-600/20 text-zinc-300"
                  >
                    NO
                  </button>
                  <button
                    onClick={() => {
                      socket.emit("request-response", {
                        senderCode: incomingRequest,
                        response: "block",
                      });
                      const updated = [...new Set([...blockedCodes, incomingRequest])];
                      setBlockedCodes(updated);
                      localStorage.setItem("blocked-codes", JSON.stringify(updated));
                      setIncomingRequest("");
                    }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 py-2 rounded-xl font-medium transition-colors border border-red-400/30 text-red-200"
                  >
                    BLOCK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification toast */}
          {notification && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[float-up_0.4s_ease-out]">
              <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-3 max-w-md border-red-400/30 shadow-[0_0_40px_rgba(255,50,50,0.05)]">
                <span className="text-3xl animate-pulse text-red-400">✦</span>
                <div className="flex-1">
                  <p className="text-red-300/70 text-sm italic">
                    {notification}
                  </p>
                </div>
                <button
  onClick={() => {
    if (notificationTimeoutRef.current !== null) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setNotification("");
  }}
  className="text-cyan-400/40 hover:text-cyan-300 transition-colors text-lg"
>
  ✕
</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default HomePage;
import { useEffect, useState, useRef } from "react";
import type { Message } from "../types/messages";
import { socket } from "../socket/socket";
import imageCompression from "browser-image-compression";

function ChatPage({
  roomId,
  userCode,
  partnerCode,
  onLeave,
}: {
  roomId: string;
  userCode: string;
  partnerCode: string;
  onLeave: (reason?: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  

  // --- Socket & chat logic (unchanged) ---
  useEffect(() => {
  const handleClose = () => {
    socket.emit("leave-chat", roomId);
  };
  window.addEventListener("beforeunload", handleClose);
  return () => {
    window.removeEventListener("beforeunload", handleClose);
  };
}, [roomId]);

  useEffect(() => {
    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on("partner-left", () => {
      onLeave("partner-left");
    });
    socket.on("typing", () => {
      setTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        setTyping(false);
      }, 1000);
    });

    return () => {
      socket.off("receive-message");
      socket.off("partner-left");
      socket.off("typing");
    };
  }, [onLeave]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const message = {
      text,
      senderId: userCode,
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.emit("send-message", { roomId, message });
    socket.emit("stop-typing", roomId);
    setText("");
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        const message = {
          image: reader.result as string,
          text: text,
          senderId: userCode,
          timestamp: new Date().toLocaleTimeString(),
        };
        socket.emit("send-message", { roomId, message });
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  // --- Leave with a small delay to ensure socket sends ---
  const leaveChat = () => {
  socket.emit("leave-chat", roomId);
  // No delay – update UI immediately
  onLeave("self-left");
};

  // --- Render ---
  return (
    <>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.05); }
          50% { box-shadow: 0 0 40px rgba(255, 0, 255, 0.15); }
        }
        @keyframes cyber-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.6; }
        }
        .glass-panel {
          background: rgba(10, 10, 20, 0.7);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 0, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .message-mine {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(0, 180, 255, 0.15));
          border: 1px solid rgba(0, 240, 255, 0.3);
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.08);
        }
        .message-theirs {
          background: linear-gradient(135deg, rgba(255, 0, 255, 0.15), rgba(180, 0, 255, 0.10));
          border: 1px solid rgba(255, 0, 255, 0.2);
          box-shadow: 0 0 25px rgba(255, 0, 255, 0.05);
        }
        .cyber-input {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 0, 255, 0.2);
          color: #e0f0ff;
          transition: all 0.3s ease;
        }
        .cyber-input:focus {
          border-color: #00f0ff;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
          outline: none;
        }
        .cyber-input::placeholder {
          color: rgba(255, 0, 255, 0.3);
        }
        .glow-text {
          text-shadow: 0 0 30px rgba(0, 240, 255, 0.2), 0 0 60px rgba(255, 0, 255, 0.1);
        }
        .cyber-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 20% 40%, rgba(255, 0, 255, 0.08), transparent 60%),
                      radial-gradient(circle at 80% 60%, rgba(0, 240, 255, 0.06), transparent 60%),
                      #0a0a14;
          z-index: 0;
        }
        .cyber-float {
          position: absolute;
          font-size: 3rem;
          opacity: 0.15;
          animation: cyber-float 6s ease-in-out infinite;
          pointer-events: none;
        }
        .cyber-float:nth-child(2) { animation-delay: 1.2s; left: 10%; top: 20%; font-size: 4rem; }
        .cyber-float:nth-child(3) { animation-delay: 2.5s; left: 80%; top: 30%; font-size: 5rem; }
        .cyber-float:nth-child(4) { animation-delay: 0.8s; left: 30%; top: 70%; font-size: 3.5rem; }
        .cyber-float:nth-child(5) { animation-delay: 3.2s; left: 70%; top: 80%; font-size: 4.5rem; }
        .cyber-float:nth-child(6) { animation-delay: 1.8s; left: 50%; top: 10%; font-size: 2.5rem; }
        .code-font {
          font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
        }
      `}</style>

      {/* FIX 1: Use `fixed inset-0` instead of `relative h-dvh` to lock it entirely to the viewport */}
      <div className="fixed inset-0 bg-[#0a0a14] text-cyan-100 font-sans selection:bg-pink-500 selection:text-white flex flex-col overflow-hidden">
        
        <div className="cyber-bg">
          <span className="cyber-float">Ø</span>
          <span className="cyber-float">☯︎</span>
          <span className="cyber-float">☮</span>
          <span className="cyber-float">☣</span>
          <span className="cyber-float">⌘</span>
          <span className="cyber-float">Ω</span>
        </div>

        {/* ——— Header ——— */}
        {/* FIX 2: Added `shrink-0` so the header doesn't compress when the keyboard opens */}
        <header className="relative z-20 shrink-0 glass-panel rounded-none border-b border-pink-500/20 bg-[#0a0a14]/70">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl sm:text-3xl drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]">👻</span>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-pink-300 glow-text">
                The Séance
              </h2>
              <span className="ml-auto flex items-center gap-2 text-xs text-cyan-400/80">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan] animate-pulse" />
                Linked
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400/60 text-xs uppercase tracking-widest">You</span>
                <span className="px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-sm tracking-[0.2em] code-font">
                  {userCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pink-400/60 text-xs uppercase tracking-widest">Phantom</span>
                <span className="px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-400/20 text-pink-300 text-sm tracking-[0.2em] code-font italic">
                  {partnerCode || "Connecting..."}
                </span>
              </div>
              <button
                onClick={leaveChat}
                className="ml-auto px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400 text-xs uppercase tracking-widest hover:bg-red-500/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,0,0.1)]"
              >
                😶‍🌫️ Vanish
              </button>
            </div>
          </div>
        </header>

        {/* ——— Messages ——— */}
        {/* FIX 3: Added `min-h-0 py-4` and removed `pt-28 pb-28`. Because the header and footer are in standard flow now, we don't need large padding to prevent overlaps. */}
        <main className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-7xl opacity-30 mb-4 drop-shadow-[0_0_40px_rgba(0,240,255,0.2)]">👻</span>
                <p className="text-cyan-400/50 italic font-light">The void is silent...</p>
                <p className="text-cyan-400/30 text-sm mt-1">Whisper the first word.</p>
              </div>
            )}

            {messages.map((msg, index) => {
              const isMine = msg.senderId === userCode;
              return (
                <div
                  key={index}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} animate-[float-up_0.4s_ease-out]`}
                >
                  <div
                    className={`group max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                      isMine
                        ? "message-mine rounded-br-sm text-white"
                        : "message-theirs rounded-bl-sm text-cyan-100"
                    }`}
                  >
                    {msg.text && <p className="leading-relaxed break-all">{msg.text}</p>}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="shared"
                        onClick={() => setPreview(msg.image!)}
                        className="mt-2 rounded-xl w-full max-w-62.5 sm:max-w-87.5 max-h-75 object-cover cursor-pointer border border-white/10 hover:border-cyan-400/30 transition-all"
                      />
                    )}
                    <p className={`text-[10px] mt-1.5 tracking-wider ${
                      isMine ? "text-cyan-300/60" : "text-pink-300/50"
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex justify-start animate-[float-up_0.4s_ease-out]">
                <div className="max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl backdrop-blur-sm message-theirs rounded-bl-sm text-pink-300/60 text-sm italic">
                  <span className="animate-pulse">Phantom is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* ——— Input ——— */}
        {/* FIX 4: Removed `fixed bottom-0 left-0 right-0` and replaced with `shrink-0`. */}
        <footer className="relative z-20 shrink-0 glass-panel rounded-none border-t border-pink-500/20 bg-[#0a0a14]/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex gap-3 items-center">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  socket.emit("typing", roomId);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Whisper into the void..."
                className="flex-1 px-5 py-3.5 rounded-xl cyber-input placeholder:text-cyan-400/30 focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-300"
              />
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer px-4 py-3.5 rounded-xl bg-pink-500/10 border border-pink-400/20 text-pink-300 hover:bg-pink-500/20 hover:border-pink-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,255,0.08)]"
              >
                📷
              </label>
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="px-6 py-3.5 rounded-xl bg-linear-to-br from-cyan-500/30 to-pink-500/30 border border-cyan-400/40 text-cyan-200 font-medium tracking-wide hover:shadow-[0_0_40px_rgba(0,240,255,0.2)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-95"
              >
                <span className="hidden sm:inline">Send 🕯️</span>
                <span className="sm:hidden">🕯️</span>
              </button>
            </div>
            <p className="text-center text-cyan-500/20 text-[10px] mt-3 tracking-widest uppercase font-light">
              Vanishes upon exit · No trace remains
            </p>
          </div>
        </footer>

        {/* ——— Image Preview ——— */}
        {preview && (
          <div
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer animate-[float-up_0.3s_ease-out]"
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-pink-400 transition-colors duration-300"
            >
              ✖
            </button>
            <img
              src={preview}
              alt="full preview"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full rounded-xl shadow-[0_0_60px_rgba(0,240,255,0.15)] object-contain border border-cyan-400/20"
            />
          </div>
        )}
      </div>
    </>
  );
}

export default ChatPage;
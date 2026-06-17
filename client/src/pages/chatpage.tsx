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
  useEffect(() => {

  const handleClose =
    () => {

      socket.emit(
        "leave-chat",
        roomId
      );
    };

  window.addEventListener(
    "beforeunload",
    handleClose
  );

  return () => {

    window.removeEventListener(
      "beforeunload",
      handleClose
    );
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

  if (typingTimeout.current) {
    clearTimeout(typingTimeout.current);
  }

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
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const message = {
      text,
      senderId: userCode,
      timestamp: new Date().toLocaleTimeString(),
    };

    socket.emit("send-message", {
      roomId,
      message,
    });
     socket.emit("stop-typing", roomId);
    setText("");
  };
  const handleImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {

  const file =
    e.target.files?.[0];

  if (!file) return;

  try {

    const compressed =
      await imageCompression(
        file,
        {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        }
      );

    const reader =
      new FileReader();

    reader.onload = () => {

      const message = {
        image:
          reader.result as string,
          text: text,
        senderId:
          userCode,
        timestamp:
          new Date().toLocaleTimeString(),
      };

      socket.emit(
        "send-message",
        {
          roomId,
          message,
        }
      );
    };

    reader.readAsDataURL(
      compressed
    );

  } catch (err) {
    console.error(err);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const leaveChat = () => {
    socket.emit("leave-chat", roomId);
    onLeave("self-left");
  };

  return (
    <div className="relative h-dvh bg-[#0a0a0a] text-zinc-200 font-serif flex flex-col overflow-hidden selection:bg-zinc-700 selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <span className="absolute left-[8%] top-[15%] text-6xl rotate-12 opacity-25% animate-[ghost-float_5s_ease-in-out_infinite]">👻</span>
        <span className="absolute left-[80%] top-[25%] text-8xl -rotate-12 opacity-25% animate-[ghost-float_6s_ease-in-out_infinite_0.5s]">👻</span>
        <span className="absolute left-[40%] top-[60%] text-7xl rotate-6 opacity-25% animate-[ghost-float_4.5s_ease-in-out_infinite_1s]">👻</span>
        <span className="absolute left-[20%] top-[80%] text-5xl -rotate-6 opacity-25% animate-[ghost-float_5.5s_ease-in-out_infinite_0.8s]">👻</span>
        <span className="absolute left-[90%] top-[70%] text-6xl rotate-12 opacity-25% animate-[ghost-float_5s_ease-in-out_infinite_1.2s]">👻</span>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />

      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23n)%22/></svg>')]" />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0d0d]/95 backdrop-blur-md shadow-2xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-2xl animate-[ghost-float_3s_ease-in-out_infinite]">👻</span>
            <h2 className="text-xl sm:text-2xl tracking-tight text-zinc-100">
              The Séance
            </h2>
            <span className="ml-auto flex items-center gap-2 text-xs text-green-400/80">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Linked
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-xs uppercase tracking-widest">
                You
              </span>
              <span className="px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 text-sm tracking-[0.2em] font-mono">
                {userCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-xs uppercase tracking-widest">
                Phantom
              </span>
              <span className="px-3 py-1 rounded-lg bg-zinc-800/40 border border-zinc-700/30 text-zinc-400 text-sm tracking-[0.2em] font-mono italic">
                {partnerCode || "Connecting..."}
              </span>
            </div>
            <button
              onClick={leaveChat}
              className="ml-auto px-4 py-1.5 rounded-lg bg-red-950/40 border border-red-800/30 text-red-400 text-xs uppercase tracking-widest hover:bg-red-900/60 hover:border-red-700/50 transition-all duration-300"
            >
              😶‍🌫️ Vanish
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 pt-40 pb-28 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl opacity-20 mb-4 animate-[ghost-float_4s_ease-in-out_infinite]">
                👻
              </span>
              <p className="text-zinc-600 italic">
                The void is silent...
              </p>
              <p className="text-zinc-700 text-sm mt-1">
                Whisper the first word.
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const isMine = msg.senderId === userCode;

            return (
              <div
                key={index}
                className={`flex ${
                  isMine ? "justify-end" : "justify-start"
                } animate-[message-in_0.4s_ease-out]`}
              >
                <div
                  className={`group max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                    isMine
                      ? "bg-linear-to-br from-indigo-700/90 to-indigo-900/90 border-indigo-600/30 text-white rounded-br-sm"
                      : "bg-linear-to-br from-zinc-800/90 to-zinc-900/90 border-white/5 text-zinc-200 rounded-bl-sm"
                  }`}
                >
                  {msg.text && (
  <p className="leading-relaxed break-all">
    {msg.text}
  </p>
)}

{msg.image && (
  <img
    src={msg.image}
    alt="shared"
    onClick={() => setPreview(msg.image!)}
    className="
  mt-2
  rounded-xl
  w-full
  max-w-62.5
  sm:max-w-87.5
  max-h-75
  object-cover
"

  />
)}
                  <p
                    className={`text-[10px] mt-1.5 tracking-wider ${
                      isMine ? "text-indigo-300/70" : "text-zinc-500"
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start animate-[message-in_0.4s_ease-out]">
              <div className="max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border bg-linear-to-br from-zinc-800/90 to-zinc-900/90 border-white/5 text-zinc-400 text-sm italic rounded-bl-sm">
                <span className="animate-pulse">Phantom is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0d0d0d]/95 backdrop-blur-md">
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
              className="flex-1 px-5 py-3.5 rounded-xl bg-black/40 border border-white/10 outline-none text-zinc-200 placeholder:text-zinc-600 placeholder:italic focus:border-indigo-700/50 focus:bg-black/60 transition-all duration-300 shadow-inner"
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
  className="
    cursor-pointer
    px-4
    py-3.5
    rounded-xl
    bg-zinc-800
    hover:bg-zinc-700
    transition
  "
>
  📷
</label>


            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="px-6 py-3.5 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-semibold tracking-wide shadow-lg hover:shadow-indigo-900/50 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-indigo-800 active:scale-95"
            >
              <span className="hidden sm:inline">Send 🕯️</span>
              <span className="sm:hidden">🕯️</span>
            </button>
            
          </div>

          <p className="text-center text-zinc-700 text-[10px] mt-3 tracking-widest uppercase">
            Vanishes upon exit · No trace remains
          </p>
        </div>
      </footer>
      {/* Fullscreen Image Viewer */}
{preview && (
  <div
    onClick={() => setPreview(null)}
    className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer animate-[message-in_0.3s_ease-out]"
  >
    <button
      onClick={() => setPreview(null)}
      className="absolute top-4 right-4 text-white text-3xl hover:text-red-400 transition-colors duration-300 z-101"
    >
      ✖
    </button>
    <img
      src={preview}
      alt="full preview"
      onClick={(e) => e.stopPropagation()}
      className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
    />
  </div>
)}
    </div>
  );
}

export default ChatPage;
import Navbar from "../components/Navbar";
import GhostButton from "../components/ghostbuttons";
import { useEffect, useState } from "react";
import { generateCode } from "../utils/codeGenerator";
import { socket } from "../socket/socket";
import ChatPage from "./chatpage";

function HomePage() {
  // States
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

  // 1. Load user code
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

  // 2. Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);


  // 2b. Load blocked codes from localStorage
useEffect(() => {
  const saved = localStorage.getItem("blocked-codes");
  if (saved) {
    setBlockedCodes(JSON.parse(saved));
  }
}, []);

  // 3. Register code with server
  useEffect(() => {
    if (userCode && connected) {
      socket.emit("register-code", userCode);
    }
  }, [userCode, connected]);

  // 3b. Cleanup queue on browser close
useEffect(() => {
  const cleanup = () => {
    socket.emit("leave-queue");
  };

  window.addEventListener("beforeunload", cleanup);

  return () => {
    window.removeEventListener("beforeunload", cleanup);
  };
}, []);

  // 4. ALL socket listeners
  useEffect(() => {
    socket.on("connect", () => {
  setConnected(true);

  const savedCode =
    localStorage.getItem(
      "ghostchat-code"
    );

  if (savedCode) {
    socket.emit(
      "register-code",
      savedCode
    );

    console.log(
      "Re-registered:",
      savedCode
    );
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

    // ✅ Request system
    socket.on("chat-request", ({ senderCode }) => {
      setIncomingRequest(senderCode);
    });

    socket.on("request-pending", () => {
  setRequestStatus("Pending...");
  setTimeout(() => setRequestStatus(""), 3000);
});

socket.on("request-rejected", () => {
  setRequestStatus("👻 Rejected — your phantom declined");
  setTimeout(() => setRequestStatus(""), 4000);
});

socket.on("request-blocked", () => {
  setRequestStatus("🚫 Blocked — you cannot reach this spirit");
  setTimeout(() => setRequestStatus(""), 4000);
});

socket.on("request-error", (msg) => {
  setRequestStatus(msg);
  setTimeout(() => setRequestStatus(""), 4000);
});

    // ✅ THIS WAS MISSING
    socket.on("request-accepted", (data) => {
      setRoomId(data.roomId);
      setPartnerCode(data.partnerCode);
      setInChat(true);
      setRequestStatus("");
      setRequestCode("");
      setIncomingRequest("");
    });

    // Cleanup
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
    };
  }, []);

  // Functions
  const startRandomChat = () => {
    socket.emit("join-random");
    setWaiting(true);
  };

  const leaveQueue = () => {
    socket.emit("leave-queue");
    setWaiting(false);
  };

  const sendRequest = () => {
  if (!requestCode.trim()) return;
  
  const code = requestCode.trim().toUpperCase();
  socket.emit("send-request", code);
  setRequestStatus("Pending...");
  
  // ✅ Clear input after sending
  setRequestCode("");
};

  const copyCode = async () => {
    await navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateCode = () => {
    const newCode = generateCode();
    localStorage.setItem("ghostchat-code", newCode);
    setUserCode(newCode);
  };

  // Unblock a code
const unblockCode = (code: string) => {
  const updated = blockedCodes.filter(c => c !== code);
  setBlockedCodes(updated);
  localStorage.setItem(
    "blocked-codes",
    JSON.stringify(updated)
  );
};

  // Early return for chat
  if (inChat && roomId) {
    return (
      <ChatPage
        roomId={roomId}
        userCode={userCode}
        partnerCode={partnerCode}
        onLeave={(reason) => {
  setInChat(false);
  setRoomId("");
  setRequestStatus(
  ""
);

setWaiting(
  false
);
  setPartnerCode("");
  setRequestStatus("");
  setIncomingRequest("");

  if (reason === "partner-left") {
    setNotification(
      " Your phantom has vanished from the séance..."
    );
  }
}}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#111111] text-zinc-300 font-serif selection:bg-zinc-700 selection:text-white z-0 overflow-hidden">
      
      {/* Ghost background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <span className="absolute left-[5%] top-[10%] text-5xl rotate-12 opacity-50 animate-[ghost-float_3s_ease-in-out_infinite]">👻</span>
        <span className="absolute left-[15%] top-[30%] text-7xl -rotate-12 opacity-50 animate-[ghost-float_4s_ease-in-out_infinite_0.5s]">👻</span>
        <span className="absolute left-[30%] top-[60%] text-3xl rotate-45 opacity-50 animate-[ghost-float_3.5s_ease-in-out_infinite_1s]">👻</span>
        <span className="absolute left-[50%] top-[20%] text-6xl -rotate-6 opacity-50 animate-[ghost-float_5s_ease-in-out_infinite_0.3s]">👻</span>
        <span className="absolute left-[70%] top-[50%] text-4xl rotate-20 opacity-50 animate-[ghost-float_4s_ease-in-out_infinite_1.5s]">👻</span>
        <span className="absolute left-[85%] top-[15%] text-7xl -rotate-12 opacity-50 animate-[ghost-float_3s_ease-in-out_infinite_0.8s]">👻</span>
        <span className="absolute left-[90%] top-[70%] text-5xl rotate-12 opacity-50 animate-[ghost-float_4.5s_ease-in-out_infinite_0.2s]">👻</span>
        <span className="absolute left-[40%] top-[80%] text-8xl -rotate-6 opacity-50 animate-[ghost-float_6s_ease-in-out_infinite_1s]">👻</span>
        <span className="absolute left-[60%] top-[40%] text-3xl rotate-30 opacity-50 animate-[ghost-float_3.5s_ease-in-out_infinite_2s]">👻</span>
      </div>

      <Navbar connected={connected} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 tracking-tight text-zinc-100">
          Whisper to a Ghost. Leave No Trace.
        </h2>

        <p className="text-zinc-500 mb-10 italic">
          Zero accounts. Zero memory. Pure ether.
        </p>

        {/* Code Card */}
        <div className="bg-[#1c1c1c]/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-8 mb-8 relative overflow-hidden">
          <p className="text-zinc-500 mb-2 uppercase tracking-widest text-xl font-semibold">
            Summoning Key
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-zinc-200 break-all">
              {userCode}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={copyCode}
                disabled={copied}
                className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  copied ? "bg-green-600 text-white" : "bg-yellow-600 text-black hover:bg-yellow-400"
                }`}
              >
                {copied ? "✔️ Stolen" : "🦝 Steal"}
              </button>
              <GhostButton variant="ghost" onClick={regenerateCode} className="px-4 py-2">
                🔄 Reborn
              </GhostButton>
            </div>
          </div>
        </div>

        {/* Random Chat */}
        <GhostButton
          onClick={startRandomChat}
          variant="primary"
          fullWidth
          className="py-5 text-xl mb-4 tracking-widest"
        >
          👻 Wander The Void
        </GhostButton>

        {waiting && (
          <div className="text-center mb-4">
            <p className="text-yellow-400 mb-2">Searching for Ghost...</p>
            <button
              onClick={leaveQueue}
              className="bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {roomId && (
          <div className="bg-green-900 border border-green-700 rounded-xl p-4 mb-4">
            <p>Connected!</p>
            <p className="text-sm text-green-300">Room: {roomId}</p>
          </div>
        )}

        {/* Connect by Code */}
        <div className="bg-[#1c1c1c]/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
          <h3 className="text-2xl font-bold mb-6 text-zinc-200">
            Join A Séance
          </h3>

          <input
            type="text"
            value={requestCode}
            onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
            placeholder="WHISPER CODE"
            maxLength={6}
            className="w-full mb-6 px-5 py-4 rounded-xl bg-black/20 border border-white/10 outline-none text-zinc-200 uppercase tracking-widest"
          />

          <GhostButton
            variant="secondary"
            fullWidth
            type="submit"
            onClick={sendRequest}
            className="py-4"
          >
            🕯️ Summon
          </GhostButton>

          {requestStatus && (
            <p className="text-sm text-zinc-400 mt-3 text-center italic">
              {requestStatus}
            </p>
          )}
        </div>

        {/* Block List */}
<div className="bg-[#1c1c1c]/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-8 mt-6 relative overflow-hidden">
  <h3 className="text-xl font-bold mb-4 text-zinc-200 flex items-center gap-2">
    <span>🚫</span>
    <span>Blocked Spirits</span>
  </h3>

  {blockedCodes.length === 0 ? (
    <p className="text-zinc-500 text-sm italic">
      No spirits have been blocked from the void.
    </p>
  ) : (
    <div className="space-y-2">
      {blockedCodes.map((code) => (
        <div
          key={code}
          className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/30 rounded-xl px-4 py-2"
        >
          <span className="text-zinc-300 font-mono tracking-wider">
            👻 {code}
          </span>
          <button
            onClick={() => unblockCode(code)}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-lg text-sm text-zinc-200 transition-colors"
          >
            Unblock
          </button>
        </div>
      ))}
    </div>
  )}
</div>

        <p className="text-center text-zinc-600 mt-10 text-sm">
          Vanish upon exit. No strings attached.
        </p>

        {/* ✅ Incoming Request Popup */}
        {incomingRequest && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[90%] max-w-sm">
              <h3 className="text-lg font-semibold mb-2 text-amber-200">
                👻 Chat Request
              </h3>
              <p className="text-zinc-400 mb-5">
                From: <span className="text-amber-300 font-mono font-bold">{incomingRequest}</span>
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
                  className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-xl font-semibold transition-colors"
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
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-xl font-semibold transition-colors"
                >
                  NO
                </button>
                <button
  onClick={() => {
    socket.emit("request-response", {
      senderCode: incomingRequest,
      response: "block",
    });

    // ✅ Save to local block list
    const updated = [
      ...new Set([...blockedCodes, incomingRequest,]),
    ];
    setBlockedCodes(updated);
    localStorage.setItem(
      "blocked-codes",
      JSON.stringify(updated)
    );

    setIncomingRequest("");
  }}
  className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-xl font-semibold transition-colors"
>
  BLOCK
</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Card */}
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.5s_ease-out]">
            <div className="bg-[#1c1c1c]/90 backdrop-blur-md border border-red-800/40 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 max-w-md">
              <span className="text-3xl animate-pulse">👻</span>
              <div className="flex-1">
                <p className="text-red-300 font-serif italic text-sm">
                  {notification}
                </p>
              </div>
              <button
                onClick={() => setNotification("")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
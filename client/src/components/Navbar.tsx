import GhostButton from "./ghostbuttons";

function Navbar(
  {
    connected,
  }: {
    connected: boolean;
  }
) {
  return (
    <nav className="border-b border-amber-900/20 bg-linear-to-r from-[#1a1008] via-[#1a1210] to-[#1a1008]">
      <div className="w-full px-10 py-6 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <span className="text-5xl group-hover:animate-[ghost-float_1s_ease-in-out_infinite] transition-all drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              👻
            </span>
            <div className="absolute -inset-2 bg-amber-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-wider group-hover:text-amber-300 transition-colors duration-300"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="text-amber-400">Ghost</span>
              <span className="text-amber-200">Chat</span>
            </h1>
            <p className="text-xs tracking-[4px] uppercase text-amber-700 group-hover:text-amber-500 transition-colors duration-300">
              Whisper Into The Void
            </p>
          </div>
        </div>

        {/* Right Side */}
        {/* Right Side */}
<div className="flex items-center gap-6">

  {/* Online/Offline Indicator */}
  <div className="flex items-center gap-2">
    <div
      className={`w-3 h-3 rounded-full ${
        connected
          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
          : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
      }`}
    />
    <span className="text-sm text-amber-600 tracking-wider">
      {connected ? "Online" : "Offline"}
    </span>
  </div>

  <span className="text-sm text-amber-800 hidden sm:block tracking-wider animate-[flicker_3s_ease-in-out_infinite]">
    ✦ Anonymous ✦
  </span>
</div>

      </div>

      {/* linear line */}
      <div className="h-px bg-linear-to-r from-transparent via-amber-700/40 to-transparent"></div>
    </nav>
  );
}

export default Navbar;

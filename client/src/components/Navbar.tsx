function Navbar({ connected }: { connected: boolean }) {
  return (
    <nav className="relative z-20 border-b border-pink-500/20 bg-[#0a0a14]/70 backdrop-blur-xl">
      <div className="w-full px-10 py-6 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <span className="text-4xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_25px_rgba(0,240,255,0.3)]">
              👻
            </span>
            <div className="absolute -inset-2 bg-cyan-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div>
            <h1
              className="text-3xl font-light tracking-wider group-hover:text-cyan-200 transition-colors duration-300"
              style={{ fontFamily: "'SF Pro Display', 'Inter', sans-serif" }}
            >
              <span className="text-cyan-300">Ghost</span>
              <span className="text-pink-300">Chat</span>
            </h1>
            <p className="text-xs tracking-[4px] uppercase text-pink-400/40 group-hover:text-cyan-300/70 transition-colors duration-300">
              Whisper Into The Void
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">

          {/* Online/Offline Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected
                  ? "bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.7)]"
                  : "bg-pink-400 shadow-[0_0_15px_rgba(255,0,255,0.7)]"
              } transition-all duration-300`}
            />
            <span className="text-sm text-cyan-400/60 tracking-wider font-light">
              {connected ? "Online" : "Offline"}
            </span>
          </div>

          <span className="text-sm text-pink-400/30 hidden sm:block tracking-wider">
            ✦ Anonymous ✦
          </span>

        </div>
      </div>

      {/* Glowing neon divider */}
      <div className="h-px bg-linear-to-r from-transparent via-cyan-400/30 to-transparent"></div>
    </nav>
  );
}

export default Navbar;
import React from "react";
import { User, KeyRound, MonitorCheck } from "lucide-react";

interface VietnamLoginFormProps {
  isLoggingIn: boolean;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  handleConnectSpace: (e: React.FormEvent) => void;
  inviteError: string;
  onGoogleSignIn: () => void;
  graphicsQuality?: "high" | "low";
}

export function VietnamLoginForm({
  isLoggingIn,
  inviteCode,
  setInviteCode,
  handleConnectSpace,
  inviteError,
  onGoogleSignIn,
  graphicsQuality = "high",
}: VietnamLoginFormProps) {
  return (
    <div className="w-full relative z-20 group">
      {/* Container Frame */}
      <div className={`relative border border-[#00e5ff]/30 bg-[#030914]/80 ${graphicsQuality === "high" ? "backdrop-blur-md" : ""} p-6 rounded-3xl shadow-md overflow-hidden`}>
        {/* Glow Effects */}
        {graphicsQuality === "high" ? (
          <>
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#00bfff] blur-[50px] opacity-20" />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#ff3b3b] blur-[50px] opacity-20" />
          </>
        ) : (
          <>
            <div className="absolute -top-10 -left-10 w-24 h-24 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #00bfff 0%, transparent 70%)" }} />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #ff3b3b 0%, transparent 70%)" }} />
          </>
        )}

        {/* HUD UI Details */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neo-bg shadow-md" />
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-neo-bg shadow-md" />
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00bfff]" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#ffcc00]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#ff3b3b]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#00bfff]" />

        <div className="flex items-center justify-between mb-6 border-b border-[#00bfff]/20 pb-2">
          <div className="flex items-center gap-2 text-[#ffcc00]">
            <MonitorCheck className="w-4 h-4" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              Hệ Thống Đăng Nhập
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#00bfff]/50 animate-pulse">
            SECURE.LINK // 5.0
          </span>
        </div>

        <div className="space-y-6 relative">
          {/* Google Sign In */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full relative flex items-center justify-center gap-3 p-3 bg-transparent border border-[#00bfff]/50 text-[#00bfff] font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#00bfff]/10 transition-all duration-300 group-hover:border-[#00bfff] overflow-hidden active:scale-95"
          >
            <div className="absolute left-0 top-0 h-full w-[2px] bg-[#00bfff] group-active:w-full transition-all duration-300 opacity-20" />
            <User className="w-4 h-4" />
            <span>Xác Thực Google</span>
            <div className="absolute right-2 text-[8px] opacity-40">OAUTH_2.0</div>
          </button>

          <div className="flex items-center gap-4 text-[#ff3b3b]/60 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex-1 h-[1px] bg-[#ff3b3b]/20" />
            <span>Hoặc Tham Gia</span>
            <div className="flex-1 h-[1px] bg-[#ff3b3b]/20" />
          </div>

          {/* Join with code */}
          <form onSubmit={handleConnectSpace} className="relative">
            <div className="flex bg-[#030914] border border-[#ffcc00]/40 rounded-3xl overflow-hidden focus-within:border-[#ffcc00] focus-within:shadow-md transition-all">
              <div className="flex items-center px-3 border-r border-[#ffcc00]/30 text-[#ffcc00]/60 bg-[#ffcc00]/5">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="NHẬP MÃ SỐ"
                maxLength={3}
                className="flex-1 bg-transparent p-3 font-mono font-bold text-center tracking-[0.4em] text-[#ffcc00] outline-none placeholder:text-[#ffcc00]/30"
              />
              <button
                type="submit"
                disabled={isLoggingIn || inviteCode.length === 0}
                className="px-6 bg-[#ff3b3b]/10 border-l border-[#ff3b3b]/30 text-[#ff3b3b] font-mono text-xs font-bold hover:bg-[#ff3b3b]/20 transition-all active:scale-95 flex items-center justify-center min-w-[80px]"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-[#ff3b3b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>KẾT NỐI</span>
                )}
              </button>
            </div>
            {inviteError && (
              <div className="absolute -bottom-6 left-0 w-full text-center">
                <span className="text-[#ff3b3b] text-[10px] font-mono bg-[#ff3b3b]/10 px-2 py-0.5 rounded-3xl border border-[#ff3b3b]/30 uppercase tracking-widest">
                  LOI: {inviteError}
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

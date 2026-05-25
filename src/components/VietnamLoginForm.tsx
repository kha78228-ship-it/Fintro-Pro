import React, { useState } from "react";
import { User, KeyRound, MonitorCheck, Mail, Lock, Loader2 } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "../lib/firebase";

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
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Vui lòng nhập Email và Mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Yêu cầu mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setAuthError("Yêu cầu nhập tên đại diện.");
      return;
    }

    setAuthError("");
    setLocalLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = "Xác thực thất bại.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "Địa chỉ email đã được sử dụng.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Định dạng email không hợp lệ.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errMsg = "Thông tin đăng nhập không chính xác.";
      } else {
        errMsg = err.message || errMsg;
      }
      setAuthError(errMsg);
    } finally {
      setLocalLoading(false);
    }
  };

  const currentLoading = isLoggingIn || localLoading;

  return (
    <div className="w-full relative z-20 group">
      {/* Container Frame */}
      <div className={`relative border border-[#00e5ff]/30 bg-[#030914]/85 ${graphicsQuality === "high" ? "backdrop-blur-md" : ""} p-6 rounded-3xl shadow-lg border-2 overflow-hidden`}>
        {/* Glow Effects */}
        {graphicsQuality === "high" ? (
          <>
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#00bfff] blur-[50px] opacity-25" />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#ff3b3b] blur-[50px] opacity-25" />
          </>
        ) : (
          <>
            <div className="absolute -top-10 -left-10 w-24 h-24 opacity-25" style={{ backgroundImage: "radial-gradient(circle, #00bfff 0%, transparent 70%)" }} />
            <div className="absolute -bottom-10 -right-10 w-24 h-24 opacity-25" style={{ backgroundImage: "radial-gradient(circle, #ff3b3b 0%, transparent 70%)" }} />
          </>
        )}

        {/* HUD UI Details */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00e5ff]/30" />
        <div className="absolute bottom-0 right-0 w-full h-[2px] bg-[#ff3b3b]/35" />
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00bfff]" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#ffcc00]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#ff3b3b]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#00bfff]" />

        <div className="flex items-center justify-between mb-6 border-b border-[#00bfff]/20 pb-3">
          <div className="flex items-center gap-2 text-[#ffcc00]">
            <MonitorCheck className="w-4 h-4" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              {authMethod === "google" ? "HỆ THỐNG XÁC THỰC" : isSignUp ? "ĐĂNG KÝ HỆ THỐNG" : "ĐĂNG NHẬP GMAIL"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#00bfff]/60 animate-pulse uppercase">
            {currentLoading ? "PROCESSING..." : "READY"}
          </span>
        </div>

        <div className="space-y-6 relative">
          {/* Tabs */}
          <div className="grid grid-cols-2 border border-[#00e5ff]/20 rounded-xl p-1 bg-black/40">
            <button
              type="button"
              disabled={currentLoading}
              onClick={() => {
                setAuthMethod("google");
                setAuthError("");
              }}
              className={`py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono font-bold tracking-wider transition-colors ${
                authMethod === "google"
                  ? "bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/40"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Google OAUTH
            </button>
            <button
              type="button"
              disabled={currentLoading}
              onClick={() => {
                setAuthMethod("email");
                setAuthError("");
              }}
              className={`py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono font-bold tracking-wider transition-colors ${
                authMethod === "email"
                  ? "bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/40"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Gmail + Password
            </button>
          </div>

          {authMethod === "google" ? (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={currentLoading}
              className="w-full relative flex items-center justify-center gap-3 p-3.5 bg-transparent border border-[#00bfff]/50 text-[#00bfff] font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#00bfff]/10 transition-all duration-300 group-hover:border-[#00bfff] overflow-hidden active:scale-95"
            >
              <div className="absolute left-0 top-0 h-full w-[2px] bg-[#00bfff] group-active:w-full transition-all duration-300 opacity-20" />
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all opacity-80"
                alt="Google"
              />
              <span>Xác Thực Google</span>
              <div className="absolute right-2 text-[8px] opacity-40">OAUTH_2.0</div>
            </button>
          ) : (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div className="flex bg-[#030914] border border-[#ffcc00]/30 rounded-2xl overflow-hidden focus-within:border-[#00e5ff] transition-colors">
                  <div className="flex items-center px-3 border-r border-[#ffcc00]/20 text-[#ffcc00]/60 bg-[#ffcc00]/5 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled={currentLoading}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="TÊN ĐẠI DIỆN"
                    className="flex-1 bg-transparent p-2.5 font-mono text-[#ffcc00] placeholder:text-[#ffcc00]/30 text-xs sm:text-sm outline-none"
                  />
                </div>
              )}

              <div className="flex bg-[#030914] border border-[#00e5ff]/35 rounded-2xl overflow-hidden focus-within:border-[#00e5ff] transition-colors">
                <div className="flex items-center px-3 border-r border-[#00e5ff]/20 text-[#00e5ff]/60 bg-[#00e5ff]/5 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled={currentLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ĐỊA CHI GMAIL"
                  className="flex-1 bg-transparent p-2.5 font-mono text-[#00e5ff] placeholder:text-[#00e5ff]/30 text-xs sm:text-sm outline-none lowercase"
                />
              </div>

              <div className="flex bg-[#030914] border border-[#00e5ff]/35 rounded-2xl overflow-hidden focus-within:border-[#00e5ff] transition-colors">
                <div className="flex items-center px-3 border-r border-[#00e5ff]/20 text-[#00e5ff]/60 bg-[#00e5ff]/5 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  disabled={currentLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="MẬT KHẨU"
                  className="flex-1 bg-transparent p-2.5 font-mono text-[#00e5ff] placeholder:text-[#00e5ff]/30 text-xs sm:text-sm outline-none"
                />
              </div>

              {authError && (
                <div className="text-center">
                  <span className="text-[#ff3b3b] text-[10px] font-mono bg-[#ff3b3b]/10 px-2 py-0.5 rounded-3xl border border-[#ff3b3b]/30 uppercase tracking-widest">
                    LOI: {authError}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={currentLoading}
                className="w-full bg-[#00bfff]/20 border border-[#00bfff]/50 hover:bg-[#00bfff]/30 text-[#00bfff] font-mono p-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-[#00ffff] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {currentLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isSignUp ? "TIẾN HÀNH ĐĂNG KÝ" : "ĐĂNG NHẬP HỆ THỐNG"}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={currentLoading}
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError("");
                  }}
                  className="text-[10px] text-neutral-400 hover:text-[#00bfff] font-mono uppercase tracking-widest transition-colors"
                >
                  {isSignUp ? "SỬ DỤNG TÀI KHOẢN ĐÃ CÓ ➜" : "TẠO TÀI KHOẢN MỚI ➜"}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-4 text-[#ff3b3b]/50 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex-1 h-[1px] bg-[#ff3b3b]/15" />
            <span>Kết nối nhanh</span>
            <div className="flex-1 h-[1px] bg-[#ff3b3b]/15" />
          </div>

          {/* Join with code */}
          <form onSubmit={handleConnectSpace} className="relative">
            <div className="flex bg-[#030914] border border-[#ffcc00]/40 rounded-3xl overflow-hidden focus-within:border-[#ffcc00] focus-within:shadow-md transition-all">
              <div className="flex items-center px-3 border-r border-[#ffcc00]/30 text-[#ffcc00]/60 bg-[#ffcc00]/5 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                disabled={currentLoading}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="NHẬP MÃ SỐ (3 số)"
                maxLength={3}
                className="flex-1 bg-transparent p-3 font-mono font-bold text-center tracking-[0.4em] text-[#ffcc00] outline-none placeholder:text-[#ffcc00]/30 text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={currentLoading || inviteCode.length === 0}
                className="px-6 bg-[#ff3b3b]/10 border-l border-[#ff3b3b]/30 text-[#ff3b3b] font-mono text-xs font-bold hover:bg-[#ff3b3b]/20 transition-all active:scale-95 flex items-center justify-center min-w-[80px]"
              >
                {currentLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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

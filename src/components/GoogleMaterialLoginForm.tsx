import React, { useState } from "react";
import { User, KeyRound, Globe, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "../lib/firebase";

interface GoogleMaterialLoginFormProps {
  isLoggingIn: boolean;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  handleConnectSpace: (e: React.FormEvent) => void;
  inviteError: string;
  onGoogleSignIn: () => void;
}

export function GoogleMaterialLoginForm({
  isLoggingIn,
  inviteCode,
  setInviteCode,
  handleConnectSpace,
  inviteError,
  onGoogleSignIn,
}: GoogleMaterialLoginFormProps) {
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
    <div className="w-full relative z-20">
      {/* Google Material Clean Card Layout */}
      <div className="relative bg-white/70 dark:bg-neutral-900/70 border border-white/50 dark:border-neutral-800/50 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(26,115,232,0.1)] transition-all">
        
        {/* Colorful top bar indicators like real Google widgets */}
        <div className="absolute top-0 left-12 right-12 h-1 grid grid-cols-4 rounded-b-full overflow-hidden">
          <div className="bg-[#4285F4]" />
          <div className="bg-[#EA4335]" />
          <div className="bg-[#FBBC05]" />
          <div className="bg-[#34A853]" />
        </div>

        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2 text-[#1a73e8] dark:text-[#a8cdfc]">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest">
              {authMethod === "google" ? "Đăng Nhập Thông Minh" : isSignUp ? "Đăng Ký Tài Khoản" : "Đăng Nhập Gmail"}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {currentLoading ? "Đang xử lý..." : "Sẵn sàng"}
          </span>
        </div>

        <div className="space-y-6">
          {/* Tabs with rounded-full pill design */}
          <div className="grid grid-cols-2 bg-neutral-100/80 dark:bg-neutral-800 p-1.5 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
            <button
              type="button"
              disabled={currentLoading}
              onClick={() => {
                setAuthMethod("google");
                setAuthError("");
              }}
              className={`py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                authMethod === "google"
                  ? "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
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
              className={`py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                authMethod === "email"
                  ? "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              Gmail + Mật Khẩu
            </button>
          </div>

          {authMethod === "google" ? (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={currentLoading}
              className="w-full relative flex items-center justify-center gap-3 p-3.5 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 font-sans text-sm font-bold rounded-3xl transition-all shadow-sm active:scale-95"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                className="w-5 h-5"
                alt="Google"
              />
              <span>Đăng nhập với Google</span>
            </button>
          ) : (
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div className="flex bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden focus-within:border-[#4285F4] transition-colors focus-within:bg-white">
                  <div className="flex items-center px-4 border-r border-neutral-100 dark:border-neutral-800 text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled={currentLoading}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tên đại diện"
                    className="flex-1 bg-transparent p-3 text-sm text-neutral-800 dark:text-white outline-none placeholder:text-neutral-400"
                  />
                </div>
              )}

              <div className="flex bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden focus-within:border-[#4285F4] transition-colors focus-within:bg-white">
                <div className="flex items-center px-4 border-r border-neutral-100 dark:border-neutral-800 text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled={currentLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ Gmail"
                  className="flex-1 bg-transparent p-3 text-sm text-neutral-800 dark:text-white outline-none placeholder:text-neutral-400 lowercase"
                />
              </div>

              <div className="flex bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden focus-within:border-[#4285F4] transition-colors focus-within:bg-white">
                <div className="flex items-center px-4 border-r border-neutral-100 dark:border-neutral-800 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  disabled={currentLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="flex-1 bg-transparent p-3 text-sm text-neutral-800 dark:text-white outline-none placeholder:text-neutral-400"
                />
              </div>

              {authError && (
                <div className="text-center">
                  <span className="text-[#EA4335] text-[11px] font-sans bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/40 uppercase tracking-wide">
                    {authError}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={currentLoading}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-sans p-3 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 active:scale-95"
              >
                {currentLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isSignUp ? "Tiến hành đăng ký" : "Đăng nhập hệ thống"}</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={currentLoading}
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError("");
                  }}
                  className="text-xs text-neutral-500 hover:text-[#1a73e8] font-medium transition-colors"
                >
                  {isSignUp ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản? Đăng ký ngay"}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-3 text-neutral-300 dark:text-neutral-700 text-[10px] font-medium uppercase tracking-widest">
            <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
            <span>Có mã cặp đôi?</span>
            <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* Join with code built strictly in Google Web standard design */}
          <form onSubmit={handleConnectSpace} className="relative">
            <div className="flex bg-neutral-50/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden focus-within:border-[#1a73e8] focus-within:bg-white focus-within:shadow-md transition-all">
              <div className="flex items-center px-4 border-r border-neutral-100 dark:border-neutral-800 text-neutral-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                disabled={currentLoading}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="NHẬP 3 CHỮ SỐ"
                maxLength={3}
                className="flex-1 bg-transparent p-3 font-sans font-bold text-center tracking-[0.3em] text-[#1a73e8] dark:text-[#a8cdfc] outline-none placeholder:text-neutral-300 text-sm"
              />
              <button
                type="submit"
                disabled={currentLoading || inviteCode.length === 0}
                className="px-6 bg-[#1a73e8] text-white font-sans text-xs font-bold hover:bg-[#1557b0] transition-all active:scale-95 flex items-center justify-center min-w-[90px]"
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
                <span className="text-[#EA4335] text-[11px] font-sans bg-rose-50 dark:bg-rose-950/30 px-3 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/40">
                  {inviteError}
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

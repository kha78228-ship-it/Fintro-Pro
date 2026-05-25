import React, { useState } from "react";
import { LogIn, Mail, Lock, User, RefreshCw, Loader2 } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "../lib/firebase";

interface VintageLoginFormProps {
  isLoggingIn: boolean;
  inviteCode: string;
  setInviteCode: (code: string) => void;
  handleConnectSpace: (e: React.FormEvent) => void;
  inviteError: string;
  onGoogleSignIn: () => void;
}

export function VintageLoginForm({
  isLoggingIn,
  inviteCode,
  setInviteCode,
  handleConnectSpace,
  inviteError,
  onGoogleSignIn,
}: VintageLoginFormProps) {
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
      setAuthError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Mật khẩu phải dài ít nhất 6 ký tự.");
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setAuthError("Vui lòng nhập tên đại diện.");
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
      let errMsg = "Đã xảy ra lỗi xác thực.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "Email này đã được sử dụng bởi tài khoản khác.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Địa chỉ email không đúng định dạng.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errMsg = "Email hoặc mật khẩu không chính xác.";
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
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="grid grid-cols-2 border border-neo-dark/20 p-1">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("google");
            setAuthError("");
          }}
          disabled={currentLoading}
          className={`py-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${
            authMethod === "google"
              ? "bg-neo-dark text-neo-light font-black"
              : "text-neo-dark/60 hover:text-neo-dark hover:bg-neutral-50"
          }`}
        >
          Google OAuth
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("email");
            setAuthError("");
          }}
          disabled={currentLoading}
          className={`py-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${
            authMethod === "email"
              ? "bg-neo-dark text-neo-light font-black"
              : "text-neo-dark/60 hover:text-neo-dark hover:bg-neutral-50"
          }`}
        >
          Gmail / Mật khẩu
        </button>
      </div>

      {authMethod === "google" ? (
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={currentLoading}
          className="border border-neo-dark hover:bg-neo-dark hover:text-neo-light p-3.5 flex items-center justify-center gap-3 w-full uppercase font-bold tracking-widest transition-all duration-300 active:scale-95"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all opacity-80"
            alt="Google"
          />
          <span>Xác Thực Google</span>
        </button>
      ) : (
        <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
          {isSignUp && (
            <div className="flex border-b border-neo-dark/40 focus-within:border-neo-orange transition-colors">
              <div className="p-2 text-neo-dark/50">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                disabled={currentLoading}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="TÊN ĐẠI DIỆN"
                className="flex-1 bg-transparent p-2 text-xs font-mono font-bold outline-none text-neo-dark placeholder:text-neo-dark/30 tracking-wider uppercase"
              />
            </div>
          )}

          <div className="flex border-b border-neo-dark/40 focus-within:border-neo-orange transition-colors">
            <div className="p-2 text-neo-dark/50">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              disabled={currentLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ĐỊA CHỈ GMAIL / EMAIL"
              className="flex-1 bg-transparent p-2 text-xs font-mono font-bold outline-none text-neo-dark placeholder:text-neo-dark/30 tracking-wider lowercase"
            />
          </div>

          <div className="flex border-b border-neo-dark/40 focus-within:border-neo-orange transition-colors">
            <div className="p-2 text-neo-dark/50">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              disabled={currentLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="MẬT KHẨU"
              className="flex-1 bg-transparent p-2 text-xs font-mono font-bold outline-none text-neo-dark placeholder:text-neo-dark/30 tracking-wider"
            />
          </div>

          {authError && (
            <p className="text-neo-orange text-[10px] font-bold uppercase tracking-widest text-center">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={currentLoading}
            className="bg-neo-dark text-neo-light p-3 flex items-center justify-center gap-2 w-full uppercase font-bold tracking-widest transition-all duration-300 hover:bg-neo-orange hover:text-neo-dark active:scale-95 text-xs"
          >
            {currentLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{isSignUp ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}</span>
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
              className="text-[10px] text-neo-dark/60 hover:text-neo-orange font-bold uppercase tracking-widest transition-colors"
            >
              {isSignUp ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản? Tạo mới ngay"}
            </button>
          </div>
        </form>
      )}

      {/* Code login divider */}
      <div className="flex items-center gap-4 text-neo-dark/30 text-[10px] font-mono uppercase tracking-widest pt-2">
        <div className="flex-1 h-[1px] bg-neo-dark/15" />
        <span>HOẶC TIẾP CẬN NHANH</span>
        <div className="flex-1 h-[1px] bg-neo-dark/15" />
      </div>

      <form
        onSubmit={handleConnectSpace}
        className="space-y-4 relative"
      >
        <div className="grid grid-cols-6 gap-2">
          <input
            type="text"
            disabled={currentLoading}
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="border-b border-neo-dark/40 col-span-4 p-2 font-mono font-bold text-center tracking-[0.3em] uppercase bg-transparent outline-none focus:border-neo-orange transition-colors text-xs"
            placeholder="MÃ PHÒNG (3 SỐ)"
            maxLength={3}
          />
          <button
            type="submit"
            disabled={currentLoading || inviteCode.length === 0}
            className="col-span-2 bg-neo-dark text-neo-light flex flex-col items-center justify-center leading-none p-2 hover:bg-neo-orange hover:text-neo-dark transition-all active:scale-95"
          >
            {currentLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-bold text-[10px] uppercase tracking-widest">THAM GIA</span>
            )}
          </button>
        </div>
        {inviteError && (
          <p className="text-neo-orange text-xs font-bold uppercase tracking-widest text-center mt-2">
            {inviteError}
          </p>
        )}
      </form>
    </div>
  );
}

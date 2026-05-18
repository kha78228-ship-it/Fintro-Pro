import React from "react";
import { LogIn } from "lucide-react";

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
  return (
    <>
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isLoggingIn}
        className="border border-neo-dark hover:bg-neo-dark hover:text-neo-light p-3 flex items-center justify-center gap-3 w-full uppercase font-bold tracking-widest transition-all duration-300 active:scale-95"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all opacity-80"
          alt="Google"
        />
        <span>Đăng Nhập</span>
      </button>

      <form
        onSubmit={handleConnectSpace}
        className="pt-4 border-t border-neo-dark/20 space-y-4 relative"
      >
        <div className="grid grid-cols-6 gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) =>
              setInviteCode(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="border-b border-neo-dark col-span-4 p-2 font-mono font-bold text-center tracking-[0.3em] uppercase bg-transparent outline-none focus:border-neo-orange transition-colors"
            placeholder="MÃ SỐ (3 số)"
            maxLength={3}
          />
          <button
            type="submit"
            disabled={isLoggingIn || inviteCode.length === 0}
            className="col-span-2 bg-neo-dark text-neo-light flex flex-col items-center justify-center leading-none p-2 hover:bg-neo-orange transition-all active:scale-95"
          >
            {isLoggingIn ? (
              <div className="w-4 h-4 border-2 border-neo-dark border-t-transparent rounded-full animate-spin" />
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
    </>
  );
}

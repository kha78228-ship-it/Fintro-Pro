import React from "react";
import { Heart } from "lucide-react";

export function PinkCuteBackground({ appMode = "finance" }: { appMode?: "finance" | "love" | "entertainment" }) {
  return (
    <>
      <div className="absolute inset-0 z-[-3] bg-gradient-to-br from-pink-50 to-pink-100" />
      {/* Sparkles / grid */}
      <div 
        className="absolute inset-0 z-[-2] pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(#fbcfe8 2px, transparent 2px)",
          backgroundSize: "32px 32px"
        }}
      />
      {/* Decorative cute elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl" />
        <Heart className="absolute top-20 right-1/4 w-12 h-12 text-pink-300/50 rotate-12" fill="currentColor" />
        <Heart className="absolute bottom-32 left-1/4 w-8 h-8 text-rose-300/50 -rotate-12" fill="currentColor" />
      </div>
    </>
  );
}

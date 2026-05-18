import React from "react";

export function VintageBackground({ appMode = "finance" }: { appMode?: "finance" | "love" | "entertainment" }) {
  return (
    <>
      <div className="absolute inset-0 z-[-3] bg-neo-bg" />
      {/* Brutalist Grid Pattern */}
      <div 
        className="absolute inset-0 z-[-2] pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: "linear-gradient(to right, var(--color-neo-dark) 1px, transparent 1px), linear-gradient(to bottom, var(--color-neo-dark) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
      {/* Optional Large typography or brutalist shapes hanging in background depending on mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-neo-orange border-[6px] border-neo-dark translate-x-1/2 -translate-y-1/2 rotate-12 shadow-[12px_12px_0_var(--color-neo-dark)]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-neo-light border-[6px] border-neo-dark -translate-x-1/3 translate-y-1/3 -rotate-6 shadow-[12px_12px_0_var(--color-neo-dark)]" />
      </div>
    </>
  );
}

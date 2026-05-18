import React from "react";
import { motion } from "motion/react";
import { VintageBackground } from "./VintageBackground";

export function VintageLoadingScreen({ appMode = "finance" }: { appMode?: "finance" | "love" | "entertainment" }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neo-bg text-neo-dark selection:bg-neo-orange selection:text-white">
      <VintageBackground appMode={appMode} />
      
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        <div className="bg-neo-light p-10 border-4 border-neo-dark shadow-[12px_12px_0_var(--color-neo-dark)] relative origin-center">
            <span className="font-display font-medium text-4xl md:text-6xl tracking-tighter uppercase text-neo-dark">
                Loading
            </span>
            <div className="absolute -top-4 -right-4 bg-neo-orange text-white font-mono text-xs font-bold border-2 border-neo-dark px-2 py-1 rotate-12">
                WAIT!
            </div>
            <div className="flex gap-2 mt-6">
                <motion.div animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className="w-4 h-4 bg-neo-dark border-2 border-neo-dark origin-bottom" />
                <motion.div animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} className="w-4 h-4 bg-neo-orange border-2 border-neo-dark origin-bottom" />
                <motion.div animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} className="w-4 h-4 bg-neo-dark border-2 border-neo-dark origin-bottom" />
            </div>
            <span className="block mt-6 text-neo-dark font-mono text-sm font-bold tracking-widest uppercase">
              System Booting...
            </span>
        </div>
      </div>
    </div>
  );
}

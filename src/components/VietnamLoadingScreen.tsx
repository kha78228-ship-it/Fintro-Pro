import React from "react";
import { motion } from "motion/react";
import { DongSonDrumHUD } from "./DongSonDrumHUD";
import { VietnamBackground } from "./VietnamBackground";

export function VietnamLoadingScreen({ appMode = "finance", graphicsQuality = "high" }: { appMode?: "finance" | "love" | "entertainment", graphicsQuality?: "high" | "low" }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030914] text-white selection:bg-[#ff3b3b] selection:text-white">
      <VietnamBackground appMode={appMode} graphicsQuality={graphicsQuality} />
      
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        <div className="relative flex items-center justify-center pt-8 pb-16">
            <DongSonDrumHUD appMode={appMode} graphicsQuality={graphicsQuality} />
        </div>
        
        <div className={`flex flex-col items-center gap-3 ${graphicsQuality === "high" ? "backdrop-blur-sm" : ""} bg-[#030914]/60 p-8 rounded-3xl border border-white/10 relative z-20`}>
            <span 
              className={`font-display font-medium text-2xl md:text-4xl tracking-[0.3em] uppercase text-white ${graphicsQuality === "high" ? "shadow-[#ff3b3b]" : ""}`}
              style={{ textShadow: graphicsQuality === "high" ? "0 0 15px rgba(255,59,59,0.8)" : undefined }}
            >
                Đang Tải
            </span>
            <div className="flex gap-3 my-2">
                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-3 h-3 bg-[#ffcc00]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-3 h-3 bg-[#ffcc00]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-3 h-3 bg-[#ffcc00]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            </div>
            <span className="text-[#00bfff] font-mono text-xs md:text-sm font-bold tracking-[0.4em] uppercase">
              Kết nối Không Gian
            </span>
        </div>
      </div>
    </div>
  );
}


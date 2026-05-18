import React from "react";
import { motion } from "motion/react";
import { PinkCuteBackground } from "./PinkCuteBackground";
import { Heart } from "lucide-react";

export function PinkCuteLoadingScreen({ appMode = "finance" }: { appMode?: "finance" | "love" | "entertainment" }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-pink-50 text-pink-700 selection:bg-rose-500 selection:text-white">
      <PinkCuteBackground appMode={appMode} />
      
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        <div className="flex flex-col items-center p-12 bg-white/70 backdrop-blur-md rounded-[3rem] border-[3px] border-pink-200 shadow-[0_8px_32px_rgba(251,207,232,0.6)] relative origin-center">
            <motion.div 
               animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} 
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="w-20 h-20 text-rose-500 mb-6" fill="currentColor" />
            </motion.div>
            
            <span className="font-display font-bold text-3xl md:text-5xl tracking-wide text-pink-700">
                Đang tải nè...
            </span>
            
            <div className="flex gap-3 mt-8">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-4 h-4 bg-pink-400 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-4 h-4 bg-rose-400 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-4 h-4 bg-pink-400 rounded-full" />
            </div>
        </div>
      </div>
    </div>
  );
}

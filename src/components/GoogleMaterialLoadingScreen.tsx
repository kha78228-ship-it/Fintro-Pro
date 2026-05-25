import React from "react";
import { motion } from "motion/react";
import { Sparkles, Globe, Heart } from "lucide-react";

export default function GoogleMaterialLoadingScreen() {
  return (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center relative overflow-hidden bg-[#e8f0fe] text-neutral-800">
      
      {/* Dynamic Flowing Google AI Liquid Gradient Backdrop (Màn hình nền loang cực đại) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-60 mix-blend-multiply">
        <div className="absolute top-[-10%] left-[-10%] w-[90vw] h-[90vw] rounded-full blur-[120px] animate-liquid-1" style={{ backgroundImage: "radial-gradient(circle, rgba(66, 133, 244, 0.5) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[85vw] h-[85vw] rounded-full blur-[100px] animate-liquid-2" style={{ backgroundImage: "radial-gradient(circle, rgba(234, 67, 53, 0.45) 0%, transparent 70%)" }} />
        <div className="absolute top-[35%] right-[15%] w-[75vw] h-[75vw] rounded-full blur-[110px] animate-liquid-3" style={{ backgroundImage: "radial-gradient(circle, rgba(251, 188, 5, 0.45) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[10%] left-[10%] w-[80vw] h-[80vw] rounded-full blur-[120px] animate-liquid-4" style={{ backgroundImage: "radial-gradient(circle, rgba(52, 168, 83, 0.4) 0%, transparent 70%)" }} />
        <div className="absolute top-[10%] left-[20%] w-[70vw] h-[70vw] rounded-full blur-[100px] animate-liquid-5" style={{ backgroundImage: "radial-gradient(circle, rgba(161, 66, 244, 0.45) 0%, transparent 70%)" }} />
      </div>

      <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center p-8 md:p-12 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-[0_24px_64px_rgba(26,115,232,0.15)] w-full text-center">
          
          {/* Glowing Animated Material Logo */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Multi-layered spinning colorful rings */}
            <div className="absolute w-24 h-24 rounded-full border-[3px] border-t-[#4285F4] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute w-20 h-20 rounded-full border-[3px] border-t-transparent border-r-[#EA4335] border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <div className="absolute w-16 h-16 rounded-full border-[3px] border-t-transparent border-r-transparent border-b-[#FBBC05] border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute w-12 h-12 rounded-full border-[3px] border-t-transparent border-r-transparent border-b-transparent border-l-[#34A853] animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
            
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center shadow-lg border border-neutral-100 dark:border-neutral-700 z-10 relative"
            >
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            </motion.div>
          </div>
          
          <h2 className="font-sans font-extrabold text-2xl tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2 justify-center">
            Fintro AI Pro
          </h2>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-1">
            Driv Design
          </p>

          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-6 max-w-xs leading-relaxed">
            Đang khởi tạo không gian lãng mạn thông minh và loang sắc thái...
          </p>
          
          {/* Linear Google-styled progress bar */}
          <div className="w-full h-[3px] bg-neutral-200 dark:bg-neutral-700 rounded-full mt-8 overflow-hidden relative">
            <motion.div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] w-1/3 rounded-full"
              animate={{
                left: ["-30%", "110%"],
                width: ["30%", "60%", "30%"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="flex gap-2 items-center justify-center mt-6 text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
            <Globe className="w-3 h-3 text-emerald-500 animate-bounce" />
            <span>ĐANG KẾT NỐI KHÔNG GIAN CẶP ĐÔI</span>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes liquid-1 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(80px, -60px) scale(1.15) rotate(180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes liquid-2 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(-70px, 70px) scale(1.1) rotate(-180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(-360deg); }
        }
        @keyframes liquid-3 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(60px, 80px) scale(0.9) rotate(120deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes liquid-4 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(-80px, -80px) scale(1.1) rotate(-120deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(-360deg); }
        }
        @keyframes liquid-5 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(70px, 70px) scale(1.15) rotate(180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        .animate-liquid-1 { animation: liquid-1 25s infinite ease-in-out; }
        .animate-liquid-2 { animation: liquid-2 28s infinite ease-in-out; }
        .animate-liquid-3 { animation: liquid-3 32s infinite ease-in-out; }
        .animate-liquid-4 { animation: liquid-4 22s infinite ease-in-out; }
        .animate-liquid-5 { animation: liquid-5 30s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

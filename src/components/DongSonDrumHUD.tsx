import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Heart, Sparkles } from 'lucide-react';
import { DongSonDrumSvg } from './DongSonDrumSvg';

export function DongSonDrumHUD({ appMode = "finance", graphicsQuality = "high" }: { appMode?: "finance" | "love" | "entertainment", graphicsQuality?: "high" | "low" }) {
  const getColors = () => {
    switch (appMode) {
      case "love":
        return { primary: "#ff3b3b", secondary: "#ffcc00", tertiary: "#00bfff" };
      case "entertainment":
        return { primary: "#ffcc00", secondary: "#00bfff", tertiary: "#ff3b3b" };
      case "finance":
      default:
        return { primary: "#00bfff", secondary: "#ff3b3b", tertiary: "#ffcc00" };
    }
  };
  const { primary, secondary, tertiary } = getColors();

  return (
    <div className="flex-1 pt-20 pb-8 flex items-center justify-center relative mt-8 md:mt-12 transition-colors duration-1000 scale-[1.2] md:scale-[1.4]" style={{ color: primary }}>
      <div className="relative flex items-center justify-center w-[300px] h-[300px] md:w-[450px] md:h-[450px] mx-auto">
        {/* Outer dashed ring */}
        {graphicsQuality === "high" ? (
          <motion.div 
              animate={{ rotate: -360 }}
              transition={{
                repeat: Infinity,
                duration: 35,
                ease: "linear",
              }}
              className="absolute -inset-12 md:-inset-20 rounded-3xl border-[1.5px] border-dashed flex items-center justify-center overflow-hidden pointer-events-none opacity-40 z-0"
              style={{ borderColor: tertiary }}
          >
              <div className="w-full h-[1px] absolute top-1/2" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-[1px] h-full absolute left-1/2" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-full h-[1px] absolute top-1/2 rotate-45" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-[1px] h-full absolute left-1/2 -rotate-45" style={{ backgroundColor: `${tertiary}40` }} />
          </motion.div>
        ) : (
          <div 
              className="absolute -inset-12 md:-inset-20 rounded-3xl border-[1.5px] border-dashed flex items-center justify-center overflow-hidden pointer-events-none opacity-40 z-0"
              style={{ borderColor: tertiary }}
          >
              <div className="w-full h-[1px] absolute top-1/2" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-[1px] h-full absolute left-1/2" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-full h-[1px] absolute top-1/2 rotate-45" style={{ backgroundColor: `${tertiary}40` }} />
              <div className="w-[1px] h-full absolute left-1/2 -rotate-45" style={{ backgroundColor: `${tertiary}40` }} />
          </div>
        )}

        {graphicsQuality === "high" && (
          <>
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 90, ease: "linear", repeat: Infinity }}
               className="absolute inset-[0%] m-auto transition-colors duration-1000 opacity-30 pointer-events-none scale-[2]"
               style={{ color: tertiary, filter: `drop-shadow(0 0 15px ${tertiary}60)`, mixBlendMode: "screen" }}
            >
               <svg viewBox="0 0 1000 1000" className="w-full h-full" stroke="currentColor" fill="none" strokeWidth="1.5">
                 <circle cx="500" cy="500" r="480" strokeWidth="3" />
                 <circle cx="500" cy="500" r="430" />
                 <circle cx="500" cy="500" r="350" strokeDasharray="10, 10" />
                 <circle cx="500" cy="500" r="270" />
               </svg>
            </motion.div>
            <motion.div
               animate={{ rotate: -360 }}
               transition={{ duration: 120, ease: "linear", repeat: Infinity }}
               className="absolute inset-[0%] m-auto transition-colors duration-1000 opacity-20 pointer-events-none scale-[2.5]"
               style={{ color: secondary, filter: `drop-shadow(0 0 20px ${secondary}50)`, mixBlendMode: "overlay" }}
            >
               <svg viewBox="0 0 1000 1000" className="w-full h-full" stroke="currentColor" fill="none" strokeWidth="1">
                 <circle cx="500" cy="500" r="470" strokeWidth="2" />
                 <circle cx="500" cy="500" r="400" strokeDasharray="5, 15" />
                 <circle cx="500" cy="500" r="310" />
                </svg>
            </motion.div>
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 60, ease: "linear", repeat: Infinity }}
               className="absolute inset-[0%] m-auto transition-colors duration-1000 opacity-15 pointer-events-none scale-[3]"
               style={{ color: primary, filter: `drop-shadow(0 0 25px ${primary}70)`, mixBlendMode: "lighten" }}
            >
               <svg viewBox="0 0 1000 1000" className="w-full h-full" stroke="currentColor" fill="none" strokeWidth="1">
                 <circle cx="500" cy="500" r="490" />
                 <circle cx="500" cy="500" r="450" />
                 <circle cx="500" cy="500" r="360" strokeDasharray="20, 20" />
                 <circle cx="500" cy="500" r="200" />
               </svg>
            </motion.div>
          </>
        )}

        {/* Core Rotating Drum (Original position) */}
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 180, ease: "linear", repeat: Infinity }}
           className="absolute inset-0 transition-colors duration-1000"
           style={{ color: primary, filter: graphicsQuality === "high" ? `drop-shadow(0 0 15px ${primary}66)` : undefined }}
        >
           <DongSonDrumSvg className="w-full h-full opacity-90" />
        </motion.div>

        {/* Central glowing core */}
        <div className={`absolute inset-0 m-auto w-16 h-16 md:w-20 md:h-20 rounded-full opacity-80 border-4 border-dashed animate-pulse transition-colors duration-1000 ${graphicsQuality === "high" ? 'blur-[20px] mix-blend-screen' : ''}`} style={{ backgroundColor: secondary, borderColor: tertiary, boxShadow: `0 0 20px ${secondary}` }} />
        
        {/* Core Text 5.0 */}
        <div className="absolute inset-0 m-auto flex items-center justify-center z-10 pointer-events-none">
          <div className="text-xl md:text-3xl font-black italic tracking-tighter transition-colors duration-1000" style={{ color: '#030914', textShadow: `0 0 10px ${secondary}` }}>
            <span className={`text-white ${graphicsQuality === "high" ? "drop-shadow-md" : ""}`} style={{ textShadow: graphicsQuality === "low" ? "0 0 5px currentColor" : undefined }}>5.0</span>
          </div>
        </div>

        {/* Orbiting Nodes: The 3 mode logos */}
        <div className="absolute inset-0 m-auto w-full h-full">
          {[
            { icon: Wallet, color: '#00bfff', angle: 0, label: "Tài Chính" },
            { icon: Heart, color: '#ff3b3b', angle: 120, label: "Tình Yêu" },
            { icon: Sparkles, color: '#ffcc00', angle: 240, label: "Giải Trí" },
          ].map((node, i) => (
            <motion.div 
              key={i}
              className="absolute top-1/2 left-1/2 z-10 w-full h-full"
              style={{ originX: 0, originY: 0, transform: 'translate(-50%, -50%)', willChange: "transform" }}
              animate={{ rotate: [node.angle, node.angle + 360] }}
              transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            >
              <div 
                className="absolute left-1/2 top-0"
                style={{ transform: `translate(-50%, -50%)` }}
              >
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                  className="p-3 md:p-4 bg-[#030914] border-[3px] rounded-3xl relative shadow-md flex flex-col items-center justify-center group transition-colors duration-1000"
                  style={{ color: node.color, borderColor: node.color, willChange: "transform" }}
                >
                  <node.icon className="w-6 h-6 md:w-8 md:h-8 stroke-[2]" />
                  
                  {/* Label */}
                  <div className="absolute -bottom-8 md:-bottom-10 opacity-100 whitespace-nowrap text-[10px] md:text-xs font-mono tracking-widest uppercase bg-[#030914] px-2 md:px-3 py-1 rounded-3xl border" style={{ color: node.color, borderColor: `${node.color}50` }}>
                    {node.label}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

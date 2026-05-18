import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const heritages = [
  { title: "Vietnam Silicon Valley", desc: "Khu CNC Hòa Lạc", system: "ALPHAGEN", image: "https://images.unsplash.com/photo-1549480017-d2ce11a76274?q=80&w=2000&auto=format&fit=crop" },
  { title: "Trung Tâm Tài Chính SG", desc: "Landmark 81", system: "CYBER-SYNC", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2000&auto=format&fit=crop" },
  { title: "Hàng Không Điện Tử", desc: "Sân Bay Long Thành", system: "NEURO-REC", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop" },
  { title: "Đô Thị Bán Dẫn", desc: "Bình Dương / Đà Nẵng", system: "HOLO-CORE", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop" },
  { title: "Mạng Lưới Vệ Tinh", desc: "VINASAT-3", system: "QUANTUM-MAP", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop" },
];

export function VietnamBackground({ appMode = "finance", graphicsQuality = "high" }: { appMode?: "finance" | "love" | "entertainment", graphicsQuality?: "high" | "low" }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    // Extra fast frequency, making images overlap constantly as the transition is longer than the interval
    const intervalTime = graphicsQuality === "high" ? 4000 : 8000;
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % heritages.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [graphicsQuality]);

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
    <div className="fixed inset-0 z-[-2] overflow-hidden bg-[#030914] font-mono">
      {/* Background Image Slideshow with Holographic Tech Filter */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          {graphicsQuality === "high" && (
            <motion.div
              key={`img-${currentImgIndex}`}
              initial={{ opacity: 0, scale: 1.5, filter: "blur(30px) contrast(300%) hue-rotate(180deg) saturate(200%)" }}
              animate={{ opacity: 0.6, scale: 1, filter: "blur(0px) contrast(150%) hue-rotate(0deg) saturate(100%)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(30px) contrast(50%) hue-rotate(-180deg) saturate(0%)" }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
              style={{ willChange: "transform, opacity, filter" }}
            >
              <img 
                src={heritages[currentImgIndex].image} 
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
              {/* Heavy glass displacement overlay and heavy pseudo-elements */}
              <div className="absolute inset-0 backdrop-blur-[50px] mix-blend-hard-light bg-black/10" />
            </motion.div>
          )}
          <motion.div
            key={`text-${currentImgIndex}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Tech HUD for Heritage Info */}
            <div className="absolute bottom-10 left-10 md:bottom-20 md:left-20 flex flex-col font-mono text-left tracking-widest uppercase z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: secondary }}></div>
                <div className="text-xs font-bold" style={{ color: secondary }}>
                  SYS.LOC // {heritages[currentImgIndex].system}
                </div>
              </div>
              <div 
                className={`text-2xl md:text-5xl font-black ${graphicsQuality === "high" ? "drop-shadow-lg" : ""}`}
                style={{ color: primary, textShadow: graphicsQuality === "high" ? `0 0 20px ${primary}` : undefined, willChange: graphicsQuality === "high" ? "color, text-shadow" : "color" }}
              >
                {heritages[currentImgIndex].title}
              </div>
              <div 
                className="text-sm md:text-xl font-medium mt-1 opacity-80"
                style={{ color: tertiary }}
              >
                TARGET_LOC: {heritages[currentImgIndex].desc}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Digital scanline overlay over images */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)', color: primary, backgroundSize: '100% 4px' }} />
      </div>

      {/* "Loang" (Glowing Blur Gradients) Background - Kỷ Nguyên Vươn Mình */}
      <div 
        className={`absolute inset-0 pointer-events-none z-0 transition-all duration-1000 ${graphicsQuality === "high" ? "opacity-60 mix-blend-screen" : "opacity-40"}`}
      >
        {/* Central glowing core - The Vietnam Star (Vươn Mình) */}
        {graphicsQuality === "high" ? (
          <>
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6], rotate: [0, 90, 180] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-3xl blur-[100px] md:blur-[150px] transition-colors duration-1000" 
              style={{ backgroundColor: "#DA251D" }} /* Flag Red */
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7], rotate: [180, 90, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] md:w-[20vw] md:h-[20vw] rounded-3xl blur-[80px] md:blur-[100px] transition-colors duration-1000" 
              style={{ backgroundColor: "#FFFF00" }} /* Flag Gold/Yellow */
            />
            {/* Secondary accents representing technology & future (Kỷ Nguyên) */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], x: [0, -100, 0], y: [0, -100, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] md:w-[30vw] md:h-[30vw] rounded-3xl blur-[90px] md:blur-[120px] transition-colors duration-1000" 
              style={{ backgroundColor: "#00bfff" }} /* Cyber Blue */
            />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4], x: [0, 100, 0], y: [0, 100, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
              className="absolute bottom-[20%] right-[20%] w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw] rounded-3xl blur-[100px] md:blur-[130px] transition-colors duration-1000" 
              style={{ backgroundColor: "#ff3b3b" }} /* Cyber Red */
            />
          </>
        ) : (
          <>
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] md:w-[60vw] md:h-[60vw] rounded-3xl transition-colors duration-1000" 
              style={{ backgroundImage: "radial-gradient(circle, rgba(218, 37, 29, 0.4) 0%, transparent 70%)" }} /* Flag Red */
            />
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-3xl transition-colors duration-1000" 
              style={{ backgroundImage: "radial-gradient(circle, rgba(255, 255, 0, 0.3) 0%, transparent 70%)" }} /* Flag Gold/Yellow */
            />
            <div 
              className="absolute top-[10%] left-[10%] w-[100vw] h-[100vw] md:w-[50vw] md:h-[50vw] rounded-3xl transition-colors duration-1000" 
              style={{ backgroundImage: "radial-gradient(circle, rgba(0, 191, 255, 0.2) 0%, transparent 70%)" }} /* Cyber Blue */
            />
            <div 
              className="absolute bottom-[10%] right-[10%] w-[120vw] h-[120vw] md:w-[60vw] md:h-[60vw] rounded-3xl transition-colors duration-1000" 
              style={{ backgroundImage: "radial-gradient(circle, rgba(255, 59, 59, 0.2) 0%, transparent 70%)" }} /* Cyber Red */
            />
          </>
        )}
      </div>
      
      {/* Light Stars/Particles for a clean cyberpunk look instead of messy panels */}
      <div className="absolute inset-0 z-0 opacity-30" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }} />

      {/* Massive 5.0 Background Text */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center ${graphicsQuality === "high" ? "opacity-80 mix-blend-plus-lighter" : "opacity-40"}`}>
        {graphicsQuality === "high" ? (
          <motion.div 
            className="text-[40vw] md:text-[30vw] font-black leading-none tracking-tighter text-transparent transition-all duration-1000 select-none"
            style={{
              WebkitTextStroke: `4px ${tertiary}`,
              textShadow: `0 0 40px ${tertiary}80`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            5.0
          </motion.div>
        ) : (
          <div 
            className="text-[40vw] md:text-[30vw] font-black leading-none tracking-tighter text-transparent select-none"
            style={{
              WebkitTextStroke: `4px ${tertiary}`,
              textShadow: `0 0 20px ${tertiary}40`,
            }}
          >
            5.0
          </div>
        )}
      </div>

      {/* Large Glowing Text */}
      <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        {/* The main text */}
        <motion.div 
          className="text-[60px] md:text-[100px] font-black leading-none tracking-tighter text-transparent transition-all duration-1000"
          style={{
            WebkitTextStroke: `2px ${tertiary}`,
            textShadow: `0 0 20px ${tertiary}66, inset 0 0 20px ${tertiary}33`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          2026
        </motion.div>
        
        {/* Base glowing line */}
        <div className="w-[150%] h-[2px] transition-colors duration-1000 my-2" style={{ backgroundImage: `linear-gradient(to right, transparent, ${secondary}, transparent)`, boxShadow: `0 0 15px ${secondary}` }}></div>
        
        {/* Subtext */}
        <div className="tracking-[0.5em] md:tracking-[1em] text-[10px] md:text-sm font-bold uppercase mt-1 text-center whitespace-nowrap transition-colors duration-1000" style={{ color: secondary, textShadow: `0 0 10px ${secondary}cc`, willChange: "color, text-shadow" }}>
          Kỷ Nguyên Vươn Mình
        </div>
      </div>

      <div className="absolute inset-0 z-20 bg-neo-bg pointer-events-none" />
    </div>
  );
}

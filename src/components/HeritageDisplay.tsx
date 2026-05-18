import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Scan, Sparkles, Database } from "lucide-react";

const heritages = [
  {
    title: "Hoa Lư",
    image: "https://images.unsplash.com/photo-1596700688970-d79ebf353eb8?q=80&w=1080&auto=format&fit=crop",
    desc: "Cố đô nghìn năm",
  },
  {
    title: "Thăng Long",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1080&auto=format&fit=crop",
    desc: "Hoàng Thành Tái Tạo",
  },
  {
    title: "Kinh Thành Huế",
    image: "https://images.unsplash.com/photo-1559592413-7ce4f0a0487f?q=80&w=1080&auto=format&fit=crop",
    desc: "Di sản triều Nguyễn",
  },
  {
    title: "Thành nhà Hồ",
    image: "https://images.unsplash.com/photo-1620619053916-24e525148fb0?q=80&w=1080&auto=format&fit=crop",
    desc: "Lũy đá thép",
  },
  {
    title: "Chùa Long Đọi Sơn",
    image: "https://images.unsplash.com/photo-1579603213560-6ddcd271dd44?q=80&w=1080&auto=format&fit=crop",
    desc: "Quốc tự thế kỷ XI",
  },
];

export function HeritageDisplay({ appMode = "finance" }: { appMode?: "finance" | "love" | "entertainment" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % heritages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getColors = () => {
    switch (appMode) {
      case "love": return { primary: "#ff3b3b", secondary: "#ffcc00", tertiary: "#00bfff" };
      case "entertainment": return { primary: "#ffcc00", secondary: "#00bfff", tertiary: "#ff3b3b" };
      case "finance":
      default: return { primary: "#00bfff", secondary: "#ff3b3b", tertiary: "#ffcc00" };
    }
  };
  const { primary, secondary, tertiary } = getColors();

  return (
    <div className="w-full max-w-lg aspect-[4/5] relative flex items-center justify-center p-8">
      {/* Outer Holographic Frame */}
      <div 
        className="absolute inset-0 rounded-3xl border bg-[#030914]/40 backdrop-blur-md overflow-hidden transition-all duration-1000"
        style={{ borderColor: `${primary}55`, boxShadow: `0 0 40px ${primary}33` }}
      >
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full transition-all duration-1000" style={{ borderColor: primary }} />
        <div className="absolute top-0 right-0 w-12 h-12 rounded-full transition-all duration-1000" style={{ borderColor: tertiary }} />
        <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full transition-all duration-1000" style={{ borderColor: secondary }} />
        <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full transition-all duration-1000" style={{ borderColor: primary }} />
        
        {/* Scanlines overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-20 mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)', backgroundSize: '100% 3px' }} />
        
        {/* HUD Overlay Info */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start opacity-80 mix-blend-screen transition-colors duration-1000" style={{ color: primary }}>
          <div className="text-[10px] font-mono tracking-widest uppercase">
            <div className="flex items-center gap-1 mb-1"><Scan className="w-3 h-3" /> DI SẢN . HOLOGRAPH</div>
            <div className="opacity-60">{heritages[currentIndex].desc}</div>
          </div>
          <div className="text-[8px] font-mono tracking-widest text-right opacity-60">
            <div>DATA.SET 0{currentIndex + 1}/05</div>
            <div>RENDER.MODE: ALPHAGEN</div>
          </div>
        </div>

        {/* The Heritage Images Hologram */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.8, y: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }}
              exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1, y: -20 }}
              transition={{ duration: 0.8, ease: "anticipate" }}
              className="w-full h-full relative"
            >
              {/* Image projection */}
              <div 
                className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 mix-blend-screen opacity-90 transition-all duration-1000"
                style={{ 
                  filter: `sepia(0.8) hue-rotate(${appMode === 'finance' ? '160deg' : appMode === 'love' ? '320deg' : '40deg'}) saturate(200%) contrast(150%) brightness(1.2)`,
                  boxShadow: `0 0 30px ${primary}66`
                }}
              >
                <img 
                  src={heritages[currentIndex].image} 
                  alt={heritages[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-neo-bg opacity-80" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Title and Tech Data */}
        <div className="absolute bottom-6 left-6 right-6 z-20">
          <AnimatePresence mode="wait">
             <motion.div
               key={currentIndex}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               className="flex flex-col gap-1"
             >
               <h3 className="text-2xl md:text-3xl font-display font-medium uppercase tracking-widest transition-colors duration-1000" style={{ color: tertiary, textShadow: `0 0 15px ${tertiary}` }}>
                 {heritages[currentIndex].title}
               </h3>
               <div className="flex items-center gap-2 mt-2 transition-colors duration-1000" style={{ color: secondary }}>
                  <Database className="w-4 h-4" />
                  <div className="h-[2px] flex-1 bg-current opacity-30 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-current w-1/4"
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
               </div>
             </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

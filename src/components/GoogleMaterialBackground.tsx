import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Sunset, Moon, Sunrise, Clock, Sparkles } from "lucide-react";

type TimePeriod = "morning" | "afternoon" | "sunset" | "night";

export function GoogleMaterialBackground() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [period, setPeriod] = useState<TimePeriod>("afternoon");
  const [isAuto, setIsAuto] = useState<boolean>(true);

  // Automatic period detection based on current hour
  const getPeriodFromHour = (hour: number): TimePeriod => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 19) return "sunset";
    return "night";
  };

  useEffect(() => {
    // Sync with system clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (isAuto) {
        setPeriod(getPeriodFromHour(now.getHours()));
      }
    }, 1000);

    // Initial check
    if (isAuto) {
      setPeriod(getPeriodFromHour(new Date().getHours()));
    }

    return () => clearInterval(timer);
  }, [isAuto]);

  const handleManualPeriod = (selectedPeriod: TimePeriod) => {
    setIsAuto(false);
    setPeriod(selectedPeriod);
  };

  // Modern Google Material dynamic color gradients corresponding to periods
  const getThemeProps = () => {
    switch (period) {
      case "morning":
        return {
          bgClass: "bg-[#f3f6fc]",
          blobs: [
            { color: "rgba(103, 151, 232, 0.25)", size: "w-[70vw] h-[70vw]", pos: "top-[-20%] left-[-10%]" }, // Soft pale blue
            { color: "rgba(255, 194, 117, 0.22)", size: "w-[60vw] h-[60vw]", pos: "bottom-[-10%] right-[-10%]" }, // Fresh gold
            { color: "rgba(194, 230, 206, 0.2)", size: "w-[50vw] h-[50vw]", pos: "top-[20%] right-[10%]" }    // Clean mint
          ],
          label: "Bình Minh",
          icon: <Sunrise className="w-3.5 h-3.5" />,
          textColor: "text-amber-800",
          cardAccent: "border-sky-100",
          desc: "Bình minh trong lành khởi đầu ngày mới"
        };
      case "afternoon":
        return {
          bgClass: "bg-[#e8f0fe]",
          blobs: [
            { color: "rgba(26, 115, 232, 0.18)", size: "w-[80vw] h-[80vw]", pos: "top-[-30%] right-[-10%]" }, // Dynamic blue
            { color: "rgba(255, 244, 229, 0.8)", size: "w-[70vw] h-[70vw]", pos: "bottom-[10%] left-[-20%]" }, // Bright sunlit cream
            { color: "rgba(138, 180, 248, 0.25)", size: "w-[60vw] h-[60vw]", pos: "top-[40%] left-[30%]" }   // Deep sky blue
          ],
          label: "Ban Ngày",
          icon: <Sun className="w-3.5 h-3.5" />,
          textColor: "text-blue-800",
          cardAccent: "border-blue-100",
          desc: "Năng lượng tích cực ngập tràn không gian"
        };
      case "sunset":
        return {
          bgClass: "bg-[#fef0e3]",
          blobs: [
            { color: "rgba(251, 146, 60, 0.22)", size: "w-[70vw] h-[70vw]", pos: "bottom-[-20%] left-[-10%]" }, // Sunset peach
            { color: "rgba(192, 132, 252, 0.18)", size: "w-[60vw] h-[60vw]", pos: "top-[-10%] right-[-10%]" }, // Lilac mist
            { color: "rgba(244, 114, 182, 0.15)", size: "w-[50vw] h-[50vw]", pos: "top-[30%] left-[20%]" }    // Warm magenta
          ],
          label: "Hoàng Hôn",
          icon: <Sunset className="w-3.5 h-3.5" />,
          textColor: "text-orange-800",
          cardAccent: "border-orange-100",
          desc: "Hoàng hôn lãng mạn, ấm áp cùng nhau"
        };
      case "night":
      default:
        return {
          bgClass: "bg-[#121316]",
          blobs: [
            { color: "rgba(110, 68, 255, 0.16)", size: "w-[80vw] h-[80vw]", pos: "top-[-30%] left-[-10%]" }, // Starry violet
            { color: "rgba(0, 191, 255, 0.12)", size: "w-[70vw] h-[70vw]", pos: "bottom-[-20%] right-[10%]" }, // Neon blue nebula
            { color: "rgba(147, 51, 234, 0.1)", size: "w-[50vw] h-[50vw]", pos: "top-[20%] right-[20%]" }    // Galaxy indigo
          ],
          label: "Ban Đêm",
          icon: <Moon className="w-3.5 h-3.5" />,
          textColor: "text-indigo-200",
          cardAccent: "border-neutral-800",
          desc: "Màn đêm huyền ảo lấp lánh và dịu êm"
        };
    }
  };

  const theme = getThemeProps();

  // Custom starry style for night mode
  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
  const currentSecond = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className={`fixed inset-0 z-[-5] transition-colors duration-[1500ms] overflow-hidden ${theme.bgClass}`}>
      {/* Dynamic Animated Ambient Light Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 filter blur-[80px] md:blur-[120px] opacity-80 mix-blend-multiply">
        <AnimatePresence mode="popLayout">
          {theme.blobs.map((blob, idx) => (
            <motion.div
              key={`${period}-blob-${idx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: [1, 1.12, 1],
                x: [0, idx % 2 === 0 ? 30 : -30, 0],
                y: [0, idx % 2 === 0 ? -30 : 30, 0],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 12 + idx * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute rounded-full transition-all duration-[1500ms] ${blob.size} ${blob.pos}`}
              style={{ backgroundColor: blob.color }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Gentle Twinkling Stars ONLY in Night Period */}
      {period === "night" && (
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.2px 1.2px at 150px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 80px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 280px 110px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.8px 1.8px at 210px 240px, #ffffff, rgba(0,0,0,0))",
            backgroundSize: "320px 320px",
            backgroundRepeat: "repeat"
          }} />
        </div>
      )}

      {/* Modern Dynamic Bottom-Left Time of Day Dashboard Controller (Quick Pill) */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[1002] pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center gap-1.5 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md py-1.5 px-3 rounded-full border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm max-w-fit">
          <Clock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-300">
            {currentHour}:{currentMinute}:{currentSecond}
          </span>
          <div className="w-[1px] h-3 bg-neutral-300 dark:bg-neutral-700 mx-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            {theme.icon} {theme.label}
          </span>
          {isAuto && (
            <span className="text-[8px] bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#a8cdfc] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              TỰ ĐỘNG
            </span>
          )}
        </div>

        {/* Time Travel Fast Buttons inside a rounded dock layout */}
        <div className="flex items-center gap-1 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md p-1 rounded-full border border-neutral-200/40 dark:border-neutral-800/40 max-w-fit shadow-lg">
          <button
            onClick={() => setIsAuto(true)}
            className={`px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase rounded-full transition-all duration-300 ${isAuto ? "bg-[#1a73e8] text-white" : "text-neutral-600 dark:text-neutral-300 hover:bg-white/20"}`}
            title="Sử dụng thời gian hệ thống thực"
          >
            Hệ thống
          </button>
          <div className="w-[1px] h-3 bg-neutral-300 dark:bg-neutral-700" />
          
          <button
            onClick={() => handleManualPeriod("morning")}
            className={`p-1.5 rounded-full transition-all duration-300 ${(!isAuto && period === "morning") ? "bg-[#f59e0b] text-white" : "text-neutral-500 dark:text-neutral-400 hover:bg-white/20"}`}
            title="Chuyển sang Sáng sớm"
          >
            <Sunrise className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => handleManualPeriod("afternoon")}
            className={`p-1.5 rounded-full transition-all duration-300 ${(!isAuto && period === "afternoon") ? "bg-[#1a73e8] text-white" : "text-neutral-500 dark:text-neutral-400 hover:bg-white/20"}`}
            title="Chuyển sang Ban ngày"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => handleManualPeriod("sunset")}
            className={`p-1.5 rounded-full transition-all duration-300 ${(!isAuto && period === "sunset") ? "bg-[#ea580c] text-white" : "text-neutral-500 dark:text-neutral-400 hover:bg-white/20"}`}
            title="Chuyển sang Hoàng hôn"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => handleManualPeriod("night")}
            className={`p-1.5 rounded-full transition-all duration-300 ${(!isAuto && period === "night") ? "bg-[#6366f1] text-white" : "text-neutral-500 dark:text-neutral-400 hover:bg-white/20"}`}
            title="Chuyển sang Ban đêm"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Global CSS Injector to automatically override variables if period is Night */}
      {period === "night" && (
        <style>{`
          [data-theme="google_material"] {
            --color-neo-bg: #121316 !important;
            --color-neo-dark: #f1f3f4 !important;
            --color-neo-light: #1e1f22 !important;
            --color-neo-orange: #a8cdfc !important;
          }
          [data-theme="google_material"] body {
            background-color: #121316 !important;
            color: #f1f3f4 !important;
          }
          [data-theme="google_material"] .card {
            background-color: #1e1f22 !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
          [data-theme="google_material"] input,
          [data-theme="google_material"] select,
          [data-theme="google_material"] textarea,
          [data-theme="google_material"] .input-field {
            background-color: #1e1f22 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
          [data-theme="google_material"] h1,
          [data-theme="google_material"] h2,
          [data-theme="google_material"] h3,
          [data-theme="google_material"] h4,
          [data-theme="google_material"] h5,
          [data-theme="google_material"] h6 {
            color: #f1f3f4 !important;
          }
          [data-theme="google_material"] .btn-secondary {
            border-color: rgba(255, 255, 255, 0.15) !important;
            color: #a8cdfc !important;
          }
          [data-theme="google_material"] .text-neutral-600 {
            color: #c4c7c5 !important;
          }
          [data-theme="google_material"] .text-neutral-700 {
            color: #e3e3e3 !important;
          }
          [data-theme="google_material"] .text-neutral-500 {
            color: #9aa0a6 !important;
          }
          [data-theme="google_material"] .bg-neutral-50 {
            background-color: #2a2b2e !important;
          }
        `}</style>
      )}
    </div>
  );
}

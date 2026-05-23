import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Download, 
  X, 
  ArrowUpRight, 
  Check, 
  Apple, 
  Monitor, 
  Menu, 
  Share, 
  PlusSquare,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "pc">("ios");

  useEffect(() => {
    // Check if the app is already running in standalone mode (installed as app)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    // Check if user has explicitly dismissed the banner
    const isDismissed = localStorage.getItem("__has_dismissed_install_banner") === "true";

    // Detect platform to set default tab
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
      setActiveTab("ios");
    } else if (userAgent.includes("android")) {
      setActiveTab("android");
    } else {
      setActiveTab("pc");
    }

    // Only show if not standalone AND not dismissed
    if (!isStandalone && !isDismissed) {
      // Subtle delay to load elegantly
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    localStorage.setItem("__has_dismissed_install_banner", "true");
  };

  const isIframe = window.self !== window.top;
  const currentAppUrl = window.location.href;

  const handleOpenNewTab = () => {
    window.open(currentAppUrl, "_blank");
  };

  return (
    <>
      {/* Mini Top Banner - Subtle & High Contrast */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-[1600px] mx-auto px-4 md:px-8 mt-4"
          >
            <div 
              onClick={() => setShowModal(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 text-white p-4 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:border-orange-500/30 transition-all duration-300"
            >
              {/* Decorative radial ambient light */}
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/15 transition-all duration-500" />
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">Cài đặt App</span>
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">Offline PWA</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-100 mt-1 leading-tight">
                    Tải & Cài đặt Ứng dụng Fintro x Couple riêng biệt!
                  </h4>
                  <p className="text-xs text-neutral-400 leading-snug mt-0.5 max-w-xl">
                    Chạy độc lập mượt mà ngoài trình duyệt, hỗ trợ ngoại tuyến khi mất mạng, truy cập nhanh chỉ bằng 1 chạm từ màn hình chính.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-5 bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs rounded-full transition-all active:scale-95 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  Cài Đặt Ngay
                </button>
                {isIframe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenNewTab();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-4 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-neutral-200 font-bold text-xs rounded-full transition-all active:scale-95"
                    title="Mở trong tab mới"
                  >
                    <span>Mở Tab Mới</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="Ẩn thông báo này"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Setup Guide Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-neutral-100 overflow-hidden text-neutral-900"
            >
              {/* Header section with brand and dismiss action */}
              <div className="bg-gradient-to-b from-neutral-50/80 to-transparent p-6 pb-4 border-b border-neutral-100 flex items-start justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md border border-neutral-800">
                    FT
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">FinTrack x Couple Pro</h3>
                    <p className="text-xs text-neutral-400 font-medium">Cài đặt ứng dụng chính thức bảo mật</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Embedded dynamic warning for Iframe nesting */}
                {isIframe && (
                  <div className="bg-orange-50/80 border border-orange-100 p-4 rounded-3xl flex items-start gap-3">
                    <div className="p-1 rounded-xl bg-orange-100/80 text-orange-600 mt-0.5 shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-orange-900 leading-snug">
                        Bạn đang xem bản thử nghiệm trong cửa sổ Google AI Studio. Trình duyệt không thể cài đặt do bị chặn bởi iframe bảo mật.
                      </p>
                      <button
                        onClick={handleOpenNewTab}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all"
                      >
                        Bước 1: Mở Tab Mới để Tải App
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab layout selector */}
                <div className="flex p-1 bg-neutral-100 rounded-full border border-neutral-200">
                  <button
                    onClick={() => setActiveTab("ios")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-full transition-all ${
                      activeTab === "ios" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Apple className="w-3.5 h-3.5" />
                    Điện thoại iOS
                  </button>
                  <button
                    onClick={() => setActiveTab("android")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-full transition-all ${
                      activeTab === "android" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Điện thoại Android
                  </button>
                  <button
                    onClick={() => setActiveTab("pc")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-full transition-all ${
                      activeTab === "pc" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Máy tính (PWA)
                  </button>
                </div>

                {/* Instruction container contents */}
                <div className="min-h-[180px] bg-neutral-50 p-6 rounded-3xl border border-neutral-100/60 font-sans text-sm text-neutral-800 space-y-4">
                  {activeTab === "ios" && (
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="leading-relaxed">
                          Mở trình duyệt <strong>Safari</strong> trên thiết bị iPhone/iPad (hoặc nhấn nút <strong>Mở Tab Mới</strong> ở trên).
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="leading-relaxed flex flex-wrap items-center gap-1.5">
                          Chọn biểu tượng chia sẻ <Share className="w-4 h-4 text-neutral-700 inline-block shrink-0 mx-0.5" /> <strong>Chia Sẻ (Share)</strong> ở dưới cùng thanh công cụ trình duyệt Safari.
                        </p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="leading-relaxed flex flex-wrap items-center gap-1.5">
                          Cuộn xuống tiếp và chọn <PlusSquare className="w-4 h-4 text-neutral-700 inline-block shrink-0 mx-0.5" /> <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "android" && (
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="leading-relaxed">
                          Mở trình duyệt <strong>Google Chrome</strong> trên điện thoại Android và truy cập đường link trang web.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="leading-relaxed flex flex-wrap items-center gap-1.5">
                          Nhấn biểu tượng nút thực đơn <Menu className="w-4 h-4 text-neutral-700 inline-block shrink-0 mx-0.5" /> <strong>Menu (3 chấm dọc)</strong> ở góc trên bên phải màn hình Chrome.
                        </p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="leading-relaxed">
                          Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>, hệ thống sẽ tự sinh ra biểu tượng App trên màn hình điện thoại mượt mà.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "pc" && (
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="leading-relaxed">
                          Sử dụng trình duyệt <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> trên máy tính của bạn nâng cấp tiện ích.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="leading-relaxed">
                          Nhấp biểu tượng cài đặt ứng dụng (hình monitor kèm mũi tên đi xuống, hoặc nút Plus ghép) nằm trực tiếp ở góc bên phải của thanh nhập địa chỉ URL của trình duyệt.
                        </p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="leading-relaxed">
                          Xác nhận cài đặt để khởi tạo một ứng dụng độc lập tuyệt đẹp chạy tách biệt khỏi trình duyệt với tốc độ vượt trội.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      localStorage.setItem("__has_dismissed_install_banner", "true");
                      setShowBanner(false);
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3.5 px-4 rounded-2xl font-bold text-sm tracking-tight transition-colors active:scale-95"
                  >
                    Đã hiểu & Không nhắc lại
                  </button>

                  <button
                    onClick={() => {
                      if (isIframe) {
                        handleOpenNewTab();
                      } else {
                        // Attempt native install trigger
                        // @ts-ignore
                        const promptEvent = window.deferredPrompt;
                        if (promptEvent) {
                          promptEvent.prompt();
                          promptEvent.userChoice.then((choiceResult: any) => {
                            if (choiceResult.outcome === "accepted") {
                              // @ts-ignore
                              window.deferredPrompt = null;
                              setShowBanner(false);
                              setShowModal(false);
                            }
                          });
                        } else {
                          // Standard info
                          alert("Trình duyệt không hỗ trợ kích hoạt trực tiếp từ website này. Vui lòng làm theo hướng dẫn cài đặt thủ công ở trên!");
                        }
                      }
                    }}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 px-4 rounded-2xl font-bold text-sm tracking-tight transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isIframe ? (
                      <>
                        Mở Tab Mới Để Tải
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Kích Hoạt Cài Đặt
                        <Download className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

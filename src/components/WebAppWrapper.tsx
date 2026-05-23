import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Layers, 
  Tv, 
  RotateCw, 
  Laptop, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  Info, 
  FileText, 
  Check, 
  Bookmark, 
  CornerDownRight, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Link,
  ShieldAlert,
  HelpCircle,
  Copy,
  ChevronRight,
  Maximize2,
  FileCode2,
  AppWindow,
  Download,
  Filter,
  Moon,
  Sun,
  QrCode
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AndroidEmulator from "./AndroidEmulator";

interface CustomApp {
  id: string;
  name: string;
  url: string;
  color: string;
  icon: string;
  description: string;
  category: "finance" | "social" | "tools" | "custom";
}

const DEFAULT_TEMPLATES: CustomApp[] = [
  {
    id: "fintrack",
    name: "FinTrack & Couple Pro",
    url: window.location.origin,
    color: "#f97316",
    icon: "Wallet",
    description: "Không gian quản lý tài chính và kết nối lứa đôi của riêng bạn.",
    category: "finance"
  },
  {
    id: "vietqr",
    name: "VietQR Quick Pay",
    url: "https://vietqr.net",
    color: "#1e3a8a",
    icon: "LayoutGrid",
    description: "Tạo và gửi mã ngân hàng VietQR nhanh thanh toán tiện lợi.",
    category: "finance"
  },
  {
    id: "goldprice",
    name: "Giá Vàng & Tỷ Giá Hôm Nay",
    url: "https://webgia.com",
    color: "#d97706",
    icon: "Coins",
    description: "Theo dõi giá vàng SJC, tỷ giá đô la ngoại tệ và lãi suất ngân hàng.",
    category: "finance"
  },
  {
    id: "windy",
    name: "Bản Đồ Thời Tiết Windy",
    url: "https://node.windy.com",
    color: "#0284c7",
    icon: "CloudSun",
    description: "Camera vệ tinh thời tiết toàn cầu và cảnh báo giông bão thời gian thực.",
    category: "tools"
  },
  {
    id: "gtranslate",
    name: "Google Dịch Song Ngữ",
    url: "https://translate.google.com/?hl=vi",
    color: "#2563eb",
    icon: "Languages",
    description: "Công cụ dịch thuật văn bản, tài liệu đa ngôn ngữ thông thái.",
    category: "tools"
  },
  {
    id: "wiki",
    name: "Wikipedia Tiếng Việt",
    url: "https://vi.wikipedia.org",
    color: "#4b5563",
    icon: "BookOpen",
    description: "Bộ bách khoa toàn thư mở lớn nhất hành tinh học tập miễn phí.",
    category: "tools"
  },
  {
    id: "vtvgo",
    name: "VTV Go - Phim & Tin Tức",
    url: "https://vtvgo.vn",
    color: "#dc2626",
    icon: "Tv",
    description: "Kênh xem truyền hình trực tuyến VTV1, VTV3 chính chủ miễn phí.",
    category: "social"
  }
];

interface WebAppWrapperProps {
  appMode?: "finance" | "love" | "entertainment" | string;
}

export default function WebAppWrapper({ appMode = "entertainment" }: WebAppWrapperProps) {
  const [customApps, setCustomApps] = useState<CustomApp[]>([]);
  const [activeApp, setActiveApp] = useState<CustomApp | null>(null);
  
  // App creation state
  const [workspaceMode, setWorkspaceMode] = useState<"pwa_pack" | "android_dev">(
    appMode === "finance" ? "pwa_pack" : "android_dev"
  );
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#f97316");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CustomApp["category"]>("custom");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom workspace notes
  const [scratchpad, setScratchpad] = useState("");
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Device simulation state
  const [viewMode, setViewMode] = useState<"phone" | "tablet" | "desktop" | "full">("phone");
  const [isPortrait, setIsPortrait] = useState(true);
  const [tempUrl, setTempUrl] = useState("");
  const [iframeKey, setIframeKey] = useState(0);

  // New features interactive dev states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDarkModeFilter, setIsDarkModeFilter] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [showQrCode, setShowQrCode] = useState(false);
  const [codeTab, setCodeTab] = useState<"manifest" | "sw">("manifest");

  // Load custom apps on mount
  useEffect(() => {
    const saved = localStorage.getItem("__custom_web_apps");
    if (saved) {
      try {
        setCustomApps(JSON.parse(saved));
      } catch (e) {
        setCustomApps(DEFAULT_TEMPLATES);
      }
    } else {
      setCustomApps(DEFAULT_TEMPLATES);
      localStorage.setItem("__custom_web_apps", JSON.stringify(DEFAULT_TEMPLATES));
    }

    const savedNotes = localStorage.getItem("__app_workspace_scratchpad") || "";
    setScratchpad(savedNotes);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      triggerToast("Vui lòng điền tên và Link URL!");
      return;
    }

    // Standardize URL protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const newApp: CustomApp = {
      id: "app_" + Date.now(),
      name: name.trim(),
      url: formattedUrl,
      color,
      icon: "Globe",
      description: description.trim() || "Ứng dụng đóng gói cá nhân liên kết.",
      category
    };

    const updated = [newApp, ...customApps];
    setCustomApps(updated);
    localStorage.setItem("__custom_web_apps", JSON.stringify(updated));
    
    // Reset form
    setName("");
    setUrl("");
    setDescription("");
    setShowAddForm(false);
    triggerToast("Đã đóng gói ứng dụng web thành công!");
  };

  const handleDeleteApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customApps.filter(app => app.id !== id);
    setCustomApps(updated);
    localStorage.setItem("__custom_web_apps", JSON.stringify(updated));
    if (activeApp?.id === id) {
      setActiveApp(null);
    }
    triggerToast("Đã loại bỏ ứng dụng khỏi danh sách!");
  };

  const handleLaunchApp = (app: CustomApp) => {
    setActiveApp(app);
    setTempUrl(app.url);
    setIframeKey(prev => prev + 1);
  };

  const handleLaunchStandalone = (appUrl: string, appName: string) => {
    // Open a completely clean standalone chromeless popup window
    const width = isPortrait && viewMode !== "desktop" ? 430 : 1024;
    const height = isPortrait && viewMode !== "desktop" ? 860 : 768;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      appUrl,
      `_blank`,
      `resizable=yes,scrollbars=yes,status=yes,width=${width},height=${height},top=${top},left=${left},location=no,toolbar=no,menubar=no`
    );
    triggerToast(`Đang mở "${appName}" ở chế độ độc lập!`);
  };

  const handleNotesChange = (txt: string) => {
    setScratchpad(txt);
    localStorage.setItem("__app_workspace_scratchpad", txt);
  };

  return (
    <div className="w-full space-y-8 pb-12 font-sans relative">
      
      {/* Absolute Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900 border border-neutral-800 text-white px-6 py-3 rounded-2xl shadow-xl text-xs font-bold tracking-wide flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with brand and description */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm gap-6 relative overflow-hidden">
        {/* Decorative ambient spot */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          {workspaceMode === "android_dev" ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Google AI Studio
                </span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                  Android Multi-App Dev V.35
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                Mô Phỏng Giả Lập Android & Gemini Builder
              </h2>
              <p className="text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                Tích hợp mô phỏng theo tính năng tạo ứng dụng Google mới cập nhật! Nhập ý tưởng bằng tiếng Việt để Gemini biên dịch mã nguồn Kotlin/Compose và chạy ứng dụng trực tiếp tương tác ngay trên máy ảo Pixel 9.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                  Web-App Packaging
                </span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                  {appMode === "finance" ? "Bộ Phận Tài Chính" : "Chế Độ Live"}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {appMode === "finance" ? "Công Cụ Đóng Gói Web PWA Tài Chính" : "Đóng Gói Link Web Thành App"}
              </h2>
              <p className="text-sm text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                Nhập bất kỳ đường link website cá nhân nào bạn nhận được hoặc muốn sử dụng, hệ thống sẽ số hóa, tinh chỉnh cấu hình và đóng gói thành một giao diện ứng dụng di động / PWA vận hành mượt mà riêng biệt.
              </p>
            </>
          )}
        </div>

        {/* Switcher & Control button block */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
          {!activeApp && (
            <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-150 w-full sm:w-auto">
              {appMode === "entertainment" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("android_dev")}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${workspaceMode === "android_dev" ? "bg-white text-neutral-850 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                  >
                    Giả Lập Android OS
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("pwa_pack")}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${workspaceMode === "pwa_pack" ? "bg-white text-neutral-850 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                  >
                    Đóng Gói Web PWA (Tiện Ích)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("pwa_pack")}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${workspaceMode === "pwa_pack" ? "bg-white text-neutral-850 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                  >
                    Đóng Gói Web PWA
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMode("android_dev")}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${workspaceMode === "android_dev" ? "bg-white text-neutral-850 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                  >
                    Giả Lập Android (Giải Trí)
                  </button>
                </>
              )}
            </div>
          )}

          {activeApp && (
            <button
              onClick={() => setActiveApp(null)}
              className="flex items-center gap-2 py-3 px-6 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-sm rounded-full transition-all active:scale-95 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay Về Kho App
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activeApp ? (
          workspaceMode === "android_dev" ? (
            <motion.div
              key="android_emulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <AndroidEmulator />
            </motion.div>
          ) : (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
            {/* Left side column: Builder Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                  <h3 className="text-lg font-extrabold text-neutral-850 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-500" />
                    Cài Đặt App Mới
                  </h3>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600"
                  >
                    {showAddForm ? "Hủy bỏ" : "Tạo mới"}
                  </button>
                </div>

                {!showAddForm ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
                      <Globe className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-700">Dán Link Trực Tiếp Có Sẵn</p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                        Chuyển hóa nhanh đường link các tiện ích ngân hàng, thương mại, hoặc blog của bạn thành biểu tượng app.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex py-3 px-5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-full shadow transition-all active:scale-95"
                    >
                      Bắt Đầu Đóng Gói
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveApp} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-neutral-500 uppercase tracking-wider text-[10px]">Tên Ứng Dụng</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ví dụ: Cổng Pay, Wikipedia, Ví Việt..." 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-neutral-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-500 uppercase tracking-wider text-[10px]">Đường link trang web (URL)</label>
                      <div className="relative">
                        <Link className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          required
                          placeholder="https://example.com" 
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-neutral-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-neutral-500 uppercase tracking-wider text-[10px]">Chuyên Mục</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-neutral-700"
                        >
                          <option value="finance">Tài Chính / Thanh Toán</option>
                          <option value="tools">Công Cụ Đa Năng</option>
                          <option value="social">Giải Trí & Xã Hội</option>
                          <option value="custom">Giải Pháp Tự Định Nghĩa</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-neutral-500 uppercase tracking-wider text-[10px]">Tông màu nhận diện</label>
                        <div className="flex gap-2 items-center h-10">
                          {["#f97316", "#1e3a8a", "#16a34a", "#ea4335", "#8b5cf6", "#ec4899", "#3b82f6"].map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setColor(c)}
                              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-neutral-950 shadow-sm" : "border-transparent"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-neutral-500 uppercase tracking-wider text-[10px]">Mô Tả Tiện Ích</label>
                      <textarea 
                        rows={2}
                        placeholder="Mô tả tóm tắt tính năng của ứng dụng đóng gói..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-neutral-800 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <AppWindow className="w-4 h-4" />
                      Xác Nhận Đóng Gói App
                    </button>
                  </form>
                )}
              </div>

              {/* Utility Tools Box */}
              <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm text-neutral-800 space-y-4">
                <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                  Hướng Dẫn Cài Đặt Lên Thiết Bị
                </h4>
                <div className="space-y-3 text-xs leading-relaxed text-neutral-500">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold">1</div>
                    <p>Nhấp vào bất kỳ ứng dụng nào trong kho bên cạnh để khởi chạy trình bao bọc và kiểm nghiệm hiển thị.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <p>Sử dụng nút <strong>"Mở Độc Lập"</strong> nếu hệ thống bảo mật của trang web đích không cho cấu hình nhúng (iframe).</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <p>Lưu lại các ghi chú dữ liệu quan trọng ngay phía dưới thanh công cụ Scratchpad tiện lợi.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side column: Virtual App Drawer Store */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                
                {/* Catalog Header with App Counter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-neutral-900">
                      Kho Ứng Dụng Web Đăng Ký
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Danh sách chứa tất cả các URL đã đóng gói thành PWA</p>
                  </div>
                  <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                    Tổng số: {customApps.length} Ứng dụng
                  </span>
                </div>

                {/* Filter and Search Bar Row */}
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm ứng dụng đã đóng gói..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200/80 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 text-neutral-800 font-medium"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700 font-sans"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Category Pills Switcher */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mr-1 flex items-center gap-1 select-none">
                      <Filter className="w-3 h-3" /> Lọc theo:
                    </span>
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "finance", label: "💼 Tài chính" },
                      { key: "tools", label: "🔧 Công cụ" },
                      { key: "social", label: "🎬 Giải trí" },
                      { key: "custom", label: "👤 Cá nhân" }
                    ].map((pill) => (
                      <button
                        key={pill.key}
                        onClick={() => setFilterCategory(pill.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all relative cursor-pointer select-none ${
                          filterCategory === pill.key 
                            ? "bg-neutral-900 text-white shadow-sm"
                            : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200/40"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtered App Box Listing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customApps.filter(app => {
                    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          app.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesCategory = filterCategory === "all" || app.category === filterCategory;
                    return matchesSearch && matchesCategory;
                  }).map(app => {
                    // Try to resolve matching icon or render char preview
                    const AppIconDynamic = (LucideIcons as any)[app.icon];
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleLaunchApp(app)}
                        className="group p-5 bg-neutral-50/60 hover:bg-white rounded-3xl border border-neutral-200/50 hover:border-neutral-300 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Brand top tab */}
                        <div className="absolute top-0 right-0 w-11 h-1 bg-neutral-200 group-hover:w-full transition-all duration-500" style={{ backgroundColor: app.color }} />

                        <div>
                          {/* Title and Badge */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                                style={{ backgroundColor: app.color }}
                              >
                                {AppIconDynamic ? (
                                  <AppIconDynamic className="w-5 h-5 text-white" />
                                ) : (
                                  app.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="text-[14px] font-bold text-neutral-800 leading-tight group-hover:text-orange-500 transition-colors">
                                  {app.name}
                                </h4>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mt-0.5">
                                  {app.category === "finance" ? "💼 Tài Chính" : app.category === "tools" ? "🔧 Công cụ" : "🌐 Website"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLaunchStandalone(app.url, app.name);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-250 rounded-lg transition-colors"
                                title="Mở trong cửa sổ app độc lập"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              {app.id !== "fintrack" && (
                                <button
                                  onClick={(e) => handleDeleteApp(app.id, e)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Xóa bỏ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-neutral-500 leading-relaxed mt-3.5 font-medium">
                            {app.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-neutral-100">
                          <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[150px]">
                            {app.url}
                          </span>
                          <span className="text-xs font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">
                            Mở Giả Lập <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {customApps.filter(app => {
                    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          app.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
                    const matchesCategory = filterCategory === "all" || app.category === filterCategory;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-400 text-xs font-medium bg-neutral-50 rounded-3xl border border-dashed border-neutral-200">
                      Không tìm thấy ứng dụng nào khớp với điều kiện tìm kiếm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )
      ) : (
          /* Active App Shell Runner Screen */
          <motion.div
            key="sandbox"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 xl:grid-cols-4 gap-8"
          >
            {/* Main Interactive Emulator Iframe container (Col-span-3) */}
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white p-5 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
                {/* Embedded controls toolbar bar */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveApp(null)}
                      className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-white rounded-xl transition-all"
                      title="Quay lại kho app"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-5 bg-neutral-300 mx-1" />

                    {/* View mode buttons */}
                    <button
                      onClick={() => { setViewMode("phone"); setZoomScale(1.0); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === "phone" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-150"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Điện thoại
                    </button>
                    <button
                      onClick={() => { setViewMode("tablet"); setZoomScale(1.0); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === "tablet" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-150"
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      Máy tính bảng
                    </button>
                    <button
                      onClick={() => { setViewMode("desktop"); setZoomScale(1.0); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === "desktop" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-150"
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      Máy tính
                    </button>
                    <button
                      onClick={() => { setViewMode("full"); setZoomScale(1.0); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        viewMode === "full" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-150"
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Toàn màn hình
                    </button>
                  </div>

                  {/* Dev Tools (Zoom scale, Night Mode Filter, QR scan tracker) */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
                    
                    {/* Zoom Content Slider */}
                    <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-250">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase select-none">Tỷ lệ:</span>
                      <input 
                        type="range" 
                        min="0.55" 
                        max="1.45" 
                        step="0.05"
                        value={zoomScale} 
                        onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                        className="w-16 h-1 accent-orange-500 cursor-pointer"
                        title="Thu phóng nội dung"
                      />
                      <span className="text-[10px] font-mono font-bold text-neutral-600 min-w-[32px] text-right">
                        {Math.round(zoomScale * 100)}%
                      </span>
                    </div>

                    {/* Dark Filter Simulator */}
                    <button
                      onClick={() => {
                        setIsDarkModeFilter(!isDarkModeFilter);
                        triggerToast(isDarkModeFilter ? "Đã tắt bộ lọc màu tối!" : "Đã kích hoạt Chế độ tối mô phỏng!");
                      }}
                      className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                        isDarkModeFilter 
                          ? "bg-slate-900 text-amber-400 border-slate-950" 
                          : "bg-white text-neutral-600 hover:text-neutral-850 border-neutral-200"
                      }`}
                      title="Mô phỏng chế độ đêm (Invert Filter)"
                    >
                      {isDarkModeFilter ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Chế độ tối</span>
                    </button>

                    {/* QR Scan Share Code */}
                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                        showQrCode 
                          ? "bg-teal-500 text-white border-teal-600" 
                          : "bg-white text-neutral-600 hover:text-neutral-850 border-neutral-200"
                      }`}
                      title="Quét QR Code của link bằng điện thoại của bạn"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Quét QR</span>
                    </button>

                    {viewMode !== "desktop" && viewMode !== "full" && (
                      <button
                        onClick={() => setIsPortrait(!isPortrait)}
                        className="p-2 text-neutral-500 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all"
                        title="Xoay hướng thiết bị"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => setIframeKey(i => i + 1)}
                      className="p-2 text-neutral-500 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                      title="Tải lại ứng dụng"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleLaunchStandalone(activeApp.url, activeApp.name)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Chạy Độc Lập
                    </button>
                  </div>
                </div>

                {/* Simulated frame viewport area */}
                <div className="flex justify-center items-center bg-neutral-100 p-8 rounded-2xl min-h-[500px] relative overflow-hidden">
                  
                  {/* Decorative mesh vector background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

                  {/* QR Float scan overlay dialog */}
                  <AnimatePresence>
                    {showQrCode && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-6 text-center select-none"
                      >
                        <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm space-y-4 border border-neutral-200 overflow-hidden relative">
                          <button 
                            onClick={() => setShowQrCode(false)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 font-bold text-xs"
                          >
                            Đóng
                          </button>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                              Chia Sẻ QR Quick Link
                            </span>
                            <h4 className="text-sm font-extrabold text-neutral-850 mt-2">Mở App Trên Điện Thoại</h4>
                            <p className="text-xs text-neutral-500 mt-1">Bật camera điện thoại quét mã dưới đây để trải nghiệm cài đặt PWA trực tiếp lên máy thật.</p>
                          </div>
                          
                          <div className="w-[180px] h-[180px] bg-neutral-50 border border-neutral-200 rounded-2xl mx-auto flex items-center justify-center p-2.5">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeApp.url)}`} 
                              alt="QR Code Link"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="bg-neutral-50 px-3.5 py-2.5 rounded-xl border border-neutral-200 text-[11px] font-mono text-neutral-600 break-all select-all">
                            {activeApp.url}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {viewMode === "phone" && (
                    <div 
                      className="relative border-[12px] border-neutral-900 bg-neutral-950 rounded-[3rem] shadow-2xl transition-all duration-300 ease-out flex flex-col overflow-hidden"
                      style={{ 
                        width: isPortrait ? "360px" : "640px", 
                        height: isPortrait ? "720px" : "360px" 
                      }}
                    >
                      {/* Curved Speaker camera notch */}
                      {isPortrait && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl z-40 flex items-center justify-center">
                          <div className="w-12 h-1 bg-neutral-800 rounded-full mb-1.5" />
                          <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full absolute right-6 top-1.5" />
                        </div>
                      )}
                      
                      <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative flex flex-col flex-1">
                        {/* Simulation clock and indicators overlay */}
                        {isPortrait && (
                          <div className="h-7 bg-neutral-100 text-neutral-800 flex items-center justify-between px-6 text-[10px] font-bold select-none relative z-30 shrink-0">
                            <span>09:41</span>
                            <div className="flex items-center gap-1.5">
                              <span>LTE</span>
                              <div className="w-5 h-2.5 bg-neutral-700 rounded-sm" />
                            </div>
                          </div>
                        )}
                        <div className="w-full h-full overflow-hidden flex-1 relative bg-white">
                          <iframe
                            key={iframeKey}
                            src={tempUrl}
                            className="border-0"
                            style={{ 
                              width: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                              height: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                              transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : "none",
                              transformOrigin: "top left",
                              filter: isDarkModeFilter ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none',
                              position: "absolute",
                              top: 0,
                              left: 0
                            }}
                            title="Mobile Simulator"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === "tablet" && (
                    <div 
                      className="relative border-[16px] border-neutral-900 bg-neutral-950 rounded-[4rem] shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col"
                      style={{ 
                        width: isPortrait ? "550px" : "800px", 
                        height: isPortrait ? "750px" : "550px" 
                      }}
                    >
                      <div className="w-full h-full bg-white rounded-[2.8rem] overflow-hidden relative flex-1">
                        <iframe
                          key={iframeKey}
                          src={tempUrl}
                          className="border-0"
                          style={{ 
                            width: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                            height: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                            transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : "none",
                            transformOrigin: "top left",
                            filter: isDarkModeFilter ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none',
                            position: "absolute",
                            top: 0,
                            left: 0
                          }}
                          title="Tablet Simulator"
                        />
                      </div>
                    </div>
                  )}

                  {viewMode === "desktop" && (
                    <div className="w-full h-[600px] border border-neutral-300 rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
                      {/* Web browser header bar */}
                      <div className="h-10 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between px-4 select-none shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="bg-white border border-neutral-200 rounded-md px-6 py-1 text-[11px] font-mono text-neutral-500 w-1/2 text-center select-all truncate">
                          {tempUrl}
                        </div>
                        <div className="w-12 h-1 bg-transparent" />
                      </div>
                      <div className="w-full h-full flex-1 relative overflow-hidden bg-white">
                        <iframe
                          key={iframeKey}
                          src={tempUrl}
                          className="border-0"
                          style={{ 
                            width: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                            height: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                            transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : "none",
                            transformOrigin: "top left",
                            filter: isDarkModeFilter ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none',
                            position: "absolute",
                            top: 0,
                            left: 0
                          }}
                          title="Desktop Simulator"
                        />
                      </div>
                    </div>
                  )}

                  {viewMode === "full" && (
                    <div className="w-full h-[650px] bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xl transition-all duration-305 relative">
                      <iframe
                        key={iframeKey}
                        src={tempUrl}
                        className="border-0"
                        style={{ 
                          width: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                          height: zoomScale !== 1.0 ? `${100 / zoomScale}%` : "100%",
                          transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : "none",
                          transformOrigin: "top left",
                          filter: isDarkModeFilter ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none',
                          position: "absolute",
                          top: 0,
                          left: 0
                        }}
                        title="Full Simulator"
                      />
                    </div>
                  )}
                </div>

                {/* Simulated PWA Specification Code Generator */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-150 pb-3">
                    <div>
                      <h5 className="text-xs uppercase font-extrabold text-neutral-850 tracking-wider">
                        Phát triển mã nguồn: Đóng gói PWA hoàn chỉnh
                      </h5>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Tải tệp này lên máy chủ website gốc để trình duyệt kích hoạt "Pin screen app".</p>
                    </div>
                    
                    <div className="flex bg-neutral-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setCodeTab("manifest")}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${codeTab === "manifest" ? "bg-white text-neutral-800 shadow" : "text-neutral-500"}`}
                      >
                        manifest.json
                      </button>
                      <button 
                        onClick={() => setCodeTab("sw")}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${codeTab === "sw" ? "bg-white text-neutral-800 shadow relative" : "text-neutral-500"}`}
                      >
                        sw.js (Service Worker)
                      </button>
                    </div>
                  </div>

                  {codeTab === "manifest" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Tạo tệp có tên <code className="font-mono bg-neutral-100 text-orange-600 px-1 py-0.5 rounded">manifest.json</code> trong thư mục gốc của website của bạn để tạo biểu trưng launcher, định danh màu sắc và chế độ khởi chạy ứng dụng:
                      </p>
                      <div className="relative group">
<pre className="p-4 bg-neutral-900 text-amber-200 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-[220px]">
{`{
  "name": "${activeApp.name}",
  "short_name": "${activeApp.name.substring(0, 12)}",
  "start_url": "${activeApp.url.startsWith(window.location.origin) ? "/" : activeApp.url}",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "${activeApp.color}",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`}
</pre>
                        <button
                          onClick={() => {
                            const val = `{
  "name": "${activeApp.name}",
  "short_name": "${activeApp.name.substring(0, 12)}",
  "start_url": "${activeApp.url.startsWith(window.location.origin) ? "/" : activeApp.url}",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "${activeApp.color}",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}`;
                            navigator.clipboard.writeText(val);
                            triggerToast("Đã sao chép manifest.json!");
                          }}
                          className="absolute right-3 top-3 px-2.5 py-1.5 bg-neutral-800 text-white hover:bg-neutral-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow"
                        >
                          <Copy className="w-3 h-3" /> Sao chép
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Tải tệp <code className="font-mono bg-neutral-100 text-orange-600 px-1 py-0.5 rounded">sw.js</code> lên máy chủ để hỗ trợ lưu đệm tài nguyên ngoại tuyến, giúp ứng dụng hoạt động ngay cả khi mất mạng internet:
                      </p>
                      <div className="relative group">
<pre className="p-4 bg-neutral-900 text-amber-200 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-[220px]">
{`const CACHE_NAME = 'app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});`}
</pre>
                        <button
                          onClick={() => {
                            const val = `const CACHE_NAME = 'app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});`;
                            navigator.clipboard.writeText(val);
                            triggerToast("Đã sao chép sw.js!");
                          }}
                          className="absolute right-3 top-3 px-2.5 py-1.5 bg-neutral-800 text-white hover:bg-neutral-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow"
                        >
                          <Copy className="w-3 h-3" /> Sao chép
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CSP Frame Diagnostic Warning Help System */}
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-700 shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-orange-950 uppercase tracking-widest">
                      Lưu Ý Đặc Biệt Về Bản Quyền Nhúng (Iframe Blocks)
                    </h5>
                    <p className="text-xs text-orange-900 leading-relaxed font-semibold">
                      Một số trang thương mại điện tử hoặc mạng xã hội lớn (vận hành bảo mật an ninh cao như Facebook, Google, Shopee) trang bị tiêu đề bảo mật <code className="font-mono bg-orange-100 text-orange-800 px-1 py-0.5 rounded">X-Frame-Options: SAMEORIGIN</code> để chặn trình duyệt nhúng trực tiếp vào trang khác (iframe block). 
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleLaunchStandalone(activeApp.url, activeApp.name)}
                        className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow active:scale-95 transition-all"
                      >
                        Mở Trình Bao Độc Lập Để Xem Full Trực Tiếp
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(activeApp.url);
                          triggerToast("Đã sao chép link liên kết!");
                        }}
                        className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200/60 active:scale-95 transition-all"
                      >
                        Sao Chép Link Gốc
                        <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side column: Workspace Scratchpad and Bookmarks (Col-span-1) */}
            <div className="space-y-6">
              
              {/* Scratchpad Card */}
              <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-sm font-extrabold text-neutral-850 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Sổ Tay Lập Trình (Notes)
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                    Ghi nhớ nhanh
                  </span>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Dán mã token, tài khoản hoặc hướng dẫn:</label>
                  <textarea
                    rows={8}
                    value={scratchpad}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Viết ghi chú nháp của bạn vào đây... Dữ liệu sẽ tự động lưu lại vào trình duyệt cục bộ của bạn."
                    className="w-full p-3.5 bg-neutral-50 border border-neutral-250 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-neutral-700 leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 text-center font-medium italic">
                  * Tự động lưu trữ offline an toàn.
                </p>
              </div>

              {/* App Meta Info Specs */}
              <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-3.5 text-neutral-800">
                <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-orange-500" />
                  Cấu Hình Đóng Gói
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-400">Tên gốc:</span>
                    <span className="font-bold text-neutral-700">{activeApp.name}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-400">Giao dịch:</span>
                    <span className="font-bold text-teal-600 block truncate max-w-[150px]" title={activeApp.url}>{activeApp.url}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-neutral-400">Nhóm:</span>
                    <span className="font-bold text-orange-500 uppercase">{activeApp.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

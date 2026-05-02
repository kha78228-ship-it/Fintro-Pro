import React, { useState } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, Layout, Type, Palette, AlertTriangle, Download, MonitorDown, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  backgroundImage: string;
  setBackgroundImage: (url: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  onDeleteData: () => void;
  onDownloadData: () => void;
}

const PRESET_BACKGROUNDS = [
  { id: 'none', url: '', label: 'Mặc định' },
  { id: 'gradient-1', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop', label: 'Hoàng hôn' },
  { id: 'gradient-2', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop', label: 'Tím mộng mơ' },
  { id: 'nature', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop', label: 'Thiên nhiên' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', label: 'Minimal Biển' },
  { id: 'dark', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', label: 'Đêm tối' },
  { id: 'mesh', url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=400&auto=format&fit=crop', label: 'Mesh hồng' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400&auto=format&fit=crop', label: 'Rừng xanh' },
  { id: 'abstract', url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?q=80&w=400&auto=format&fit=crop', label: 'Art cam' },
  { id: 'city', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=400&auto=format&fit=crop', label: 'Thành phố' }
];

const FONTS = [
  { id: 'Inter', label: 'Inter (Mặc định)' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Nunito', label: 'Nunito' },
  { id: 'Quicksand', label: 'Quicksand' },
  { id: 'Lora', label: 'Lora (Cổ điển)' },
  { id: 'Merriweather', label: 'Merriweather' },
];

const COLORS = [
  { id: '#1a1a1a', label: 'Đen nhạt (Mặc định)', bg: 'bg-[#1a1a1a]' },
  { id: '#3b82f6', label: 'Xanh lam', bg: 'bg-blue-500' },
  { id: '#10b981', label: 'Xanh ngọc', bg: 'bg-emerald-500' },
  { id: '#8b5cf6', label: 'Tím', bg: 'bg-violet-500' },
  { id: '#f43f5e', label: 'Hồng', bg: 'bg-rose-500' },
  { id: '#d97706', label: 'Cam', bg: 'bg-amber-600' },
];

export default function SettingsView({ 
  backgroundImage, 
  setBackgroundImage,
  fontFamily,
  setFontFamily,
  textColor,
  setTextColor,
  onDeleteData,
  onDownloadData
}: SettingsProps) {
  const [customInput, setCustomInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveCustom = () => {
    if (customInput.trim()) {
      setBackgroundImage(customInput);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Cài đặt</h2>
          <p className="text-neutral-500 mt-1">Tùy chỉnh giao diện và bảo mật tài khoản.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-neutral-900">Tùy Biến Ảnh Nền</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {PRESET_BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setBackgroundImage(bg.url)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl p-2 border-2 transition-all ${backgroundImage === bg.url ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent hover:bg-neutral-50'}`}
                >
                  <div 
                    className="w-full h-20 rounded-xl bg-neutral-200 bg-cover bg-center shadow-sm"
                    style={{ backgroundImage: bg.url ? `url(${bg.url})` : 'none' }}
                  />
                  <span className="text-xs font-bold text-neutral-700">{bg.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3">
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Link ảnh tự do</p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Tiếp tục link hình ảnh (https://...)"
                  className="input-field py-3 px-4 resize-none"
                />
                <button 
                  onClick={handleSaveCustom}
                  className="btn-primary py-2 px-4 shadow-none"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
              <Type className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-neutral-900">Tùy Chỉnh Chữ</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Phông chữ</p>
                <div className="grid grid-cols-2 gap-3">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id)}
                      className={`text-sm font-semibold py-3 px-4 rounded-xl border-2 transition-all text-left ${fontFamily === font.id ? 'border-amber-500 bg-amber-50/50 text-amber-700' : 'border-neutral-100 text-neutral-700 hover:bg-neutral-50'}`}
                      style={{ fontFamily: font.id }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Màu nhấn chữ</p>
                <div className="flex flex-wrap gap-4">
                  {COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setTextColor(color.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${textColor === color.id ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105 shadow-sm'}`}
                      title={color.label}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bg}`} style={{ backgroundColor: color.id }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
              <Download className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-neutral-800">Cập nhật dữ liệu & Ngoại tuyến</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">Bạn có thể tải về toàn bộ dữ liệu giao dịch dưới định dạng CSV để sao lưu hoặc dùng phần mềm khác quản lý.</p>
              
              <button 
                onClick={onDownloadData}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all"
              >
                <Download className="w-5 h-5" />
                Tải xuống dữ liệu CSV
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <p className="text-sm text-neutral-600">Lưu giao diện trang web thành định dạng PDF để tiện lưu trữ hoặc in ấn báo cáo.</p>
              
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl transition-all"
              >
                <MonitorDown className="w-5 h-5" />
                Tải về trang web (Xuất PDF)
              </button>
            </div>
            
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="font-bold text-neutral-900 mb-4 flex items-center justify-between">
                Tải App Điện Thoại / Máy Tính
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase tracking-wider">Phiên bản Cloud</span>
              </h4>
              
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-indigo-900 leading-tight">Fintro App</h5>
                    <p className="text-xs text-indigo-700/80 mt-1">iOS • Android • macOS • Windows</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-start gap-2 text-sm text-indigo-900/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <p>Hoạt động như một ứng dụng độc lập trên thiết bị của bạn.</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-indigo-900/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <p><strong>Yêu cầu có mạng:</strong> Bạn cần kết nối Internet (Wifi/4G) để sử dụng.</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (window.self !== window.top) {
                      alert('⚠️ Bạn đang dùng bản xem trước, vui lòng nhấn "Open in new tab" ở góc trên bên phải để bắt đầu tải app.');
                      return;
                    }
                    // @ts-ignore
                    const promptEvent = window.deferredPrompt;
                    if (promptEvent) {
                      promptEvent.prompt();
                      promptEvent.userChoice.then((choiceResult: any) => {
                        console.log(choiceResult.outcome);
                        // @ts-ignore
                        window.deferredPrompt = null;
                      });
                    } else {
                        // User manual instructions
                        alert('Để tải ứng dụng:\n\n• Trên Safari (iOS): Nhấn nút Chia Sẻ (vuông có mũi tên lên) ở dưới cùng màn hình -> Chọn "Thêm vào MH chính" (Add to Home Screen).\n\n• Trên Chrome (Android): Nhấn nút Menu (3 chấm) ở góc phải -> Chọn "Thêm vào Màn hình chính" hoặc "Cài đặt ứng dụng".');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  Tải Ứng Dụng Ngay
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-red-100 pb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-red-600">Khu Vực Nguy Hiểm</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">Hành động này sẽ xóa toàn bộ dữ liệu giao dịch của bạn. Dữ liệu sau khi xóa sẽ <strong className="text-red-500">không thể khôi phục</strong>.</p>
              
              {showDeleteConfirm ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl transition-all">Hủy</button>
                  <button 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      onDeleteData();
                    }} 
                    className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/30"
                  >
                    Xác nhận Xóa
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all"
                >
                  Xóa toàn bộ dữ liệu giao dịch
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

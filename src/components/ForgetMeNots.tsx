import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Plus, Gift, Cake, CalendarHeart, Shirt } from 'lucide-react';

export default function ForgetMeNots() {
  const [items, setItems] = useState([
    { id: 1, type: "size", title: "Cỡ giày", value: "37", icon: <Shirt className="w-5 h-5 text-indigo-500" /> },
    { id: 2, type: "gift", title: "Loài hoa yêu thích", value: "Hoa Cẩm Tú Cầu", icon: <Gift className="w-5 h-5 text-pink-500" /> },
    { id: 3, type: "food", title: "Dị ứng", value: "Tôm non", icon: <Cake className="w-5 h-5 text-amber-500" /> },
    { id: 4, type: "date", title: "Ngày kỷ niệm", value: "12/04/2022", icon: <CalendarHeart className="w-5 h-5 text-rose-500" /> },
  ]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-display font-bold text-sky-600 tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <Bookmark className="w-8 h-8 fill-sky-100" />
            Forget-Me-Nots
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Lưu trữ các tiểu tiết quan trọng của người ấy để trở nên tinh tế hơn.</p>
        </div>
        <button className="flex items-center gap-2 bg-sky-600 text-white font-bold px-5 py-3 rounded-xl shadow-md hover:bg-sky-700 transition-colors">
          <Plus className="w-5 h-5" /> Thêm ghi chú
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-sky-300 transition-all"
          >
            <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">{item.title}</span>
              <span className="text-lg font-bold text-neutral-800 tracking-tight">{item.value}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

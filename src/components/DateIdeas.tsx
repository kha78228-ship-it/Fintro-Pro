import React from 'react';
import { motion } from 'motion/react';
import { Map, Coffee, Music, Trees, UtensilsCrossed } from 'lucide-react';

export default function DateIdeas() {
  const ideas = [
    {
      title: "Làm gốm cuối tuần",
      desc: "Cùng nhau lấm lem bùn đất và tạo ra chiếc cốc đôi độc nhất vô nhị. Phù hợp cho ngày mưa.",
      type: "Sáng tạo",
      icon: <Coffee className="w-5 h-5" />,
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      title: "Picnic công viên hoàng hôn",
      desc: "Chuẩn bị thảm caro, vài miếng sandwich và chút hoa quả. Ngắm ánh chiều tà rơi trên mặt hồ.",
      type: "Lãng mạn & Thiên nhiên",
      icon: <Trees className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      title: "Nghe nhạc Live Acoustic",
      desc: "Đưa nhau đi trốn ở một pub nhỏ, nhâm nhi cocktail và chill theo điệu nhạc.",
      type: "Thư giãn",
      icon: <Music className="w-5 h-5" />,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      title: "Nấu một món mới tinh",
      desc: "Cùng đi siêu thị mua nguyên liệu cồng kềnh về nấu một món chưa từng làm bao giờ.",
      type: "Vui vẻ",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      color: "bg-rose-50 text-rose-600 border-rose-200"
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-orange-600 tracking-tight flex items-center justify-center gap-3">
          <Map className="w-8 h-8 fill-orange-100" />
          Ý Tưởng Hẹn Hò
        </h2>
        <p className="text-neutral-500">Gợi ý những trải nghiệm mới để hâm nóng tình cảm.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map((idea, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-4 p-6 bg-white rounded-3xl shadow-sm border border-neutral-100 hover:shadow-lg transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${idea.color}`}>
              {idea.icon}
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">{idea.type}</div>
              <h3 className="text-lg font-bold text-neutral-900 leading-tight mb-2">{idea.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{idea.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button className="bg-orange-100 text-orange-700 font-bold px-8 py-4 rounded-xl hover:bg-orange-200 transition-colors">
          Tạo random một ý tưởng ngay!
        </button>
      </div>
    </div>
  );
}

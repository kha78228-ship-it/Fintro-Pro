import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, HandHeart, MessageCircleHeart, ShieldAlert } from 'lucide-react';

export default function RelationshipExercises() {
  const exercises = [
    {
      id: 1,
      title: "Nghệ thuật lắng nghe chủ động",
      desc: "Học cách nghe để thấu hiểu, không phải nghe để trả lời.",
      icon: <MessageCircleHeart className="w-6 h-6 text-pink-500" />,
      color: "from-pink-500 to-rose-400",
      bg: "bg-pink-50"
    },
    {
      id: 2,
      title: "Giải quyết mâu thuẫn không làm tổn thương",
      desc: "Quy tắc 3 không khi cãi vã giúp giữ gìn mối quan hệ.",
      icon: <ShieldAlert className="w-6 h-6 text-amber-500" />,
      color: "from-amber-400 to-orange-500",
      bg: "bg-amber-50"
    },
    {
      id: 3,
      title: "5 Ngôn ngữ tình yêu",
      desc: "Khám phá cách bạn và người ấy muốn được yêu thương.",
      icon: <HandHeart className="w-6 h-6 text-teal-500" />,
      color: "from-teal-400 to-emerald-500",
      bg: "bg-teal-50"
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-teal-700 tracking-tight flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 fill-teal-100" />
          Bài Tập Mối Quan Hệ
        </h2>
        <p className="text-neutral-500">Góc chuyên gia giúp tình yêu luôn bền chặt và thấu hiểu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exercises.map((ex, i) => (
          <motion.div 
            key={ex.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-3xl p-6 border border-neutral-100 bg-white shadow-sm hover:shadow-xl transition-all cursor-pointer group`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${ex.bg} group-hover:scale-110 transition-transform`}>
              {ex.icon}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-tight">
              {ex.title}
            </h3>
            <p className="text-neutral-500 text-sm">
              {ex.desc}
            </p>
            <div className="mt-6 font-bold text-xs uppercase tracking-widest text-neutral-400 group-hover:text-neutral-800 transition-colors">
              Bắt đầu bài tập &rarr;
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

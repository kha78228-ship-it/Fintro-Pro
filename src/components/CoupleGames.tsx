import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Check, X, Trophy } from 'lucide-react';

export default function CoupleGames() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  const questions = [
    {
      q: "Vị kem yêu thích của người ấy là gì?",
      options: ["Matcha", "Chocolate", "Vani", "Dâu tây"],
      answer: 0
    },
    {
      q: "Người ấy thích ở nhà xem phim hay ra ngoài đi dạo cuối tuần?",
      options: ["Ở nhà xem phim chilling", "Ra ngoài hóng gió", "Đi cafe chụp ảnh", "Ngủ nướng cả ngày"],
      answer: 2
    },
    {
      q: "Món quà nào khiến người ấy cảm động nhất?",
      options: ["Tự làm đồ handmade", "Trang sức đắt tiền", "Dẫn đi ăn ngon", "Chuyển khoản :))"],
      answer: 0
    }
  ];

  const handleSelect = (idx: number) => {
    if (idx === questions[currentQ].answer) setScore(score + 1);
    setCurrentQ(currentQ + 1);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-indigo-600 tracking-tight flex items-center justify-center gap-3">
          <Gamepad2 className="w-8 h-8 fill-indigo-100" />
          Mức Độ Hiểu Nhau
        </h2>
        <p className="text-neutral-500">Xem bạn nắm rõ sở thích của nửa kia đến đâu nhé!</p>
      </div>

      {!started ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 text-center shadow-xl shadow-indigo-500/5 border border-indigo-100 space-y-6"
        >
          <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-bold font-display">Quiz: Bạn có hiểu người ấy?</h3>
          <p className="text-neutral-500">Người ấy đã trả lời xong bộ câu hỏi này. Giờ đến lượt bạn trổ tài đoán ý đồng đội!</p>
          <button 
            onClick={() => setStarted(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            Bắt Đầu Chơi
          </button>
        </motion.div>
      ) : currentQ < questions.length ? (
        <motion.div 
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-500/5 border border-indigo-100"
        >
          <div className="text-sm font-bold text-indigo-500 mb-4 tracking-widest uppercase">Câu {currentQ + 1} / {questions.length}</div>
          <h3 className="text-xl font-semibold mb-6">{questions[currentQ].q}</h3>
          <div className="space-y-3">
            {questions[currentQ].options.map((opt, idx) => (
              <button 
                key={idx}
                onClick={() => handleSelect(idx)}
                className="w-full text-left p-4 rounded-xl border border-neutral-200 hover:border-indigo-500 hover:bg-indigo-50 font-medium text-neutral-700 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl p-10 text-center shadow-xl space-y-4"
        >
          <Trophy className="w-20 h-20 text-yellow-300 mx-auto drop-shadow-md mb-4" />
          <h3 className="text-3xl font-bold font-display">Điểm của bạn: {score}/{questions.length}</h3>
          <p className="text-indigo-100 text-lg">
            {score === questions.length ? "Tuyệt vời! Bạn quá hiểu người ấy luôn 😍" : 
             score > 0 ? "Khá lắm, nhưng cần cố gắng quan sát thêm nhé! 😅" : "Toang rồi, tối nay ra sofa ngủ nhé =))"}
          </p>
          <button 
            onClick={() => {setStarted(false); setCurrentQ(0); setScore(0);}}
            className="mt-6 bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl transition-all hover:bg-neutral-50"
          >
            Chơi Lại
          </button>
        </motion.div>
      )}
    </div>
  );
}

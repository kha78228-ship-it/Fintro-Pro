import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Lock, Unlock, Send, Sparkles } from 'lucide-react';

export default function DailyQuestion({ user }: { user: any }) {
  const [answered, setAnswered] = useState(false);
  const [answer, setAnswer] = useState('');
  const [myAnswer, setMyAnswer] = useState('');

  const todayQuestion = "Nếu một ngày chúng ta phải xa nhau 1 tháng không thể liên lạc, điều gì ở đối phương sẽ làm bạn nhớ nhất?";

  const handleAnswer = () => {
    if (answer.trim()) {
      setMyAnswer(answer);
      setAnswered(true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-rose-600 tracking-tight flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 fill-rose-100" />
          Câu Hỏi Hôm Nay
        </h2>
        <p className="text-neutral-500">Mỗi ngày một câu hỏi để hiểu và yêu nhau nhiều hơn.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl shadow-rose-500/5 relative overflow-hidden border border-rose-100"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-transparent rounded-bl-full opacity-50" />
        
        <div className="relative z-10 text-center space-y-6">
          <Sparkles className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-2xl font-bold text-neutral-900 leading-snug">
            "{todayQuestion}"
          </h3>

          {!answered ? (
            <div className="space-y-4 pt-4">
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Câu trả lời của bạn..."
                className="w-full h-32 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 focus:ring-2 focus:ring-rose-200 transition-all font-medium text-neutral-800 resize-none outline-none"
              />
              <button 
                onClick={handleAnswer}
                className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> Gửi câu trả lời để mở khóa
              </button>
            </div>
          ) : (
            <div className="space-y-6 pt-4 text-left">
              <div className="p-6 bg-rose-50 rounded-2xl space-y-2 border border-rose-100">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest pl-1">Bạn</span>
                <p className="text-neutral-800 font-medium">{myAnswer}</p>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl space-y-2 border border-indigo-100 relative">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest pl-1">Người ấy</span>
                <p className="text-neutral-800 font-medium italic">"Chắc chắn là mùi hương của cậu rồi. Và cả cách cậu hay nhăn mặt khi cười nữa =))"</p>
                <div className="absolute top-4 right-4 bg-indigo-100 p-2 rounded-full text-indigo-600">
                  <Unlock className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

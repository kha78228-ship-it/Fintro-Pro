import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronLeft, ArrowRightLeft } from 'lucide-react';

const QUESTIONS = [
  { optionA: "Đi du lịch biển", optionB: "Đi khám phá núi rừng" },
  { optionA: "Chủ động nhắn tin trước", optionB: "Đợi người kia nhắn tin" },
  { optionA: "Ăn tại nhà hàng sang trọng", optionB: "Tự nấu ăn tại nhà" },
  { optionA: "Một buổi tối xem phim ở rạp", optionB: "Netflix & chill tại nhà" },
  { optionA: "Có khả năng đọc suy nghĩ", optionB: "Có khả năng tàng hình" },
  { optionA: "Nói lời yêu mỗi ngày", optionB: "Thể hiện tình yêu qua hành động" },
  { optionA: "Trễ hẹn 30 phút", optionB: "Đến sớm 30 phút" },
  { optionA: "Quà tặng đắt tiền", optionB: "Đồ handmade ý nghĩa" },
];

export default function WouldYouRather({ user, onExit }: { user?: any, onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [selections, setSelections] = useState<{ A: 'a' | 'b' | null, B: 'a' | 'b' | null }>({ A: null, B: null });
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B'>('A');
  const [showResult, setShowResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const handleSelect = (choice: 'a' | 'b') => {
    if (showResult) return;

    if (currentTurn === 'A') {
      setSelections({ ...selections, A: choice });
      setCurrentTurn('B');
    } else {
      const newSelections = { ...selections, B: choice };
      setSelections(newSelections);
      setShowResult(true);
      
      if (newSelections.A === newSelections.B) {
        setMatchCount(m => m + 1);
      }
    }
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelections({ A: null, B: null });
    setCurrentTurn('A');
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameFinished(true);
    }
  };

  const getOptionColor = (opt: 'a' | 'b') => {
    if (!showResult) return "bg-white hover:bg-neo-bg border-neo-dark";
    
    const isMatch = selections.A === selections.B;
    const isSelectedA = selections.A === opt;
    const isSelectedB = selections.B === opt;

    if (isMatch && isSelectedA) return "bg-[#8BC34A] text-white border-neo-dark ring-4 ring-[#8BC34A]/30";
    if (!isMatch && (isSelectedA || isSelectedB)) return "bg-[#E91E63] text-white border-neo-dark";
    
    return "bg-neutral-100 opacity-50 border-neo-dark";
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-neo-dark hover:text-neo-orange font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Sảnh Game
        </button>
        <div className="text-xl font-display font-bold text-neo-dark">Bạn Chọn Gì?</div>
        <div className="w-24"></div>
      </div>

      <div className="w-full max-w-2xl bg-neo-light border-4 border-neo-dark p-6 sm:p-10 shadow-[8px_8px_0_var(--color-neo-dark)] relative min-h-[500px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!gameFinished ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-3 mb-8">
                 <ArrowRightLeft className="w-8 h-8 text-neo-orange" />
                 <h2 className="text-2xl font-bold uppercase tracking-widest text-neo-dark">Lựa Chọn Bắt Buộc</h2>
              </div>

              {!showResult ? (
                 <div className="text-center font-bold text-lg mb-8 bg-neo-dark text-white px-6 py-2">
                   Lượt của: Người {currentTurn}
                 </div>
              ) : (
                 <div className="text-center font-bold text-xl mb-8 flex flex-col items-center">
                   {selections.A === selections.B ? (
                     <span className="text-[#8BC34A] bg-[#8BC34A]/10 px-4 py-2 border-2 border-[#8BC34A]">Tâm Linh Tương Thông!</span>
                   ) : (
                     <span className="text-[#E91E63] bg-[#E91E63]/10 px-4 py-2 border-2 border-[#E91E63]">Trái Dấu Mất Rồi!</span>
                   )}
                 </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 w-full items-stretch justify-center relative">
                 <button 
                   onClick={() => handleSelect('a')}
                   disabled={showResult}
                   className={`flex-1 min-h-[160px] border-4 p-6 transition-all duration-300 shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center text-center text-xl font-bold ${getOptionColor('a')}`}
                 >
                   {QUESTIONS[currentIndex].optionA}
                 </button>
                 
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-neo-orange rounded-full flex items-center justify-center font-black text-white border-4 border-neo-dark z-10 shadow-md">
                   VS
                 </div>
                 
                 <button 
                   onClick={() => handleSelect('b')}
                   disabled={showResult}
                   className={`flex-1 min-h-[160px] border-4 p-6 transition-all duration-300 shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center text-center text-xl font-bold ${getOptionColor('b')}`}
                 >
                   {QUESTIONS[currentIndex].optionB}
                 </button>
              </div>

              {showResult && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={nextQuestion}
                  className="mt-12 bg-neo-dark text-white font-bold px-8 py-3 uppercase tracking-widest hover:bg-neo-orange transition-colors"
                >
                  Câu Tiếp Theo
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center"
            >
              <HelpCircle className="w-24 h-24 text-neo-orange mb-6" />
              <h2 className="text-4xl font-display font-bold text-neo-dark mb-4">Kết Quả</h2>
              <p className="text-xl mb-8">
                Độ trùng khớp: <span className="text-4xl text-neo-orange font-bold font-display ml-2">{Math.round((matchCount / QUESTIONS.length) * 100)}%</span>
              </p>
              
              <div className="p-6 bg-neo-bg border-2 border-neo-dark mb-8 text-lg font-bold min-w-[300px]">
                {matchCount >= QUESTIONS.length * 0.8 
                  ? "Cực kỳ hợp cạ, chung suy nghĩ!" 
                  : matchCount >= QUESTIONS.length * 0.5 
                    ? "Cũng gọi là có nét tương đồng đó!" 
                    : "Trái dấu hoàn toàn. Bù trừ cho nhau chăng?"}
              </div>

              <button 
                onClick={onExit}
                className="bg-neo-dark text-white font-bold px-8 py-4 uppercase tracking-widest hover:bg-neo-orange transition-colors"
              >
                Về Sảnh Game
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

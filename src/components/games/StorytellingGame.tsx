import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronLeft, ChevronRight, PenTool, CheckCircle2 } from 'lucide-react';

const STORY_PROMPTS = [
  "Ngày xửa ngày xưa, tại một vương quốc bị lãng quên...",
  "Trong một thế giới mà mọi người đều có thể đọc được suy nghĩ, hai người...",
  "Một buổi sáng bình thường, tiếng chuông cửa reo lên và một gói hàng bí ẩn xuất hiện...",
  "Trên một chuyến tàu địa ngầm cũ kỹ, đèn điện đột ngột vụt tắt...",
];

export default function StorytellingGame({ user, onExit }: { user?: any, onExit: () => void }) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [storyNodes, setStoryNodes] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0); // 0 or 1
  const [currentInput, setCurrentInput] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setStoryNodes([prompt]);
    setCurrentTurn(0);
  };

  const handleAddNode = () => {
    if (currentInput.trim() === '') return;
    setStoryNodes([...storyNodes, currentInput]);
    setCurrentInput('');
    setCurrentTurn(currentTurn === 0 ? 1 : 0);
  };

  const handleFinish = () => {
    setIsFinished(true);
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
        <div className="text-xl font-display font-bold text-neo-dark">Truyền thuyết kết nối</div>
        <div className="w-24"></div>
      </div>

      <div className="w-full max-w-3xl bg-neo-light border-4 border-neo-dark p-6 sm:p-8 shadow-[8px_8px_0_var(--color-neo-dark)] flex flex-col h-[70vh] relative">
        <AnimatePresence mode="wait">
          {!selectedPrompt ? (
             <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1"
             >
                <div className="text-center mb-8">
                  <BookOpen className="w-16 h-16 text-neo-orange mx-auto mb-4" />
                  <h2 className="text-3xl font-display font-bold text-neo-dark mb-2">Chọn Câu Chuyện Mở Đầu</h2>
                  <p className="text-neo-dark/70">Mỗi người sẽ luân phiên viết tiếp một câu để tạo nên tác phẩm chung!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STORY_PROMPTS.map((prompt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSelectPrompt(prompt)}
                      className="text-left bg-white border-2 border-neo-dark p-6 hover:bg-neo-bg hover:-translate-y-1 transition-all shadow-[4px_4px_0_var(--color-neo-dark)]"
                    >
                      <PenTool className="w-5 h-5 text-neo-orange mb-3" />
                      <p className="font-bold text-neo-dark leading-relaxed">{prompt}</p>
                    </button>
                  ))}
                </div>
             </motion.div>
          ) : !isFinished ? (
            <motion.div
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto mb-4 p-4 border-2 border-neo-dark bg-white shadow-inner flex flex-col gap-4">
                 {storyNodes.map((node, idx) => (
                   <div key={idx} className={`p-4 border border-neo-dark max-w-[85%] ${idx === 0 ? 'bg-neo-bg self-center font-bold text-center' : idx % 2 === 1 ? 'bg-orange-50 self-end' : 'bg-blue-50 self-start'} shadow-sm`}>
                     <span className="text-xs font-bold text-neo-dark/50 block mb-1 uppercase">
                       {idx === 0 ? 'Mở đầu' : `Lượt ${idx}`}
                     </span>
                     <p className="text-lg">{node}</p>
                   </div>
                 ))}
              </div>

              <div className="bg-neo-bg p-4 border-2 border-neo-dark">
                <div className="flex items-center gap-2 mb-2 font-bold text-neo-dark">
                   Tới lượt: <span className="text-neo-orange">Người {currentTurn === 0 ? "A" : "B"}</span>
                </div>
                <div className="flex gap-2">
                  <textarea 
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Viết tiếp câu chuyện..."
                    className="flex-1 p-3 border-2 border-neo-dark bg-white resize-none h-20 focus:outline-none focus:ring-2 focus:ring-neo-orange"
                  />
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleAddNode}
                      disabled={currentInput.trim() === ''}
                      className="flex-1 bg-neo-dark text-white px-6 font-bold uppercase transition-colors hover:bg-neo-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Gửi
                    </button>
                    <button 
                      onClick={handleFinish}
                      className="bg-[#8BC34A] text-white px-6 py-2 font-bold uppercase hover:bg-[#7CB342] transition-colors border-2 border-neo-dark inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Kết Phim
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="finish"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col flex-1 items-center justify-center text-center py-8"
            >
              <h2 className="text-3xl font-display font-bold text-neo-dark mb-8">Cuốn Sách Kỷ Niệm</h2>
              <div className="bg-[#fcf8f2] border-l-8 border-l-neo-orange border-y-2 border-r-2 border-neo-dark p-8 md:p-12 mb-8 max-w-2xl text-left shadow-xl w-full">
                 <p className="text-xl font-display leading-loose text-neo-dark indent-8">
                   {storyNodes.join(" ")}
                 </p>
              </div>
              <button 
                onClick={onExit}
                className="bg-neo-dark text-white px-8 py-3 font-bold uppercase hover:bg-neo-orange transition-colors"
               >
                 Đóng Sách
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

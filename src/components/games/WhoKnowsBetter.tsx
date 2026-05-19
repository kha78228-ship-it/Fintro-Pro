import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Crown } from 'lucide-react';

const QUESTIONS = [
  "Câu trả lời nào đúng nhất về món ăn yêu thích của bạn?",
  "Địa điểm hẹn hò lý tưởng của bạn là ở đâu?",
  "Nếu có một ngày nghỉ, bạn muốn làm gì nhất?",
  "Bạn sợ con vật gì nhất?",
  "Đâu là bộ phim yêu thích của bạn?",
  "Kỷ niệm đáng nhớ nhất của hai người là gì?",
  "Bạn thích được tặng quà gì nhất trong ngày kỷ niệm?"
];

export default function WhoKnowsBetter({ user, onExit }: { user?: any, onExit: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [phase, setPhase] = useState<'answer' | 'reveal'>('answer');
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const handleNextQuestion = () => {
    if (currentInput.trim() === '') return;
    
    setAnswers({ ...answers, [currentQuestionIndex]: currentInput });
    setCurrentInput('');

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setPhase('reveal');
      setCurrentQuestionIndex(0);
    }
  };

  const handleScore = (isCorrect: boolean) => {
    if (isCorrect) setScore(score + 1);
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentInput('');
    setPhase('answer');
    setScore(0);
    setGameFinished(false);
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
        <div className="text-xl font-display font-bold text-neo-dark">Ai hiểu tôi hơn?</div>
        <div className="w-24"></div> {/* spacer */}
      </div>

      <div className="w-full max-w-2xl bg-neo-light border-4 border-neo-dark p-8 shadow-[8px_8px_0_var(--color-neo-dark)] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!gameFinished ? (
            <motion.div
              key={`${phase}-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <HeartHandshake className="w-16 h-16 text-neo-orange mb-2" />
              <div className="text-sm font-bold text-neo-dark/60 uppercase tracking-widest">
                Câu Hỏi {currentQuestionIndex + 1} / {QUESTIONS.length}
              </div>
              <h3 className="text-2xl font-bold text-neo-dark font-display min-h-[80px] flex items-center justify-center">
                {QUESTIONS[currentQuestionIndex]}
              </h3>

              {phase === 'answer' ? (
                <div className="w-full space-y-4">
                  <p className="text-neo-dark/70 italic">Người A trả lời trước...</p>
                  <input 
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-4 border-2 border-neo-dark bg-white font-medium focus:outline-none focus:ring-2 focus:ring-neo-orange transition-shadow"
                    onKeyDown={(e) => e.key === 'Enter' && handleNextQuestion()}
                  />
                  <button 
                    onClick={handleNextQuestion}
                    disabled={currentInput.trim() === ''}
                    className="w-full bg-neo-dark text-white p-4 font-bold uppercase tracking-wider hover:bg-neo-orange disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
                  >
                    Tiếp Tục <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <p className="text-neo-dark/70 italic">Người B đoán xem câu trả lời là gì!</p>
                  <div className="p-6 border-2 border-neo-dark border-dashed bg-white/50 text-xl font-bold">
                    Câu trả lời của người A: <span className="text-neo-orange">{answers[currentQuestionIndex]}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleScore(true)}
                      className="flex-1 bg-[#8BC34A] text-white p-4 font-bold border-2 border-neo-dark shadow-[4px_4px_0_var(--color-neo-dark)] hover:translate-y-1 hover:shadow-[2px_2px_0_var(--color-neo-dark)] transition-all flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Đoán đúng!
                    </button>
                    <button 
                     onClick={() => handleScore(false)}
                     className="flex-1 bg-[#E91E63] text-white p-4 font-bold border-2 border-neo-dark shadow-[4px_4px_0_var(--color-neo-dark)] hover:translate-y-1 hover:shadow-[2px_2px_0_var(--color-neo-dark)] transition-all"
                    >
                      Sai mất rồi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <Crown className="w-20 h-20 text-[#FFC107] mb-6 drop-shadow-[0_0_15px_rgba(255,193,7,0.5)]" />
              <h2 className="text-4xl font-display font-bold text-neo-dark mb-4">Hoàn Thành!</h2>
              <p className="text-xl font-medium mb-8">
                Bạn đoán đúng <span className="text-neo-orange text-3xl font-bold">{score}</span> / {QUESTIONS.length} câu.
              </p>
              
              <div className="p-6 bg-neo-bg border-2 border-neo-dark mb-8 text-lg font-bold">
                {score === QUESTIONS.length 
                  ? "Tuyệt vời! Hai bạn cực kỳ hiểu nhau!" 
                  : score >= QUESTIONS.length / 2 
                    ? "Rất khá! Các bạn hợp nhau lắm!" 
                    : "Có vẻ cần dành thêm thời gian trò chuyện cùng nhau nhé!"}
              </div>

              <div className="flex gap-4 w-full">
                 <button onClick={handleRestart} className="flex-1 border-2 border-neo-dark bg-white font-bold p-4 hover:bg-neo-bg transition-colors flex items-center justify-center gap-2">
                   <RotateCcw className="w-5 h-5" /> Chơi Lại
                 </button>
                 <button onClick={onExit} className="flex-1 bg-neo-dark text-white font-bold p-4 hover:bg-neo-orange transition-colors">
                   Sảnh Game
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

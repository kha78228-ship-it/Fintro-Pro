import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, RefreshCw } from 'lucide-react';

export default function DiscoveryDeck() {
  const [deck, setDeck] = useState([
    "Kỷ niệm đáng nhớ nhất của bạn về lần đầu tiên chúng mình gặp nhau là gì?",
    "Nếu chúng ta có thể chuyển đến sống ở bất kỳ đâu trên thế giới, bạn sẽ chọn nơi nào?",
    "Điều gì ở tôi lúc ban đầu khiến bạn ấn tượng nhất?",
    "Một thói quen kỳ quặc của bạn mà ít ai biết là gì?",
    "Bạn cảm thấy được yêu thương nhất khi tôi làm điều gì?",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.length);
    }, 200);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto h-[70vh] flex flex-col pt-10">
      <div className="text-center space-y-2 mb-8 shrink-0">
        <h2 className="text-3xl font-display font-bold text-violet-700 tracking-tight flex items-center justify-center gap-3">
          <Layers className="w-8 h-8 fill-violet-100" />
          Bộ Thẻ Khám Phá
        </h2>
        <p className="text-neutral-500">Kéo gần khoảng cách qua những câu hỏi sâu sắc khi hẹn hò.</p>
      </div>

      <div className="flex-1 relative w-full flex items-center justify-center perspective-[1000px]">
        <motion.div 
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full max-w-sm aspect-[3/4] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Mặt trước */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center justify-center border-4 border-white/20 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Layers className="w-16 h-16 text-white/50 mb-6 drop-shadow-md" />
            <h3 className="text-white font-bold tracking-widest uppercase text-xl drop-shadow-sm text-center">
              Chạm để mở thẻ
            </h3>
          </div>

          {/* Mặt sau */}
          <div 
            className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center justify-center text-center border overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
          >
            <p className="text-2xl font-bold font-display text-neutral-800 leading-snug">
              "{deck[currentIndex]}"
            </p>
          </div>
        </motion.div>
      </div>

      <div className="shrink-0 flex justify-center pb-8 mt-6">
         <button 
           onClick={handleNext}
           className="flex items-center gap-2 bg-neutral-100 px-6 py-3 rounded-full font-bold text-neutral-600 hover:bg-neutral-200 transition-colors shadow-sm"
         >
           <RefreshCw className="w-5 h-5" /> Đổi câu hỏi khác
         </button>
      </div>
    </div>
  );
}

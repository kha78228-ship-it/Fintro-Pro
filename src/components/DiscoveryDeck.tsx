import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, RefreshCw } from 'lucide-react';

export default function DiscoveryDeck() {
  const DISCOVERY_QUESTIONS = [
    // Kỷ niệm & Lãng mạn
    "Kỷ niệm đáng nhớ nhất của bạn về lần đầu tiên chúng mình gặp nhau là gì?",
    "Điều gì ở tôi lúc ban đầu khiến bạn ấn tượng nhất?",
    "Bạn nhận ra mình thích/yêu tôi từ khoảnh khắc nào?",
    "Bạn cảm thấy được yêu thương nhất khi tôi làm điều gì?",
    "Điều lãng mạn nhất mà tôi từng làm cho bạn là gì?",
    "Nụ hôn nào của chúng mình làm bạn nhớ nhất?",
    "Chuyến đi nào của hai đứa khiến bạn có nhiều cảm xúc nhất?",
    
    // Cặp đôi & Mối quan hệ
    "Nếu chúng ta có thể chuyển đến sống ở bất kỳ đâu trên thế giới, bạn sẽ chọn nơi nào?",
    "Điều gì ở mối quan hệ của chúng ta khiến bạn tự hào nhất?",
    "Bạn nghĩ điểm mạnh nhất và điểm yếu nhất của chúng ta (với tư cách là một cặp đôi) là gì?",
    "Có điều gì bạn luôn muốn làm cùng tôi nhưng chưa có cơ hội không?",
    "Theo bạn, điều gì quan trọng nhất để duy trì một tình yêu bền vững?",
    "Bạn nghĩ chúng ta cần cải thiện điều gì ở nhau?",
    "Bạn thích nhất những hoạt động nào khi chúng ta ở cạnh nhau?",

    // Cá nhân & Nội tâm
    "Một thói quen kỳ quặc của bạn mà ít ai biết là gì?",
    "Nỗi sợ lớn nhất của bạn ở thời điểm hiện tại là gì?",
    "Điều gì thường khiến bạn cảm thấy tự ti nhất?",
    "Lời khuyên tốt nhất mà bạn từng nhận được là gì?",
    "Bạn hối tiếc điều gì nhất trong quá khứ?",
    "Nếu có thể thay đổi một điều ở bản thân mình, bạn sẽ thay đổi điều gì?",
    "Bạn nghĩ bạn đã thay đổi như thế nào từ khi chúng ta yêu nhau?",
    
    // Tương lai
    "Hình dung về ngôi nhà tương lai của hai đứa, bạn nghĩ nó sẽ trông như thế nào?",
    "Mục tiêu lớn nhất của bạn trong 5 năm tới là gì?",
    "Khi về già, bạn nghĩ hai đứa mình sẽ sống như thế nào?",
    "Bạn có muốn một ngày nào đó hai đứa nuôi một con thú cưng không? Nếu có, đó là con gì?",
    "Bạn định nghĩa như thế nào là một cuộc sống 'đủ'?",

    // Ngẫu nhiên & Thú vị
    "Nếu ngày mai tận thế, bạn muốn chúng ta làm gì trong ngày hôm nay?",
    "Nếu tôi là một món ăn, bạn nghĩ tôi sẽ là món gì?",
    "Nếu chúng ta đổi chỗ cho nhau trong 1 ngày, bạn nghĩ điều gì sẽ là thử thách lớn nhất?",
    "Hành động nào của tôi đôi khi khiến bạn bực mình nhưng bạn không nói?",
    "Nếu bạn trúng xổ số 100 tỷ, việc đầu tiên bạn làm cho chúng ta là gì?",
    "Điều gì bạn từng tưởng chừng như không thể nhưng bạn đã làm được?"
  ];

  const [deck, setDeck] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Xáo trộn ngẫu nhiên câu hỏi khi vào trang
    const shuffled = [...DISCOVERY_QUESTIONS].sort(() => 0.5 - Math.random());
    setDeck(shuffled);
  }, []);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.length);
    }, 200);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto flex flex-col pt-8 pb-4">
      <div className="text-center space-y-2 mb-8 shrink-0">
        <h2 className="text-3xl font-display font-bold text-neutral-700 tracking-tight flex items-center justify-center gap-3">
          <Layers className="w-8 h-8 fill-neutral-100" />
          Bộ Thẻ Khám Phá
        </h2>
        <p className="text-neutral-500">Kéo gần khoảng cách qua những câu hỏi sâu sắc khi hẹn hò.</p>
      </div>

      <div className="relative w-full h-[400px] flex items-center justify-center" style={{ perspective: "1000px" }}>
        <motion.div 
          animate={{ rotateX: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full max-w-sm aspect-[3/4] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Mặt trước */}
          <div 
            className="absolute inset-0 bg-neo-bg rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center border-4 border-white/20 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <Layers className="w-16 h-16 text-white/50 mb-6 drop-shadow-md" />
            <h3 className="text-white font-bold tracking-widest uppercase text-xl drop-shadow-sm text-center">
              Chạm để mở thẻ
            </h3>
          </div>

          {/* Mặt sau */}
          <div 
            className="absolute inset-0 bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center text-center border overflow-y-auto"
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
           className="flex items-center gap-2 bg-neutral-100 px-6 py-3 rounded-3xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors shadow-sm"
         >
           <RefreshCw className="w-5 h-5" /> Đổi câu hỏi khác
         </button>
      </div>
    </div>
  );
}

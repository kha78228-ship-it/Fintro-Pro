import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Heart, Wallet, Users, MessageCircleQuestion } from 'lucide-react';

interface Slide {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const slides: Slide[] = [
  {
    title: "Chào mừng đến với Fintro ✕ Couple",
    description: "Nơi vun đắp tình yêu và quản lý tài chính cùng người ấy.",
    icon: <Heart className="w-20 h-20 text-white" />,
    color: "bg-neo-bg"
  },
  {
    title: "Tài chính thông minh",
    description: "Theo dõi chi tiêu, lập ngân sách và đạt mục tiêu tài chính cùng nhau.",
    icon: <Wallet className="w-20 h-20 text-white" />,
    color: "bg-neo-bg"
  },
  {
    title: "Kết nối yêu thương",
    description: "Trò chuyện, chia sẻ kỷ niệm và khám phá những điều thú vị về nhau.",
    icon: <Users className="w-20 h-20 text-white" />,
    color: "bg-neo-bg"
  }
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className={`w-40 h-40 rounded-full ${slides[currentSlide].color} flex items-center justify-center mb-10 shadow-2xl shadow-neutral-300`}>
            {slides[currentSlide].icon}
          </div>
          <h2 className="text-3xl font-display font-medium text-neutral-900 mb-4">{slides[currentSlide].title}</h2>
          <p className="text-neutral-500 text-lg max-w-sm leading-relaxed">{slides[currentSlide].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="px-8 pb-12 flex items-center justify-between">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div key={index} className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          ))}
        </div>
        <button 
          onClick={nextSlide}
          className="bg-neutral-900 text-white px-8 py-3.5 rounded-3xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          {currentSlide === slides.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

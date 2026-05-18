import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, HandHeart, MessageCircleHeart, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Rule {
  title: string;
  desc: string;
}

interface InteractiveExercise {
  id: number;
  title: string;
  desc: string;
  icon: JSX.Element;
  color: string;
  bg: string;
  content: string[];
  rules?: Rule[];
}

export default function RelationshipExercises() {
  const [selectedExercise, setSelectedExercise] = useState<InteractiveExercise | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const exercises: InteractiveExercise[] = [
    {
      id: 1,
      title: "Nghệ thuật lắng nghe chủ động",
      desc: "Học cách nghe để thấu hiểu, không phải nghe để trả lời.",
      icon: <MessageCircleHeart className="w-6 h-6 text-orange-500" />,
      color: "from-orange-500 to-orange-400",
      bg: "bg-orange-50",
      content: [
        "Người A sẽ chia sẻ cảm xúc hoặc một vấn đề quan trọng trong vòng 3 phút. Người B chỉ ngồi nghe, không phản hồi.",
        "Người B sẽ tóm tắt lại những gì người A vừa nói. Bắt đầu bằng: 'Theo anh/em hiểu thì...'",
        "Người A xác nhận xem người B đã hiểu đúng chưa. Nếu chưa, giải thích lại một cách nhẹ nhàng.",
        "Đổi vai và lặp lại quá trình trên."
      ]
    },
    {
      id: 2,
      title: "Giải quyết mâu thuẫn không làm tổn thương",
      desc: "Quy tắc 3 không khi cãi vã giúp giữ gìn mối quan hệ.",
      icon: <ShieldAlert className="w-6 h-6 text-orange-500" />,
      color: "from-orange-400 to-orange-500",
      bg: "bg-orange-50",
      rules: [
        { title: "Không đào bới quá khứ", desc: "Chỉ tập trung vào vấn đề hiện tại." },
        { title: "Không công kích cá nhân", desc: "Dùng cấu trúc câu 'Em/Anh cảm thấy... khi...' thay vì 'Anh/Cô luôn luôn...'." },
        { title: "Không bỏ đi đột ngột", desc: "Nếu quá căng thẳng, hãy xin tạm nghỉ 15 phút, nhưng hứa sẽ quay lại giải quyết." }
      ],
      content: [
        "Bước 1: Hai bạn cùng hứa sẽ tuân thủ 'Quy tắc 3 không'.",
        "Bước 2: Mỗi người viết ra giấy 1 điều hiện tại đang khiến mình khó chịu nhất (chỉ 1 điều).",
        "Bước 3: Lần lượt đọc lên và thảo luận dựa trên góc độ cảm xúc cá nhân.",
        "Bước 4: Cùng nhau đưa ra 1 giải pháp nhượng bộ ngay lập tức."
      ]
    },
    {
      id: 3,
      title: "5 Ngôn ngữ tình yêu",
      desc: "Khám phá cách bạn và người ấy muốn được yêu thương.",
      icon: <HandHeart className="w-6 h-6 text-teal-500" />,
      color: "from-teal-400 to-neutral-500",
      bg: "bg-teal-50",
      content: [
        "Cùng nhau tìm hiểu về 5 ngôn ngữ tình yêu: Lời yêu thương, Hành động chăm sóc, Quà tặng, Thời gian chất lượng, Tiếp xúc cơ thể.",
        "Mỗi người hãy tự xếp hạng 5 ngôn ngữ này theo mức độ quan trọng đối với bản thân.",
        "Chia sẻ bảng xếp hạng của mình cho đối phương.",
        "Cam kết trong tuần tới sẽ thực hiện 1 hành động thuộc 'Ngôn ngữ số 1' của người kia."
      ]
    }
  ];

  if (selectedExercise) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-0">
        <button 
          onClick={() => setSelectedExercise(null)}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-800 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${selectedExercise.bg}`}>
              {selectedExercise.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{selectedExercise.title}</h2>
              <p className="text-neutral-500">{selectedExercise.desc}</p>
            </div>
          </div>

          {selectedExercise.rules && (
            <div className="mb-8 p-4 bg-orange-50/50 rounded-3xl border border-orange-100 text-sm">
              <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Nguyên tắc bắt buộc:
              </h4>
              <ul className="space-y-2">
                {selectedExercise.rules.map((rule, idx) => (
                  <li key={idx} className="text-orange-900">
                    <strong className="font-semibold">{rule.title}:</strong> {rule.desc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="font-bold text-lg text-neutral-900 border-b border-neutral-100 pb-2">
              Tiến trình thực hành
            </h3>
            
            <div className="space-y-4">
              {selectedExercise.content.map((step, idx) => (
                <div 
                  key={idx}
                  className={`flex gap-4 p-4 rounded-3xl transition-all border ${
                    idx <= currentStep 
                      ? 'bg-neutral-50 border-neutral-200' 
                      : 'opacity-50 grayscale bg-white flex-row border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${
                    idx < currentStep ? 'bg-neutral-100 text-neutral-600' :
                    idx === currentStep ? 'bg-neutral-600 text-white shadow-md' :
                    'bg-neutral-100 text-neutral-400'
                  }`}>
                    {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${idx === currentStep ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {step}
                    </p>
                    {idx === currentStep && (
                      <button
                        onClick={() => setCurrentStep(prev => Math.min(selectedExercise.content.length, prev + 1))}
                        className="mt-4 px-6 py-2 bg-neutral-600 text-white text-sm font-bold rounded-3xl hover:bg-neutral-700 transition"
                      >
                        {idx === selectedExercise.content.length - 1 ? 'Hoàn thành bài tập' : 'Đã xong bước này'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {currentStep === selectedExercise.content.length && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 bg-neutral-50 rounded-3xl text-center border border-neutral-100"
              >
                <div className="w-16 h-16 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HandHeart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">Tuyệt vời!</h3>
                <p className="text-neutral-700 font-medium mb-6">
                  Các bạn vừa dành thời gian tuyệt vời để chăm sóc tình yêu của mình.
                </p>
                <button
                  onClick={() => {
                    setSelectedExercise(null);
                    setCurrentStep(0);
                  }}
                  className="px-6 py-2 bg-neutral-600 text-white rounded-3xl font-bold hover:bg-neutral-700 transition"
                >
                  Về danh sách bài tập
                </button>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-0">
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
            onClick={() => {
              setSelectedExercise(ex);
              setCurrentStep(0);
            }}
            className={`rounded-3xl p-6 border border-neutral-100 bg-white shadow-sm hover:shadow-xl transition-all cursor-pointer group`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${ex.bg} group-hover:scale-110 transition-transform`}>
              {ex.icon}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-tight">
              {ex.title}
            </h3>
            <p className="text-neutral-500 text-sm">
              {ex.desc}
            </p>
            <div className="mt-6 font-bold text-xs uppercase tracking-widest text-neutral-400 group-hover:text-neutral-600 transition-colors">
              Bắt đầu bài tập &rarr;
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Award, Play, ChevronLeft } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const DEFAULT_QUESTIONS = [
  { question: 'Lần đầu tiên hai người gặp nhau ở đâu?', options: ['Quán cà phê', 'Trường học/Chỗ làm', 'Qua mạng', 'Buổi tiệc'], correctIndex: 0 },
  { question: 'Sở thích chung lớn nhất của hai bạn là gì?', options: ['Xem phim', 'Du lịch', 'Ăn uống', 'Chơi game'], correctIndex: 2 },
  { question: 'Ai là người tỏ tình trước?', options: ['Bạn Nam', 'Bạn Nữ', 'Cả hai cùng lúc', 'Không ai nói ra'], correctIndex: 0 },
  { question: 'Món ăn yêu thích của người ấy?', options: ['Hải sản', 'Gà rán', 'Lẩu/Nướng', 'Đồ ngọt'], correctIndex: 2 },
  { question: 'Thói quen xấu nào của người ấy khiến bạn hay cằn nhằn nhất?', options: ['Ngủ nướng', 'Bừa bộn', 'Hay quên', 'Chơi game nhiều'], correctIndex: 1 },
  { question: 'Nơi nào là địa điểm hẹn hò lý tưởng nhất của hai người?', options: ['Bờ hồ/Biển', 'Nhà hàng sang trọng', 'Rạp chiếu phim', 'Ở nhà nấu ăn'], correctIndex: 0 },
  { question: 'Màu sắc yêu thích của người ấy?', options: ['Đen/Trắng', 'Xanh dương', 'Hồng/Đỏ', 'Vàng/Xanh lá'], correctIndex: 0 },
  { question: 'Điều gì ở người ấy làm bạn thấy tự hào nhất?', options: ['Sự nghiệp', 'Ngoại hình', 'Tính cách', 'Sự quan tâm'], correctIndex: 2 },
  { question: 'Khuyết điểm nào của bạn mà người ấy phải chịu đựng nhiều nhất?', options: ['Hay dỗi', 'Nói nhiều', 'Thiếu quyết đoán', 'Hay ghen'], correctIndex: 0 },
  { question: 'Dự định tương lai lớn nhất của hai bạn hiện tại là gì?', options: ['Kết hôn', 'Mua nhà/xe', 'Sinh con', 'Du lịch thế giới'], correctIndex: 1 },
];

export default function LoveQuizGame({ user, onExit }: { user?: any, onExit: () => void }) {
  const [customQuestions, setCustomQuestions] = useState<any[]>(() => {
      const saved = localStorage.getItem('__love_quiz_questions');
      return saved ? JSON.parse(saved) : [];
  });
  const questions = customQuestions.length > 0 ? customQuestions : DEFAULT_QUESTIONS;
  
  const [isManagingQuiz, setIsManagingQuiz] = useState(false);

  // Quiz State
  const [quizState, setQuizState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    localStorage.setItem('__love_quiz_questions', JSON.stringify(customQuestions));
  }, [customQuestions]);

  const startQuiz = () => {
    setQuizState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
  };

  const handleAnswer = (index: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(index);
    setIsAnswerRevealed(true);
    
    if (index === questions[currentQuestionIndex].correctIndex) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsAnswerRevealed(false);
      } else {
        setQuizState('finished');
        if (user) {
          const finalScore = score + (index === questions[currentQuestionIndex].correctIndex ? 1 : 0);
          addDoc(collection(db, `users/${user.uid}/notifications`), {
            type: 'entertainment',
            title: 'Kết quả trò chơi Tình yêu',
            description: `Bạn đã đạt ${finalScore}/${questions.length} điểm trong Bài kiểm tra mức độ thấu hiểu.`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            createdAt: Date.now()
          }).catch(console.error);
        }
      }
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <button 
          onClick={onExit}
          className="flex items-center gap-2 text-neutral-500 hover:text-orange-500 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Trở lại
        </button>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
        {quizState === 'idle' && (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-3xl font-display font-bold mb-3">Thử Ngay Mức Độ Thấu Hiểu</h3>
            <p className="text-neutral-500 max-w-md mb-8">Trò chơi 10 câu hỏi trắc nghiệm sẽ giúp bạn biết ai là người hiểu đối phương hơn.</p>
            <button 
              onClick={startQuiz}
              className="bg-neutral-900 text-white px-8 py-3.5 rounded-3xl font-bold shadow-xl shadow-neutral-900/20 hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Play className="w-5 h-5" fill="currentColor"/> Bắt đầu chơi ngay
            </button>
          </div>
        )}

        {quizState === 'playing' && (
          <div className="p-6 sm:p-10">
            <div className="flex justify-between items-center mb-8">
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-3xl font-bold text-sm">Câu {currentQuestionIndex + 1}/{questions.length}</span>
              <span className="font-bold text-neutral-500">Điểm: {score}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-display font-bold mb-8 text-neutral-800 min-h-[5rem]">
              {questions[currentQuestionIndex].question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {questions[currentQuestionIndex].options.map((option: string, idx: number) => {
                let btnStyle = "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-orange-300 hover:bg-orange-50";
                
                if (isAnswerRevealed) {
                  if (idx === questions[currentQuestionIndex].correctIndex) {
                    btnStyle = "bg-neutral-500 border-neutral-500 text-white shadow-lg shadow-neutral-500/30";
                  } else if (idx === selectedAnswer) {
                    btnStyle = "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30";
                  } else {
                    btnStyle = "bg-neutral-100 border-neutral-200 text-neutral-400 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerRevealed}
                    onClick={() => handleAnswer(idx)}
                    className={`text-left px-6 py-4 rounded-3xl border-2 font-semibold transition-all duration-300 ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      {option}
                      {isAnswerRevealed && idx === questions[currentQuestionIndex].correctIndex && <CheckCircle2 className="w-5 h-5" />}
                      {isAnswerRevealed && idx === selectedAnswer && idx !== questions[currentQuestionIndex].correctIndex && <XCircle className="w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {quizState === 'finished' && (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-white">
              <Award className="w-12 h-12 text-orange-500" />
            </div>
            <h3 className="text-4xl font-display font-black text-neutral-900 mb-2">
              {score}/{questions.length} Điểm
            </h3>
            <p className="text-lg text-neutral-500 mb-8 max-w-md">
              {score === questions.length ? 'Hoàn hảo! Dường như không có điều gì về người ấy mà bạn không biết.' :
               score >= (questions.length * 0.7) ? 'Cực giỏi! Hai bạn đúng là tâm đầu ý hợp.' :
               score >= (questions.length * 0.5) ? 'Cũng ổn đấy, nhưng hãy dành thời gian tìm hiểu nhau nhiều hơn nhé!' :
               'Ôi không... Bạn cần phạt một chầu dạo quanh phố để tâm sự thôi!'}
            </p>
            <button 
              onClick={startQuiz}
              className="bg-orange-500 text-white px-8 py-3.5 rounded-3xl font-bold shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Chơi lại lần nữa
            </button>
          </div>
        )}
        
        {/* Quiz Management Section */}
        {quizState === 'idle' && (
          <div className="mt-4 border-t border-neutral-100 p-6">
            <button onClick={() => setIsManagingQuiz(!isManagingQuiz)} className="text-orange-500 font-bold flex items-center gap-2">
  			      {isManagingQuiz ? <XCircle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
              {isManagingQuiz ? 'Đóng quản lý' : 'Tùy chỉnh câu hỏi'}
            </button>
            {isManagingQuiz && (
              <div className="mt-6 space-y-4 text-left">
                <h4 className="font-bold">Danh sách câu hỏi ({customQuestions.length}/10)</h4>
                {customQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 bg-neutral-50 p-3 rounded-3xl border">
                    <span className="flex-1 truncate">{q.question}</span>
                    <button onClick={() => setCustomQuestions(customQuestions.filter((_, idx) => idx !== i))} className="text-orange-500">X</button>
                  </div>
                ))}
                
                {customQuestions.length < 10 && (
                  <div className="space-y-2 pt-4 border-t">
                    <input id="new_ques" type="text" placeholder="Câu hỏi" className="w-full p-2 border rounded-3xl" />
                    <input id="opt1" type="text" placeholder="Đáp án 1" className="w-full p-2 border rounded-3xl" />
                    <input id="opt2" type="text" placeholder="Đáp án 2" className="w-full p-2 border rounded-3xl" />
                    <input id="opt3" type="text" placeholder="Đáp án 3" className="w-full p-2 border rounded-3xl" />
                    <input id="opt4" type="text" placeholder="Đáp án 4" className="w-full p-2 border rounded-3xl" />
                    <select id="corrOpt" className="w-full p-2 border rounded-3xl">
                      <option value="0">Đáp án 1 đúng</option>
                      <option value="1">Đáp án 2 đúng</option>
                      <option value="2">Đáp án 3 đúng</option>
                      <option value="3">Đáp án 4 đúng</option>
                    </select>
                    <button onClick={() => {
                        const q = (document.getElementById('new_ques') as HTMLInputElement).value;
                        const o = [
                            (document.getElementById('opt1') as HTMLInputElement).value,
                            (document.getElementById('opt2') as HTMLInputElement).value,
                            (document.getElementById('opt3') as HTMLInputElement).value,
                            (document.getElementById('opt4') as HTMLInputElement).value,
                        ];
                        const c = parseInt((document.getElementById('corrOpt') as HTMLSelectElement).value);
                        if (q && o.every(x => x)) {
                            setCustomQuestions([...customQuestions, {question: q, options: o, correctIndex: c}]);
                            (document.getElementById('new_ques') as HTMLInputElement).value = '';
                            if (user) {
                                addDoc(collection(db, `users/${user.uid}/notifications`), {
                                    type: 'love',
                                    title: 'Cập nhật bộ câu hỏi',
                                    description: `Bạn vừa thêm 1 câu hỏi mới vào Bài kiểm tra. Hãy nhớ mời người ấy vào làm nhé!`,
                                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                                    read: false,
                                    createdAt: Date.now()
                                }).catch(console.error);
                            }
                        }
                    }} className="block w-full bg-orange-500 text-white px-4 py-2 mt-4 rounded-3xl">Thêm câu hỏi</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

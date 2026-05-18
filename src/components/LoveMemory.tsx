import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Clock, Calendar } from 'lucide-react';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

export default function LoveMemory() {
  const [loveDate, setLoveDate] = useState(() => localStorage.getItem('__love_date') || '2023-01-01');
  const [marriageDate, setMarriageDate] = useState(() => localStorage.getItem('__marriage_date') || '');
  
  const [isEditingDates, setIsEditingDates] = useState(false);

  useEffect(() => {
    localStorage.setItem('__love_date', loveDate);
    if (marriageDate) localStorage.setItem('__marriage_date', marriageDate);
  }, [loveDate, marriageDate]);

  const calculateTime = (dateString: string) => {
    if (!dateString) return null;
    const start = new Date(dateString);
    const now = new Date();
    
    // Set time to midnight for accurate days calculation
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const years = differenceInYears(now, start);
    const startAfterYears = new Date(start);
    startAfterYears.setFullYear(start.getFullYear() + years);
    
    const months = differenceInMonths(now, startAfterYears);
    const startAfterMonths = new Date(startAfterYears);
    startAfterMonths.setMonth(startAfterYears.getMonth() + months);
    
    const days = differenceInDays(now, startAfterMonths);
    const totalDays = differenceInDays(now, start);

    return { years, months, days, totalDays };
  };

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
      }
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2 mb-8 pt-4">
        <h2 className="text-4xl font-display font-bold text-orange-600 tracking-tight flex items-center justify-center gap-3">
          <Heart className="w-10 h-10 fill-orange-500" />
          Góc Kỷ Niệm
        </h2>
        <p className="text-neutral-500 text-lg">Cùng nhau đếm ngược thanh xuân và thử tài thấu hiểu nhau.</p>
      </div>

      {/* Time Counters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-100/50 border border-orange-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Clock className="w-32 h-32" />
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold font-display text-neutral-800">Bộ đếm thời gian</h3>
          <button 
            onClick={() => setIsEditingDates(!isEditingDates)}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 px-3 py-1.5 bg-orange-50 rounded-3xl"
          >
            {isEditingDates ? 'Xong' : 'Chỉnh sửa ngày'}
          </button>
        </div>

        {isEditingDates && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid md:grid-cols-2 gap-4 mb-8 bg-neutral-50 p-4 rounded-3xl">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Ngày chính thức yêu nhau</label>
              <input type="date" value={loveDate} onChange={e => setLoveDate(e.target.value)} className="w-full p-2.5 rounded-3xl border border-neutral-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Ngày cưới (tuỳ chọn)</label>
              <input type="date" value={marriageDate} onChange={e => setMarriageDate(e.target.value)} className="w-full p-2.5 rounded-3xl border border-neutral-200 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          {/* Love Duration */}
          {loveDate && (
            <div className="bg-neo-bg rounded-3xl p-6 border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 mb-4 font-semibold uppercase tracking-wider text-sm">
                <Heart className="w-4 h-4 fill-orange-500" /> Đã yêu nhau
              </div>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black font-display text-orange-600 tracking-tight leading-none mb-2">
                  {calculateTime(loveDate)?.totalDays || 0}
                </span>
                <span className="text-orange-400 font-medium mb-4">Ngày</span>
                
                <div className="flex gap-4 text-center divide-x divide-orange-200 w-full justify-center">
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.years || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Năm</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.months || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Tháng</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.days || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Ngày</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marriage Duration */}
          {marriageDate ? (
            <div className="bg-neo-bg rounded-3xl p-6 border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-600 mb-4 font-semibold uppercase tracking-wider text-sm">
                <Calendar className="w-4 h-4" /> Đã chung một nhà
              </div>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black font-display text-neutral-600 tracking-tight leading-none mb-2">
                  {calculateTime(marriageDate)?.totalDays || 0}
                </span>
                <span className="text-neutral-400 font-medium mb-4">Ngày</span>
                
                <div className="flex gap-4 text-center divide-x divide-neutral-200 w-full justify-center">
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.years || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Năm</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.months || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Tháng</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.days || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Ngày</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500 font-medium max-w-xs">Chưa có thông tin ngày đăng ký kết hôn / ngày cưới.</p>
              <button onClick={() => setIsEditingDates(true)} className="mt-4 text-sm font-bold text-orange-500">Cập nhật ngay</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

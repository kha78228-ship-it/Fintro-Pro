import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Calendar as CalendarIcon, Info, Droplets, Users, Sparkles, Wind } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface CycleTrackerProps {
  user?: User | null;
}

export default function CycleTracker({ user }: CycleTrackerProps) {
  const [lastPeriod, setLastPeriod] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [shareWithFamily, setShareWithFamily] = useState<boolean>(true);
  const [periodReminderDays, setPeriodReminderDays] = useState<number>(2);
  const [ovulationReminderDays, setOvulationReminderDays] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // First load local data
      const saved = localStorage.getItem('__fintrack_cycle');
      let localData = null;
      if (saved) {
        try {
          localData = JSON.parse(saved);
          if (localData.lastPeriod) setLastPeriod(localData.lastPeriod);
          if (localData.cycleLength) setCycleLength(localData.cycleLength);
          if (localData.periodLength) setPeriodLength(localData.periodLength);
          if (localData.shareWithFamily !== undefined) setShareWithFamily(localData.shareWithFamily);
          if (localData.periodReminderDays !== undefined) setPeriodReminderDays(localData.periodReminderDays);
          if (localData.ovulationReminderDays !== undefined) setOvulationReminderDays(localData.ovulationReminderDays);
        } catch(e) {}
      }

      // Then attempt to sync from server if we are in a shared fund
      if (user) {
        try {
          const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
          const fundsSnap = await getDocs(q);
          if (!fundsSnap.empty) {
            const fundData = fundsSnap.docs[0].data();
            const myData = fundData.members?.[user.uid]?.cycleData;
            if (myData) {
              if (myData.lastPeriod) setLastPeriod(myData.lastPeriod);
              if (myData.cycleLength) setCycleLength(myData.cycleLength);
              if (myData.periodLength) setPeriodLength(myData.periodLength);
              if (myData.shareWithFamily !== undefined) setShareWithFamily(myData.shareWithFamily);
              if (myData.periodReminderDays !== undefined) setPeriodReminderDays(myData.periodReminderDays);
              if (myData.ovulationReminderDays !== undefined) setOvulationReminderDays(myData.ovulationReminderDays);
            }
          }
        } catch (error) {
          console.error("Error loading user cycle data", error);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    const data = {
      lastPeriod,
      cycleLength,
      periodLength,
      shareWithFamily,
      periodReminderDays,
      ovulationReminderDays
    };
    localStorage.setItem('__fintrack_cycle', JSON.stringify(data));
    
    if (user) {
      try {
        const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
        const fundsSnap = await getDocs(q);
        
        let updatedServer = false;
        for (const fDoc of fundsSnap.docs) {
           await updateDoc(fDoc.ref, {
             [`members.${user.uid}.cycleData`]: data
           });
           updatedServer = true;
        }

        if (updatedServer) {
          alert('Đã lưu thông tin lịch dâu và đồng bộ với Quỹ gia đình!');
        } else {
          alert('Đã lưu thông tin (chưa có nhóm gia đình để đồng bộ).');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `shared_funds`);
      }
    } else {
      alert('Đã lưu thông tin (chỉ lưu cục bộ vì chưa đăng nhập).');
    }
  };

  let nextPeriodDate = new Date();
  let ovulationDate = new Date();
  let isPredictable = false;

  const today = new Date();
  let currentDayOfCycle = 0;
  let currentPhaseInfo = { name: '', color: '', desc: '', icon: <Heart /> };

  if (lastPeriod && cycleLength > 0 && periodLength > 0) {
    const lastDate = new Date(lastPeriod);
    nextPeriodDate = addDays(lastDate, cycleLength);
    ovulationDate = addDays(nextPeriodDate, -14);
    isPredictable = true;

    // Calculate current phase
    const diff = differenceInDays(today, lastDate);
    if (diff >= 0) {
      currentDayOfCycle = diff % cycleLength;
    } else {
      currentDayOfCycle = (cycleLength - (Math.abs(diff) % cycleLength)) % cycleLength;
    }

    const ovulationStart = cycleLength - 14 - 2;
    const ovulationEnd = cycleLength - 14 + 2;

    if (currentDayOfCycle < periodLength) {
      currentPhaseInfo = { 
        name: 'Mùa Dâu Rụng', 
        color: 'from-orange-600 to-orange-700', 
        desc: 'Cần nghỉ ngơi, ủ ấm và ăn đồ ngọt!', 
        icon: <Droplets className="w-8 h-8 text-white drop-shadow-md" /> 
      };
    } else if (currentDayOfCycle >= ovulationStart && currentDayOfCycle <= ovulationEnd) {
      currentPhaseInfo = { 
        name: 'Cửa Sổ Trứng Rụng', 
        color: 'from-fuchsia-600 to-purple-700', 
        desc: 'Tăng cường dưỡng da, rạng rỡ và dễ thụ thai nhất!', 
        icon: <Sparkles className="w-8 h-8 text-white drop-shadow-md" /> 
      };
    } else if (currentDayOfCycle < ovulationStart) {
      currentPhaseInfo = { 
        name: 'Ngày Bình Yên (Nang Noãn)', 
        color: 'from-neutral-600 to-teal-700', 
        desc: 'Năng lượng dồi dào, tâm trạng tươi tắn chốt đơn!', 
        icon: <Wind className="w-8 h-8 text-white drop-shadow-md" /> 
      };
    } else {
      currentPhaseInfo = { 
        name: 'Ngày Chờ Đợi (Hoàng Thể)', 
        color: 'from-neutral-600 to-neutral-700', 
        desc: 'Dễ dỗi hờn, thèm ăn, cần được cưng chiều nha.', 
        icon: <Heart className="w-8 h-8 text-white drop-shadow-md" /> 
      };
    }
  }

  const daysUntilNext = isPredictable ? differenceInDays(nextPeriodDate, today) : 0;

  if (isLoading) return null;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-orange-600 tracking-tight flex items-center gap-3">
            <Heart className="w-8 h-8 fill-orange-100" />
            Lịch Dâu Chị Em
          </h2>
          <p className="text-neutral-500 mt-1">Nơi dự đoán ngày rụng dâu, rụng trứng và năng lượng hiện tại.</p>
        </div>
      </div>

      {isPredictable && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/10 bg-gradient-to-r ${currentPhaseInfo.color} relative overflow-hidden`}
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute left-0 bottom-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-col items-center justify-center shrink-0 w-32 h-32 rounded-full bg-white/10 border-4 border-white/30 bg-white/10 shadow-inner backdrop-blur-sm relative">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80 absolute top-4">Ngày</span>
              <span className="text-5xl font-display font-black leading-none mt-2">{currentDayOfCycle + 1}</span>
              <span className="text-xs font-medium text-white/80 absolute bottom-4">/{cycleLength}</span>
            </div>
            
            <div className="text-center md:text-left space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 bg-white/20 backdrop-blur-md mb-2">
                {currentPhaseInfo.icon}
              </div>
              <h3 className="text-2xl font-bold font-display drop-shadow-sm">{currentPhaseInfo.name}</h3>
              <p className="text-white/90 text-sm md:text-base drop-shadow-sm">{currentPhaseInfo.desc}</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Ngày tới tháng gần nhất</label>
              <input 
                type="date"
                value={lastPeriod}
                onChange={(e) => setLastPeriod(e.target.value)}
                className="w-full bg-orange-50 border-none rounded-3xl p-3 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-neutral-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Độ dài chu kỳ (ngày)</label>
              <input 
                type="number"
                value={cycleLength}
                min={20}
                max={45}
                onChange={(e) => setCycleLength(parseInt(e.target.value) || 0)}
                className="w-full bg-orange-50 border-none rounded-3xl p-3 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-neutral-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Số ngày rụng dâu (ngày)</label>
              <input 
                type="number"
                value={periodLength}
                min={1}
                max={15}
                onChange={(e) => setPeriodLength(parseInt(e.target.value) || 0)}
                className="w-full bg-orange-50 border-none rounded-3xl p-3 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-neutral-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Nhắc rụng dâu trước (ngày)</label>
              <input 
                type="number"
                value={periodReminderDays}
                min={0}
                max={7}
                onChange={(e) => setPeriodReminderDays(parseInt(e.target.value) || 0)}
                className="w-full bg-orange-50 border-none rounded-3xl p-3 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-neutral-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Nhắc rụng trứng trước (ngày)</label>
              <input 
                type="number"
                value={ovulationReminderDays}
                min={0}
                max={7}
                onChange={(e) => setOvulationReminderDays(parseInt(e.target.value) || 0)}
                className="w-full bg-orange-50 border-none rounded-3xl p-3 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-neutral-800"
              />
            </div>

            {user && (
              <label className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-3xl cursor-pointer hover:bg-orange-50 transition-colors">
                <input 
                  type="checkbox"
                  checked={shareWithFamily}
                  onChange={(e) => setShareWithFamily(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-900 flex items-center gap-1"><Users className="w-4 h-4 text-orange-500"/> Share cho "người ấy"</span>
                  <span className="text-xs text-neutral-500">Cho người trong nhóm gia đình biết để cưng chiều bạn hơn.</span>
                </div>
              </label>
            )}
            
            <button 
              onClick={handleSave}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-3xl transition-all shadow-md shadow-orange-500/20"
            >
              Lưu & Cập nhật Dữ Liệu
            </button>
          </div>

          <div className="bg-neo-bg rounded-3xl p-6 border border-orange-200 shadow-inner flex flex-col justify-center">
            {isPredictable ? (
              <div className="space-y-6 text-center">
                <div>
                  <p className="text-orange-600 font-semibold mb-1">Dự báo lần rớt dâu tiếp theo</p>
                  <p className="text-3xl font-display font-bold text-orange-900">
                    {format(nextPeriodDate, 'dd/MM/yyyy')}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-3xl text-orange-700 font-medium">
                    <CalendarIcon className="w-5 h-5 text-orange-500" />
                    <span>Còn {daysUntilNext} ngày nữa</span>
                  </div>
                </div>

                <div className="h-px bg-orange-200 w-2/3 mx-auto"></div>

                <div>
                  <p className="text-orange-600 font-semibold mb-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" /> Cửa sổ rụng trứng (Cẩn thận nha)
                  </p>
                  <p className="text-lg font-bold text-orange-900">
                    Khoảng {format(addDays(ovulationDate, -2), 'dd/MM')} - {format(addDays(ovulationDate, 2), 'dd/MM')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-orange-400">
                <Info className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Vui lòng điền đủ thông tin để xem dự báo</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      <div className="bg-white/50 backdrop-blur-sm border border-neutral-200 p-6 rounded-3xl text-sm leading-relaxed text-neutral-600 flex gap-4 items-start">
        <Info className="w-6 h-6 text-neutral-400 shrink-0" />
        <p>
          <strong>Lưu ý nhỏ:</strong> Dữ liệu đã lưu sẽ được đồng bộ cùng với Quỹ gia đình. Tuy nhiên, việc dự đoán chỉ mang tính chất tham khảo vui vẻ, không thay thế cho các tư vấn y khoa chuyên nghiệp đâu nhé.
        </p>
      </div>
    </div>
  );
}

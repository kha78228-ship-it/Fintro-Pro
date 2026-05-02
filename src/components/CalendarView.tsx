import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, differenceInDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Heart, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

interface CalendarViewProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  user?: User | null;
}

export default function CalendarView({ transactions, onDelete, user }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selection, setSelection] = useState<{start: Date, end: Date} | null>(null);
  const [familyCycles, setFamilyCycles] = useState<{uid: string, name: string, cycleData: any}[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  useEffect(() => {
    if (!user) return;
    const fetchCycles = async () => {
      try {
        const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
        const fundsSnap = await getDocs(q);
        
        let cycles: {uid: string, name: string, cycleData: any}[] = [];
        
        if (!fundsSnap.empty) {
          const fundData = fundsSnap.docs[0].data();
          const membersList = fundData.members || {};
          
          Object.entries(membersList).forEach(([uid, member]: [string, any]) => {
            const hasCycleData = member.cycleData;
            if (hasCycleData && (uid === user.uid || member.cycleData.shareWithFamily !== false)) {
              cycles.push({
                uid,
                name: uid === user.uid ? 'Bạn' : member.displayName || 'Thành viên',
                cycleData: member.cycleData
              });
            }
          });
        } else {
           const saved = localStorage.getItem('__fintrack_cycle');
           if (saved) {
             try {
               cycles.push({
                 uid: user.uid,
                 name: 'Bạn',
                 cycleData: JSON.parse(saved)
               });
             } catch(e) {}
           }
        }
        
        setFamilyCycles(cycles);
      } catch (error) {
        console.error("Error fetching family cycles", error);
      }
    };
    fetchCycles();
  }, [user]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number; list: Transaction[] }> = {};
    transactions.forEach(t => {
      if (!grouped[t.date]) {
        grouped[t.date] = { income: 0, expense: 0, list: [] };
      }
      grouped[t.date].list.push(t);
      if (t.type === TransactionType.INCOME) {
        grouped[t.date].income += t.amount;
      } else {
        grouped[t.date].expense += t.amount;
      }
    });
    return grouped;
  }, [transactions]);

  const selectedTransactions = useMemo(() => {
    if (!selection) return [];
    const trans: Transaction[] = [];
    const interval = eachDayOfInterval({ start: selection.start, end: selection.end });
    interval.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (transactionsByDate[dateStr]?.list) {
        trans.push(...transactionsByDate[dateStr].list);
      }
    });
    return trans;
  }, [selection, transactionsByDate]);

  const rangeTotals = useMemo(() => {
    return selectedTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += Math.abs(t.amount);
      return acc;
    }, { income: 0, expense: 0 });
  }, [selectedTransactions]);

  const getCycleWarningsForDay = (day: Date) => {
    const warnings: string[] = [];
    familyCycles.forEach(person => {
      if (!person.cycleData.lastPeriod) return;
      const lastP = parseISO(person.cycleData.lastPeriod);
      const cycleLen = person.cycleData.cycleLength || 28;
      const periodLen = person.cycleData.periodLength || 5;
      
      const diff = differenceInDays(day, lastP);
      
      if (diff >= 0) {
        const daysIntoCycle = diff % cycleLen;
        if (daysIntoCycle < periodLen) {
          warnings.push(person.name);
        }
      } else {
        let daysIntoCycle = (cycleLen - (Math.abs(diff) % cycleLen)) % cycleLen;
        if (daysIntoCycle < periodLen) {
          warnings.push(person.name);
        }
      }
    });
    return warnings;
  };

  const handleDayClick = (day: Date) => {
    if (!selection) {
      setSelection({ start: day, end: day });
    } else if (isSameDay(selection.start, selection.end)) {
      if (day < selection.start) {
        setSelection({ start: day, end: selection.start });
      } else {
        setSelection({ start: selection.start, end: day });
      }
    } else {
      setSelection({ start: day, end: day });
    }
  };

  const selectedDateWarnings = useMemo(() => {
    if (!selection) return [];
    const warningsSet = new Set<string>();
    const interval = eachDayOfInterval({ start: selection.start, end: selection.end });
    interval.forEach(day => {
      const dayWarnings = getCycleWarningsForDay(day);
      dayWarnings.forEach(w => warningsSet.add(w));
    });
    return Array.from(warningsSet);
  }, [selection, familyCycles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Lịch gia đình</h2>
          <p className="text-neutral-500 mt-1">Theo dõi chi tiêu và lịch trình, chu kỳ cho cả hai.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card p-6 sm:p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-neutral-900 capitalize">
              {format(currentDate, 'MMMM, yyyy', { locale: vi })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <button onClick={nextMonth} className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayData = transactionsByDate[dateStr];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const dayWarnings = getCycleWarningsForDay(day);

              const isSelected = selection && day >= startOfDay(selection.start) && day <= endOfDay(selection.end);
              const isSelectionStart = selection && isSameDay(day, selection.start);
              const isSelectionEnd = selection && isSameDay(day, selection.end);
              const isRangeView = selection && !isSameDay(selection.start, selection.end);

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`
                    flex flex-col items-center justify-start p-2 sm:p-3 rounded-2xl min-h-[5rem] sm:min-h-[6rem] transition-all relative
                    ${!isCurrentMonth ? 'opacity-30 grayscale' : 'opacity-100'}
                    ${isSelected 
                      ? isSelectionStart || isSelectionEnd 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 z-10' 
                        : 'bg-indigo-50 text-indigo-900 border-y border-indigo-100 rounded-none -mx-1 sm:-mx-2 px-3 sm:px-5' 
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900'}
                    ${today && !isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                    ${isSelectionStart && isRangeView ? 'rounded-r-none' : ''}
                    ${isSelectionEnd && isRangeView ? 'rounded-l-none' : ''}
                  `}
                >
                  <span className={`text-sm sm:text-base font-bold mb-1 sm:mb-2 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'text-white' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayData && (
                    <div className="mt-1 sm:mt-2 w-full space-y-0.5 sm:space-y-1">
                      {dayData.income > 0 && (
                        <div className={`text-[9px] sm:text-[10px] font-bold truncate text-center rounded px-1 py-0.5 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'bg-indigo-800/50 text-indigo-100 border border-indigo-500/30' : 'bg-emerald-100 text-emerald-700'}`}>
                          +{dayData.income >= 1000000 ? (dayData.income/1000000).toFixed(1) + 'M' : (dayData.income/1000).toFixed(0) + 'k'}
                        </div>
                      )}
                      {dayData.expense > 0 && (
                        <div className={`text-[9px] sm:text-[10px] font-bold truncate text-center rounded px-1 py-0.5 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'bg-indigo-800/50 text-indigo-100 border border-indigo-500/30' : 'bg-rose-100 text-rose-700'}`}>
                          -{dayData.expense >= 1000000 ? (dayData.expense/1000000).toFixed(1) + 'M' : (dayData.expense/1000).toFixed(0) + 'k'}
                        </div>
                      )}
                    </div>
                  )}

                  {dayWarnings.length > 0 && (
                    <div className="absolute top-2 right-2 flex gap-0.5">
                      {dayWarnings.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 shadow-sm"></div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Đã chọn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-indigo-500 p-0.5 ring-offset-1"></span> Hôm nay
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Ngày "dâu"
            </span>
            <span className="ml-auto flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md mb-[-4px]">
              Mẹo: Chọn 2 ngày để tạo khoảng thời gian
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 sm:p-8 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                {!selection 
                  ? 'Chọn ngày' 
                  : isSameDay(selection.start, selection.end)
                    ? format(selection.start, 'dd/MM/yyyy')
                    : `${format(selection.start, 'dd/MM')} - ${format(selection.end, 'dd/MM/yyyy')} 
                      (${differenceInDays(selection.end, selection.start) + 1} ngày)`
                }
              </h3>
              <p className="text-xs font-semibold text-neutral-400">Chi tiết khoảng thời gian</p>
            </div>
          </div>

          {selectedDateWarnings.length > 0 && (
            <div className="space-y-2 mb-2">
              {selectedDateWarnings.map((name, i) => (
                <div key={i} className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex gap-2 items-center">
                  <Heart className="w-5 h-5 fill-rose-200 text-rose-500 shrink-0" />
                  <span className="text-sm font-semibold">Tới mùa dâu rụng của {name} 🍓</span>
                </div>
              ))}
            </div>
          )}
          
          {selection && (rangeTotals.income > 0 || rangeTotals.expense > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">Tổng thu</p>
                <p className="text-sm font-bold text-emerald-700">+{rangeTotals.income.toLocaleString()}đ</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-0.5">Tổng chi</p>
                <p className="text-sm font-bold text-rose-700">-{rangeTotals.expense.toLocaleString()}đ</p>
              </div>
              <div className="col-span-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Số dư kỳ</span>
                <span className={`text-sm font-bold ${rangeTotals.income >= rangeTotals.expense ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(rangeTotals.income - rangeTotals.expense).toLocaleString()}đ
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {!selection ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400 font-medium text-sm">Bấm vào một ngày trên lịch để xem chi tiết.</p>
              </div>
            ) : selectedTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400 font-medium text-sm">Không có giao dịch nào trong thời gian này.</p>
              </div>
            ) : (
              // Group transactions by date
              Object.entries(
                selectedTransactions.reduce((acc, t) => {
                  const dateFormated = format(parseISO(t.date), 'dd/MM/yyyy');
                  if (!acc[dateFormated]) acc[dateFormated] = { transactions: [], income: 0, expense: 0 };
                  acc[dateFormated].transactions.push(t);
                  if (t.type === TransactionType.INCOME) acc[dateFormated].income += t.amount;
                  else acc[dateFormated].expense += Math.abs(t.amount);
                  return acc;
                }, {} as Record<string, { transactions: Transaction[], income: number, expense: number }>)
              ).sort((a,b) => {
                // simple sort reverse chronological based on the key assuming DD/MM/YYYY
                const [d1,m1,y1] = a[0].split('/');
                const [d2,m2,y2] = b[0].split('/');
                return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
              }).map(([dateStr, data]) => (
                <div key={dateStr} className="space-y-2">
                  <div className="flex justify-between items-center bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                    <span className="text-xs font-bold text-indigo-900">{dateStr}</span>
                    <div className="flex gap-2 text-[10px] font-bold">
                      {data.income > 0 && <span className="text-emerald-600">Thu: +{data.income.toLocaleString()}đ</span>}
                      {data.expense > 0 && <span className="text-rose-600">Chi: -{data.expense.toLocaleString()}đ</span>}
                    </div>
                  </div>
                  {data.transactions.map(t => (
                    <div key={t.id} className="group flex justify-between items-center p-3 sm:p-4 bg-neutral-50 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 rounded-2xl transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-neutral-900 text-sm truncate max-w-[140px] sm:max-w-[150px]">{t.description || 'Giao dịch'}</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-neutral-500">
                          {t.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`font-mono font-bold text-xs sm:text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-neutral-900'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}đ
                        </span>
                        {onDelete && (
                          confirmDeleteId === t.id ? (
                            <div className="flex items-center gap-1 opacity-100 bg-rose-50 p-1 rounded-lg ml-auto" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { onDelete(t.id); setConfirmDeleteId(null); }} className="p-1 sm:p-1.5 text-white bg-rose-500 hover:bg-rose-600 rounded-md transition-colors"><Check className="w-3 h-3 text-white" /></button>
                              <button onClick={() => setConfirmDeleteId(null)} className="p-1 sm:p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"><X className="w-3 h-3 text-rose-600" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(t.id);
                              }}
                              className="p-1.5 sm:p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 ml-auto"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, subDays, isToday, startOfWeek, endOfWeek, differenceInDays, parseISO, startOfDay, endOfDay, subYears, addYears, eachMonthOfInterval, startOfYear, endOfYear, isSameYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Heart, Check, X, ArrowUp, ArrowDown, MapPin, GraduationCap, Map, Users, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { useCurrency } from '../lib/CurrencyContext';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'school' | 'outing' | 'other' | 'anniversary';
  time: string;
}

interface CalendarViewProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  user?: User | null;
}

export default function CalendarView({ transactions, onDelete, user }: CalendarViewProps) {
  const { formatMoney } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'week'>('month');
  const [selection, setSelection] = useState<{start: Date, end: Date} | null>(null);
  const [familyCycles, setFamilyCycles] = useState<{uid: string, name: string, cycleData: any}[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sharedFundId, setSharedFundId] = useState<string | null>(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{title: string, type: 'school' | 'outing' | 'other' | 'anniversary', time: string}>({
     title: '', type: 'outing', time: '08:00'
  });

  const prevPeriod = () => {
    if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subYears(currentDate, 1));
  };
  const nextPeriod = () => {
    if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addYears(currentDate, 1));
  };

  useEffect(() => {
    if (!user) return;
    const fetchCyclesAndEvents = async () => {
      try {
        const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
        const fundsSnap = await getDocs(q);
        
        let cycles: {uid: string, name: string, cycleData: any}[] = [];
        
        // --- Fetch cycles ---
        if (!fundsSnap.empty) {
          const fundDoc = fundsSnap.docs[0];
          setSharedFundId(fundDoc.id);
          const fundData = fundDoc.data();
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
          
          // --- Fetch Events from couple_data ---
          const { doc, getDoc } = await import('firebase/firestore');
          const eventsDocSnap = await getDoc(doc(db, 'couple_data', `calendar_${fundDoc.id}`));
          if (eventsDocSnap.exists()) {
             setEvents(eventsDocSnap.data().events || []);
          }
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
           const savedEvents = localStorage.getItem('__family_events');
           if (savedEvents) {
              try { setEvents(JSON.parse(savedEvents)); } catch(e) {}
           }
        }
        
        setFamilyCycles(cycles);
      } catch (error) {
        console.error("Error fetching family cycles/events", error);
      }
    };
    fetchCyclesAndEvents();
  }, [user]);

  // Sync events
  useEffect(() => {
    if (sharedFundId) {
      import('firebase/firestore').then(({ setDoc, doc }) => {
         setDoc(doc(db, 'couple_data', `calendar_${sharedFundId}`), { events }, { merge: true }).catch(console.error);
      });
    } else {
      localStorage.setItem('__family_events', JSON.stringify(events));
    }
  }, [events, sharedFundId]);


  const days = useMemo(() => {
    if (viewMode === 'week') {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate, viewMode]);

  const months = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentDate]);

  const transactionsByMonth = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const monthStr = format(parseISO(t.date), 'yyyy-MM');
      if (!grouped[monthStr]) {
        grouped[monthStr] = { income: 0, expense: 0 };
      }
      if (t.type === TransactionType.INCOME) {
        grouped[monthStr].income += t.amount;
      } else {
        grouped[monthStr].expense += t.amount;
      }
    });
    return grouped;
  }, [transactions]);

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

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }, [events]);

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

  const selectedEvents = useMemo(() => {
    if (!selection) return [];
    const evs: CalendarEvent[] = [];
    const interval = eachDayOfInterval({ start: selection.start, end: selection.end });
    interval.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (eventsByDate[dateStr]) {
        evs.push(...eventsByDate[dateStr]);
      }
    });
    // Sort events by time
    return evs.sort((a,b) => a.time.localeCompare(b.time));
  }, [selection, eventsByDate]);

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

  const handleDayClick = (day: Date, e?: React.MouseEvent) => {
    if (!selection || !(e?.shiftKey)) {
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

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Fintro Pro//Shared Calendar//EN\n";
    const eventsToExport = selectedEvents.length > 0 ? selectedEvents : events;
    
    if (eventsToExport.length === 0) return;

    eventsToExport.forEach(e => {
        const [year, month, day] = e.date.split('-');
        const [hours, mins] = e.time.split(':');
        const startStr = `${year}${month}${day}T${hours}${mins}00`;
        const endH = (parseInt(hours) + 1).toString().padStart(2, '0');
        const endStr = `${year}${month}${day}T${endH}${mins}00`;

        icsContent += `BEGIN:VEVENT\n` + 
                      `DTSTART:${startStr}\n` + 
                      `DTEND:${endStr}\n` + 
                      `SUMMARY:${e.title}\n` + 
                      `END:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lich-gia-dinh.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Lịch gia đình</h2>
          <p className="text-neutral-500 mt-1">Theo dõi chi tiêu, sự kiện và chu kỳ cho cả hai.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportICS} className="flex items-center gap-2 px-4 py-2 bg-neutral-50 text-neutral-600 rounded-3xl font-semibold hover:bg-neutral-100 transition-all active:scale-95">
            <CalendarIcon className="w-5 h-5" />
            <span>Tải lịch (.ics)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-baseline gap-4 mb-6">
            <h3 
              className="text-xl font-bold text-neutral-900 capitalize"
            >
              {viewMode === 'month' ? format(currentDate, 'MMMM, yyyy', { locale: vi }) 
               : viewMode === 'week' ? `Tuần ${format(startOfWeek(currentDate, {weekStartsOn:1}), 'dd/MM')} - ${format(endOfWeek(currentDate, {weekStartsOn:1}), 'dd/MM/yyyy')}`
               : format(currentDate, 'yyyy', { locale: vi })}
            </h3>
            <div className="flex gap-2">
              <div className="flex bg-neutral-100 rounded-3xl p-1">
                 <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-semibold rounded-3xl transition-all active:scale-95 ${viewMode === 'week' ? 'bg-white shadow-sm text-neutral-600' : 'text-neutral-500 hover:text-neutral-700'}`}>Tuần</button>
                 <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-semibold rounded-3xl transition-all active:scale-95 ${viewMode === 'month' ? 'bg-white shadow-sm text-neutral-600' : 'text-neutral-500 hover:text-neutral-700'}`}>Tháng</button>
                 <button onClick={() => setViewMode('year')} className={`px-3 py-1 text-sm font-semibold rounded-3xl transition-all active:scale-95 ${viewMode === 'year' ? 'bg-white shadow-sm text-neutral-600' : 'text-neutral-500 hover:text-neutral-700'}`}>Năm</button>
              </div>
              <button onClick={prevPeriod} className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-3xl transition-all active:scale-95">
                <ChevronLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <button onClick={nextPeriod} className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-3xl transition-all active:scale-95">
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>

          {viewMode === 'month' || viewMode === 'week' ? (
            <>
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
                  const dayEvents = eventsByDate[dateStr];
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
                      onClick={(e) => handleDayClick(day, e)}
                      className={`
                        group flex flex-col items-center justify-start p-2 sm:p-3 rounded-3xl min-h-[5rem] sm:min-h-[6rem] transition-all relative
                        ${!isCurrentMonth && viewMode === 'month' ? 'opacity-30 grayscale' : 'opacity-100'}
                        ${isSelected 
                          ? isSelectionStart || isSelectionEnd 
                            ? 'bg-neutral-600 text-white shadow-lg shadow-neutral-200 z-10' 
                            : 'bg-neutral-50 text-neutral-900 border-y border-neutral-100 rounded-3xl -mx-1 sm:-mx-2 px-3 sm:px-5' 
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900'}
                        ${today && !isSelected ? 'ring-2 ring-neutral-500 ring-offset-2' : ''}
                        ${isSelectionStart && isRangeView ? 'rounded-3xl' : ''}
                        ${isSelectionEnd && isRangeView ? 'rounded-3xl' : ''}
                      `}
                    >
                      <span className={`text-sm sm:text-base font-bold mb-1 sm:mb-2 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'text-white' : ''}`}>
                         {format(day, 'd')}
                      </span>
                      
                      {dayData && (
                        <div className="flex gap-1 mb-1 justify-center">
                          {dayData.income > 0 && <ArrowUp className="w-3 h-3 text-neutral-600 bg-neutral-100 rounded-full p-0.5" />}
                          {dayData.expense > 0 && <ArrowDown className="w-3 h-3 text-orange-600 bg-orange-100 rounded-full p-0.5" />}
                        </div>
                      )}
                      
                      {dayEvents && (
                        <div className="flex flex-wrap gap-1 mb-1 justify-center max-w-full">
                           {dayEvents.map(e => (
                              <div key={e.id} className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-100 bg-orange-100 text-orange-600 flex items-center justify-center">
                                 {e.type === 'school' ? <GraduationCap className="w-2.5 h-2.5" /> : e.type === 'outing' ? <Map className="w-2.5 h-2.5" /> : e.type === 'anniversary' ? <Heart className="w-2.5 h-2.5 fill-orange-200 text-orange-500" /> : <MapPin className="w-2.5 h-2.5" />}
                              </div>
                           ))}
                        </div>
                      )}
                      
                      {dayData && (
                        <div className="mt-1 sm:mt-2 w-full space-y-0.5 sm:space-y-1">
                          {dayData.income > 0 && (
                            <div className={`text-[9px] sm:text-[10px] font-bold truncate text-center rounded px-1 py-0.5 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'bg-neutral-800/50 text-neutral-100 border border-neutral-500/30' : 'bg-neutral-100 text-neutral-700'}`}>
                              +{dayData.income >= 1000000 ? (dayData.income/1000000).toFixed(1) + 'M' : (dayData.income/1000).toFixed(0) + 'k'}
                            </div>
                          )}
                          {dayData.expense > 0 && (
                            <div className={`text-[9px] sm:text-[10px] font-bold truncate text-center rounded px-1 py-0.5 ${isSelected && (isSelectionStart || isSelectionEnd) ? 'bg-neutral-800/50 text-neutral-100 border border-neutral-500/30' : 'bg-orange-100 text-orange-700'}`}>
                              -{dayData.expense >= 1000000 ? (dayData.expense/1000000).toFixed(1) + 'M' : (dayData.expense/1000).toFixed(0) + 'k'}
                            </div>
                          )}
                        </div>
                      )}

                      {dayWarnings.length > 0 && (
                        <div className="absolute top-2 right-2 flex gap-0.5">
                          {dayWarnings.map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-3xl bg-orange-500 shadow-sm"></div>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelection({ start: day, end: day });
                          setShowEventForm(true);
                          setEditingEventId(null);
                          setEventForm({title: '', type: 'outing', time: '08:00'});
                        }}
                        className="hidden md:flex absolute top-1 left-1 w-6 h-6 items-center justify-center bg-white border border-neutral-200 text-neutral-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-100 hover:text-neutral-900 shadow-sm"
                        title="Thêm hoạt động"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
              {months.map((month, idx) => {
                const monthStr = format(month, 'yyyy-MM');
                const mData = transactionsByMonth[monthStr];
                const isCurrentMonth = isSameMonth(month, new Date());
                const isSelected = isSameYear(month, currentDate) && isSameMonth(month, currentDate);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentDate(month);
                      setViewMode('month');
                    }}
                    className={`
                      flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl min-h-[6rem] sm:min-h-[7rem] transition-all relative border
                      ${isSelected ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-50 hover:bg-neutral-100 border-transparent'}
                      ${isCurrentMonth ? 'ring-2 ring-neutral-500 ring-offset-2' : ''}
                    `}
                  >
                    <span className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${isSelected ? 'text-neutral-700' : 'text-neutral-900'}`}>
                      Th {format(month, 'M')}
                    </span>

                    {mData ? (
                      <div className="flex flex-col items-center gap-1 w-full mt-2">
                        {mData.income > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold text-neutral-600 truncate w-full text-center">
                            +{mData.income >= 1000000 ? (mData.income/1000000).toFixed(1) + 'M' : (mData.income/1000).toFixed(0) + 'k'}
                          </span>
                        )}
                        {mData.expense > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold text-orange-600 truncate w-full text-center">
                            -{mData.expense >= 1000000 ? (mData.expense/1000000).toFixed(1) + 'M' : (mData.expense/1000).toFixed(0) + 'k'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400 mt-2">-</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-3xl bg-neutral-600"></span> Đã chọn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-3xl ring-2 ring-neutral-500 p-0.5 ring-offset-1"></span> Hôm nay
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-3xl bg-orange-500"></span> Ngày "dâu"
            </span>
            <span className="ml-auto flex items-center bg-neutral-50 text-neutral-700 px-2 py-1 rounded-3xl mb-[-4px]">
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-600">
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
                <p className="text-xs font-semibold text-neutral-400">Giao dịch</p>
              </div>
            </div>
            {selection && (
              <button 
                onClick={() => setSelection(null)}
                className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-3xl transition-colors"
                title="Đóng chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {selectedDateWarnings.length > 0 && (
            <div className="space-y-2 mb-2">
              {selectedDateWarnings.map((name, i) => (
                <div key={i} className="p-3 bg-orange-50 border border-orange-100 text-orange-700 rounded-3xl flex gap-2 items-center">
                  <Heart className="w-5 h-5 fill-orange-200 text-orange-500 shrink-0" />
                  <span className="text-sm font-semibold">Tới mùa dâu rụng của {name} 🍓</span>
                </div>
              ))}
            </div>
          )}
          
          {selection && (rangeTotals.income > 0 || rangeTotals.expense > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div className="bg-neutral-50 rounded-3xl p-3 border border-neutral-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-0.5">Tổng thu</p>
                <p className="text-sm font-bold text-neutral-700">+{formatMoney(rangeTotals.income)}</p>
              </div>
              <div className="bg-orange-50 rounded-3xl p-3 border border-orange-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-0.5">Tổng chi</p>
                <p className="text-sm font-bold text-orange-700">-{formatMoney(rangeTotals.expense)}</p>
              </div>
              <div className="col-span-2 bg-neutral-50 rounded-3xl p-3 border border-neutral-100 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Số dư kỳ</span>
                <span className={`text-sm font-bold ${rangeTotals.income >= rangeTotals.expense ? 'text-neutral-600' : 'text-orange-600'}`}>
                  {formatMoney(rangeTotals.income - rangeTotals.expense)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {!selection ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400 font-medium text-sm">Bấm vào một ngày trên lịch để xem chi tiết.</p>
              </div>
            ) : (
              <>
                {/* Lịch trình/Events Section */}
                <div className="mb-4 space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="text-sm font-bold text-neutral-800">Hoạt động, Sự kiện</h4>
                     {!showEventForm && (
                        <button onClick={() => { setShowEventForm(true); setEditingEventId(null); setEventForm({title: '', type: 'outing', time: '08:00'}) }} className="text-xs font-semibold text-neutral-600 bg-neutral-50 px-2 py-1 rounded-3xl hover:bg-neutral-100">+ Thêm</button>
                     )}
                   </div>
                   
                   {showEventForm && (
                     <div className="bg-neutral-50 p-3 rounded-3xl border border-neutral-200 space-y-3">
                       <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="Tên hoạt động..." className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-3xl text-sm outline-none focus:border-neutral-500" />
                       <div className="flex gap-2">
                         <input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} className="bg-white border border-neutral-200 px-2 py-1.5 rounded-3xl text-sm outline-none" />
                         <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="flex-1 bg-white border border-neutral-200 px-2 py-1.5 rounded-3xl text-sm outline-none">
                            <option value="school">Đi học / Công việc</option>
                            <option value="outing">Đi chơi</option>
                            <option value="anniversary">Kỷ niệm / Quan trọng</option>
                            <option value="other">Khác</option>
                         </select>
                       </div>
                       <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowEventForm(false)} className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Hủy</button>
                          <button 
                            onClick={() => {
                               if(!eventForm.title) return;
                               if(editingEventId) {
                                  setEvents(events.map(e => e.id === editingEventId ? {...e, ...eventForm} : e));
                               } else {
                                  setEvents([...events, {id: Date.now().toString(), date: format(selection.start, 'yyyy-MM-dd'), ...eventForm}]);
                               }
                               setShowEventForm(false);
                            }} 
                            className="px-3 py-1.5 text-xs font-semibold bg-neutral-600 text-white rounded-3xl hover:bg-neutral-700"
                          >Lưu</button>
                       </div>
                     </div>
                   )}
                   
                   {selectedEvents.length === 0 && !showEventForm && (
                     <p className="text-xs text-neutral-400 italic">Chưa có lịch trình.</p>
                   )}
                   
                   {selectedEvents.map(e => (
                     <div key={e.id} className="group flex justify-between items-center p-3 bg-orange-50 rounded-3xl border border-orange-100 hover:border-orange-200 transition-colors">
                        <div className="flex gap-3 items-center">
                           <div className="w-10 h-10 bg-orange-100 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                              {e.type === 'school' ? <GraduationCap className="w-4 h-4" /> : e.type === 'outing' ? <Map className="w-4 h-4" /> : e.type === 'anniversary' ? <Heart className="w-4 h-4 fill-orange-200 text-orange-500" /> : <MapPin className="w-4 h-4" />}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-neutral-800">{e.title}</p>
                             <p className="text-xs text-neutral-500">{e.time}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEventForm({title: e.title, time: e.time, type: e.type}); setEditingEventId(e.id); setShowEventForm(true); }} className="text-xs text-neutral-600 hover:bg-neutral-50 p-1.5 rounded-3xl">Sửa</button>
                           <button onClick={() => setEvents(events.filter(ev => ev.id !== e.id))} className="text-xs text-orange-600 hover:bg-orange-50 p-1.5 rounded-3xl">Xóa</button>
                        </div>
                     </div>
                   ))}
                </div>
                
                {/* Giao dịch Section */}
                <h4 className="text-sm font-bold text-neutral-800 border-t border-neutral-100 pt-4">Giao dịch</h4>
                {selectedTransactions.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-neutral-400 font-medium text-sm">Không có giao dịch nào.</p>
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
              }).map(([dateStr, data]: [string, any]) => (
                <div key={dateStr} className="space-y-2">
                  <div className="flex justify-between items-center bg-neutral-50/50 px-3 py-1.5 rounded-3xl border border-neutral-100/50">
                    <span className="text-xs font-bold text-neutral-900">{dateStr}</span>
                    <div className="flex gap-2 text-[10px] font-bold">
                      {data.income > 0 && <span className="text-neutral-600">Thu: +{formatMoney(data.income)}</span>}
                      {data.expense > 0 && <span className="text-orange-600">Chi: -{formatMoney(data.expense)}</span>}
                    </div>
                  </div>
                  {data.transactions.map((t: any) => (
                    <div key={t.id} className="group flex justify-between items-center p-3 sm:p-4 bg-neutral-50 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 rounded-3xl transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-neutral-900 text-sm truncate max-w-[140px] sm:max-w-[150px]">{t.description || 'Giao dịch'}</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-neutral-500">
                          {t.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`font-mono font-bold text-xs sm:text-sm ${t.type === TransactionType.INCOME ? 'text-neutral-600' : 'text-orange-500'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'}{formatMoney(t.amount)}
                        </span>
                        {onDelete && (
                          confirmDeleteId === t.id ? (
                            <div className="flex items-center gap-1 opacity-100 bg-orange-50 p-1 rounded-3xl ml-auto" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { onDelete(t.id); setConfirmDeleteId(null); }} className="p-1 sm:p-1.5 text-white bg-orange-500 hover:bg-orange-600 rounded-3xl transition-colors"><Check className="w-3 h-3 text-white" /></button>
                              <button onClick={() => setConfirmDeleteId(null)} className="p-1 sm:p-1.5 text-orange-600 hover:bg-orange-100 rounded-3xl transition-colors"><X className="w-3 h-3 text-orange-600" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(t.id);
                              }}
                              className="p-1.5 sm:p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-3xl transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 ml-auto"
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
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect, memo } from 'react';
import { Transaction, TransactionType } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, subDays, isToday, startOfWeek, endOfWeek, differenceInDays, parseISO, startOfDay, endOfDay, subYears, addYears, eachMonthOfInterval, startOfYear, endOfYear, isSameYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Heart, Check, X, ArrowUp, ArrowDown, MapPin, GraduationCap, Map as MapIcon, Users, Plus, Copy, Link, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { useCurrency } from '../lib/CurrencyContext';
import { 
  getWorkspaceToken, 
  setWorkspaceToken, 
  connectWorkspace, 
  listCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent 
} from '../lib/workspaceServices';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'school' | 'outing' | 'other' | 'anniversary' | 'google';
  time: string;
  createdBy?: string;
  creatorName?: string;
  isGoogle?: boolean;
  googleId?: string;
  location?: string;
}

interface CalendarViewProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  user?: User | null;
  reducedMotion?: boolean;
}

const CalendarView = memo(({ transactions, onDelete, user, reducedMotion }: CalendarViewProps) => {
  const { formatMoney } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'week'>('month');
  const [selection, setSelection] = useState<{start: Date, end: Date} | null>(null);
  const [familyCycles, setFamilyCycles] = useState<{uid: string, name: string, cycleData: any}[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [sharedFundId, setSharedFundId] = useState<string | null>(null);

  // Google Calendar Integration states
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleToken, setGoogleToken] = useState<string | null>(getWorkspaceToken());
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [eventTarget, setEventTarget] = useState<'family' | 'google'>('family');
  const [newEventLocation, setNewEventLocation] = useState('');

  const fetchGoogleCalendarEvents = async (token: string) => {
    setIsGoogleLoading(true);
    try {
      const items = await listCalendarEvents(token);
      setGoogleEvents(items);
    } catch (err) {
      console.error('Error listing Google Calendar events:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      fetchGoogleCalendarEvents(googleToken);
    }
  }, [googleToken]);

  const handleConnectGoogle = async () => {
    setIsGoogleConnecting(true);
    try {
      const res = await connectWorkspace(['https://www.googleapis.com/auth/calendar']);
      if (res?.accessToken) {
        setGoogleToken(res.accessToken);
        setWorkspaceToken(res.accessToken, res.user);
        fetchGoogleCalendarEvents(res.accessToken);
      }
    } catch (err) {
      console.error('Connection to Google failed:', err);
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleToken(null);
    setWorkspaceToken(null);
    setGoogleEvents([]);
  };

  const handleRefreshGoogleEvents = () => {
    if (googleToken) {
      fetchGoogleCalendarEvents(googleToken);
    }
  };

  const handleDeleteGoogleEvent = async (googleEventId: string, title: string) => {
    if (!googleToken) return;
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}" khỏi Google Calendar?`);
    if (!confirmed) return;
    
    setIsGoogleLoading(true);
    try {
      await deleteCalendarEvent(googleToken, googleEventId);
      setGoogleEvents(prev => prev.filter(e => e.id !== googleEventId));
    } catch (err: any) {
      alert('Không thể xóa sự kiện Google: ' + err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const formattedGoogleEvents = useMemo(() => {
    return googleEvents.map(gev => {
      const startDateTime = gev.start?.dateTime || gev.start?.date || '';
      const dateStr = startDateTime ? startDateTime.substring(0, 10) : '';
      const timeStr = gev.start?.dateTime ? startDateTime.substring(11, 16) : '00:00';
      return {
        id: 'google_' + gev.id,
        googleId: gev.id,
        date: dateStr,
        title: gev.summary || 'Sự kiện Google',
        type: 'google' as const,
        time: timeStr,
        isGoogle: true,
        description: gev.description || '',
        location: gev.location || ''
      };
    });
  }, [googleEvents]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{title: string, type: 'school' | 'outing' | 'other' | 'anniversary' | 'google', time: string}>({
     title: '', type: 'outing', time: '08:00'
  });
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [copied, setCopied] = useState(false);

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
           const { doc, getDoc } = await import('firebase/firestore');
           const userEventsSnap = await getDoc(doc(db, 'users', user.uid));
           if (userEventsSnap.exists() && userEventsSnap.data().calendarEvents) {
              setEvents(userEventsSnap.data().calendarEvents || []);
           } else {
              const savedEvents = localStorage.getItem('__family_events');
              if (savedEvents) {
                 try { setEvents(JSON.parse(savedEvents)); } catch(e) {}
              }
           }
        }
        
        setFamilyCycles(cycles);
        setEventsLoaded(true);
      } catch (error) {
        console.error("Error fetching family cycles/events", error);
        setEventsLoaded(true);
      }
    };
    fetchCyclesAndEvents();
  }, [user]);

  // Sync events
  useEffect(() => {
    if (!user || !eventsLoaded) return;
    import('firebase/firestore').then(({ setDoc, doc }) => {
      if (sharedFundId) {
         setDoc(doc(db, 'couple_data', `calendar_${sharedFundId}`), { events }, { merge: true }).catch(console.error);
      } else {
         setDoc(doc(db, 'users', user.uid), { calendarEvents: events }, { merge: true }).catch(console.error);
      }
      localStorage.setItem('__family_events', JSON.stringify(events));
    });
  }, [events, sharedFundId, user, eventsLoaded]);


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

  const [filterType, setFilterType] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [filterCreator, setFilterCreator] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dateAsc');
  const [rightPanelTab, setRightPanelTab] = useState<'day' | 'all'>('day');

  const uniqueCreators = useMemo(() => {
    const creators = new Set<string>();
    events.forEach(e => {
      if (e.creatorName) {
        creators.add(e.creatorName);
      }
    });
    return Array.from(creators);
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    // 1. Filter by event type
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // 2. Filter by time (Upcoming vs Past vs This Month)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (filterTime === 'upcoming') {
      result = result.filter(e => e.date >= todayStr);
    } else if (filterTime === 'past') {
      result = result.filter(e => e.date < todayStr);
    } else if (filterTime === 'thisMonth') {
      const currentMonthStr = format(currentDate, 'yyyy-MM');
      result = result.filter(e => e.date.substring(0, 7) === currentMonthStr);
    }

    // 3. Filter by creator
    if (filterCreator !== 'all') {
      if (filterCreator === 'me') {
        result = result.filter(e => e.createdBy === user?.uid || !e.createdBy);
      } else if (filterCreator === 'others') {
        result = result.filter(e => e.createdBy && e.createdBy !== user?.uid);
      } else {
        result = result.filter(e => e.creatorName === filterCreator);
      }
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'dateAsc') {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      } else if (sortBy === 'dateDesc') {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      } else if (sortBy === 'titleAsc') {
        return a.title.localeCompare(b.title, 'vi');
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    return result;
  }, [events, filterType, filterTime, filterCreator, sortBy, user, currentDate]);

  const combinedEvents = useMemo(() => {
    return [...filteredAndSortedEvents, ...formattedGoogleEvents];
  }, [filteredAndSortedEvents, formattedGoogleEvents]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    combinedEvents.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return grouped;
  }, [combinedEvents]);

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
    // Sort events with selected sorting option for consistency in detail panel
    return evs.sort((a,b) => {
      if (sortBy === 'titleAsc') return a.title.localeCompare(b.title, 'vi');
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'dateDesc') {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      }
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [selection, eventsByDate, sortBy]);

  const rangeTotals = useMemo(() => {
    return selectedTransactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expense += Math.abs(t.amount);
      return acc;
    }, { income: 0, expense: 0 });
  }, [selectedTransactions]);

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

  const cycleWarningsByDate = useMemo(() => {
    const warnings: Record<string, {name: string, type: 'period' | 'ovulation' | 'period_reminder' | 'ovulation_reminder'}[]> = {};
    
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayWarnings: {name: string, type: 'period' | 'ovulation' | 'period_reminder' | 'ovulation_reminder'}[] = [];
      
      familyCycles.forEach(person => {
        if (!person.cycleData.lastPeriod) return;
        const lastP = parseISO(person.cycleData.lastPeriod);
        const cycleLen = person.cycleData.cycleLength || 28;
        const periodLen = person.cycleData.periodLength || 5;
        const periodRem = person.cycleData.periodReminderDays || 2;
        const ovuRem = person.cycleData.ovulationReminderDays || 2;
        
        const ovulationStart = cycleLen - 14 - 2;
        const ovulationEnd = cycleLen - 14 + 2;

        let diff = differenceInDays(day, lastP);
        let daysIntoCycle = 0;
        
        if (diff >= 0) {
          daysIntoCycle = diff % cycleLen;
        } else {
          daysIntoCycle = (cycleLen - (Math.abs(diff) % cycleLen)) % cycleLen;
        }

        if (daysIntoCycle < periodLen) {
          dayWarnings.push({ name: person.name, type: 'period' });
        } else if (daysIntoCycle >= cycleLen - periodRem) {
          dayWarnings.push({ name: person.name, type: 'period_reminder' });
        } else if (daysIntoCycle >= ovulationStart && daysIntoCycle <= ovulationEnd) {
          dayWarnings.push({ name: person.name, type: 'ovulation' });
        } else if (daysIntoCycle >= ovulationStart - ovuRem && daysIntoCycle < ovulationStart) {
          dayWarnings.push({ name: person.name, type: 'ovulation_reminder' });
        }
      });
      
      if (dayWarnings.length > 0) {
        warnings[dateStr] = dayWarnings;
      }
    });
    
    return warnings;
  }, [days, familyCycles]);

  const selectedDateWarnings = useMemo(() => {
    if (!selection) return [];
    const warningsMap = new Map<string, {name: string, type: 'period' | 'ovulation' | 'period_reminder' | 'ovulation_reminder'}>();
    const interval = eachDayOfInterval({ start: selection.start, end: selection.end });
    interval.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayWarnings = cycleWarningsByDate[dateStr] || [];
      dayWarnings.forEach(w => warningsMap.set(`${w.name}-${w.type}`, w));
    });
    return Array.from(warningsMap.values());
  }, [selection, cycleWarningsByDate]);

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

  const subscribeParams = sharedFundId ? `fundId=${sharedFundId}` : `userId=${user?.uid || ''}`;
  const subscribeUrl = `${window.location.protocol}//${window.location.host}/api/calendar/subscribe?${subscribeParams}`;
  const webcalUrl = `webcal://${window.location.host}/api/calendar/subscribe?${subscribeParams}`;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Lịch gia đình</h2>
          <p className="text-neutral-500 mt-1">Theo dõi chi tiêu, sự kiện và chu kỳ cho cả hai.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportICS} className="flex items-center gap-2 px-4 py-2 bg-neutral-50 text-neutral-600 rounded-3xl font-semibold hover:bg-neutral-100 transition-all active:scale-95">
            <CalendarIcon className="w-5 h-5" />
            <span>Tải lịch (.ics)</span>
          </button>
          <button onClick={() => setShowSubscribeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-3xl font-semibold hover:bg-neutral-800 transition-all active:scale-95">
            <Link className="w-5 h-5 text-neutral-300" />
            <span>Đăng ký lịch</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc & Sắp xếp */}
      <motion.div 
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-neutral-200 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block shrink-0">Bộ lọc</span>
          
          {/* Lọc loại sự kiện */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 rounded-2xl outline-none focus:ring-2 focus:ring-neutral-400 transition-all cursor-pointer"
          >
            <option value="all">📅 Tất cả loại sự kiện</option>
            <option value="school">🎓 Đi học / Công việc</option>
            <option value="outing">🚗 Đi chơi</option>
            <option value="anniversary">💖 Kỷ niệm / Quan trọng</option>
            <option value="other">📍 Khác</option>
          </select>

          {/* Lọc thời gian / Hết hạn */}
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 rounded-2xl outline-none focus:ring-2 focus:ring-neutral-400 transition-all cursor-pointer"
          >
            <option value="all">⏰ Tất cả thời gian</option>
            <option value="upcoming">🌟 Sắp diễn ra (Chưa qua)</option>
            <option value="past">⏳ Đã diễn ra / Quá hạn</option>
            <option value="thisMonth">📅 Trong tháng này</option>
          </select>

          {/* Lọc theo người tạo */}
          <select
            value={filterCreator}
            onChange={(e) => setFilterCreator(e.target.value)}
            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 rounded-2xl outline-none focus:ring-2 focus:ring-neutral-400 transition-all cursor-pointer"
          >
            <option value="all">👤 Người tạo: Tất cả</option>
            <option value="me">Tôi</option>
            <option value="others">Thành viên khác</option>
            {uniqueCreators.map((creator) => (
              <option key={creator} value={creator}>
                👤 {creator}
              </option>
            ))}
          </select>

          {/* Reset button */}
          {(filterType !== 'all' || filterTime !== 'all' || filterCreator !== 'all') && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterTime('all');
                setFilterCreator('all');
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-orange-50 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              Đặt lại lọc
            </button>
          )}
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block shrink-0">Sắp xếp</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-2 rounded-2xl outline-none focus:ring-2 focus:ring-neutral-400 transition-all cursor-pointer"
          >
            <option value="dateAsc">📅 Ngày tăng dần (Sắp tới trước)</option>
            <option value="dateDesc">📅 Ngày giảm dần (Mới nhất trước)</option>
            <option value="titleAsc">🔤 Tên sự kiện (A-Z)</option>
            <option value="type">🏷️ Theo loại sự kiện</option>
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
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

          {/* Google Calendar Sync Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-6 rounded-3xl bg-blue-50/50 border border-blue-100/60 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-neutral-800">Đồng bộ Google Calendar</h5>
                <p className="text-[11px] text-neutral-500 font-medium">Lập kế hoạch và xem lịch trình cá nhân / công việc trên cùng một lịch</p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center shrink-0">
              {isGoogleLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
              {googleToken ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã kết nối
                  </span>
                  <button 
                    onClick={handleRefreshGoogleEvents} 
                    disabled={isGoogleLoading}
                    className="px-3 py-1 text-xs font-bold text-neutral-600 bg-white border border-neutral-200 rounded-3xl hover:bg-neutral-50 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Làm mới
                  </button>
                  <button 
                    onClick={handleDisconnectGoogle} 
                    className="px-3 py-1 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-3xl transition-all"
                  >
                    Ngắt
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleConnectGoogle} 
                  disabled={isGoogleConnecting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-3xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {isGoogleConnecting ? 'Đang kết nối...' : 'Kết nối Lịch Google'}
                </button>
              )}
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
                  const dayWarnings = cycleWarningsByDate[dateStr] || [];

                  const isSelected = selection && day >= startOfDay(selection.start) && day <= endOfDay(selection.end);
                  const isSelectionStart = selection && isSameDay(day, selection.start);
                  const isSelectionEnd = selection && isSameDay(day, selection.end);
                  const isRangeView = selection && !isSameDay(selection.start, selection.end);

                  return (
                    <button
                      key={idx}
                      onClick={(e) => {
                        handleDayClick(day, e);
                        // Open event form if clicking on an empty day slot
                        if (!dayEvents && !dayData && !e.shiftKey) {
                          setShowEventForm(true);
                          setEditingEventId(null);
                          setEventForm({title: '', type: 'outing', time: '08:00'});
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelection({ start: day, end: day });
                        setShowEventForm(true);
                        setEditingEventId(null);
                        setEventForm({title: '', type: 'outing', time: '08:00'});
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('ring-2', 'ring-orange-400');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('ring-2', 'ring-orange-400');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('ring-2', 'ring-orange-400');
                        const eventId = e.dataTransfer.getData('text/plain');
                        if (eventId) {
                          setEvents(prev => prev.map(ev => 
                            ev.id === eventId ? { ...ev, date: dateStr } : ev
                          ));
                        }
                      }}
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
                              <div 
                                key={e.id} 
                                draggable={!e.isGoogle}
                                onDragStart={(evt) => {
                                  if (e.isGoogle) return;
                                  evt.dataTransfer.setData('text/plain', e.id);
                                  evt.stopPropagation();
                                }}
                                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center ${e.isGoogle ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-orange-100 text-orange-600'} ${!e.isGoogle ? 'cursor-move' : ''}`}
                                title={`${e.isGoogle ? '📅 (Lịch Google) ' : ''}${e.title}`}
                              >
                                 {e.isGoogle ? <CalendarIcon className="w-2.5 h-2.5 text-blue-500" /> : e.type === 'school' ? <GraduationCap className="w-2.5 h-2.5" /> : e.type === 'outing' ? <MapIcon className="w-2.5 h-2.5" /> : e.type === 'anniversary' ? <Heart className="w-2.5 h-2.5 fill-orange-200 text-orange-500" /> : <MapPin className="w-2.5 h-2.5" />}
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
                          {dayWarnings.map((w, i) => {
                            let color = 'bg-orange-500';
                            if (w.type === 'ovulation') color = 'bg-purple-500';
                            else if (w.type === 'period_reminder') color = 'bg-orange-300';
                            else if (w.type === 'ovulation_reminder') color = 'bg-purple-300';
                            return <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-3xl shadow-sm ${color}`}></div>;
                          })}
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
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0.2 } : { delay: 0.1 }}
          className="card p-6 sm:p-8 flex flex-col gap-4"
        >
          {/* Menu Tab chọn chế độ xem */}
          <div className="flex border-b border-neutral-100 pb-2">
            <button
              onClick={() => setRightPanelTab('day')}
              className={`flex-1 pb-2 text-xs sm:text-sm font-bold border-b-2 text-center transition-all ${
                rightPanelTab === 'day'
                  ? 'border-neutral-800 text-neutral-900 font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 font-semibold'
              }`}
            >
              🕒 Ngày đã chọn
            </button>
            <button
              onClick={() => setRightPanelTab('all')}
              className={`flex-1 pb-2 text-xs sm:text-sm font-bold border-b-2 text-center transition-all relative ${
                rightPanelTab === 'all'
                  ? 'border-neutral-800 text-neutral-900 font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 font-semibold'
              }`}
            >
              📋 Tất cả sự kiện
              {filteredAndSortedEvents.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-neutral-900 text-white rounded-full">
                  {filteredAndSortedEvents.length}
                </span>
              )}
            </button>
          </div>

          {rightPanelTab === 'day' ? (
            <div className="flex-1 flex flex-col gap-4">
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
                  {selectedDateWarnings.map((warning, i) => {
                    let icon = <Heart className="w-5 h-5 fill-orange-200 text-orange-500 shrink-0" />;
                    let text = `Tới mùa dâu rụng của ${warning.name} 🍓`;
                    let bgClass = "bg-orange-50 border-orange-100 text-orange-700";

                    if (warning.type === 'ovulation') {
                      text = `Đang trong cửa sổ rụng trứng của ${warning.name} ✨`;
                      bgClass = "bg-purple-50 border-purple-100 text-purple-700";
                      icon = <Heart className="w-5 h-5 fill-purple-200 text-purple-500 shrink-0" />;
                    } else if (warning.type === 'period_reminder') {
                      text = `Sắp tới mùa dâu rụng của ${warning.name} ⏰`;
                      bgClass = "bg-orange-50 border-orange-100 text-orange-600";
                      icon = <Heart className="w-5 h-5 text-orange-400 shrink-0" />;
                    } else if (warning.type === 'ovulation_reminder') {
                      text = `Sắp tới rụng trứng của ${warning.name} ⏰`;
                      bgClass = "bg-purple-50 border-purple-100 text-purple-600";
                      icon = <Heart className="w-5 h-5 text-purple-400 shrink-0" />;
                    }

                    return (
                      <div key={i} className={`p-3 border rounded-3xl flex gap-2 items-center ${bgClass}`}>
                        {icon}
                        <span className="text-sm font-semibold">{text}</span>
                      </div>
                    );
                  })}
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
                            <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="flex-1 bg-white border border-neutral-200 px-2 py-1.5 rounded-3xl text-sm outline-none" disabled={eventTarget === 'google'}>
                              <option value="school">Đi học / Công việc</option>
                              <option value="outing">Đi chơi</option>
                              <option value="anniversary">Kỷ niệm / Quan trọng</option>
                              <option value="other">Khác</option>
                            </select>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-neutral-100">
                            <div className="flex gap-4 items-center">
                              <span className="text-xs font-bold text-neutral-500">Lưu vào:</span>
                              <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                                <input type="radio" checked={eventTarget === 'family'} onChange={() => setEventTarget('family')} className="accent-neutral-700" />
                                <span>Lịch Gia đình</span>
                              </label>
                              {googleToken && (
                                <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                                  <input type="radio" checked={eventTarget === 'google'} onChange={() => setEventTarget('google')} className="accent-blue-600" />
                                  <span className="text-blue-600 font-bold flex items-center gap-0.5">Google Calendar</span>
                                </label>
                              )}
                            </div>
                            {eventTarget === 'google' && (
                              <input 
                                type="text" 
                                value={newEventLocation} 
                                onChange={e => setNewEventLocation(e.target.value)} 
                                placeholder="Địa điểm sự kiện (Tùy chọn)..." 
                                className="w-full bg-white border border-neutral-200 px-3 py-1.5 rounded-3xl text-xs outline-none focus:border-neutral-500" 
                              />
                            )}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowEventForm(false)} className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Hủy</button>
                            <button 
                              onClick={async () => {
                                if(!eventForm.title) return;
                                if (eventTarget === 'google' && googleToken) {
                                  setIsGoogleLoading(true);
                                  try {
                                    const startDateTimeStr = `${format(selection.start, 'yyyy-MM-dd')}T${eventForm.time}:00`;
                                    const timeParts = eventForm.time.split(':');
                                    let endHour = parseInt(timeParts[0]) + 1;
                                    let endMin = timeParts[1];
                                    if (endHour >= 24) {
                                      endHour = 23;
                                      endMin = '59';
                                    }
                                    const endDateTimeStr = `${format(selection.start, 'yyyy-MM-dd')}T${endHour.toString().padStart(2, '0')}:${endMin}:00`;
                                    
                                    await createCalendarEvent(googleToken, {
                                      summary: eventForm.title,
                                      location: newEventLocation,
                                      start: {
                                        dateTime: new Date(startDateTimeStr).toISOString(),
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                      },
                                      end: {
                                        dateTime: new Date(endDateTimeStr).toISOString(),
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                      }
                                    });
                                    setNewEventLocation('');
                                    setShowEventForm(false);
                                    fetchGoogleCalendarEvents(googleToken);
                                  } catch (err: any) {
                                    alert('Lỗi tạo sự kiện Google: ' + err.message);
                                  } finally {
                                    setIsGoogleLoading(false);
                                  }
                                } else {
                                  if(editingEventId) {
                                    setEvents(events.map(e => e.id === editingEventId ? {...e, ...eventForm} : e));
                                  } else {
                                    setEvents([...events, {
                                      id: Date.now().toString(), 
                                      date: format(selection.start, 'yyyy-MM-dd'), 
                                      ...eventForm,
                                      createdBy: user?.uid || 'local',
                                      creatorName: user?.displayName || user?.email?.split('@')[0] || 'Gia đình'
                                    }]);
                                  }
                                  setShowEventForm(false);
                                }
                              }} 
                              className="px-3 py-1.5 text-xs font-bold bg-neutral-800 text-white rounded-3xl hover:bg-neutral-900 transition-all active:scale-95"
                            >Lưu</button>
                          </div>
                        </div>
                      )}
                      
                      {selectedEvents.length === 0 && !showEventForm && (
                        <p className="text-xs text-neutral-400 italic text-center py-2">Chưa có lịch trình.</p>
                      )}
                      
                      {selectedEvents.map(e => {
                        if (e.isGoogle) {
                          return (
                            <div 
                              key={e.id} 
                              className="group flex justify-between items-center p-3 bg-blue-50/70 border border-blue-100 hover:border-blue-200 rounded-3xl transition-colors animate-fade-in"
                            >
                              <div className="flex gap-3 items-center min-w-0 flex-1">
                                <div className="w-10 h-10 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-neutral-800 truncate">{e.title}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                     <span className="text-[10px] text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded-3xl font-semibold">
                                        🕒 {e.time}
                                     </span>
                                     <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-3xl font-semibold">
                                        Google Calendar
                                     </span>
                                     {e.location && (
                                        <span className="text-[10px] text-neutral-500 max-w-[150px] truncate" title={e.location}>
                                           📍 {e.location}
                                        </span>
                                     )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 shrink-0">
                                <button 
                                  onClick={() => handleDeleteGoogleEvent(e.googleId, e.title)} 
                                  className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-3xl transition-all"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={e.id} 
                            draggable
                            onDragStart={(evt) => {
                              evt.dataTransfer.setData('text/plain', e.id);
                            }}
                            className="group flex justify-between items-center p-3 bg-orange-50 rounded-3xl border border-orange-100 hover:border-orange-200 transition-colors cursor-move"
                          >
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 bg-orange-100 rounded-full text-orange-600 flex items-center justify-center">
                                {e.type === 'school' ? <GraduationCap className="w-4 h-4 text-orange-600" /> : e.type === 'outing' ? <MapIcon className="w-4 h-4 text-orange-600" /> : e.type === 'anniversary' ? <Heart className="w-4 h-4 fill-orange-200 text-orange-500" /> : <MapPin className="w-4 h-4 text-orange-600" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-neutral-800">{e.title}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                   <span className="text-[10px] text-neutral-500 bg-neutral-200/55 px-1.5 py-0.5 rounded-3xl font-medium">
                                      🕒 {e.time}
                                   </span>
                                   {e.creatorName && (
                                      <span className="text-[10px] text-orange-600 bg-orange-100/30 border border-orange-100/50 px-1.5 py-0.5 rounded-3xl font-semibold">
                                         👤 {e.creatorName}
                                      </span>
                                   )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEventForm({title: e.title, time: e.time, type: e.type}); setEditingEventId(e.id); setEventTarget('family'); setShowEventForm(true); }} className="text-xs text-neutral-600 hover:bg-neutral-50 p-1.5 rounded-3xl">Sửa</button>
                              <button onClick={() => setEvents(events.filter(ev => ev.id !== e.id))} className="text-xs text-orange-600 hover:bg-orange-50 p-1.5 rounded-3xl">Xóa</button>
                            </div>
                          </div>
                        );
                      })}
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
                                <span className="text-[10px] sm:text-xs font-semibold text-neutral-500 border border-neutral-200/50 rounded-full px-2 py-0.5 bg-neutral-100/50 w-max text-center">
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
            </div>
          ) : (
            /* Tab: Tất cả sự kiện (Master list) */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-800">Tất cả lịch trình ({filteredAndSortedEvents.length})</h3>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Đã sắp xếp</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {filteredAndSortedEvents.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400">
                    <p className="font-semibold text-sm">Không có sự kiện nào khớp bộ lọc.</p>
                    <p className="text-xs text-neutral-400 mt-1">Điều chỉnh bộ lọc ở bên trên để xem thêm.</p>
                  </div>
                ) : (
                  filteredAndSortedEvents.map(e => {
                    let badgeBg = "bg-orange-50 border-orange-100 text-orange-600";
                    let icon = <MapPin className="w-4 h-4" />;
                    
                    if (e.type === 'school') {
                      badgeBg = "bg-blue-50 border-blue-100 text-blue-600";
                      icon = <GraduationCap className="w-4 h-4" />;
                    } else if (e.type === 'outing') {
                      badgeBg = "bg-emerald-50 border-emerald-100 text-emerald-600";
                      icon = <MapIcon className="w-4 h-4" />;
                    } else if (e.type === 'anniversary') {
                      badgeBg = "bg-pink-50 border-pink-100 text-pink-600";
                      icon = <Heart className="w-4 h-4 fill-pink-200 text-pink-500" />;
                    }

                    const eventDate = parseISO(e.date);

                    return (
                      <button
                        key={e.id}
                        onClick={() => {
                          setSelection({ start: eventDate, end: eventDate });
                          setCurrentDate(eventDate);
                          setRightPanelTab('day');
                        }}
                        className="w-full text-left p-3 rounded-3xl border transition-all flex items-start gap-3 bg-neutral-50 hover:bg-neutral-100 border-neutral-100 hover:border-neutral-200 group active:scale-[0.99]"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${badgeBg} border`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-800 truncate group-hover:text-black transition-colors">{e.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] text-neutral-500 bg-neutral-200/50 px-1.5 py-0.5 rounded-3xl font-bold">
                              📅 {format(eventDate, 'dd/MM/yyyy')}
                            </span>
                            <span className="text-[9px] text-neutral-500 bg-neutral-200/50 px-1.5 py-0.5 rounded-3xl font-bold">
                              🕒 {e.time}
                            </span>
                            {e.creatorName && (
                              <span className="text-[9px] text-orange-600 bg-orange-100/30 border border-orange-100/50 px-1.5 py-0.5 rounded-3xl font-semibold">
                                👤 {e.creatorName}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showSubscribeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-neutral-200 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-neutral-900 flex items-center gap-2">
                    <span>Đăng ký Lịch Gia Đình ⭐️</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">Đồng bộ lịch tự động về điện thoại hoặc máy tính của bạn.</p>
                </div>
                <button
                  onClick={() => setShowSubscribeModal(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Địa chỉ đăng ký (URL)</span>
                  <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl p-2 pl-3">
                    <input
                      type="text"
                      readOnly
                      value={subscribeUrl}
                      className="w-full text-xs font-mono text-neutral-600 bg-transparent outline-none border-none select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => handleCopyLink(subscribeUrl)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 bg-neutral-50/70 p-4 rounded-2xl text-xs font-medium text-neutral-600 border border-neutral-100">
                  <p className="font-bold text-neutral-800 border-b border-neutral-100 pb-1.5">Hướng dẫn thiết lập:</p>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold font-mono shrink-0">1.</span>
                    <p><strong>Google Calendar:</strong> Truy cập Google Calendar trực tuyến, ở thanh bên trái tìm mục <strong>"Lịch khác"</strong>, nhấn nút <strong>+</strong> rồi chọn <strong>"Từ URL"</strong> và dán liên kết bên trên vào.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-500 font-bold font-mono shrink-0">2.</span>
                    <p><strong>Lịch Apple (Mac & iPhone):</strong> Mở ứng dụng Lịch (Calendar) trên Mac hoặc iPhone, chọn <strong>"Thêm lịch đăng ký mới" (Add Subscribed Calendar...)</strong>, dán liên kết trên vào và thiết lập chu kỳ tự động cập nhật.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSubscribeModal(false)}
                    className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 text-sm font-semibold rounded-3xl hover:bg-neutral-50 transition-all active:scale-95"
                  >
                    Đóng
                  </button>
                  <a
                    href={webcalUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-3xl transition-all active:scale-95 shadow-lg shadow-neutral-900/10 text-center"
                  >
                    <CalendarIcon className="w-4 h-4 text-neutral-300" />
                    Đăng ký tự động
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CalendarView;

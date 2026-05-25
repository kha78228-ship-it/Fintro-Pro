import React, { useMemo, memo, useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import TransactionList from './TransactionList';
import { 
  ArrowRight, ShieldCheck, Clock, TrendingDown, Target, Wallet, Share2, Bell, 
  Sparkles, Heart, Calendar, ArrowDownToLine, Check, Bookmark, ChevronRight, 
  Plus, Gift, Cake, Star, Shirt, CalendarHeart, BookOpen, MessageSquareText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useCurrency } from '../lib/CurrencyContext';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';

interface DashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  setCurrentView: (view: any) => void;
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
  user?: any;
}

const Dashboard = memo(({ transactions, onDeleteTransaction, setCurrentView, appTheme = "vietnam", user }: DashboardProps) => {
  const { formatMoney } = useCurrency();
  const today = new Date();

  const [reminders, setReminders] = useState<any[]>([]);
  const [forgetMeNots, setForgetMeNots] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);

  const getForgetIcon = (type: string) => {
    switch(type) {
      case 'shirt': return <Shirt className="w-4 h-4 text-neutral-500" />;
      case 'gift': return <Gift className="w-4 h-4 text-rose-500" />;
      case 'cake': return <Cake className="w-4 h-4 text-amber-500" />;
      case 'calendar': return <CalendarHeart className="w-4 h-4 text-pink-500" />;
      case 'star': return <Star className="w-4 h-4 text-yellow-500 fill-yellow-100" />;
      default: return <Heart className="w-4 h-4 text-red-500 fill-red-100" />;
    }
  };

  const getForgetBadgeColor = (type: string) => {
    switch(type) {
      case 'shirt': return 'bg-neutral-50 text-neutral-600 border-neutral-100';
      case 'gift': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'cake': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'calendar': return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'star': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-red-50 text-red-600 border-red-105';
    }
  };

  useEffect(() => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) return;

    // Listen to Forget-Me-Nots in real time
    const forgetQ = query(
      collection(db, `users/${activeUser.uid}/forgetMeNots`),
      orderBy('createdAt', 'desc')
    );
    const unsubsForget = onSnapshot(forgetQ, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setForgetMeNots(items.slice(0, 4));
    }, err => console.warn("Error listening to forget me nots in dashboard:", err));

    // Listen to Diaries (using active connection path)
    let unsubsDiaries: (() => void) | null = null;
    const setupDiariesObserver = async () => {
      try {
        const fundsQ = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', activeUser.uid));
        const fundsSnap = await getDocs(fundsQ);
        let fundId = null;
        if (!fundsSnap.empty) {
          fundId = fundsSnap.docs[0].id;
        }
        const diariesRefStr = fundId ? `couple_data/${fundId}/diaries` : `users/${activeUser.uid}/diaries`;
        const diariesQ = query(collection(db, diariesRefStr), orderBy('date', 'desc'));
        
        unsubsDiaries = onSnapshot(diariesQ, (snap) => {
          const items: any[] = [];
          snap.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
          });
          setDiaries(items.slice(0, 3));
        }, err => console.warn("Error listening to diaries in dashboard:", err));
      } catch (err) {
        console.warn("Error setting up diaries observer in dashboard:", err);
      }
    };

    setupDiariesObserver();

    return () => {
      unsubsForget();
      if (unsubsDiaries) unsubsDiaries();
    };
  }, [user]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notifQuery = query(
      collection(db, `users/${currentUser.uid}/notifications`),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const active: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (['period_reminder', 'calendar_reminder', 'backup', 'event'].includes(data.type)) {
          active.push({
            id: doc.id,
            ...data
          });
        }
      });
      active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReminders(active.slice(0, 3));
    }, (err) => {
      console.warn("Error subscribing to dashboard reminders:", err);
    });

    return () => unsubscribe();
  }, []);
  
  const { todayExpense, weekExpense, monthExpense, yearExpense, totalIncome, totalGlobalExpense, balance } = useMemo(() => {
    const todayS = new Date(new Date().setHours(0, 0, 0, 0));
    const weekS = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
    const monthS = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const yearS = new Date(new Date().getFullYear(), 0, 1);

    const calcTotal = (startDate: Date) => transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startDate)
      .reduce((sum, t) => sum + t.amount, 0);

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    return {
      todayExpense: calcTotal(todayS),
      weekExpense: calcTotal(weekS),
      monthExpense: calcTotal(monthS),
      yearExpense: calcTotal(yearS),
      totalIncome: income,
      totalGlobalExpense: expense,
      balance: income - expense
    };
  }, [transactions]);

  const upcomingTransactions = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [transactions]);

  // 30 Days trend data for chart
  const dailyTrendData = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
      return {
        date: format(day, 'dd'),
        expense: dayTransactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0),
        income: dayTransactions
          .filter(t => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neo-bg border border-neo-dark p-3 shadow-[4px_4px_0_var(--color-neo-dark)]">
          <p className="text-xs font-bold text-neo-dark mb-2">Ngày {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1 text-xs">
              <span className="font-semibold text-neo-dark/70">
                {entry.dataKey === 'income' ? 'Thu' : 'Chi'}
              </span>
              <span className={`font-mono font-bold ${entry.dataKey === 'income' ? 'text-neutral-600' : 'text-orange-600'}`}>
                {formatMoney(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleShareSummary = async () => {
    const summaryText = `Báo Cáo Tài Chính Tổng Quan:
- Tổng Thu: ${formatMoney(totalIncome)}
- Tổng Chi: ${formatMoney(totalGlobalExpense)}
- Số Dư: ${formatMoney(balance)}
- Chi Tiêu Tháng Này: ${formatMoney(monthExpense)}
Hãy cùng nhau quản lý tài chính trên Fintro Pro!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tóm Tắt Ngân Sách - Fintro Pro',
          text: summaryText,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      // Fallback to mailto link
      const mailtoLink = `mailto:?subject=${encodeURIComponent('Tóm Tắt Ngân Sách - Fintro Pro')}&body=${encodeURIComponent(summaryText)}`;
      window.open(mailtoLink, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Vươn Mình / Tầm Nhìn Era Banner */}
      {appTheme === "vietnam" ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="w-full bg-neo-orange border border-neo-dark p-6 shadow-[6px_6px_0_var(--color-neo-dark)] relative overflow-hidden"
        >
          <div className="absolute right-[-10%] top-[-50%] w-[30vw] h-[30vw] min-w-[200px] min-h-[200px] rounded-3xl border-4 border-neo-light/20 z-0" />
          <div className="absolute right-[5%] bottom-[-20%] w-[10vw] h-[10vw] min-w-[100px] min-h-[100px] rounded-3xl bg-neo-light/10 z-0" />
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-medium text-neo-light uppercase tracking-tight mb-2">Việt Nam Kỷ Nguyên Vươn Mình</h2>
              <p className="text-xs md:text-sm font-sans font-bold tracking-widest text-neo-dark uppercase">Tầm Nhìn 2026</p>
            </div>
            <div className="border border-neo-dark bg-neo-light px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-neo-dark shadow-[2px_2px_0_var(--color-neo-dark)]">
              Tiên Phong
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="w-full bg-neo-dark border border-neo-dark p-6 shadow-[6px_6px_0_var(--color-neo-dark)] relative overflow-hidden"
        >
          <div className="absolute right-[-10%] top-[-50%] w-[30vw] h-[30vw] min-w-[200px] min-h-[200px] rounded-3xl border-4 border-neo-light/10 z-0" />
          <div className="absolute right-[5%] bottom-[-20%] w-[10vw] h-[10vw] min-w-[100px] min-h-[100px] rounded-3xl bg-neo-light/5 z-0" />
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-medium text-neo-light tracking-tight mb-2">Tầm Nhìn Chung</h2>
              <p className="text-xs md:text-sm font-sans font-bold tracking-[0.2em] text-neo-orange uppercase">Tương lai 2026</p>
            </div>
            <div className="border border-neo-dark bg-neo-light px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-neo-dark shadow-[2px_2px_0_var(--color-neo-dark)]">
              Lạc Quan
            </div>
          </div>
        </motion.div>
      )}

      {/* Live Sync alerts and notifications */}
      <AnimatePresence>
        <motion.div
          id="dashboard-live-reminders"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white border border-neutral-200 p-5 rounded-[2rem] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 tracking-wide">Nhắc nhở & Sự kiện gia đình</h3>
            </div>
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Đồng bộ thực
            </span>
          </div>

          {reminders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reminders.map((rem) => {
                let badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200/70";
                let icon = <Calendar className="w-3.5 h-3.5" />;
                let viewTarget = "calendar";

                if (rem.type === "period_reminder") {
                  badgeClass = "bg-rose-50 text-rose-700 border-rose-200/70";
                  icon = <Heart className="w-3.5 h-3.5 fill-rose-100" />;
                  viewTarget = "cycle";
                } else if (rem.type === "backup") {
                  badgeClass = "bg-cyan-50 text-cyan-700 border-cyan-200/70";
                  icon = <ArrowDownToLine className="w-3.5 h-3.5" />;
                  viewTarget = "settings";
                }

                return (
                  <motion.div
                    key={rem.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex flex-col justify-between p-4 bg-neutral-50/50 hover:bg-neutral-100/40 border border-neutral-150 rounded-2xl transition-all cursor-pointer group"
                    onClick={() => setCurrentView(viewTarget)}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {icon}
                          {rem.type === "period_reminder" ? "Chu kỳ sức khỏe" : rem.type === "backup" ? "Sao lưu Drive" : "Lịch trình đi chơi"}
                        </span>
                        <span className="text-[9px] font-semibold text-neutral-400 font-mono">{rem.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-800 line-clamp-1 group-hover:text-neutral-950">{rem.title}</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">{rem.description}</p>
                    </div>
                    <div className="mt-3 py-1.5 border-t border-neutral-100 flex justify-end">
                      <span className="text-[10px] font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-all">
                        Truy cập ngay <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100/60 flex items-center justify-center text-orange-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">Không có hoạt động khẩn cấp</h4>
                  <p className="text-[11px] text-neutral-500 font-medium font-sans">Lịch trình của gia đình bạn đều đang êm đẹp và đồng bộ 100%. Rất tốt lành! ✨</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView("calendar")}
                className="px-4 py-1.5 text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white rounded-3xl active:scale-95 transition-all text-center shrink-0 shadow-sm cursor-pointer"
              >
                Đặt lịch mới
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Top Section: Balance Card & Chart side-by-side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance Card (Bigger) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-neo-dark text-neo-light border border-neo-dark p-8 pb-10 relative overflow-hidden shadow-[8px_8px_0_var(--color-neo-dark)] flex flex-col justify-between group cursor-pointer"
          whileHover={{ scale: 1.01, rotate: -0.5 }}
          whileTap={{ scale: 0.99 }}
          style={{ minHeight: '320px' }}
        >
          <ShieldCheck className="absolute -right-6 top-0 w-64 h-64 text-neo-light/5 rotate-12 pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-8 text-neo-light/70">
              <Wallet className="w-5 h-5 text-neo-orange" />
              <h3 className="font-bold text-xs tracking-[0.2em] uppercase">Tổng Khả Dụng</h3>
            </div>
            
            <div className="text-4xl sm:text-5xl font-display font-medium tracking-tight mb-4 text-neo-light break-words">
              {formatMoney(balance)}
            </div>

            <div className="inline-block bg-neo-light/10 px-4 py-2 text-xs font-mono font-bold tracking-widest uppercase text-neo-orange mb-12">
              Tích lũy linh hoạt
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto border-t border-neo-light/20 pt-6">
            <div className="flex -space-x-3">
               <div className="w-10 h-10 rounded-full bg-neo-dark border border-neo-light flex items-center justify-center text-[10px] font-bold text-neo-light">U1</div>
               <div className="w-10 h-10 rounded-full bg-neo-dark border border-neo-light flex items-center justify-center text-[10px] font-bold text-neo-light">U2</div>
               <div className="w-10 h-10 rounded-full border border-neo-light flex items-center justify-center text-[10px] font-bold text-neo-light bg-neo-orange">+</div>
            </div>
            <div className="flex items-center gap-2">
              <button title="Chia sẻ báo cáo nhanh" onClick={handleShareSummary} className="w-12 h-12 flex items-center justify-center bg-neo-light/10 hover:bg-neo-orange transition-colors group">
                <Share2 className="w-5 h-5 text-neo-light group-hover:text-white" />
              </button>
              <button title="Lịch sử giao dịch" onClick={() => setCurrentView('history')} className="w-12 h-12 flex items-center justify-center bg-neo-light/10 hover:bg-neo-orange transition-colors group">
                <ArrowRight className="w-5 h-5 text-neo-light group-hover:text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-neo-bg border border-neo-dark p-6 shadow-[8px_8px_0_var(--color-neo-dark)] flex flex-col cursor-pointer group hover:bg-neutral-50 transition-colors"
          whileHover={{ scale: 1.01, rotate: 0.5 }}
          whileTap={{ scale: 0.99 }}
          style={{ minHeight: '320px' }}
        >
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold text-neo-dark uppercase tracking-widest pl-3 border-l-4 border-neo-orange">Biểu đồ Tháng Này</h3>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-neutral-500"/><span className="text-[10px] font-bold uppercase text-neo-dark/70 tracking-widest">Thu</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-orange-500"/><span className="text-[10px] font-bold uppercase text-neo-dark/70 tracking-widest">Chi</span></div>
             </div>
           </div>
           
           <div className="flex-1 w-full relative">
             {dailyTrendData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dailyTrendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} dy={10} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-neo-dark/30">Chưa có dữ liệu</div>
             )}
           </div>
        </motion.div>
      </div>

      {/* Grid Cards for metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hôm nay */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neo-bg border border-neo-dark p-5 shadow-[4px_4px_0_var(--color-neo-dark)] group"
        >
          <div className="w-10 h-10 border border-neo-dark bg-neo-light flex items-center justify-center mb-6 group-hover:bg-neo-orange group-hover:text-white transition-colors">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-neo-dark/60 tracking-[0.2em] uppercase mb-1">Hôm nay</p>
          <p className="text-lg font-display font-bold text-neo-dark">{formatMoney(todayExpense)}</p>
        </motion.div>

        {/* Tuần này */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neo-bg border border-neo-dark p-5 shadow-[4px_4px_0_var(--color-neo-dark)] group"
        >
          <div className="w-10 h-10 border border-neo-dark bg-neo-light flex items-center justify-center mb-6 group-hover:bg-neo-orange group-hover:text-white transition-colors">
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-neo-dark/60 tracking-[0.2em] uppercase mb-1">Tuần này</p>
          <p className="text-lg font-display font-bold text-neo-dark">{formatMoney(weekExpense)}</p>
        </motion.div>

        {/* Tháng này */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neo-bg border border-neo-dark p-5 shadow-[4px_4px_0_var(--color-neo-dark)] group bg-neo-light"
        >
          <div className="w-10 h-10 border border-neo-dark bg-neo-orange text-white flex items-center justify-center mb-6">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-neo-dark/60 tracking-[0.2em] uppercase mb-1 text-neo-orange">Tháng này</p>
          <p className="text-lg font-display font-bold text-neo-dark">{formatMoney(monthExpense)}</p>
        </motion.div>

        {/* Năm nay */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-neo-bg border border-neo-dark p-5 shadow-[4px_4px_0_var(--color-neo-dark)] group"
        >
          <div className="w-10 h-10 border border-neo-dark bg-neo-light flex items-center justify-center mb-6 group-hover:bg-neo-dark group-hover:text-white transition-colors">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-neo-dark/60 tracking-[0.2em] uppercase mb-1">Năm nay</p>
          <p className="text-lg font-display font-bold text-neo-dark">{formatMoney(yearExpense)}</p>
        </motion.div>
      </div>

      {/* Memory Lane & Forget-Me-Nots Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        {/* Widget 1: Forget-Me-Nots */}
        <motion.div
          id="dashboard-forget-me-notes"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-neutral-200 p-5 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-200/50">
                  <Bookmark className="w-4 h-4 fill-yellow-150" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800 tracking-wide">Nhớ Ghi Vụn Vặt (Forget-Me-Nots)</h3>
              </div>
              <button
                onClick={() => setCurrentView('forget_me_nots')}
                className="text-[11px] font-bold text-yellow-600 bg-yellow-50/50 hover:bg-yellow-100 border border-yellow-200/40 px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-0.5 active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" /> Chi tiết
              </button>
            </div>

            {forgetMeNots.length > 0 ? (
              <div className="space-y-2.5">
                {forgetMeNots.map((f) => (
                  <motion.div 
                    key={f.id} 
                    whileHover={{ scale: 1.01, x: 2 }}
                    className="flex items-center justify-between p-3 bg-neutral-50/40 hover:bg-neutral-100/30 rounded-2xl border border-neutral-150/70 cursor-pointer transition-colors"
                    onClick={() => setCurrentView('forget_me_nots')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-neutral-200/30 ${getForgetBadgeColor(f.iconType)}`}>
                        {getForgetIcon(f.iconType)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-800 line-clamp-1">{f.title}</p>
                        <p className="text-[11px] text-neutral-500 font-semibold">{f.value}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50/50 border border-dashed border-neutral-200/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center my-2">
                <div className="w-9 h-9 rounded-full bg-yellow-50/70 flex items-center justify-center text-yellow-500 mb-2">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-700">Chưa ghi nhận tiểu tiết</h4>
                <p className="text-[10px] text-neutral-400 mt-1 max-w-[210px] leading-relaxed font-medium">Hãy ghi lại các sở thích nhỏ của người ấy để trở nên thật tinh tế!</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-neutral-100 flex justify-between items-center text-[11px] text-neutral-400 font-medium">
            <span>Đã ghi chép: {forgetMeNots.length} tin nhanh</span>
            <span onClick={() => setCurrentView('forget_me_nots')} className="text-yellow-600 hover:text-yellow-700 font-bold cursor-pointer hover:underline">Quản lý &gt;</span>
          </div>
        </motion.div>

        {/* Widget 2: Recent Diaries Excerpts */}
        <motion.div
          id="dashboard-recent-diaries"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-neutral-200 p-5 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-200/50">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800 tracking-wide">Nhật Ký Yêu Thương (Recent Diaries)</h3>
              </div>
              <button
                onClick={() => setCurrentView('love_memory')}
                className="text-[11px] font-bold text-pink-600 bg-pink-50/50 hover:bg-pink-100 border border-pink-200/40 px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-0.5 active:scale-95 transition-all"
              >
                <Plus className="w-3 h-3" /> Viết mới
              </button>
            </div>

            {diaries.length > 0 ? (
              <div className="space-y-2.5">
                {diaries.map((d) => (
                  <motion.div
                    key={d.id}
                    whileHover={{ scale: 1.01, x: 2 }}
                    className="p-3 bg-neutral-50/40 hover:bg-neutral-100/30 rounded-2xl border border-neutral-150/70 cursor-pointer transition-all flex gap-3 items-center"
                    onClick={() => setCurrentView('love_memory')}
                  >
                    {d.photos && d.photos.length > 0 ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                        <img src={d.photos[0]} alt="Diary thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-pink-50/50 border border-pink-100 flex items-center justify-center text-pink-400 shrink-0">
                        <MessageSquareText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-neutral-800 line-clamp-1">{d.title}</h4>
                        <span className="text-[9px] font-semibold text-neutral-400 font-mono shrink-0">{d.date}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1 leading-relaxed font-sans">
                        {d.content || 'Không có mô tả chi tiết...'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50/50 border border-dashed border-neutral-200/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center my-2">
                <div className="w-9 h-9 rounded-full bg-pink-50/70 flex items-center justify-center text-pink-500 mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-neutral-700">Chưa có nhật ký</h4>
                <p className="text-[10px] text-neutral-400 mt-1 max-w-[210px] leading-relaxed font-medium">Hãy cùng lưu giữ dòng thời gian lãng mạn và xúc động cùng người ấy.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-neutral-100 flex justify-between items-center text-[11px] text-neutral-400 font-medium">
            <span>Dòng thời gian: {diaries.length} khoảnh khắc</span>
            <span onClick={() => setCurrentView('love_memory')} className="text-pink-600 hover:text-pink-700 font-bold cursor-pointer hover:underline">Xem thêm &gt;</span>
          </div>
        </motion.div>

      </div>

      {/* Upcoming Transactions */}
      {upcomingTransactions.length > 0 && (
        <motion.div
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="card p-6 shadow-sm"
        >
          <h3 className="text-lg font-display font-bold text-neo-dark mb-4">Sắp tới</h3>
          <div className="space-y-3">
            {upcomingTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-neo-light/30 border border-neo-dark/10 rounded-2xl">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${t.type === TransactionType.EXPENSE ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-600'}`}>
                       <Clock className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-neo-dark">{t.description}</p>
                       <p className="text-xs text-neo-dark/60">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
                     </div>
                   </div>
                   <p className={`text-sm font-bold font-mono tracking-tight ${t.type === TransactionType.INCOME ? 'text-neutral-600' : 'text-orange-500'}`}>
                     {t.type === TransactionType.INCOME ? '+' : '-'}{formatMoney(t.amount)}
                   </p>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <div className="space-y-8 mt-8">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-display font-bold text-neo-dark">Giao dịch gần đây</h3>
           <button onClick={() => setCurrentView('history')} className="text-sm font-bold text-neo-orange hover:opacity-80 transition-opacity flex items-center gap-1">Lịch sử đầy đủ <ArrowRight className="w-4 h-4" /></button>
        </div>
        <TransactionList 
          transactions={transactions.slice(0, 5)} 
          onDelete={onDeleteTransaction} 
        />
      </div>
    </div>
  );
});

export default Dashboard;

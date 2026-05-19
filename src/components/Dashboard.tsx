import React, { useMemo, memo } from 'react';
import { Transaction, TransactionType } from '../types';
import TransactionList from './TransactionList';
import { ArrowRight, ShieldCheck, Clock, TrendingDown, Target, Wallet, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useCurrency } from '../lib/CurrencyContext';

interface DashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  setCurrentView: (view: any) => void;
  appTheme?: "vintage" | "vietnam";
}

const Dashboard = memo(({ transactions, onDeleteTransaction, setCurrentView, appTheme = "vietnam" }: DashboardProps) => {
  const { formatMoney } = useCurrency();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const weekStart = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const getExpenseTotal = (startDate: Date) => {
    return transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startDate)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const todayExpense = getExpenseTotal(todayStart);
  const weekExpense = getExpenseTotal(weekStart);
  const monthExpense = getExpenseTotal(monthStart);
  const yearExpense = getExpenseTotal(yearStart);

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalGlobalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalGlobalExpense;

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

      {/* Upcoming Transactions */}
      {transactions.filter(t => new Date(t.date) > new Date()).length > 0 && (
        <motion.div
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100/50"
        >
          <h3 className="text-lg font-display font-bold text-neutral-900 mb-4">Sắp tới</h3>
          <div className="space-y-3">
            {transactions
              .filter(t => new Date(t.date) > new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3)
              .map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-3xl">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-3xl ${t.type === TransactionType.EXPENSE ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-600'}`}>
                       <Clock className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-neutral-900">{t.description}</p>
                       <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
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
           <h3 className="text-xl font-display font-bold text-neutral-900">Giao dịch gần đây</h3>
           <button onClick={() => setCurrentView('history')} className="text-sm font-bold text-neutral-600 hover:text-neutral-700 transition-colors flex items-center gap-1">Lịch sử đầy đủ <ArrowRight className="w-4 h-4" /></button>
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

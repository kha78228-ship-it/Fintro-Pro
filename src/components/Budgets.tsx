import React, { useState, useEffect, useMemo } from 'react';
import { Budget } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { 
  Target, 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle 
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/CurrencyContext';

interface BudgetsProps {
  transactions: any[];
  reducedMotion?: boolean;
}

export default function Budgets({ transactions, reducedMotion }: BudgetsProps) {
  const { formatMoney } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState({ categoryId: DEFAULT_CATEGORIES[0].id, amount: '' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/budgets`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b: Budget[] = [];
      snapshot.forEach(doc => b.push({ id: doc.id, ...doc.data() } as Budget));
      setBudgets(b);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const currentMonthStart = useMemo(() => {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }, []);

  const spentByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense' && new Date(t.date) >= currentMonthStart) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    
    return totals;
  }, [transactions, currentMonthStart]);

  // Overall Statistics for Budget Bento
  const budgetStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalRemaining = 0;
    let exceededCount = 0;
    let warningCount = 0; // >= 80% and < 100%

    budgets.forEach(b => {
      const spent = spentByCategory[b.categoryId] || 0;
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      totalBudget += b.amount;
      totalSpent += spent;
      totalRemaining += Math.max(b.amount - spent, 0);

      if (spent >= b.amount) {
        exceededCount++;
      } else if (percent >= 80) {
        warningCount++;
      }
    });

    const averagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      exceededCount,
      warningCount,
      averagePercent
    };
  }, [budgets, spentByCategory]);

  // Calculate day of the month elapsed info
  const dayProgressInfo = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDays - currentDay;
    const elapsedPercent = (currentDay / totalDays) * 100;
    return {
      currentDay,
      totalDays,
      daysRemaining,
      elapsedPercent
    };
  }, []);

  const getRecentCategoryTransactions = (categoryId: string) => {
    return transactions
      .filter(t => t.category === categoryId && t.type === 'expense' && new Date(t.date) >= currentMonthStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAddBudget = async () => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/budgets`;
    try {
      await addDoc(collection(db, path), {
        categoryId: newBudget.categoryId,
        amount: parseFloat(newBudget.amount),
        period: 'monthly',
        userId: auth.currentUser.uid
      });
      setIsAdding(false);
      setNewBudget({ categoryId: DEFAULT_CATEGORIES[0].id, amount: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/budgets/${id}`;
    try {
      await deleteDoc(doc(db, path));
      if (expandedBudgetId === id) {
        setExpandedBudgetId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur border border-neutral-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            Ngân sách hàng tháng
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full border border-neutral-200">
              Tháng {new Date().getMonth() + 1}
            </span>
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Thiết lập giới hạn để quản lý tốc độ và kỷ luật chi tiêu cá nhân</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm font-bold py-3 px-5 bg-neutral-900 text-white rounded-3xl shadow-md hover:bg-neutral-800 transition-all cursor-pointer select-none active:scale-95 shrink-0"
        >
          {isAdding ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
          {isAdding ? 'Hủy bỏ' : 'Thêm ngân sách'}
        </button>
      </div>

      {/* Bento Grid Stats Card Bar */}
      {budgets.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-neutral-400" />
              Tổng ngân sách
            </span>
            <div className="mt-2.5">
              <p className="text-lg sm:text-2xl font-black text-neutral-900 leading-tight">{formatMoney(budgetStats.totalBudget)}</p>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500 mt-1 leading-none">
                Chi tiêu tháng {new Date().getMonth() + 1}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
              Đã chi tiêu
            </span>
            <div className="mt-2.5">
              <p className="text-lg sm:text-2xl font-black text-orange-600 leading-tight">
                {formatMoney(budgetStats.totalSpent)}
              </p>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500 mt-1">
                Chiếm {budgetStats.averagePercent.toFixed(0)}% quỹ mục tiêu
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Quỹ còn lại
            </span>
            <div className="mt-2.5">
              <p className="text-lg sm:text-2xl font-black text-emerald-600 leading-tight">
                {formatMoney(budgetStats.totalRemaining)}
              </p>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500 mt-1 leading-none">
                Có thể chi tới cuối tháng
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
              Sức khỏe tài chính
            </span>
            <div className="mt-2.5">
              <div className="flex items-center gap-2">
                {budgetStats.exceededCount > 0 ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {budgetStats.exceededCount} Vượt mua
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    An toàn
                  </span>
                )}
                {budgetStats.warningCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                    {budgetStats.warningCount} Sắp chạm
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-2 leading-tight">
                Tháng trôi qua {dayProgressInfo.elapsedPercent.toFixed(0)}% ({dayProgressInfo.daysRemaining} ngày còn lại)
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add New Budget view */}
      {isAdding && (
        <motion.div 
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -20 }}
          className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-neutral-900/5 border border-neutral-200 space-y-8 relative overflow-hidden"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-display text-neutral-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Thiết lập Ngân sách mới
            </h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-neutral-50 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">1. Chọn danh mục áp dụng</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {DEFAULT_CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(c => {
                  const isAlreadyBudgeted = budgets.some(b => b.categoryId === c.id);
                  const IconComp = (LucideIcons as any)[c.icon || 'HelpCircle'] || LucideIcons.HelpCircle;
                  return (
                    <button
                      key={c.id}
                      disabled={isAlreadyBudgeted}
                      onClick={() => setNewBudget({...newBudget, categoryId: c.id})}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${newBudget.categoryId === c.id ? 'bg-neutral-900 border-neutral-900 shadow-md text-white' : isAlreadyBudgeted ? 'bg-neutral-50/50 border-neutral-100 text-neutral-300 cursor-not-allowed grayscale' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 cursor-pointer active:scale-95'} border`}
                    >
                      <IconComp className="w-6 h-6 mb-2 text-inherit" />
                      <span className="text-[11px] font-bold text-center leading-tight line-clamp-1">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">2. Hạn mức chi tiêu mong muốn</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0"
                  value={newBudget.amount}
                  onChange={e => setNewBudget({...newBudget, amount: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-5 pl-6 pr-16 outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono font-bold text-neutral-900 text-2xl md:text-3xl"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-sm md:text-base">VND</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[200000, 500000, 1000000, 2000000, 5000000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setNewBudget({...newBudget, amount: ((Number(newBudget.amount) || 0) + amt).toString()})}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-3xl text-xs sm:text-sm font-bold hover:bg-neutral-200 transition-colors border border-transparent active:border-neutral-300 cursor-pointer"
                  >
                    +{formatMoney(amt)}
                  </button>
                ))}
                <button 
                  onClick={() => setNewBudget({...newBudget, amount: ''})}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-500 rounded-3xl text-xs sm:text-sm font-bold hover:bg-neutral-50 hover:text-neutral-700 transition-colors sm:ml-auto cursor-pointer"
                >
                  Nhập lại
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-neutral-100 flex justify-end">
             <button 
               onClick={handleAddBudget} 
               disabled={!newBudget.amount || parseFloat(newBudget.amount) <= 0} 
               className="w-full sm:w-auto bg-neutral-900 text-white font-extrabold px-8 py-4 rounded-3xl shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95 cursor-pointer select-none"
             >
               <Plus className="w-5 h-5" />
               Lưu cấu hình hạn mức
             </button>
          </div>
        </motion.div>
      )}

      {/* Budgets Grid Area */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget, idx) => {
            const category = DEFAULT_CATEGORIES.find(c => c.id === budget.categoryId);
            const spent = spentByCategory[budget.categoryId] || 0;
            const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const remaining = Math.max(budget.amount - spent, 0);
            const isOver = spent >= budget.amount;
            const capPercent = Math.min(percent, 100);
            
            // Icon rendering
            const CategoryIcon = (LucideIcons as any)[category?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

            // Health Status Calculation
            let levelColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
            let progressGradient = 'bg-gradient-to-r from-emerald-400 to-teal-500';
            let warningText = '🟢 Chi tiêu an toàn';
            let advice = 'Bạn đang kiểm soát ngân sách rất kỷ luật. Hãy duy trì thế này nhé!';

            if (isOver) {
              levelColor = 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse';
              progressGradient = 'bg-gradient-to-r from-red-500 to-rose-600 shadow-sm';
              warningText = '🔴 Vượt quá hạn mức';
              advice = `Chú ý! Đã chi lố hạn mức thêm ${formatMoney(spent - budget.amount)}. Hãy cân đối tiêu dùng từ các vùng dư dả khác!`;
            } else if (percent >= 80) {
              levelColor = 'text-amber-600 bg-amber-50 border-amber-200';
              progressGradient = 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm';
              warningText = '🟠 Báo động sắp hết';
              advice = 'Cảnh báo! Ngân sách đã cạn hơn 80%, chỉ nên phát sinh chi tiêu cốt lõi.';
            } else if (percent >= 50) {
              levelColor = 'text-sky-600 bg-sky-50 border-sky-100';
              progressGradient = 'bg-gradient-to-r from-sky-400 to-blue-500';
              warningText = '🔵 Tiêu chuẩn trung bình';
              advice = 'Đã tiêu trên một nửa quỹ. Cân nhắc giãn lịch trình mua sắm của bạn.';
            }

            // Spend speed vs Time ratio
            const elapsedRatio = dayProgressInfo.elapsedPercent;
            const isSpendingFast = percent > elapsedRatio + 15;
            const isSpendingSlow = percent < elapsedRatio - 15;

            // expanded view transactions list
            const matchedTransactions = getRecentCategoryTransactions(budget.categoryId);
            const isExpanded = expandedBudgetId === budget.id;

            return (
              <motion.div 
                layout={!reducedMotion}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={reducedMotion ? { duration: 0.2 } : { delay: idx * 0.05 }}
                key={budget.id} 
                className={`p-6 rounded-3xl bg-white shadow-sm border transition-all ${isOver ? 'border-red-200/80 bg-gradient-to-b from-white to-red-50/20' : percent >= 80 ? 'border-amber-200' : 'border-neutral-200/80'} relative overflow-hidden`}
              >
                {/* Visual Glow Background Corner */}
                {isOver && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] rounded-full pointer-events-none blur-xl"></div>
                )}
                {percent >= 80 && !isOver && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full pointer-events-none blur-xl"></div>
                )}
                
                {/* Top header within card */}
                <div className="flex justify-between items-start mb-5 gap-2">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-colors shrink-0 ${isOver ? 'bg-red-50 border border-red-100 text-rose-500' : percent >= 80 ? 'bg-amber-50 border border-amber-100 text-amber-500' : 'bg-neutral-50 border border-neutral-100 text-neutral-600'}`}>
                      <CategoryIcon className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-lg leading-tight flex items-center gap-2">
                        {category?.name || 'Mục tiêu'}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${levelColor}`}>
                          {warningText}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => budget.id && setExpandedBudgetId(isExpanded ? null : budget.id)}
                      title="Xem lịch sử giao dịch liên quan"
                      className={`p-2 rounded-2xl transition-colors cursor-pointer text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50`}
                    >
                      <History className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => budget.id && handleDeleteBudget(budget.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bars & details section */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2.5">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Đã chi tiêu</span>
                      <div className="text-right">
                         <span className={`text-xl font-mono font-black ${isOver ? 'text-red-600' : percent >= 80 ? 'text-amber-600' : 'text-neutral-950'}`}>
                            {formatMoney(spent)}
                         </span>
                         <span className="text-neutral-400 font-mono text-sm font-bold ml-1">/ {formatMoney(budget.amount)}</span>
                      </div>
                    </div>

                    {/* Enhanced Interactive Progress Container */}
                    <div className="h-4 bg-neutral-100 border border-neutral-200/30 rounded-3xl overflow-hidden relative shadow-inner">
                      {/* 50% Milestone Marker */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-neutral-200/60 z-10" title="Đánh dấu 50%" />
                      {/* 80% Milestone Marker */}
                      <div className="absolute left-[80%] top-0 bottom-0 w-[1.5px] bg-neutral-300/60 z-10" title="Đánh dấu 80%" />
                      
                      <motion.div 
                        key={capPercent}
                        initial={{ width: 0 }}
                        animate={{ width: `${capPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-3xl ${progressGradient} relative`}
                      >
                        {/* Glow tip element */}
                        {capPercent > 0 && capPercent < 100 && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 blur-[1px]" />
                        )}
                      </motion.div>
                    </div>
                    {/* Visual Milestone Labels */}
                    <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-neutral-400 mt-1 uppercase pl-1 tracking-wider">
                      <span>0%</span>
                      <span className="ml-[12%]">50%</span>
                      <span className="mr-[8%]">80%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Remaining & Progress statistics detailed split */}
                  <div className="grid grid-cols-2 gap-3.5 bg-neutral-50/70 p-4 rounded-3xl border border-neutral-200/50">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                         {isOver ? 'Vượt chỉ chi tiêu' : 'Ngân sách còn lại'}
                       </span>
                       <span className={`font-mono font-bold text-sm sm:text-base mt-0.5 ${isOver ? 'text-red-600' : remaining === 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                         {isOver ? '-' : ''}{formatMoney(isOver ? spent - budget.amount : remaining)}
                       </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tiến trình</span>
                       <span className={`font-bold mt-0.5 text-sm sm:text-base ${isOver ? 'text-red-500' : percent >= 80 ? 'text-amber-500' : 'text-neutral-700'}`}>
                         {percent.toFixed(1)}%
                       </span>
                    </div>
                  </div>

                  {/* Smart Spending Velocity Alert Box */}
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60 text-xs text-neutral-600 space-y-1.5">
                    <p className="font-serif italic text-neutral-500 pr-1">{advice}</p>
                    
                    {/* Comparison note */}
                    <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-neutral-400">Tốc độ chi tiêu:</span>
                      {isOver ? (
                        <span className="text-red-500 uppercase">Cạn kiệt lực kế</span>
                      ) : isSpendingFast ? (
                        <span className="text-amber-500 flex items-center gap-1">
                          ⚠️ Đang tiêu quá nhanh ({percent.toFixed(0)}% diện tích, {dayProgressInfo.elapsedPercent.toFixed(0)}% ngày)
                        </span>
                      ) : isSpendingSlow ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          ✨ Rất tiết kiệm ({percent.toFixed(0)}% diện tích, {dayProgressInfo.elapsedPercent.toFixed(0)}% ngày)
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          Bám sát tiến độ ngày ({percent.toFixed(0)}% diện tích)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Drill Down History Table */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2 border-t border-neutral-100"
                      >
                        <div className="space-y-2 mt-1">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase text-neutral-400 pl-1">
                            <span>Lịch sử chi tháng này</span>
                            <span>{matchedTransactions.length} Giao dịch</span>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-50">
                            {matchedTransactions.slice(0, 5).map((tx, tIdx) => (
                              <div key={tx.id || tIdx} className="flex justify-between items-center py-1.5 text-xs text-neutral-700">
                                <div className="space-y-0.5 truncate pr-2">
                                  <p className="font-bold text-neutral-800 truncate">{tx.description || 'Giao dịch chưa phân loại'}</p>
                                  <p className="text-[10px] text-neutral-400">{new Date(tx.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <span className="font-mono font-bold text-neutral-900 shrink-0">-{formatMoney(tx.amount)}</span>
                              </div>
                            ))}
                            {matchedTransactions.length === 0 && (
                              <p className="text-center py-4 text-xs text-neutral-400 italic">Chưa phát sinh chí tiêu nào trong danh mục này.</p>
                            )}
                            {matchedTransactions.length > 5 && (
                              <p className="text-center text-[10px] text-neutral-400 pt-1.5">và {matchedTransactions.length - 5} giao dịch khác...</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Toggle indicator bar */}
                  <button
                    onClick={() => budget.id && setExpandedBudgetId(isExpanded ? null : budget.id)}
                    className="w-full py-1 bg-neutral-50/30 hover:bg-neutral-50 border border-neutral-100/50 rounded-2xl flex items-center justify-center text-[10px] font-bold text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <span className="flex items-center gap-1">Thu nhỏ chi tiết <ChevronUp className="w-3.5 h-3.5" /></span>
                    ) : (
                      <span className="flex items-center gap-1">Xem lịch sử đóng góp <ChevronDown className="w-3.5 h-3.5" /></span>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {budgets.length === 0 && !isAdding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-16 flex flex-col items-center justify-center bg-white/50 backdrop-blur rounded-3xl border border-dashed border-neutral-300"
            >
              <Target className="w-12 h-12 text-neutral-300 mb-4 animate-pulse" />
              <p className="text-neutral-500 font-bold text-lg">Chưa có ngân sách phòng bị nào</p>
              <p className="text-neutral-400 text-sm mt-1 max-w-sm text-center px-4 leading-relaxed">Thiết lập ngân sách giúp bạn và đồng đội kiểm soát chi tiêu tốt hơn cho từng danh mục cụ thể.</p>
              <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-6 font-bold text-neutral-600 bg-neutral-100 px-6 py-2.5 rounded-3xl transition-all hover:bg-neutral-200 border border-neutral-200 font-display text-sm cursor-pointer"
              >
                  Tạo ngân sách đầu tiên
              </button>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}

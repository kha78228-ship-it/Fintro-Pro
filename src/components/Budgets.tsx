import React, { useState, useEffect, useMemo } from 'react';
import { Budget } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Target, Plus, Trash2, Edit2, X } from 'lucide-react';
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

  const spentByCategory = useMemo(() => {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const totals: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense' && new Date(t.date) >= currentMonthStart) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    
    return totals;
  }, [transactions]);

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
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/50 backdrop-blur border border-neutral-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 tracking-tight">Ngân sách hàng tháng</h2>
          <p className="text-sm text-neutral-500 mt-1">Thiết lập giới hạn chi tiêu theo danh mục đễ dễ quản lý</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm font-semibold py-3 px-5 bg-neutral-900 text-white rounded-3xl shadow-md hover:bg-neutral-800 transition-all pointer-events-auto"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Hủy' : 'Thêm ngân sách'}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -20 }}
          className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-neutral-900/5 border border-neutral-200 space-y-8 relative overflow-hidden"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-display text-neutral-900">Thêm ngân sách mới</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-neutral-50 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">1. Chọn danh mục</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {DEFAULT_CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(c => {
                  const isAlreadyBudgeted = budgets.some(b => b.categoryId === c.id);
                  return (
                  <button
                    key={c.id}
                    disabled={isAlreadyBudgeted}
                    onClick={() => setNewBudget({...newBudget, categoryId: c.id})}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${newBudget.categoryId === c.id ? 'bg-neutral-900 border-neutral-900 shadow-md text-white' : isAlreadyBudgeted ? 'bg-neutral-50/50 border-neutral-100 text-neutral-300 cursor-not-allowed grayscale' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer active:scale-95'} border`}
                  >
                    <span className="text-2xl mb-1.5">{c.icon}</span>
                    <span className="text-[10px] font-bold text-center leading-tight line-clamp-1">{c.name}</span>
                  </button>
                )})}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">2. Số tiền giới hạn</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="0"
                  value={newBudget.amount}
                  onChange={e => setNewBudget({...newBudget, amount: e.target.value})}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-5 pl-6 pr-16 outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono font-bold text-neutral-900 text-2xl md:text-3xl"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-neutral-400">VNĐ</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[500000, 1000000, 2000000, 5000000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setNewBudget({...newBudget, amount: ((Number(newBudget.amount) || 0) + amt).toString()})}
                     className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-3xl text-sm font-bold hover:bg-neutral-200 transition-colors border border-transparent active:border-neutral-300"
                  >
                    +{formatMoney(amt)}
                  </button>
                ))}
                <button 
                  onClick={() => setNewBudget({...newBudget, amount: ''})}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-500 rounded-3xl text-sm font-bold hover:bg-neutral-50 hover:text-neutral-700 transition-colors sm:ml-auto"
                >
                  Nhập lại
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-neutral-100 flex justify-end">
             <button onClick={handleAddBudget} disabled={!newBudget.amount || parseFloat(newBudget.amount) <= 0} className="w-full sm:w-auto bg-neutral-900 text-white font-bold px-8 py-3.5 rounded-3xl shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95">
               <Plus className="w-5 h-5" />
               Lưu ngân sách
             </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget, idx) => {
            const category = DEFAULT_CATEGORIES.find(c => c.id === budget.categoryId);
            const spent = spentByCategory[budget.categoryId] || 0;
            const percent = Math.min((spent / budget.amount) * 100, 100);
            const remaining = Math.max(budget.amount - spent, 0);
            const isOver = spent >= budget.amount;

            return (
              <motion.div 
                layout={!reducedMotion}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={reducedMotion ? { duration: 0.2 } : { delay: idx * 0.05 }}
                key={budget.id} 
                className={`p-6 rounded-3xl bg-white shadow-sm border transition-shadow hover:shadow-md relative overflow-hidden ${isOver ? 'border-orange-200 bg-orange-50/30' : 'border-neutral-100'}`}
              >
                {isOver && (
                   <div className="absolute top-0 right-0 absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full"></div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${isOver ? 'bg-orange-100 text-orange-500' : 'bg-neutral-100 text-neutral-600'}`}>
                      {category?.icon || '🎯'}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg leading-tight">{category?.name || 'Mục tiêu'}</h4>
                      <span className="text-xs font-semibold text-neutral-400">Ngân sách tháng này</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => budget.id && handleDeleteBudget(budget.id)}
                    className="p-2 -mr-2 text-neutral-300 hover:text-orange-500 hover:bg-orange-50 rounded-3xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-neutral-500">Đã chi tiêu</span>
                        <div className="text-right">
                           <span className={`text-xl font-display font-black leading-none ${isOver ? 'text-orange-600' : 'text-neutral-900'}`}>
                              {formatMoney(spent)}
                           </span>
                           <span className="text-neutral-400 text-sm font-medium ml-1">/ {formatMoney(budget.amount)}</span>
                        </div>
                     </div>
                     <div className="h-3 bg-neutral-100 rounded-3xl overflow-hidden">
                       <motion.div 
                         key={percent}
                         initial={{ width: 0 }}
                         animate={{ width: `${percent}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={`h-full rounded-3xl ${isOver ? 'bg-orange-500 shadow-md' : percent >= 80 ? 'bg-orange-500 shadow-md' : 'bg-neutral-500 shadow-md'}`}
                       />
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-center rounded-3xl bg-neutral-50 p-3 border border-neutral-100/50">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Còn lại</span>
                       <span className={`font-mono font-bold ${remaining === 0 ? 'text-orange-500' : 'text-neutral-600'}`}>{formatMoney(remaining)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Tiến độ</span>
                       <span className={`font-bold text-sm ${isOver ? 'text-orange-500' : percent >= 80 ? 'text-orange-500' : 'text-neutral-700'}`}>{percent.toFixed(1)}%</span>
                    </div>
                  </div>
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
              <Target className="w-12 h-12 text-neutral-300 mb-4" />
              <p className="text-neutral-500 font-medium text-lg">Chưa có ngân sách nào</p>
              <p className="text-neutral-400 text-sm mt-1 max-w-sm text-center">Thiết lập ngân sách giúp bạn kiểm soát chi tiêu tốt hơn cho từng danh mục cụ thể.</p>
              <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-6 font-bold text-neutral-600 bg-neutral-50 px-6 py-2 rounded-3xl transition-all hover:bg-neutral-100"
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

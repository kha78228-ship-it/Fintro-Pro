import React, { useState, useEffect } from 'react';
import { Budget } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Target, Plus, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BudgetsProps {
  transactions: any[];
}

export default function Budgets({ transactions }: BudgetsProps) {
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
          className="flex items-center gap-2 text-sm font-semibold py-3 px-5 bg-neutral-900 text-white rounded-xl shadow-md hover:bg-neutral-800 transition-all pointer-events-auto"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Hủy' : 'Thêm ngân sách'}
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="bg-white p-6 rounded-3xl shadow-lg border border-neutral-100 space-y-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-r-full"></div>
          <h3 className="text-lg font-bold">Thêm ngân sách mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Danh mục</label>
               <select 
                 value={newBudget.categoryId}
                 onChange={e => setNewBudget({...newBudget, categoryId: e.target.value})}
                 className="w-full bg-neutral-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-neutral-800"
               >
                 {DEFAULT_CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both').map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">Số tiền giới hạn</label>
               <input 
                 type="number"
                 placeholder="0 ₫"
                 value={newBudget.amount}
                 onChange={e => setNewBudget({...newBudget, amount: e.target.value})}
                 className="w-full bg-neutral-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-200 transition-all font-mono font-bold text-neutral-900"
               />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
             <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800 transition-colors">Hủy</button>
             <button onClick={handleAddBudget} disabled={!newBudget.amount || parseFloat(newBudget.amount) <= 0} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow hover:bg-indigo-700 transition disabled:opacity-50">Lưu ngân sách</button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget, idx) => {
            const category = DEFAULT_CATEGORIES.find(c => c.id === budget.categoryId);
            // Get all transactions for current month only
            const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const spent = transactions
              .filter(t => t.category === budget.categoryId && t.type === 'expense' && new Date(t.date) >= currentMonthStart)
              .reduce((sum, t) => sum + t.amount, 0);
            const percent = Math.min((spent / budget.amount) * 100, 100);
            const remaining = Math.max(budget.amount - spent, 0);
            const isOver = spent >= budget.amount;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                key={budget.id} 
                className={`p-6 rounded-3xl bg-white shadow-sm border transition-shadow hover:shadow-md relative overflow-hidden ${isOver ? 'border-red-200 bg-red-50/30' : 'border-neutral-100'}`}
              >
                {isOver && (
                   <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full"></div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${isOver ? 'bg-red-100 text-red-500' : 'bg-neutral-100 text-neutral-600'}`}>
                      {category?.icon || '🎯'}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg leading-tight">{category?.name || 'Mục tiêu'}</h4>
                      <span className="text-xs font-semibold text-neutral-400">Ngân sách tháng này</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => budget.id && handleDeleteBudget(budget.id)}
                    className="p-2 -mr-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                     <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-neutral-500">Đã chi tiêu</span>
                        <div className="text-right">
                           <span className={`text-xl font-display font-black leading-none ${isOver ? 'text-red-600' : 'text-neutral-900'}`}>
                              {spent.toLocaleString()}đ
                           </span>
                           <span className="text-neutral-400 text-sm font-medium ml-1">/ {budget.amount.toLocaleString()}đ</span>
                        </div>
                     </div>
                     <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                       <motion.div 
                         key={percent}
                         initial={{ width: 0 }}
                         animate={{ width: `${percent}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={`h-full rounded-full ${isOver ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : percent >= 80 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
                       />
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-center rounded-xl bg-neutral-50 p-3 border border-neutral-100/50">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Còn lại</span>
                       <span className={`font-mono font-bold ${remaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{remaining.toLocaleString()}đ</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-0.5">Tiến độ</span>
                       <span className={`font-bold text-sm ${isOver ? 'text-red-500' : percent >= 80 ? 'text-amber-500' : 'text-neutral-700'}`}>{percent.toFixed(1)}%</span>
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
                  className="mt-6 font-bold text-indigo-600 bg-indigo-50 px-6 py-2 rounded-xl transition-all hover:bg-indigo-100"
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

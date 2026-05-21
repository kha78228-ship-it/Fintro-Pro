import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Banknote, Plus, Trash2, Calendar, User, CheckCircle2, AlertCircle, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../lib/CurrencyContext';

export default function DebtTracker() {
  const { formatMoney, currency } = useCurrency();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newDebt, setNewDebt] = useState({ 
    title: '', 
    amount: '', 
    type: 'owe' as 'owe' | 'lent', 
    person: '', 
    dueDate: '' 
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/debts`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const d: Debt[] = [];
      snapshot.forEach(doc => d.push({ id: doc.id, ...doc.data() } as Debt));
      setDebts(d);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleAddDebt = async () => {
    if (!auth.currentUser || !newDebt.title || !newDebt.amount || !newDebt.person) return;
    const path = `users/${auth.currentUser.uid}/debts`;
    try {
      const data: any = {
        title: newDebt.title,
        amount: parseFloat(newDebt.amount),
        type: newDebt.type,
        person: newDebt.person,
        status: 'pending',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };
      if (newDebt.dueDate) {
        data.dueDate = newDebt.dueDate;
      }

      await addDoc(collection(db, path), data);
      setIsAdding(false);
      setNewDebt({ title: '', amount: '', type: 'owe', person: '', dueDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleStatus = async (debt: Debt) => {
    if (!auth.currentUser || !debt.id) return;
    const path = `users/${auth.currentUser.uid}/debts/${debt.id}`;
    try {
      await updateDoc(doc(db, path), {
        status: debt.status === 'completed' ? 'pending' : 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/debts/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const totalOwe = debts
    .filter(d => d.type === 'owe' && d.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalLent = debts
    .filter(d => d.type === 'lent' && d.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Quản lý Vay & Nợ</h2>
          <p className="text-neutral-500 mt-1">Theo dõi các khoản vay mượn một cách minh bạch.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-6 py-3 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm khoản mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ArrowDownLeft className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Tổng nợ (Tôi nợ)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-red-700">{formatMoney(totalOwe)}</div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Tổng cho vay (Nợ tôi)</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-700">{formatMoney(totalLent)}</div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8 space-y-6 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Loại khoản</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewDebt({...newDebt, type: 'owe'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${newDebt.type === 'owe' ? 'bg-red-500 text-white shadow-lg' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                  >
                    Tôi nợ
                  </button>
                  <button 
                    onClick={() => setNewDebt({...newDebt, type: 'lent'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${newDebt.type === 'lent' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                  >
                    Họ nợ tôi
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Ghi chú / Tên khoản</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Tiền ăn tối, Tiền nhà..."
                  value={newDebt.title}
                  onChange={e => setNewDebt({...newDebt, title: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Đối phương</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="text"
                    placeholder="Tên người vay/cho vay"
                    value={newDebt.person}
                    onChange={e => setNewDebt({...newDebt, person: e.target.value})}
                    className="input-field pl-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Số tiền ({currency})</label>
                <input 
                  type="number"
                  value={newDebt.amount}
                  onChange={e => setNewDebt({...newDebt, amount: e.target.value})}
                  className="input-field font-mono"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Hạn trả (Tùy chọn)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="date"
                    value={newDebt.dueDate}
                    onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})}
                    className="input-field pl-12"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end pt-4 border-t border-neutral-100">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-6 py-3 rounded-3xl text-neutral-500 font-bold hover:bg-neutral-50 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddDebt} 
                className="btn-primary px-8 py-3"
              >
                Lưu khoản này
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {debts.map((debt, idx) => (
          <motion.div 
            key={debt.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`card p-5 group flex items-center gap-4 hover:shadow-md transition-all ${debt.status === 'completed' ? 'opacity-60 bg-neutral-50 grayscale' : 'bg-white'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${debt.type === 'owe' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {debt.type === 'owe' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-lg truncate ${debt.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>{debt.title}</h4>
                {debt.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 font-medium">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {debt.type === 'owe' ? `Trả cho: ${debt.person}` : `Nhận từ: ${debt.person}`}</span>
                {debt.dueDate && (
                  <span className={`flex items-center gap-1 ${!debt.status && new Date(debt.dueDate) < new Date() ? 'text-red-500 animate-pulse' : ''}`}>
                    <Clock className="w-3.5 h-3.5" /> 
                    Hạn: {format(parseISO(debt.dueDate), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className={`text-xl font-mono font-bold ${debt.type === 'owe' ? 'text-red-600' : 'text-emerald-600'}`}>
                {debt.type === 'owe' ? '-' : '+'}{formatMoney(debt.amount)}
              </div>
              <div className="flex items-center justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => toggleStatus(debt)}
                  className={`p-2 rounded-xl transition-colors ${debt.status === 'completed' ? 'bg-neutral-200 text-neutral-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  title={debt.status === 'completed' ? "Đánh dấu chưa xong" : "Đánh dấu đã trả xong"}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => debt.id && handleDeleteDebt(debt.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {debts.length === 0 && !isAdding && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
            <Banknote className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 font-display italic text-lg">Mọi khoản vay nợ đều đã được thanh toán.</p>
          </div>
        )}
      </div>
    </div>
  );
}

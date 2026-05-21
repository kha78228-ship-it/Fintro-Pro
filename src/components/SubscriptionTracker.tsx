import React, { useState, useEffect } from 'react';
import { Subscription } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Plus, Trash2, Calendar, CreditCard, RefreshCw, AlertCircle, ShoppingBag, Music, MonitorPlay, Zap, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, addMonths, addYears } from 'date-fns';
import { useCurrency } from '../lib/CurrencyContext';

const SUB_ICONS = [
  { id: 'MonitorPlay', icon: MonitorPlay, label: 'Giải trí / Phim' },
  { id: 'Music', icon: Music, label: 'Âm nhạc' },
  { id: 'Zap', icon: Zap, label: 'Tiện ích / Điện nước' },
  { id: 'ShoppingBag', icon: ShoppingBag, label: 'Thương mại' },
  { id: 'Shield', icon: Shield, label: 'Bảo mật / Phầm mềm' },
  { id: 'Globe', icon: Globe, label: 'Internet / Tên miền' },
  { id: 'CreditCard', icon: CreditCard, label: 'Khác' },
];

export default function SubscriptionTracker() {
  const { formatMoney, currency } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ 
    name: '', 
    amount: '', 
    billingCycle: 'monthly' as 'monthly' | 'yearly', 
    nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
    category: 'Giải trí',
    icon: 'MonitorPlay'
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/subscriptions`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const s: Subscription[] = [];
      snapshot.forEach(doc => s.push({ id: doc.id, ...doc.data() } as Subscription));
      setSubscriptions(s);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSub = async () => {
    if (!auth.currentUser || !newSub.name || !newSub.amount) return;
    const path = `users/${auth.currentUser.uid}/subscriptions`;
    try {
      const data: any = {
        name: newSub.name,
        amount: parseFloat(newSub.amount),
        billingCycle: newSub.billingCycle,
        nextBillingDate: newSub.nextBillingDate,
        category: newSub.category,
        icon: newSub.icon,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, path), data);
      setIsAdding(false);
      setNewSub({ 
        name: '', 
        amount: '', 
        billingCycle: 'monthly', 
        nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
        category: 'Giải trí',
        icon: 'MonitorPlay'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleRenew = async (sub: Subscription) => {
    if (!auth.currentUser || !sub.id) return;
    const path = `users/${auth.currentUser.uid}/subscriptions/${sub.id}`;
    try {
      const nextDate = sub.billingCycle === 'monthly' 
        ? addMonths(parseISO(sub.nextBillingDate), 1) 
        : addYears(parseISO(sub.nextBillingDate), 1);
      
      await updateDoc(doc(db, path), {
        nextBillingDate: format(nextDate, 'yyyy-MM-dd')
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/subscriptions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const monthlyTotal = subscriptions.reduce((acc, curr) => {
    return acc + (curr.billingCycle === 'monthly' ? curr.amount : curr.amount / 12);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Quản lý Đăng ký</h2>
          <p className="text-neutral-500 mt-1">Không bao giờ quên ngày gia hạn dịch vụ của bạn.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-6 py-3 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm dịch vụ
        </button>
      </div>

      <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shrink-0">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Ước tính chi phí hàng tháng</h3>
            <div className="text-4xl font-mono font-bold text-indigo-900">{formatMoney(monthlyTotal)}</div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-indigo-400 text-sm font-medium">Tổng cộng {subscriptions.length} dịch vụ đang theo dõi</p>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card p-8 space-y-6 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Tên dịch vụ</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Netflix, Spotify, iCloud..."
                  value={newSub.name}
                  onChange={e => setNewSub({...newSub, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Số tiền ({currency})</label>
                <input 
                  type="number"
                  value={newSub.amount}
                  onChange={e => setNewSub({...newSub, amount: e.target.value})}
                  className="input-field font-mono"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Chu kỳ thanh toán</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewSub({...newSub, billingCycle: 'monthly'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${newSub.billingCycle === 'monthly' ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                  >
                    Hàng tháng
                  </button>
                  <button 
                    onClick={() => setNewSub({...newSub, billingCycle: 'yearly'})}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${newSub.billingCycle === 'yearly' ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                  >
                    Hàng năm
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Biểu tượng</label>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                   {SUB_ICONS.map(item => {
                     const IconComp = item.icon;
                     return (
                       <button
                         key={item.id}
                         onClick={() => setNewSub({...newSub, icon: item.id})}
                         className={`p-3 rounded-2xl flex items-center justify-center transition-all shrink-0 ${newSub.icon === item.id ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'}`}
                         title={item.label}
                       >
                         <IconComp className="w-5 h-5" />
                       </button>
                     )
                   })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Ngày gia hạn tiếp theo</label>
                <input 
                  type="date"
                  value={newSub.nextBillingDate}
                  onChange={e => setNewSub({...newSub, nextBillingDate: e.target.value})}
                  className="input-field"
                />
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
                onClick={handleAddSub} 
                className="btn-primary px-8 py-3"
              >
                Lưu dịch vụ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map((sub, idx) => {
          const iconObj = SUB_ICONS.find(i => i.id === sub.icon) || SUB_ICONS[6];
          const IconComp = iconObj.icon;
          const nextDate = parseISO(sub.nextBillingDate);
          const isSoon = nextDate.getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 3; // 3 days

          return (
            <motion.div 
              key={sub.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => sub.id && handleDeleteSub(sub.id)}
                    className="p-2 text-neutral-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-xl font-bold text-neutral-900 mb-1">{sub.name}</h4>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">{sub.billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-neutral-900">{formatMoney(sub.amount)}</span>
                </div>
                
                <div className={`p-3 rounded-2xl flex items-center justify-between ${isSoon ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-neutral-50 text-neutral-600'}`}>
                   <div className="flex items-center gap-2">
                     <Calendar className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-wider">Hạn: {format(nextDate, 'dd/MM')}</span>
                   </div>
                   <button 
                     onClick={() => handleRenew(sub)}
                     className={`p-1.5 rounded-lg transition-all ${isSoon ? 'bg-orange-500 text-white' : 'hover:bg-neutral-200 text-neutral-500'}`}
                     title="Gia hạn (Lùi ngày thêm 1 chu kỳ)"
                   >
                     <RefreshCw className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {subscriptions.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
            <MonitorPlay className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 font-display italic text-lg">Bạn chưa có đăng ký dịch vụ nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

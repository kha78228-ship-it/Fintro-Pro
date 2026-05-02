import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Target, Plus, Trash2, PiggyBank, Calendar, TrendingUp, Car, Plane, Home, Laptop, Heart, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

const ICONS = [
  { id: 'PiggyBank', icon: PiggyBank, label: 'Tiết kiệm' },
  { id: 'Car', icon: Car, label: 'Xe cộ' },
  { id: 'Plane', icon: Plane, label: 'Du lịch' },
  { id: 'Home', icon: Home, label: 'Nhà cửa' },
  { id: 'Laptop', icon: Laptop, label: 'Công nghệ' },
  { id: 'Heart', icon: Heart, label: 'Sức khỏe' },
  { id: 'GraduationCap', icon: GraduationCap, label: 'Học tập' },
];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', icon: 'PiggyBank', deadline: '' });

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/goals`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g: Goal[] = [];
      snapshot.forEach(doc => g.push({ id: doc.id, ...doc.data() } as Goal));
      setGoals(g);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleAddGoal = async () => {
    if (!auth.currentUser || !newGoal.name || !newGoal.targetAmount) return;
    const path = `users/${auth.currentUser.uid}/goals`;
    try {
      const data: any = {
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        icon: newGoal.icon,
        userId: auth.currentUser.uid
      };
      if (newGoal.deadline) {
        data.deadline = newGoal.deadline;
      }

      await addDoc(collection(db, path), data);
      setIsAdding(false);
      setNewGoal({ name: '', targetAmount: '', icon: 'PiggyBank', deadline: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddMoney = async (goal: Goal, amount: number) => {
    if (!auth.currentUser || !goal.id) return;
    const path = `users/${auth.currentUser.uid}/goals/${goal.id}`;
    try {
      await updateDoc(doc(db, path), {
        currentAmount: goal.currentAmount + amount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/goals/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Mục tiêu tiết kiệm</h2>
          <p className="text-neutral-500 mt-1">Biến ước mơ thành hiện thực bằng cách lập kế hoạch.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-6 py-3 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm mục tiêu
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8 space-y-6 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Tên mục tiêu</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Mua Macbook Pro, Du lịch Nhật Bản..."
                  value={newGoal.name}
                  onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Số tiền mục tiêu (VNĐ)</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 50000000"
                  value={newGoal.targetAmount}
                  onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  className="input-field font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Icon</label>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {ICONS.map(iconObj => {
                    const IconComp = iconObj.icon;
                    return (
                      <button
                        key={iconObj.id}
                        onClick={() => setNewGoal({...newGoal, icon: iconObj.id})}
                        className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                          newGoal.icon === iconObj.id 
                            ? 'bg-neutral-900 text-white shadow-md' 
                            : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                        title={iconObj.label}
                      >
                        <IconComp className="w-6 h-6" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Hạn chót (Tùy chọn)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="date"
                    value={newGoal.deadline}
                    onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="input-field pl-12"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end pt-4 border-t border-neutral-100">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-6 py-3 rounded-2xl text-neutral-500 font-bold hover:bg-neutral-50 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddGoal} 
                className="btn-primary px-8 py-3"
              >
                Tạo nhanh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map((goal, idx) => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const activeIconObj = ICONS.find(i => i.id === goal.icon) || ICONS[0];
          const GoalIcon = activeIconObj.icon;
          
          return (
            <motion.div 
              key={goal.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="card p-8 group relative overflow-hidden hover:shadow-xl transition-all duration-500"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                <GoalIcon className="w-24 h-24 text-neutral-900" />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                  <GoalIcon className="w-7 h-7" />
                </div>
                <button 
                  onClick={() => goal.id && handleDeleteGoal(goal.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-xl font-bold text-neutral-900 mb-1 truncate">{goal.name}</h4>
              {goal.deadline && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-4">
                  <Calendar className="w-3.5 h-3.5" /> 
                  Hạn chót: {format(parseISO(goal.deadline), 'dd/MM/yyyy')}
                </div>
              )}
              
              <div className="flex items-end gap-2 mb-6 mt-2">
                <span className="text-2xl font-mono font-bold text-neutral-900">{goal.currentAmount.toLocaleString()}đ</span>
                <span className="text-sm text-neutral-400 font-medium mb-1">/ {goal.targetAmount.toLocaleString()}đ</span>
              </div>

              <div className="space-y-4">
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${percent >= 100 ? 'bg-green-500' : 'bg-neutral-900'} rounded-full`}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{percent.toFixed(1)}% hoàn thành</span>
                </div>
                
                {percent < 100 ? (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button 
                      onClick={() => handleAddMoney(goal, 100000)}
                      className="text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" /> +100k
                    </button>
                    <button 
                      onClick={() => handleAddMoney(goal, 500000)}
                      className="text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" /> +500k
                    </button>
                    <button 
                      onClick={() => handleAddMoney(goal, 1000000)}
                      className="col-span-2 text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" /> +1 Triệu
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                        <Plus className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-green-700">Tuyệt vời! Mục tiêu hoàn tất.</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-neutral-200">
            <PiggyBank className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 font-display italic text-lg">Bắt đầu tiết kiệm cho tương lai ngay hôm nay.</p>
          </div>
        )}
      </div>
    </div>
  );
}

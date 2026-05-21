import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Target, Plus, Trash2, PiggyBank, Calendar, TrendingUp, Car, Plane, Home, Laptop, Heart, GraduationCap, Edit3, X, Check, Users, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../lib/CurrencyContext';

const ICONS = [
  { id: 'PiggyBank', icon: PiggyBank, label: 'Tiết kiệm' },
  { id: 'Car', icon: Car, label: 'Xe cộ' },
  { id: 'Plane', icon: Plane, label: 'Du lịch' },
  { id: 'Home', icon: Home, label: 'Nhà cửa' },
  { id: 'Laptop', icon: Laptop, label: 'Công nghệ' },
  { id: 'Heart', icon: Heart, label: 'Sức khỏe' },
  { id: 'GraduationCap', icon: GraduationCap, label: 'Học tập' },
];

export default function Goals({ appTheme = "vietnam" }: { appTheme?: "vintage" | "vietnam" | "pink_cute" }) {
  const { formatMoney, currency } = useCurrency();
  const [personalGoals, setPersonalGoals] = useState<Goal[]>([]);
  const [sharedGoals, setSharedGoals] = useState<Goal[]>([]);
  const [sharedFundDoc, setSharedFundDoc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    icon: 'PiggyBank',
    deadline: '',
    scope: 'personal' as 'personal' | 'shared'
  });
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [customCurrentAmount, setCustomCurrentAmount] = useState<string>('');

  // 1. Fetch personal goals
  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/goals`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g: Goal[] = [];
      snapshot.forEach(doc => {
        g.push({ id: doc.id, scope: 'personal', ...doc.data() } as Goal);
      });
      setPersonalGoals(g);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch active shared group
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'shared_funds'),
      where('memberIds', 'array-contains', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSharedFundDoc({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setSharedFundDoc(null);
        setActiveTab('personal');
      }
    }, (error) => {
      console.error("Error listening for shared fund for goals:", error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Fetch shared goals if user is in a group
  useEffect(() => {
    if (!auth.currentUser || !sharedFundDoc?.id) {
      setSharedGoals([]);
      return;
    }
    const path = `couple_data/${sharedFundDoc.id}/goals`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g: Goal[] = [];
      snapshot.forEach(doc => {
        g.push({ id: doc.id, scope: 'shared', ...doc.data() } as Goal);
      });
      setSharedGoals(g);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [sharedFundDoc?.id]);

  const getGoalPath = (goal: Goal) => {
    if (goal.scope === 'shared' && sharedFundDoc?.id) {
      return `couple_data/${sharedFundDoc.id}/goals/${goal.id}`;
    }
    return `users/${auth.currentUser.uid}/goals/${goal.id}`;
  };

  const handleAddGoal = async () => {
    if (!auth.currentUser || !newGoal.name || !newGoal.targetAmount) return;
    
    const isShared = newGoal.scope === 'shared' && sharedFundDoc?.id;
    const path = isShared 
      ? `couple_data/${sharedFundDoc.id}/goals` 
      : `users/${auth.currentUser.uid}/goals`;
      
    try {
      const data: any = {
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        icon: newGoal.icon,
        userId: auth.currentUser.uid,
        scope: isShared ? 'shared' : 'personal',
        creatorName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Người dùng'
      };
      if (newGoal.deadline) {
        data.deadline = newGoal.deadline;
      }

      await addDoc(collection(db, path), data);
      setIsAdding(false);
      setNewGoal({ name: '', targetAmount: '', icon: 'PiggyBank', deadline: '', scope: isShared ? 'shared' : 'personal' });
      if (isShared) {
        setActiveTab('shared');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddMoney = async (goal: Goal, amount: number) => {
    if (!auth.currentUser || !goal.id) return;
    const path = getGoalPath(goal);
    try {
      await updateDoc(doc(db, path), {
        currentAmount: goal.currentAmount + amount
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateCurrentAmount = async (goal: Goal) => {
    if (!auth.currentUser || !goal.id) return;
    const path = getGoalPath(goal);
    try {
      const parsedAmount = parseFloat(customCurrentAmount);
      if (isNaN(parsedAmount)) return;
      await updateDoc(doc(db, path), {
        currentAmount: parsedAmount < 0 ? 0 : parsedAmount
      });
      setUpdatingGoalId(null);
      setCustomCurrentAmount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (!auth.currentUser || !goal.id) return;
    const path = getGoalPath(goal);
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSyncGoal = async (goal: Goal) => {
    if (!auth.currentUser || !sharedFundDoc?.id || !goal.id) return;
    
    const currentPath = getGoalPath(goal);
    const targetPath = `couple_data/${sharedFundDoc.id}/goals`;
    
    try {
      const data: any = {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        icon: goal.icon,
        userId: goal.userId,
        scope: 'shared',
        creatorName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Người dùng'
      };
      if (goal.deadline) {
        data.deadline = goal.deadline;
      }
      
      await addDoc(collection(db, targetPath), data);
      await deleteDoc(doc(db, currentPath));
      setActiveTab('shared');
    } catch (error) {
      console.error("Error syncing goal to shared group:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Mục tiêu tiết kiệm</h2>
          <p className="text-neutral-500 mt-1">Biến ước mơ thành hiện thực bằng cách lập kế hoạch tích lũy.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary px-6 py-3 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm mục tiêu
        </button>
      </div>

      {/* Tab Selectors & Suggestion Banner */}
      {sharedFundDoc ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-150 pb-4">
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-3xl w-fit">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'personal'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Target className="w-4 h-4" /> Cá nhân ({personalGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'shared'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Users className="w-4 h-4" /> Gia đình chung ({sharedGoals.length})
            </button>
          </div>
          <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5 bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đã đồng bộ nhóm gia đình
          </div>
        </div>
      ) : (
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-neutral-500">
            <Users className="w-4.5 h-4.5 text-neutral-450 shrink-0" />
            <span>Đã ghép đôi hoặc có nhóm tài chính chung? Hãy tạo nhóm tại mục <strong>Quỹ chung</strong> để đồng bộ hóa mục tiêu tiết kiệm gia đình cho cả hai cùng theo dõi!</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8 space-y-6 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sharedFundDoc && (
                <div className="space-y-2 col-span-full">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Phạm vi mục tiêu</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewGoal({ ...newGoal, scope: 'personal' })}
                      className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                        newGoal.scope === 'personal'
                          ? 'border-neutral-900 bg-neutral-50 text-neutral-900 shadow-sm'
                          : 'border-neutral-200 text-neutral-550 hover:border-neutral-300'
                      }`}
                    >
                      <Target className="w-5 h-5 text-neutral-500" /> Chỉ riêng tôi
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGoal({ ...newGoal, scope: 'shared' })}
                      className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                        newGoal.scope === 'shared'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                      }`}
                    >
                      <Users className="w-5 h-5 text-neutral-300" /> Đồng bộ chung gia đình
                    </button>
                  </div>
                </div>
              )}

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
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Số tiền mục tiêu ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 50000000"
                  value={newGoal.targetAmount}
                  onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  className="input-field font-mono"
                />
              </div>
              <div className="space-y-2 col-span-full">
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
              <div className="space-y-2 col-span-full">
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
                className="px-6 py-3 rounded-3xl text-neutral-500 font-bold hover:bg-neutral-50 transition-all"
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
        {(activeTab === 'personal' ? personalGoals : sharedGoals).map((goal, idx) => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const activeIconObj = ICONS.find(i => i.id === goal.icon) || ICONS[0];
          const GoalIcon = activeIconObj.icon;
          
          let barGradientClass = "bg-gradient-to-r from-teal-500 to-emerald-400";
          let badgeText = "Đang tích lũy";
          let badgeColorClass = "text-neutral-500 bg-neutral-100 border border-neutral-200/50";
          
          if (percent >= 100) {
            badgeText = "Hoàn thành! 🎉";
            if (appTheme === 'vietnam') {
              barGradientClass = "bg-gradient-to-r from-red-600 via-amber-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
              badgeColorClass = "text-red-700 bg-red-50 border border-red-100";
            } else if (appTheme === 'pink_cute') {
              barGradientClass = "bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse";
              badgeColorClass = "text-rose-700 bg-rose-50 border border-rose-100";
            } else {
              barGradientClass = "bg-neutral-900 border border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,0.15)]";
              badgeColorClass = "text-neutral-800 bg-neutral-100 border border-neutral-300";
            }
          } else if (percent >= 80) {
            badgeText = "Sắp đạt được! 🔥";
            if (appTheme === 'vietnam') {
              barGradientClass = "bg-gradient-to-r from-blue-500 to-teal-400";
              badgeColorClass = "text-blue-700 bg-blue-50 border border-blue-100";
            } else if (appTheme === 'pink_cute') {
              barGradientClass = "bg-gradient-to-r from-pink-300 to-rose-400";
              badgeColorClass = "text-pink-600 bg-pink-50 border border-pink-100";
            } else {
              barGradientClass = "bg-gradient-to-r from-neutral-600 to-neutral-800";
              badgeColorClass = "text-neutral-700 bg-neutral-100 border border-neutral-200";
            }
          } else {
            if (appTheme === 'vietnam') {
              barGradientClass = "bg-gradient-to-r from-[#00bfff] to-[#0088cc]";
              badgeColorClass = "text-sky-700 bg-sky-50 border border-sky-100";
            } else if (appTheme === 'pink_cute') {
              barGradientClass = "bg-gradient-to-r from-pink-300 to-pink-400";
              badgeColorClass = "text-neutral-500 bg-neutral-100 border border-neutral-200/50";
            } else {
              barGradientClass = "bg-neutral-800";
              badgeColorClass = "text-neutral-600 bg-neutral-100 border border-neutral-200/50";
            }
          }

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
                <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                  <GoalIcon className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2">
                  {goal.scope === 'personal' && sharedFundDoc && (
                    <button
                      onClick={() => handleSyncGoal(goal)}
                      className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50/65 hover:bg-emerald-100/80 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold"
                      title="Đồng bộ ngay tới nhóm gia đình"
                    >
                      <Share2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>Đồng bộ</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteGoal(goal)}
                    className="p-2 text-neutral-300 hover:text-orange-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-xl font-bold text-neutral-900 mb-1 truncate">{goal.name}</h4>
              
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-4">
                {goal.scope === 'shared' && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-full font-bold">
                    <Users className="w-3 h-3" /> Quỹ chung nhóm
                  </span>
                )}
                {goal.creatorName && goal.scope === 'shared' && (
                  <span className="text-[10.5px] text-neutral-400 font-bold bg-neutral-50 border border-neutral-150 px-2 py-0.4 rounded-md">
                    Bởi: {goal.creatorName}
                  </span>
                )}
                {goal.deadline && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-neutral-400">
                    <Calendar className="w-3.5 h-3.5" /> 
                    Hạn: {format(parseISO(goal.deadline), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
              
              <div className="flex items-end gap-2 mb-6 mt-2 h-[40px]">
                {updatingGoalId === goal.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      type="number"
                      value={customCurrentAmount}
                      onChange={(e) => setCustomCurrentAmount(e.target.value)}
                      className="input-field py-1 px-3 text-sm font-mono w-full"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleUpdateCurrentAmount(goal)}
                      className="p-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setUpdatingGoalId(null);
                        setCustomCurrentAmount('');
                      }}
                      className="p-2 bg-neutral-100 text-neutral-500 rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl font-mono font-bold text-neutral-900 flex items-center gap-2">
                      {formatMoney(goal.currentAmount)}
                      <button 
                        onClick={() => {
                          setUpdatingGoalId(goal.id || null);
                          setCustomCurrentAmount(goal.currentAmount.toString());
                        }}
                        className="text-neutral-300 hover:text-neutral-900 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </span>
                    <span className="text-sm text-neutral-400 font-medium mb-1">/ {formatMoney(goal.targetAmount)}</span>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className={`${percent >= 100 ? 'text-emerald-600 font-extrabold' : 'text-neutral-400'}`}>
                    {percent.toFixed(1)}% hoàn thành
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColorClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="relative h-4 bg-neutral-100/80 rounded-full p-0.5 border border-neutral-200/40 overflow-hidden shadow-inner flex items-center">
                  <div className="absolute inset-x-0 inset-y-0 flex justify-between px-[25%] pointer-events-none z-10">
                    <div className="w-[1px] h-full bg-neutral-300/30" title="25%" />
                    <div className="w-[1px] h-full bg-neutral-300/30" title="50%" />
                    <div className="w-[1px] h-full bg-neutral-300/30" title="75%" />
                  </div>

                  <motion.div 
                    layout
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full relative ${barGradientClass} transition-colors duration-500`}
                  >
                    {percent > 0 && percent < 100 && (
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute right-0.5 top-0.5 bottom-0.5 w-1.5 rounded-full bg-white opacity-80"
                      />
                    )}
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mt-1">
                  {percent < 100 ? (
                    <span className="flex items-center gap-1">
                      <span className="text-neutral-500">Còn cần:</span>
                      <span className="font-mono font-bold text-neutral-700">{formatMoney(goal.targetAmount - goal.currentAmount)}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      Đã tích lũy đủ: <span className="font-mono text-emerald-700 font-extrabold">{formatMoney(goal.currentAmount)}</span>
                    </span>
                  )}
                  {goal.deadline && percent < 100 && (
                    <span className="text-[10px] lowercase text-neutral-400 font-medium">
                      tiến độ bình quân ~{formatMoney(Math.ceil((goal.targetAmount - goal.currentAmount) / 2))} / kì
                    </span>
                  )}
                </div>

                {percent < 105 ? (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                    <button 
                      onClick={() => handleAddMoney(goal, 100000)}
                      className="text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-3xl flex items-center justify-center gap-1.5 transition-all border border-neutral-100 shadow-sm"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-neutral-500" /> +100k
                    </button>
                    <button 
                      onClick={() => handleAddMoney(goal, 500000)}
                      className="text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-3xl flex items-center justify-center gap-1.5 transition-all border border-neutral-100 shadow-sm"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-neutral-500" /> +500k
                    </button>
                    <button 
                      onClick={() => handleAddMoney(goal, 1000000)}
                      className="col-span-2 text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 py-2.5 rounded-3xl flex items-center justify-center gap-1.5 transition-all border border-neutral-100 shadow-sm"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-neutral-500" /> +1 Triệu
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md animate-bounce">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-emerald-800">Tuyệt vời!</h5>
                      <span className="text-xs text-emerald-700">Mục tiêu tiết kiệm đã hoàn thành xuất sắc!</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {(activeTab === 'personal' ? personalGoals : sharedGoals).length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
            <PiggyBank className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 font-display italic text-lg px-6">
              {activeTab === 'personal' 
                ? 'Bắt đầu tích lũy cho các dự định cá nhân của bạn ngay hôm nay.'
                : 'Chưa có mục tiêu gia đình chung nào được thiết lập. Hãy cùng nhau lập kế hoạch tích lũy!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

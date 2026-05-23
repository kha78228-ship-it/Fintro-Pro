import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, PieChart, Info, ArrowRight, Home, GraduationCap, ShieldCheck, Plane, Car, Plus, X, Wallet, Heart, ShoppingCart, Link as LinkIcon, Check, Copy, Sparkles, Scale, Coins, AlertCircle, RefreshCw } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, arrayUnion, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useCurrency } from '../lib/CurrencyContext';

const availableIcons = {
  Home: { icon: Home, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-100' },
  GraduationCap: { icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  ShieldCheck: { icon: ShieldCheck, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-100' },
  Car: { icon: Car, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  Plane: { icon: Plane, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-100' },
  Wallet: { icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  Heart: { icon: Heart, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
  ShoppingCart: { icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' }
};

type IconName = keyof typeof availableIcons;

interface Fund {
  id: string;
  name: string;
  percent: number;
  iconName: IconName;
}

interface SharedFundProps {
  user: User;
}

export default function SharedFund({ user }: SharedFundProps) {
  const { formatMoney } = useCurrency();
  const [sharedFundDoc, setSharedFundDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Record<string, { role: string, income: number, displayName: string, customRatio?: number }>>({});
  const [funds, setFunds] = useState<Fund[]>([]);
  const [myIncomeSync, setMyIncomeSync] = useState<string>('');
  const [contributionMode, setContributionMode] = useState<'income' | 'equal' | 'custom'>('income');
  const [targetBudget, setTargetBudget] = useState<number>(10000000);
  const [isEditingRatio, setIsEditingRatio] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundPercent, setNewFundPercent] = useState('');
  const [newFundIcon, setNewFundIcon] = useState<IconName>('Wallet');
  const [joinLinkInput, setJoinLinkInput] = useState('');

  const handleJoinFromLink = () => {
    if (!joinLinkInput.trim()) return;
    let url;
    try {
      url = new URL(joinLinkInput);
    } catch (e) {
      // If it's not a URL, maybe it's just the ID
      if (joinLinkInput.match(/^[a-zA-Z0-9]+$/)) {
        window.location.href = `${window.location.origin}${window.location.pathname}?join=${joinLinkInput}`;
      } else {
        alert("Link hoặc ID không hợp lệ");
      }
      return;
    }
    const joinId = url.searchParams.get('join');
    if (joinId) {
      window.location.href = joinLinkInput;
    } else {
      // fallback in case they pasted base url? Or just error.
      alert("Link không chứa mã nhóm hợp lệ");
    }
  };

  useEffect(() => {
    if (!user) return;

    let unsubscribe = () => {};

    const setup = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const joinId = searchParams.get('join');
      
      if (joinId) {
        try {
          const fundRef = doc(db, 'shared_funds', joinId);
          const fundSnap = await getDoc(fundRef);
          if (fundSnap.exists()) {
            const data = fundSnap.data();
            if (!data.memberIds.includes(user.uid)) {
              // Leave any other funds (optional, but good for "one fund per user" logic)
              const existingQ = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
              const existingSnap = await getDocs(existingQ);
              for (const d of existingSnap.docs) {
                 if (d.id !== joinId && d.data().ownerId !== user.uid) {
                    const oldData = d.data();
                    const newOldMembers = { ...oldData.members };
                    delete newOldMembers[user.uid];
                    await updateDoc(d.ref, {
                      memberIds: oldData.memberIds.filter((id: string) => id !== user.uid),
                      members: newOldMembers
                    });
                 }
              }

              const newMembers = { ...data.members, [user.uid]: { role: 'member', income: 0, displayName: user.displayName || 'Thành viên' } };
              await updateDoc(fundRef, {
                memberIds: arrayUnion(user.uid),
                members: newMembers,
              });
            }
          }
        } catch (e) {
          console.error('Error joining fund', e);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const q = query(
        collection(db, 'shared_funds'),
        where('memberIds', 'array-contains', user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          // Find the correct fund (if multiple, prioritize the one we joined or just the first)
          const docSnap = joinId ? (snapshot.docs.find(d => d.id === joinId) || snapshot.docs[0]) : snapshot.docs[0];
          const data = docSnap.data();
          setSharedFundDoc({ id: docSnap.id, ...data });
          setMembers(data.members || {});
          setFunds(data.funds || []);
          setContributionMode(data.contributionMode || 'income');
          setTargetBudget(data.targetBudget !== undefined ? data.targetBudget : 10000000);
          if (data.members && data.members[user.uid]) {
            setMyIncomeSync(data.members[user.uid].income?.toString() || '0');
          }
        } else {
          setSharedFundDoc(null);
        }
        setLoading(false);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'shared_funds'));
    };

    setup();

    return () => unsubscribe();
  }, [user]);

  const handleCreateFund = async () => {
    const newFundId = doc(collection(db, 'shared_funds')).id;
    const data = {
      ownerId: user.uid,
      memberIds: [user.uid],
      contributionMode: 'income',
      targetBudget: 10000000,
      members: {
        [user.uid]: {
          role: 'owner',
          income: 0,
          displayName: user.displayName || 'Trưởng nhóm',
          customRatio: 100,
          contributionPercent: 100
        }
      },
      funds: [
        { id: '1', name: 'Sinh hoạt chung', iconName: 'Home', percent: 50 },
        { id: '2', name: 'Giáo dục / Tương lai', iconName: 'GraduationCap', percent: 20 },
        { id: '3', name: 'Dự phòng khẩn cấp', iconName: 'ShieldCheck', percent: 15 },
        { id: '4', name: 'Đầu tư / Tận hưởng', iconName: 'Car', percent: 15 },
      ]
    };
    try {
      await setDoc(doc(db, 'shared_funds', newFundId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `shared_funds/${newFundId}`);
    }
  };

  const handleUpdateContributionMode = async (mode: 'income' | 'equal' | 'custom') => {
    if (!sharedFundDoc) return;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      
      // If switching to custom and no ratios set, initialize them equally
      let updateData: any = { contributionMode: mode };
      if (mode === 'custom') {
         const mems = Object.keys(members);
         const equalRatio = 100 / mems.length;
         mems.forEach(uid => {
            updateData[`members.${uid}.customRatio`] = members[uid].customRatio || equalRatio;
         });
      }

      await updateDoc(fundRef, updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const handleUpdateCustomRatio = async (uid: string, ratio: string) => {
    if (!sharedFundDoc) return;
    const newRatio = parseFloat(ratio) || 0;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        [`members.${uid}.customRatio`]: newRatio
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const handleUpdateTargetBudget = async (newVal: number) => {
    if (!sharedFundDoc) return;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        targetBudget: newVal
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const handleUpdateIncome = async (newVal: string) => {
    setMyIncomeSync(newVal);
    if (!sharedFundDoc) return;
    const newIncome = parseFloat(newVal) || 0;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        [`members.${user.uid}.income`]: newIncome
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const handleUpdateContributionPercent = async (uid: string, percent: string) => {
    if (!sharedFundDoc) return;
    const val = parseFloat(percent) || 0;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        [`members.${uid}.contributionPercent`]: val
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const memberList = Object.entries(members || {}).map(([uid, m]) => {
    const mem = m as any;
    return { 
      uid, 
      role: mem?.role, 
      income: mem?.income, 
      displayName: mem?.displayName, 
      customRatio: mem?.customRatio,
      contributionPercent: mem?.contributionPercent !== undefined ? mem.contributionPercent : 100
    };
  });
  const totalIncome = memberList.reduce((acc, m) => acc + (m.income || 0), 0);
  const totalContributed = memberList.reduce((acc, m) => acc + ((m.income || 0) * (m.contributionPercent / 100)), 0);
  const totalCustomRatio = memberList.reduce((acc, m) => acc + (m.customRatio || 0), 0);
  const parsedSharedTotal = totalContributed;

  const handleCopyLink = () => {
    if (!sharedFundDoc) return;
    const baseUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(`${baseUrl}?join=${sharedFundDoc.id}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalPercent = funds.reduce((acc, curr) => acc + curr.percent, 0);

  const handleAddFund = async () => {
    if (!newFundName.trim() || !newFundPercent || !sharedFundDoc) return;
    
    const newFund: Fund = {
      id: Date.now().toString(),
      name: newFundName,
      percent: parseFloat(newFundPercent) || 0,
      iconName: newFundIcon
    };
    
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        funds: [...funds, newFund]
      });
      setIsAddingMode(false);
      setNewFundName('');
      setNewFundPercent('');
      setNewFundIcon('Wallet');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const removeFund = async (id: string) => {
    if (!sharedFundDoc) return;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        funds: funds.filter(f => f.id !== id)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  const handleUpdateFundPercent = async (id: string, newPercentStr: string) => {
    if (!sharedFundDoc) return;
    const newPercent = parseFloat(newPercentStr) || 0;
    try {
      const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
      await updateDoc(fundRef, {
        funds: funds.map(f => f.id === id ? { ...f, percent: newPercent } : f)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `shared_funds/${sharedFundDoc.id}`);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>;
  }

  if (!sharedFundDoc) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-2">
          <Users className="w-12 h-12 text-neutral-500" />
        </div>
        <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight text-center">Quỹ chung Gia đình</h2>
        <p className="text-neutral-500 text-center max-w-md">Tạo nhóm để cùng người thân quản lý, đóng góp và minh bạch tài chính gia đình.</p>
        <button 
          onClick={handleCreateFund}
          className="btn-primary mt-2 py-4 px-8 text-lg w-full max-w-md"
        >
          Tạo nhóm gia đình mới
        </button>

        <div className="mt-8 flex flex-col items-center w-full max-w-md">
          <div className="flex items-center gap-4 w-full mb-6">
            <div className="h-px bg-neutral-200 flex-1"></div>
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Hoặc</span>
            <div className="h-px bg-neutral-200 flex-1"></div>
          </div>
          
          <div className="w-full space-y-3 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <label className="text-sm font-semibold text-neutral-700 block">Tham gia nhóm có sẵn</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={joinLinkInput}
                onChange={(e) => setJoinLinkInput(e.target.value)}
                placeholder="Dán link mời vào đây..."
                className="input-field flex-1"
              />
              <button 
                onClick={handleJoinFromLink}
                className="btn-secondary whitespace-nowrap"
              >
                Tham gia ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Quỹ chung Gia đình</h2>
          <p className="text-neutral-500 mt-1">Quản lý và thiết lập tỷ lệ đóng góp quỹ chung một cách công bằng.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 rounded-3xl transition-colors shrink-0"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            <span className="text-sm font-semibold">{isCopied ? 'Đã sao chép link' : 'Thêm thành viên'}</span>
          </button>
          
          {confirmDeleteId === 'fund' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-orange-600">Thật sự rời/xóa?</span>
              <button 
                onClick={async () => {
                  if (sharedFundDoc.ownerId === user.uid) {
                    const { deleteDoc } = await import('firebase/firestore');
                    await deleteDoc(doc(db, 'shared_funds', sharedFundDoc.id));
                  } else {
                    // Leave group logic (optional but basic)
                    // For simplicity we just drop them if they are not owner.
                    const newMembers = { ...sharedFundDoc.members };
                    delete newMembers[user.uid];
                    await updateDoc(doc(db, 'shared_funds', sharedFundDoc.id), {
                      memberIds: sharedFundDoc.memberIds.filter((id: string) => id !== user.uid),
                      members: newMembers
                    });
                  }
                  setSharedFundDoc(null);
                  setConfirmDeleteId(null);
                }}
                className="p-2 text-white bg-orange-500 hover:bg-orange-600 rounded-3xl transition-colors shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="p-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-3xl transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmDeleteId('fund')}
              className="flex items-center justify-center p-2 text-orange-500 hover:bg-orange-50 rounded-3xl transition-colors shrink-0"
              title="Rời/Xóa nhóm"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-orange-50/70 to-white rounded-3xl p-6 md:p-8 shadow-sm border border-orange-200/55 h-fit space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl shadow-md shadow-orange-500/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Chi Tiêu Chung & Đóng Góp</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Xác định hạn mức ngân sách & tỉ lệ chia sẻ tài chính gia đình</p>
            </div>
          </div>

          {/* Target Monthly Joint Budget Setup */}
          <div className="bg-white rounded-2xl p-5 border border-orange-100/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 block">Hạn mức ngân sách chung</span>
                <label className="text-sm font-bold text-neutral-800 block">Mục tiêu hằng tháng</label>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-mono text-orange-600 block">{formatMoney(targetBudget)}</span>
              </div>
            </div>

            {/* Manual input and Slider controls combo */}
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={targetBudget}
                    min="1000000"
                    max="100000000"
                    step="500000"
                    onChange={(e) => handleUpdateTargetBudget(Number(e.target.value) || 0)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl py-2 px-3 pr-12 text-sm font-bold font-mono text-neutral-800 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">VND</span>
                </div>
              </div>

              <input 
                type="range"
                min="1000000"
                max="50000000"
                step="500000"
                value={targetBudget}
                onChange={(e) => handleUpdateTargetBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-orange-100/70 rounded-full appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
              <div className="flex justify-between text-[9px] text-neutral-400 font-bold font-mono">
                <span>1 TR</span>
                <span>25 TR</span>
                <span>50 TR</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[5000000, 10000000, 15000000, 20000000, 30000000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleUpdateTargetBudget(preset)}
                  className={`px-3 py-1.5 text-xs rounded-xl transition-all border font-semibold ${
                    targetBudget === preset 
                      ? 'bg-orange-500 border-orange-500 text-white shadow-xs font-bold' 
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                  }`}
                >
                  {preset / 1000000}M đ
                </button>
              ))}
            </div>

            {/* Budget Progress Bar */}
            <div className="pt-4 border-t border-dashed border-neutral-100">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  Ủng hộ cam kết:
                </span>
                <span className="font-bold text-neutral-800 font-mono">
                  {formatMoney(parsedSharedTotal)} / {formatMoney(targetBudget)}
                </span>
              </div>
              
              {/* Progress Bar Line */}
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden relative border border-neutral-200/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (parsedSharedTotal / (targetBudget || 1)) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-neutral-400 font-medium">Tỷ lệ bao phủ mục tiêu</span>
                <span className={`text-xs font-bold font-mono ${parsedSharedTotal >= targetBudget ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {((parsedSharedTotal / (targetBudget || 1)) * 100).toFixed(0)}% {parsedSharedTotal >= targetBudget ? '✓' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Mode Selector Component */}
          <div className="bg-white rounded-2xl p-5 border border-orange-100/80 shadow-xs space-y-4">
            <div>
              <label className="text-sm font-bold text-neutral-800 block">Chế độ phân phối trách nhiệm</label>
              <p className="text-xs text-neutral-400 mt-0.5">Xác định công thức tính chỉ tiêu cần góp của từng người</p>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-neutral-100/70 p-1.5 rounded-xl border border-neutral-200/20">
              <button 
                onClick={() => handleUpdateContributionMode('income')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${contributionMode === 'income' ? 'bg-white shadow-xs text-orange-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Tỉ lệ lương
              </button>
              <button 
                onClick={() => handleUpdateContributionMode('equal')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${contributionMode === 'equal' ? 'bg-white shadow-xs text-orange-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Chia đều
              </button>
              <button 
                onClick={() => handleUpdateContributionMode('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${contributionMode === 'custom' ? 'bg-white shadow-xs text-orange-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Tùy biến %
              </button>
            </div>

            {/* Quick explanatory note based on mode */}
            <div className="bg-gradient-to-r from-orange-50/40 to-amber-50/20 p-3.5 rounded-xl border border-orange-100/60 flex items-start gap-3">
              <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-neutral-600 leading-relaxed space-y-1">
                {contributionMode === 'income' && (
                  <>
                    <p className="font-bold text-orange-950">Chế độ tỉ lệ thu nhập (Công bằng nhất)</p>
                    <p>Chia gánh nặng tài chính theo thu nhập của mỗi người. Thành viên có thu nhập cao hơn sẽ chịu trách nhiệm phần ngân sách lớn hơn tương ứng.</p>
                    <div className="inline-flex bg-white/70 px-2 py-0.5 rounded border border-orange-100 font-mono text-[9px] text-orange-700 mt-1.5">
                      Công thức: (Lương / Tổng thu nhập) × Mục tiêu chung
                    </div>
                  </>
                )}
                {contributionMode === 'equal' && (
                  <>
                    <p className="font-bold text-orange-950">Chế độ chia đều (Trách nhiệm bình đẳng)</p>
                    <p>Mục tiêu tài chính được chia đều 50/50 (hoặc chia đều cho số lượng thành viên), không phụ thuộc vào tiền lương mỗi người chênh lệch ra sao.</p>
                    <div className="inline-flex bg-white/70 px-2 py-0.5 rounded border border-orange-100 font-mono text-[9px] text-orange-700 mt-1.5">
                      Công thức: Mục tiêu chung / Số lượng người ({memberList.length})
                    </div>
                  </>
                )}
                {contributionMode === 'custom' && (
                  <>
                    <p className="font-bold text-orange-950">Chế độ tùy biến phần trăm (%)</p>
                    <p>Trưởng nhóm có thể linh động điều chỉnh tỉ lệ phân bổ mong muốn của từng người dựa trên sự đồng thuận và thỏa thuận nội bộ.</p>
                    <div className="inline-flex bg-white/70 px-2 py-0.5 rounded border border-orange-100 font-mono text-[9px] text-orange-700 mt-1.5">
                      Phạm vi thiết lập: Tổng phần trăm các thành viên = 100%
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Danger alert if custom has ratio mismatch */}
            {contributionMode === 'custom' && totalCustomRatio !== 100 && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-red-700">
                    <span className="font-bold">Tổng tỉ lệ phân bổ chưa đúng 100%</span> (Hiện là <span className="font-bold font-mono">{totalCustomRatio}%</span>). Hãy điều chỉnh lại hoặc sử dụng nút hỗ trợ nhanh:
                  </div>
                </div>
                {sharedFundDoc?.ownerId === user.uid && (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={async () => {
                        const fundRef = doc(db, 'shared_funds', sharedFundDoc.id);
                        const updateData: any = {};
                        const mems = Object.keys(members);
                        const equalRatio = Math.floor(100 / mems.length);
                        mems.forEach((uid, index) => {
                          const ratio = index === mems.length - 1 ? (100 - (equalRatio * (mems.length - 1))) : equalRatio;
                          updateData[`members.${uid}.customRatio`] = ratio;
                        });
                        await updateDoc(fundRef, updateData);
                      }}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      ✓ Đồng đều lại %
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Members Contribution List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Thành viên & Định mức</h4>
              <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full font-bold">
                {memberList.length} thành viên
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {memberList.map((m) => {
                // Core Calculations for plan contribution
                let calculatedRatio = 0;
                if (contributionMode === 'custom') {
                  calculatedRatio = (m.customRatio || 0) / 100;
                  if (totalCustomRatio > 0 && totalCustomRatio !== 100) {
                    calculatedRatio = (m.customRatio || 0) / totalCustomRatio;
                  }
                } else if (contributionMode === 'equal') {
                  calculatedRatio = 1 / memberList.length;
                } else {
                  // income ratio division
                  calculatedRatio = totalIncome > 0 ? (m.income || 0) / totalIncome : 1 / memberList.length;
                }

                const expectedContribution = targetBudget * calculatedRatio;
                const actualContributed = (m.income || 0) * (m.contributionPercent / 100);
                const isMetTarget = actualContributed >= expectedContribution;
                const variance = actualContributed - expectedContribution;
                
                // percentage of fulfilment
                const fulfilmentPercent = expectedContribution > 0 ? (actualContributed / expectedContribution) * 100 : 100;

                const isMe = m.uid === user.uid;

                return (
                  <div 
                    key={m.uid} 
                    className={`bg-white rounded-2xl p-4 shadow-xs border transition-all ${
                      isMe 
                        ? 'border-orange-400 ring-2 ring-orange-500/5 shadow-md shadow-orange-500/5' 
                        : 'border-neutral-200/60 hover:border-neutral-300'
                    } space-y-4`}
                  >
                    {/* Header of member card */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold font-mono shrink-0">
                          {m.displayName ? m.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-neutral-800 leading-tight">{m.displayName}</span>
                            {isMe && (
                              <span className="inline-flex items-center text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                Bạn
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {m.role === 'owner' ? 'Trưởng nhóm' : 'Thành viên'}
                          </span>
                        </div>
                      </div>

                      {/* Goal Met Status Badge */}
                      <div className="text-right">
                        {isMetTarget ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đủ chỉ tiêu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50/70 text-orange-700 border border-orange-100/70">
                            Thiếu {formatMoney(Math.abs(variance), 0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Adaptive content based on current active settings */}
                    <div className="space-y-4">
                      {/* Section 1: Financial Capacity inputs */}
                      <div className="grid grid-cols-2 gap-4 bg-neutral-50/60 p-3 rounded-xl border border-neutral-100">
                        {/* Monthly Income input (only editable if me) */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block">Thu nhập hằng tháng</span>
                          {isMe ? (
                            <div className="space-y-1">
                              <div className="relative">
                                <input 
                                  type="number"
                                  placeholder="Nhập lương..."
                                  value={myIncomeSync}
                                  onChange={(e) => setMyIncomeSync(e.target.value)}
                                  onBlur={(e) => handleUpdateIncome(e.target.value)}
                                  className="w-full bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg py-1 px-2 pr-6 text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono font-bold text-neutral-800"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400">đ</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (!user) return;
                                  const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'income'));
                                  const snap = await getDocs(q);
                                  const totalInc = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
                                  handleUpdateIncome(totalInc.toString());
                                }}
                                className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded bg-orange-50 hover:bg-orange-100 text-[8px] font-bold text-orange-700 transition-all"
                              >
                                <RefreshCw className="w-2 h-2" />
                                Lấy từ thu nhập
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-bold font-mono text-neutral-800 pt-1">
                              {formatMoney(Number(m.income) || 0)}
                            </div>
                          )}
                        </div>

                        {/* Custom Ratio configuration editable ONLY by owner in custom mode */}
                        <div className="space-y-1.5 border-l pl-3 border-neutral-200">
                          {contributionMode === 'custom' ? (
                            <>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block">Tỉ lệ được phân công</span>
                              {sharedFundDoc?.ownerId === user.uid ? (
                                <div className="relative">
                                  <input 
                                    type="number"
                                    defaultValue={m.customRatio}
                                    onBlur={(e) => handleUpdateCustomRatio(m.uid, e.target.value)}
                                    className="w-full bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg py-1 px-2 pr-6 text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono font-bold text-neutral-800"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-[9px]">%</span>
                                </div>
                              ) : (
                                <div className="text-xs font-bold font-mono text-neutral-800 pt-1">
                                  {(calculatedRatio * 100).toFixed(0)}%
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block">Tự động phân bổ</span>
                              <div className="pt-1">
                                <span className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100/50">
                                  {(calculatedRatio * 100).toFixed(0)}% gánh nặng
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Section 2: Actual agreed commitments */}
                      <div className="space-y-2 p-3 bg-neutral-50/30 rounded-xl border border-neutral-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">Mức đóng góp tự nguyện (% thu nhập)</span>
                          <span className="text-xs font-mono font-extrabold text-orange-600">{m.contributionPercent}%</span>
                        </div>

                        {(isMe || sharedFundDoc?.ownerId === user.uid) ? (
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={m.contributionPercent}
                              onChange={(e) => handleUpdateContributionPercent(m.uid, e.target.value)}
                              className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
                            />
                            <div className="relative w-16">
                              <input 
                                type="number"
                                value={m.contributionPercent}
                                onChange={(e) => handleUpdateContributionPercent(m.uid, e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-md p-1 pr-4 text-center text-xs font-bold font-mono outline-none"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400 font-mono">%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                            <div style={{ width: `${m.contributionPercent}%` }} className="h-full bg-orange-400 rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Section 3: Side-by-side targets & progress bars */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-neutral-50/40 p-2 rounded-lg border border-neutral-100/60">
                            <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wide">Yêu cầu kế hoạch</span>
                            <span className="font-extrabold font-mono text-neutral-700 block mt-0.5">{formatMoney(expectedContribution)}</span>
                          </div>
                          <div className="bg-orange-50/35 p-2 rounded-lg border border-orange-100/30">
                            <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wide">CAM KẾT THỰC ĐÓNG</span>
                            <span className="font-extrabold font-mono text-orange-600 block mt-0.5">{formatMoney(actualContributed)}</span>
                          </div>
                        </div>

                        {/* Individual completion path timeline */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-neutral-400 font-bold uppercase">
                            <span>Tỷ lệ hoàn thành định mức</span>
                            <span className={isMetTarget ? 'text-emerald-700 font-bold' : 'text-neutral-600 font-bold'}>
                              {fulfilmentPercent.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden relative border border-neutral-200/10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, fulfilmentPercent)}%` }}
                              className={`h-full rounded-full ${isMetTarget ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-orange-400 to-amber-500'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregate Stats Area */}
          <div className="pt-4 border-t border-orange-200/60 mt-4 space-y-4">
            {totalIncome > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50/40 p-4 rounded-2xl border border-orange-200/40 flex justify-between items-center sm:px-5">
                <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">Tổng thu nhập toàn gia đình</span>
                <span className="text-lg font-extrabold font-mono text-orange-850">{formatMoney(totalIncome)}</span>
              </div>
            )}

            {/* Custom Interactive SVG Contribution Chart */}
            <div className="bg-white p-5 rounded-2xl border border-orange-150/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500" />
                <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Tỷ trọng gánh nặng đóng góp chung</p>
              </div>

              {/* Horizontal split representation bar */}
              <div className="space-y-4">
                <div className="h-5 rounded-lg overflow-hidden flex shadow-inner border border-neutral-100">
                  {memberList.map((m, index) => {
                    let ratio = 0;
                    if (contributionMode === 'custom') {
                      ratio = (m.customRatio || 0) / 100;
                      if (totalCustomRatio > 0 && totalCustomRatio !== 100) {
                        ratio = (m.customRatio || 0) / totalCustomRatio;
                      }
                    } else if (contributionMode === 'equal') {
                      ratio = 1 / memberList.length;
                    } else {
                      ratio = totalIncome > 0 ? (m.income || 0) / totalIncome : 1 / memberList.length;
                    }

                    // Colors array
                    const colors = ['bg-orange-500', 'bg-amber-400', 'bg-emerald-500', 'bg-neutral-600'];
                    const colorClass = colors[index % colors.length];

                    if (ratio <= 0) return null;

                    return (
                      <div 
                        key={m.uid} 
                        title={`${m.displayName}: ${(ratio * 100).toFixed(0)}%`}
                        style={{ width: `${ratio * 100}%` }} 
                        className={`${colorClass} h-full transition-all duration-300 relative group flex items-center justify-center`}
                      >
                        <span className="text-[9px] text-white font-extrabold font-mono opacity-80 select-none">
                          {m.displayName ? m.displayName.slice(0, 2).toUpperCase() : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legends */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {memberList.map((m, index) => {
                    let ratio = 0;
                    if (contributionMode === 'custom') {
                      ratio = (m.customRatio || 0) / 100;
                      if (totalCustomRatio > 0 && totalCustomRatio !== 100) {
                        ratio = (m.customRatio || 0) / totalCustomRatio;
                      }
                    } else if (contributionMode === 'equal') {
                      ratio = 1 / memberList.length;
                    } else {
                      ratio = totalIncome > 0 ? (m.income || 0) / totalIncome : 1 / memberList.length;
                    }

                    const colors = ['bg-orange-500', 'bg-amber-400', 'bg-emerald-500', 'bg-neutral-600'];
                    const dotColorClass = colors[index % colors.length];
                    
                    const plannedShare = targetBudget * ratio;
                    const actualShare = (m.income || 0) * (m.contributionPercent / 100);

                    return (
                      <div key={m.uid} className="bg-orange-50/20 border border-orange-100/50 rounded-xl p-3 flex flex-col justify-between space-y-1.5 hover:shadow-xs transition-all">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${dotColorClass} shrink-0`} />
                          <span className="text-[11px] font-bold text-neutral-700 truncate">{m.displayName}</span>
                          <span className="text-[10px] font-bold text-neutral-400 shrink-0 font-mono ml-auto">({(ratio * 100).toFixed(0)}%)</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-neutral-100 text-[10px] font-mono leading-tight">
                          <div>
                            <span className="text-neutral-400 block text-[8px] uppercase tracking-wide">Yêu cầu</span>
                            <span className="font-bold text-neutral-600 block mt-0.5">{formatMoney(plannedShare, 0)}</span>
                          </div>
                          <div className="border-l pl-2 border-neutral-200">
                            <span className="text-neutral-400 block text-[8px] uppercase tracking-wide">Thực tế</span>
                            <span className="font-bold text-orange-600 block mt-0.5">{formatMoney(actualShare, 0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="card p-6 md:p-8"
          >
             <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-xl font-bold text-neutral-900">Các phần quỹ gia đình</h3>
                  <p className="text-neutral-500 text-sm mt-1">Tổng phân bổ: <span className={`font-semibold ${totalPercent > 100 ? 'text-orange-500' : totalPercent === 100 ? 'text-neutral-500' : ''}`}>{totalPercent}%</span></p>
               </div>
               <button 
                 onClick={() => setIsAddingMode(true)}
                 className="w-10 h-10 bg-neutral-50 rounded-full bg-neutral-50 text-neutral-600 flex items-center justify-center hover:bg-neutral-100 transition-colors"
               >
                 <Plus className="w-5 h-5" />
               </button>
             </div>
             
             <AnimatePresence>
               {isAddingMode && (
                 <motion.div
                   initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                   animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                   exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                   className="overflow-hidden"
                 >
                   <div className="bg-neutral-50/50 rounded-3xl p-4 border border-neutral-100 mb-4">
                     <div className="flex justify-between items-center mb-4">
                       <h4 className="font-bold text-neutral-900">Tạo quỹ mới</h4>
                       <button onClick={() => setIsAddingMode(false)} className="text-neutral-400 hover:text-neutral-600">
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                     <div className="space-y-4">
                       <div>
                         <label className="text-xs font-semibold text-neutral-800 mb-1 block">Tên quỹ</label>
                         <input
                           type="text"
                           value={newFundName}
                           onChange={(e) => setNewFundName(e.target.value)}
                           className="w-full bg-white border border-neutral-100 rounded-3xl p-2.5 text-sm focus:ring-2 focus:ring-neutral-500 outline-none"
                           placeholder="Ví dụ: Du lịch gia đình"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-neutral-800 mb-1 block">Phần trăm (%)</label>
                         <input
                           type="number"
                           value={newFundPercent}
                           onChange={(e) => setNewFundPercent(e.target.value)}
                           className="w-full bg-white border border-neutral-100 rounded-3xl p-2.5 text-sm focus:ring-2 focus:ring-neutral-500 outline-none"
                           placeholder="Ví dụ: 10"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-neutral-800 mb-2 block">Biểu tượng</label>
                         <div className="flex gap-2 flex-wrap">
                           {(Object.keys(availableIcons) as IconName[]).map((name) => {
                             const Icon = availableIcons[name].icon;
                             const color = availableIcons[name].color;
                             const bg = availableIcons[name].bg;
                             const border = availableIcons[name].border;
                             const isSelected = newFundIcon === name;
                             
                             return (
                               <button
                                 key={name}
                                 onClick={() => setNewFundIcon(name)}
                                 className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? `${bg} border-2 ${border}` : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}
                               >
                                 <Icon className={`w-5 h-5 ${isSelected ? color : 'text-neutral-500'}`} />
                               </button>
                             );
                           })}
                         </div>
                       </div>
                       <button
                         onClick={handleAddFund}
                         disabled={!newFundName.trim() || !newFundPercent}
                         className="w-full bg-neutral-600 text-white rounded-3xl py-2.5 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700"
                       >
                         Lưu quỹ mới
                       </button>
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <AnimatePresence>
                 {funds.map((fund) => {
                   const iconConfig = availableIcons[fund.iconName];
                   const FundIcon = iconConfig.icon;
                   const allocatedAmount = parsedSharedTotal > 0 ? (parsedSharedTotal * fund.percent) / 100 : 0;
                   return (
                     <motion.div 
                       layout
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       key={fund.id} 
                       className={`p-5 rounded-3xl border ${iconConfig.border} flex flex-col transition-all hover:shadow-lg bg-white relative overflow-hidden group`}
                     >
                       <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 transition-transform group-hover:scale-110 ${iconConfig.bg}`} />
                       
                       <button 
                         onClick={() => removeFund(fund.id)}
                         className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/50 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all z-20"
                       >
                         <X className="w-4 h-4" />
                       </button>

                       <div className="flex items-start justify-between relative z-10 mb-4 pr-8">
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${iconConfig.bg} border ${iconConfig.border}`}>
                           <FundIcon className={`w-6 h-6 ${iconConfig.color}`} />
                         </div>
                         <div className={`px-2.5 py-1 ${iconConfig.bg} rounded-3xl border ${iconConfig.border}`}>
                           <div className={`flex items-center gap-0.5`}>
                             <input type="number" defaultValue={fund.percent || 0} onBlur={(e) => handleUpdateFundPercent(fund.id, e.target.value)} className={`w-8 text-center bg-transparent outline-none text-sm font-bold ${iconConfig.color}`} />
                             <span className={`text-sm font-bold ${iconConfig.color}`}>%</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="relative z-10 flex-1 flex flex-col justify-between">
                         <h4 className="text-[15px] font-bold text-neutral-900 leading-snug mb-4">{fund.name}</h4>
                         
                         <div className="pt-3 border-t border-neutral-100">
                           {parsedSharedTotal > 0 ? (
                             <div>
                               <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Phân bổ</p>
                               <div className={`text-lg font-mono font-bold ${iconConfig.color}`}>{formatMoney(allocatedAmount)}</div>
                             </div>
                           ) : (
                             <div className="h-[46px] flex items-center">
                               <p className="text-xs text-neutral-400 font-medium">Nhập chi tiêu chung để xem số tiền</p>
                             </div>
                           )}
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-neutral-900 p-8 rounded-3xl text-white shadow-xl flex items-center justify-between"
          >
             <div>
                <h3 className="text-lg font-bold mb-2">Lời khuyên gia đình</h3>
                <p className="text-neutral-200 text-sm max-w-xs leading-relaxed">Luôn đảm bảo đóng góp quỹ chung công bằng để duy trì hạnh phúc dài lâu.</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-white" />
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

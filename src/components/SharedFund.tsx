import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, PieChart, Info, ArrowRight, Home, GraduationCap, ShieldCheck, Plane, Car, Plus, X, Wallet, Heart, ShoppingCart, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, arrayUnion, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const availableIcons = {
  Home: { icon: Home, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  GraduationCap: { icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  ShieldCheck: { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  Car: { icon: Car, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
  Plane: { icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100' },
  Wallet: { icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  Heart: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
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
  const [sharedFundDoc, setSharedFundDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Record<string, { role: string, income: number, displayName: string }>>({});
  const [funds, setFunds] = useState<Fund[]>([]);
  const [myIncomeSync, setMyIncomeSync] = useState<string>('');

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
      members: {
        [user.uid]: {
          role: 'owner',
          income: 0,
          displayName: user.displayName || 'Trưởng nhóm'
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

  const memberList = Object.entries(members || {}).map(([uid, m]) => {
    const mem = m as any;
    return { uid, role: mem?.role, income: mem?.income, displayName: mem?.displayName };
  });
  const totalIncome = memberList.reduce((acc, m) => acc + (m.income || 0), 0);
  const parsedSharedTotal = totalIncome;

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

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>;
  }

  if (!sharedFundDoc) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto flex flex-col items-center justify-center py-20 px-4">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
          <Users className="w-12 h-12 text-indigo-500" />
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            <span className="text-sm font-semibold">{isCopied ? 'Đã sao chép link' : 'Thêm thành viên'}</span>
          </button>
          
          {confirmDeleteId === 'fund' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600">Thật sự rời/xóa?</span>
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
                className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="p-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmDeleteId('fund')}
              className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Rời/Xóa nhóm"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 rounded-[2rem] p-8 shadow-sm border border-amber-200 h-fit"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500 text-white rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">Chi Tiêu Chung & Đóng Góp</h3>
              <p className="text-sm text-amber-700">Tổng hợp thu nhập để quy ra quỹ gia đình</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {memberList.map((m) => (
                <div key={m.uid} className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">{m.displayName} {m.role === 'owner' ? '(Trưởng nhóm)' : ''}</label>
                    {m.uid === user.uid ? (
                      <input 
                        type="number"
                        placeholder="Nhập thu nhập của bạn..."
                        value={myIncomeSync}
                        onChange={(e) => setMyIncomeSync(e.target.value)}
                        onBlur={(e) => handleUpdateIncome(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono font-medium"
                      />
                    ) : (
                      <div className="text-lg font-mono font-bold text-neutral-900">{Number(m.income).toLocaleString()}đ</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {totalIncome > 0 && (
              <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-amber-900">Tổng thu nhập gia đình</span>
                <span className="text-xl font-bold font-mono text-amber-700">{totalIncome.toLocaleString()}đ</span>
              </div>
            )}

            {parsedSharedTotal > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-amber-200 mt-4 space-y-4"
              >
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between">
                  <div className="space-y-2 w-full">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Tỷ trọng đóng góp các nguồn</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {memberList.map(m => {
                        const ratio = totalIncome > 0 ? (m.income || 0) / totalIncome : 1 / memberList.length;
                        const propShare = parsedSharedTotal * ratio;
                        return (
                          <div key={m.uid} className="bg-amber-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-neutral-500 mb-1 truncate">{m.displayName} ({(ratio * 100).toFixed(0)}%)</p>
                            <p className="text-sm sm:text-base font-mono font-bold text-amber-700 truncate">{propShare.toLocaleString(undefined, { maximumFractionDigits: 0 })}đ</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-amber-100 flex items-center justify-between opacity-70">
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Góp đều</p>
                    <p className="text-sm font-semibold text-neutral-800">Mỗi nguồn góp:</p>
                  </div>
                  <span className="font-mono font-bold text-amber-600 text-lg">{(parsedSharedTotal / memberList.length).toLocaleString()}đ</span>
                </div>
              </motion.div>
            )}
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
                  <p className="text-neutral-500 text-sm mt-1">Tổng phân bổ: <span className={`font-semibold ${totalPercent > 100 ? 'text-red-500' : totalPercent === 100 ? 'text-green-500' : ''}`}>{totalPercent}%</span></p>
               </div>
               <button 
                 onClick={() => setIsAddingMode(true)}
                 className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
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
                   <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 mb-4">
                     <div className="flex justify-between items-center mb-4">
                       <h4 className="font-bold text-indigo-900">Tạo quỹ mới</h4>
                       <button onClick={() => setIsAddingMode(false)} className="text-indigo-400 hover:text-indigo-600">
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                     <div className="space-y-4">
                       <div>
                         <label className="text-xs font-semibold text-indigo-800 mb-1 block">Tên quỹ</label>
                         <input
                           type="text"
                           value={newFundName}
                           onChange={(e) => setNewFundName(e.target.value)}
                           className="w-full bg-white border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                           placeholder="Ví dụ: Du lịch gia đình"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-indigo-800 mb-1 block">Phần trăm (%)</label>
                         <input
                           type="number"
                           value={newFundPercent}
                           onChange={(e) => setNewFundPercent(e.target.value)}
                           className="w-full bg-white border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                           placeholder="Ví dụ: 10"
                         />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-indigo-800 mb-2 block">Biểu tượng</label>
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
                                 className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isSelected ? `${bg} border-2 ${border}` : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}
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
                         className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
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
                       className={`p-5 rounded-[1.5rem] border ${iconConfig.border} flex flex-col transition-all hover:shadow-lg bg-white relative overflow-hidden group`}
                     >
                       <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 transition-transform group-hover:scale-110 ${iconConfig.bg}`} />
                       
                       <button 
                         onClick={() => removeFund(fund.id)}
                         className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/50 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all z-20"
                       >
                         <X className="w-4 h-4" />
                       </button>

                       <div className="flex items-start justify-between relative z-10 mb-4 pr-8">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${iconConfig.bg} border ${iconConfig.border}`}>
                           <FundIcon className={`w-6 h-6 ${iconConfig.color}`} />
                         </div>
                         <div className={`px-2.5 py-1 ${iconConfig.bg} rounded-lg border ${iconConfig.border}`}>
                           <span className={`text-sm font-bold ${iconConfig.color}`}>{fund.percent}%</span>
                         </div>
                       </div>
                       
                       <div className="relative z-10 flex-1 flex flex-col justify-between">
                         <h4 className="text-[15px] font-bold text-neutral-900 leading-snug mb-4">{fund.name}</h4>
                         
                         <div className="pt-3 border-t border-neutral-100">
                           {parsedSharedTotal > 0 ? (
                             <div>
                               <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 mb-1">Phân bổ</p>
                               <div className={`text-lg font-mono font-bold ${iconConfig.color}`}>{allocatedAmount.toLocaleString()}đ</div>
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
             className="bg-indigo-900 p-8 rounded-[2rem] text-white shadow-xl flex items-center justify-between"
          >
             <div>
                <h3 className="text-lg font-bold mb-2">Lời khuyên gia đình</h3>
                <p className="text-indigo-200 text-sm max-w-xs leading-relaxed">Luôn đảm bảo đóng góp quỹ chung công bằng để duy trì hạnh phúc dài lâu.</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-white" />
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

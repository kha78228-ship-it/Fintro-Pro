import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, Layout, Type, Palette, AlertTriangle, Download, MonitorDown, Smartphone, UserCircle, Shield, KeySquare, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface SettingsProps {
  user?: any;
  backgroundImage: string;
  setBackgroundImage: (url: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  chartPalette: string;
  setChartPalette: (palette: string) => void;
  onDeleteData: () => void;
  onDownloadData: () => void;
}

const PRESET_BACKGROUNDS = [
  { id: 'none', url: '', label: 'Mặc định' },
  { id: 'gradient-1', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop', label: 'Hoàng hôn' },
  { id: 'gradient-2', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop', label: 'Tím mộng mơ' },
  { id: 'nature', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop', label: 'Thiên nhiên' },
  { id: 'minimal', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', label: 'Minimal Biển' },
  { id: 'dark', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop', label: 'Đêm tối' },
  { id: 'mesh', url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=400&auto=format&fit=crop', label: 'Mesh hồng' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400&auto=format&fit=crop', label: 'Rừng xanh' },
  { id: 'abstract', url: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?q=80&w=400&auto=format&fit=crop', label: 'Art cam' },
  { id: 'city', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=400&auto=format&fit=crop', label: 'Thành phố' }
];

const FONTS = [
  { id: 'Inter', label: 'Inter (Mặc định)' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Nunito', label: 'Nunito' },
  { id: 'Quicksand', label: 'Quicksand' },
  { id: 'Lora', label: 'Lora (Cổ điển)' },
  { id: 'Merriweather', label: 'Merriweather' },
];

const COLORS = [
  { id: '#1a1a1a', label: 'Đen nhạt (Mặc định)', bg: 'bg-[#1a1a1a]' },
  { id: '#3b82f6', label: 'Xanh lam', bg: 'bg-blue-500' },
  { id: '#10b981', label: 'Xanh ngọc', bg: 'bg-emerald-500' },
  { id: '#8b5cf6', label: 'Tím', bg: 'bg-violet-500' },
  { id: '#f43f5e', label: 'Hồng', bg: 'bg-rose-500' },
  { id: '#d97706', label: 'Cam', bg: 'bg-amber-600' },
];

const CHART_PALETTES = [
  { id: 'default', label: 'Mặc định', colors: ['#171717', '#22c55e', '#4f46e5'] },
  { id: 'ocean', label: 'Đại dương', colors: ['#0ea5e9', '#10b981', '#3b82f6'] },
  { id: 'sunset', label: 'Hoàng hôn', colors: ['#f43f5e', '#f59e0b', '#e11d48'] },
  { id: 'pastel', label: 'Pastel', colors: ['#fca5a5', '#86efac', '#93c5fd'] },
  { id: 'monochrome', label: 'Tối giản', colors: ['#525252', '#a3a3a3', '#171717'] },
];

export default function SettingsView({ 
  user,
  backgroundImage, 
  setBackgroundImage,
  fontFamily,
  setFontFamily,
  textColor,
  setTextColor,
  chartPalette,
  setChartPalette,
  onDeleteData,
  onDownloadData
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [customInput, setCustomInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Account settings
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [isCycleVisibleToPartner, setIsCycleVisibleToPartner] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  
  // Invite codes admin only
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [adminDurationHours, setAdminDurationHours] = useState(24);

  useEffect(() => {
     const interval = setInterval(() => setNow(Date.now()), 1000);
     return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     let unsubAdminStatus: any;
     let unsubAdminsList: any;

     if (user) {
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        getDoc(doc(db, 'users', user.uid)).then(snap => {
           if (snap.exists()) {
             const data = snap.data();
             setNickname(data.nickname || '');
             setGender(data.gender || '');
             setIsCycleVisibleToPartner(data.isCycleVisibleToPartner || false);
             setRoomCode(data.friendCode || '');
           }
        });

        const superAdmin = user.email?.toLowerCase() === 'kha78228@gmail.com';
        setIsSuperAdmin(superAdmin);

        unsubAdminStatus = onSnapshot(doc(db, 'admins', user.uid), (snap) => {
            if (superAdmin) {
                setIsAdmin(true);
            } else if (snap.exists()) {
                const data = snap.data();
                if (data.expiresAt > Date.now()) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        });

        if (superAdmin) {
            unsubAdminsList = onSnapshot(collection(db, 'admins'), snap => {
                setAdminList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        }
     }
     return () => { 
       if (unsubAdminStatus) unsubAdminStatus(); 
       if (unsubAdminsList) unsubAdminsList();
     }
  }, [user]);

  useEffect(() => {
     let unsub: any;
     let unsubUsers: any;
     if (isAdmin) {
        unsub = onSnapshot(collection(db, 'invite_codes'), snap => {
            setInviteCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error("Admin user list error", err);
        });
     }
     return () => {
         if (unsub) unsub();
         if (unsubUsers) unsubUsers();
     }
  }, [isAdmin]);

  const handleUpdateProfile = async () => {
     if (!displayName.trim() || !user) return;
     setIsSavingProfile(true);
     try {
        await updateProfile(user, { displayName, photoURL });
        await setDoc(doc(db, 'users', user.uid), { displayName, photoURL, nickname, gender, isCycleVisibleToPartner }, { merge: true });
        await setDoc(doc(db, 'publicProfiles', user.uid), { displayName, photoURL, status: 'online', gender, isCycleVisibleToPartner }, { merge: true });
        alert('Cập nhật tài khoản thành công!');
     } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
     } finally {
        setIsSavingProfile(false);
     }
  };

  const handleAddAdmin = async () => {
     if (!newAdminUserId.trim() || !user) return;
     try {
        const expiresAt = Date.now() + adminDurationHours * 3600000;
        await setDoc(doc(db, 'admins', newAdminUserId.trim()), {
           grantedBy: user.uid,
           expiresAt: expiresAt,
           createdAt: serverTimestamp()
        });
        setNewAdminUserId('');
        alert('Cấp quyền quản trị viên phụ thành công!');
     } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `admins/${newAdminUserId}`);
     }
  };

  const handleRemoveAdmin = async (adminId: string) => {
     if (!user || !window.confirm('Bạn có chắc muốn gỡ quyền quản trị của người này?')) return;
     try {
        await deleteDoc(doc(db, 'admins', adminId));
     } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `admins/${adminId}`);
     }
  };

  const generateInviteCode = async () => {
     try {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'invite_codes', id), {
           createdAt: serverTimestamp(),
           createdBy: user.email,
           expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
           uses: 0,
           type: 'google_invite'
        });
     } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'invite_codes');
     }
  };

  const generateAnonymousCode = async () => {
     try {
        const id = Math.floor(100 + Math.random() * 900).toString();
        await setDoc(doc(db, 'invite_codes', id), {
           createdAt: serverTimestamp(),
           createdBy: user.email,
           expiresAt: Date.now() + 24 * 3600 * 1000,
           uses: 0,
           type: 'anonymous'
        });
     } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'invite_codes');
     }
  };

  const deleteInviteCode = async (id: string) => {
     try {
        await deleteDoc(doc(db, 'invite_codes', id));
     } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `invite_codes/${id}`);
     }
  };

  const deleteUserAccount = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá người dùng ${name} (ID: ${id}) không? Hành động này sẽ xoá dữ liệu hồ sơ của họ.`)) return;
    try {
        await deleteDoc(doc(db, 'users', id));
        await deleteDoc(doc(db, 'publicProfiles', id));
        alert('Đã xoá tài khoản thành công!');
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  };

  const migrateFriendCodes = async () => {
    if (!confirm('Bạn có chắc muốn đồng bộ ID cho tất cả người dùng không?')) return;
    try {
        // Fetch all users
        const usersSnap = await getDocs(collection(db, 'users'));
        let updatedCount = 0;
        
        console.log(`Starting migration for ${usersSnap.docs.length} users.`);

        for (const userDoc of usersSnap.docs) {
            // Generate a random 6-digit numeric code
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`Assigning new friendCode: ${newCode} to user: ${userDoc.id}`);
            
            await setDoc(userDoc.ref, { friendCode: newCode }, { merge: true });
            await setDoc(doc(db, 'publicProfiles', userDoc.id), { friendCode: newCode, displayName: userDoc.data().displayName || 'Khách' }, { merge: true });
            
            updatedCount++;
        }
        alert(`Đã hoàn tất đồng bộ! Đã cập nhật cho ${updatedCount} người dùng.`);
    } catch (e) {
        console.error("Error during migration:", e);
        handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleSaveCustom = () => {
    if (customInput.trim()) {
      setBackgroundImage(customInput);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Cài đặt</h2>
          <p className="text-neutral-500 mt-1">Quản lý tài khoản, giao diện và dữ liệu.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
         <button onClick={() => setActiveTab('account')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'account' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-100/50 text-neutral-600 hover:bg-neutral-200/50'}`}>Tài khoản</button>
         <button onClick={() => setActiveTab('appearance')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'appearance' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-100/50 text-neutral-600 hover:bg-neutral-200/50'}`}>Giao diện</button>
         <button onClick={() => setActiveTab('data')} className={`whitespace-nowrap px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'data' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-100/50 text-neutral-600 hover:bg-neutral-200/50'}`}>Dữ liệu & Ngoại tuyến</button>
      </div>

      {activeTab === 'account' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="card p-8 space-y-6 max-w-2xl">
               <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
                  <UserCircle className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-neutral-900">Hồ sơ cá nhân</h3>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-200">
                        {photoURL ? <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-indigo-500">{displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>}
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Đường dẫn ảnh (URL)</label>
                        <input type="text" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 font-mono text-sm" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Tên hiển thị</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ví dụ: Hoàng Khang" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Biệt danh</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ví dụ: Gấu Béo" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Giới tính</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
                           <option value="">Chọn giới tính</option>
                           <option value="male">Nam</option>
                           <option value="female">Nữ</option>
                        </select>
                     </div>
                     {gender === 'female' && (
                       <div className="flex items-center gap-2 pt-6">
                          <input type="checkbox" checked={isCycleVisibleToPartner} onChange={(e) => setIsCycleVisibleToPartner(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <label className="text-sm text-neutral-700">Chia sẻ kỳ kinh nguyệt với người yêu</label>
                       </div>
                     )}
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Mã tham gia không gian chung (3 số)</label>
                     <div className="flex gap-2">
                       <input type="text" value={roomCode || 'Đang tải...'} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-700 font-mono tracking-widest cursor-default" />
                       <button onClick={() => { navigator.clipboard.writeText(roomCode); alert('Đã copy!'); }} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-neutral-800 transition">
                         Copy
                       </button>
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Phiên ẩn danh</label>
                     <input type="text" value={user?.isAnonymous ? 'Đang sử dụng phiên ẩn danh' : (user?.email || 'Phiên ẩn danh')} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-2 text-sm text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                     <button onClick={() => signOut(auth)} className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-lg font-bold transition-colors">
                        Đăng xuất
                     </button>
                     <button onClick={handleUpdateProfile} disabled={isSavingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50">
                        {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                     </button>
                  </div>
               </div>
            </div>

            {isAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-rose-500" />
                        <h3 className="text-lg font-bold text-neutral-900">Quản trị viên (Mã mời)</h3>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={generateAnonymousCode} className="bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors">Tạo Mã Ẩn Danh (3 số)</button>
                       <button onClick={generateInviteCode} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors">Tạo Mã Tham Gia (6 chữ)</button>
                       <button onClick={migrateFriendCodes} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors">Đồng bộ ID</button>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {inviteCodes.map(code => {
                        const createdAt = code.createdAt?.toDate ? code.createdAt.toDate().getTime() : code.createdAt ? new Date(code.createdAt).getTime() : 0;
                        const timeLeft = 3600000 - (now - createdAt);
                        const timeLeftStr = timeLeft > 0 ? `${Math.floor(timeLeft / 60000)}:${Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0')}` : 'Hết hạn';
                        const maxUses = code.type === 'anonymous' ? (code.createdBy === 'kha78228@gmail.com' ? 1 : 2) : 10;
                        const usage = code.uses || 0;
                        
                        return (
                         <div key={code.id} className="bg-white border border-rose-200 rounded-xl p-4 flex flex-col justify-between">
                            <div className="text-2xl font-mono tracking-widest font-bold text-neutral-900 text-center mb-2">{code.id}</div>
                            <div className="text-xs text-center text-neutral-600 mb-2">Lượt: {usage}/{maxUses}</div>
                            <div className={`text-xs text-center font-bold mb-2 ${timeLeft > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Hết hạn trong: {timeLeftStr}</div>
                            <button onClick={(e) => { const target = e.currentTarget; target.innerText = 'Đã chép!'; navigator.clipboard.writeText(code.id); setTimeout(() => { target.innerText = 'Copy'; }, 2000); }} className="w-full bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 py-2 rounded-lg mb-2 cursor-pointer transition-colors text-center border border-neutral-200">Copy</button>
                            <button onClick={() => deleteInviteCode(code.id)} className="w-full text-xs font-semibold text-rose-500 hover:text-rose-600 flex justify-center items-center gap-1">
                               <AlertTriangle className="w-3 h-3" /> Thu hồi
                            </button>
                         </div>
                        );
                     })}
                     {inviteCodes.length === 0 && <p className="text-sm text-neutral-500 col-span-full">Chưa có mã mời nào.</p>}
                  </div>
               </div>
            )}

             {isAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl mt-8">
                  <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                     <div className="flex items-center gap-3">
                        <UserCircle className="w-5 h-5 text-rose-500" />
                        <h3 className="text-lg font-bold text-neutral-900">Người dùng hệ thống</h3>
                     </div>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {allUsers.map(u => (
                          <div key={u.id} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between">
                             <div>
                                 <div className="font-bold text-neutral-900">{u.displayName || 'Khách'} <span className="text-xs text-neutral-400 font-mono">({u.friendCode || 'Chưa đồng bộ'})</span></div>
                                 <div className="text-sm text-neutral-500">{u.email}</div>
                             </div>
                             <button onClick={() => deleteUserAccount(u.id, u.displayName || u.email)} className="text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors">
                                 Xoá
                             </button>
                          </div>
                      ))}
                      {allUsers.length === 0 && <p className="text-sm text-neutral-500">Chưa có dữ liệu người dùng.</p>}
                  </div>
               </div>
            )}

            {isSuperAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl mt-8 bg-indigo-50/30 border border-indigo-100">
                  <div className="flex justify-between items-center mb-6 border-b border-indigo-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-indigo-900">Quản trị viên ủy quyền (Phụ)</h3>
                     </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <select 
                      value={newAdminUserId}
                      onChange={e => setNewAdminUserId(e.target.value)}
                      className="input-field flex-1 text-sm font-medium"
                    >
                      <option value="">-- Chọn tài khoản cấp quyền --</option>
                      {allUsers.filter(u => u.id !== user?.uid).map(u => (
                         <option key={u.id} value={u.id}>
                            {u.displayName || 'Không tên'} - {u.email || u.id}
                         </option>
                      ))}
                    </select>
                    <select 
                      value={adminDurationHours}
                      onChange={e => setAdminDurationHours(Number(e.target.value))}
                      className="input-field w-32"
                    >
                      <option value={1}>1 giờ</option>
                      <option value={24}>1 ngày</option>
                      <option value={72}>3 ngày</option>
                      <option value={168}>7 ngày</option>
                    </select>
                    <button 
                      onClick={handleAddAdmin}
                      disabled={!newAdminUserId}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg disabled:opacity-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      Cấp Quyền
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-neutral-700">Danh sách quản trị viên:</h4>
                    {adminList.map(adm => {
                       const exp = new Date(adm.expiresAt);
                       const isExpired = Date.now() > adm.expiresAt;
                       const usrInfo = allUsers.find(u => u.id === adm.id);
                       
                       return (
                         <div key={adm.id} className={`p-4 rounded-xl border ${isExpired ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-indigo-200 shadow-sm'} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                                  <Shield className="w-5 h-5 text-indigo-500" />
                               </div>
                               <div>
                                  <div className="font-bold text-neutral-900 mb-0.5">{usrInfo ? usrInfo.displayName : adm.id}</div>
                                  {usrInfo && usrInfo.email && <div className="text-xs text-neutral-500 mb-1">{usrInfo.email}</div>}
                                  <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded inline-block ${isExpired ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                     {isExpired ? 'Đã hết hạn' : `Tới: ${exp.toLocaleString()}`}
                                  </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveAdmin(adm.id)}
                              className="p-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                              title="Gỡ quyền"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                       );
                    })}
                    {adminList.length === 0 && (
                        <div className="text-center py-6 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed">
                           <Shield className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                           <p className="text-sm font-medium text-neutral-500">Chưa có quản trị viên phụ nào.</p>
                        </div>
                    )}
                  </div>
               </div>
            )}
         </motion.div>
      )}

      {activeTab === 'appearance' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 space-y-6"
            >
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-neutral-900">Tùy Biến Ảnh Nền</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {PRESET_BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setBackgroundImage(bg.url)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl p-2 border-2 transition-all ${backgroundImage === bg.url ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent hover:bg-neutral-50'}`}
                >
                  <div 
                    className="w-full h-20 rounded-xl bg-neutral-200 bg-cover bg-center shadow-sm"
                    style={{ backgroundImage: bg.url ? `url(${bg.url})` : 'none' }}
                  />
                  <span className="text-xs font-bold text-neutral-700">{bg.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3">
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Link ảnh tự do</p>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Tiếp tục link hình ảnh (https://...)"
                  className="input-field py-3 px-4 resize-none"
                />
                <button 
                  onClick={handleSaveCustom}
                  className="btn-primary py-2 px-4 shadow-none"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 space-y-6"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
              <Type className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-neutral-900">Tùy Chỉnh Chữ</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Phông chữ</p>
                <div className="grid grid-cols-2 gap-3">
                  {FONTS.map(font => (
                    <button
                      key={font.id}
                      onClick={() => setFontFamily(font.id)}
                      className={`text-sm font-semibold py-3 px-4 rounded-xl border-2 transition-all text-left ${fontFamily === font.id ? 'border-amber-500 bg-amber-50/50 text-amber-700' : 'border-neutral-100 text-neutral-700 hover:bg-neutral-50'}`}
                      style={{ fontFamily: font.id }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Màu nhấn chữ</p>
                <div className="flex flex-wrap gap-4">
                  {COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setTextColor(color.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${textColor === color.id ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105 shadow-sm'}`}
                      title={color.label}
                    >
                      <div className={`w-8 h-8 rounded-full ${color.bg}`} style={{ backgroundColor: color.id }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Màu sắc biểu đồ</p>
                <div className="grid grid-cols-2 gap-3">
                  {CHART_PALETTES.map(palette => (
                    <button
                      key={palette.id}
                      onClick={() => setChartPalette(palette.id)}
                      className={`text-sm font-semibold py-3 px-4 rounded-xl border-2 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-2 ${chartPalette === palette.id ? 'border-sky-500 bg-sky-50/50 text-sky-700' : 'border-neutral-100 text-neutral-700 hover:bg-neutral-50'}`}
                    >
                      <span>{palette.label}</span>
                      <div className="flex -space-x-1">
                         {palette.colors.map((c, i) => <div key={i} className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: c }} />)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      )}

      {activeTab === 'data' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
              <Download className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-neutral-800">Cập nhật dữ liệu & Ngoại tuyến</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">Bạn có thể tải về toàn bộ dữ liệu giao dịch dưới định dạng CSV để sao lưu hoặc dùng phần mềm khác quản lý.</p>
              
              <button 
                onClick={onDownloadData}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all"
              >
                <Download className="w-5 h-5" />
                Tải xuống dữ liệu CSV
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <p className="text-sm text-neutral-600">Lưu giao diện trang web thành định dạng PDF để tiện lưu trữ hoặc in ấn báo cáo.</p>
              
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl transition-all"
              >
                <MonitorDown className="w-5 h-5" />
                Tải về trang web (Xuất PDF)
              </button>
            </div>
            
            <div className="pt-4 border-t border-neutral-100">
              <h4 className="font-bold text-neutral-900 mb-4 flex items-center justify-between">
                Tải App Điện Thoại / Máy Tính
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase tracking-wider">Phiên bản Cloud</span>
              </h4>
              
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-indigo-900 leading-tight">Fintro App</h5>
                    <p className="text-xs text-indigo-700/80 mt-1">iOS • Android • macOS • Windows</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-start gap-2 text-sm text-indigo-900/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <p>Hoạt động như một ứng dụng độc lập trên thiết bị của bạn.</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-indigo-900/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <p><strong>Yêu cầu có mạng:</strong> Bạn cần kết nối Internet (Wifi/4G) để sử dụng.</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (window.self !== window.top) {
                      alert('⚠️ Bạn đang dùng bản xem trước, vui lòng nhấn "Open in new tab" ở góc trên bên phải để bắt đầu tải app.');
                      return;
                    }
                    // @ts-ignore
                    const promptEvent = window.deferredPrompt;
                    if (promptEvent) {
                      promptEvent.prompt();
                      promptEvent.userChoice.then((choiceResult: any) => {
                        console.log(choiceResult.outcome);
                        // @ts-ignore
                        window.deferredPrompt = null;
                      });
                    } else {
                        alert('Để tải ứng dụng:\n\n• Trên Safari (iOS): Nhấn nút Chia Sẻ (vuông có mũi tên lên) ở dưới cùng màn hình -> Chọn "Thêm vào MH chính" (Add to Home Screen).\n\n• Trên Chrome (Android): Nhấn nút Menu (3 chấm) ở góc phải -> Chọn "Thêm vào Màn hình chính" hoặc "Cài đặt ứng dụng".');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  Tải Ứng Dụng Ngay
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-red-100">
               <div className="flex items-center gap-3 mb-6 border-b border-red-100 pb-4">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 <h3 className="text-lg font-bold text-red-600">Khu Vực Nguy Hiểm</h3>
               </div>
               
               <div className="space-y-4">
                 <p className="text-sm text-neutral-600">Hành động này sẽ xóa toàn bộ dữ liệu giao dịch của bạn. Dữ liệu sau khi xóa sẽ <strong className="text-red-500">không thể khôi phục</strong>.</p>
                 
                 {showDeleteConfirm ? (
                   <div className="flex gap-3">
                     <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl transition-all">Hủy</button>
                     <button 
                       onClick={() => {
                         setShowDeleteConfirm(false);
                         onDeleteData();
                       }} 
                       className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/30"
                     >
                       Xác nhận Xóa
                     </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setShowDeleteConfirm(true)}
                     className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all"
                   >
                     Xóa toàn bộ dữ liệu giao dịch
                   </button>
                 )}
               </div>
            </div>
         </motion.div>
      )}
    </div>
  );
}

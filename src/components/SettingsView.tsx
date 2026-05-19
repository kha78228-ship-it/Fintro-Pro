import React, { useState, useEffect, memo } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, Layout, Type, Palette, AlertTriangle, Download, MonitorDown, Smartphone, UserCircle, Shield, KeySquare, Copy, Check, Trash2, Bell, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';
import AIAvatar from './AIAvatar';

interface SettingsProps {
  user?: any;
  chartPalette: string;
  setChartPalette: (palette: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  accentColor?: string;
  setAccentColor?: (color: string) => void;
  onDeleteData: () => void;
  onDownloadData: () => void;
  appTheme?: "vintage" | "vietnam" | "pink_cute";
  setAppTheme?: (theme: "vintage" | "vietnam" | "pink_cute") => void;
}

const FONTS = [
  { id: 'Inter', label: 'Neo Inter (Mặc định)' },
  { id: 'JetBrains Mono', label: 'Neo Mono' },
  { id: 'Space Grotesk', label: 'Space Grotesk' },
  { id: 'Playfair Display', label: 'Mỏng Vừa (Serif)' },
];

const COLORS = [
  { id: '#1a1a1a', label: 'Đen Nhám (Mặc định)', bg: 'bg-[#1a1a1a]' },
  { id: '#d15814', label: 'Cam Đất', bg: 'bg-[#d15814]' },
  { id: '#2d3748', label: 'Xám Đậm', bg: 'bg-[#2d3748]' },
  { id: '#5a67d8', label: 'Xanh Neon', bg: 'bg-[#5a67d8]' },
];

export default memo(function SettingsView({ 
  user,
  chartPalette,
  setChartPalette,
  fontFamily,
  setFontFamily,
  textColor,
  setTextColor,
  accentColor,
  setAccentColor,
  onDeleteData,
  onDownloadData,
  appTheme,
  setAppTheme
}: SettingsProps) {
  const { currency, setCurrency } = useCurrency();
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

  // System Announcement states
  const [sysAnnounceText, setSysAnnounceText] = useState('');
  const [sysAnnounceIsMarquee, setSysAnnounceIsMarquee] = useState(true);
  const [sysAnnounceColor, setSysAnnounceColor] = useState('#ffffff');
  const [sysAnnounceBg, setSysAnnounceBg] = useState('#4f46e5');
  const [sysAnnounceFont, setSysAnnounceFont] = useState('Inter');
  const [sysAnnounceSize, setSysAnnounceSize] = useState(16);
  const [isAnnounceActive, setIsAnnounceActive] = useState(false);

  useEffect(() => {
     const interval = setInterval(() => setNow(Date.now()), 1000);
     return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     let unsubAdminStatus: any;
     let unsubAdminsList: any;
     let unsubAnnounce: any;

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
        }, (err) => handleFirestoreError(err, OperationType.GET, `admins/${user.uid}`));

        if (superAdmin) {
            unsubAdminsList = onSnapshot(collection(db, 'admins'), snap => {
                setAdminList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => handleFirestoreError(err, OperationType.LIST, `admins`));
        }
        
        unsubAnnounce = onSnapshot(doc(db, 'system', 'announcement'), (snap) => {
            if (snap.exists()) {
               const d = snap.data();
               setSysAnnounceText(d.text || '');
               setSysAnnounceIsMarquee(d.isMarquee ?? true);
               setSysAnnounceColor(d.textColor || '#ffffff');
               setSysAnnounceBg(d.backgroundColor || '#4f46e5');
               setSysAnnounceFont(d.fontFamily || 'Inter');
               setSysAnnounceSize(d.fontSize || 16);
               setIsAnnounceActive(d.show || false);
            } else {
               setIsAnnounceActive(false);
            }
        }, (err) => handleFirestoreError(err, OperationType.GET, `system/announcement`));
     }
     return () => { 
       if (unsubAdminStatus) unsubAdminStatus(); 
       if (unsubAdminsList) unsubAdminsList();
       if (unsubAnnounce) unsubAnnounce();
     }
  }, [user]);

  useEffect(() => {
     let unsub: any;
     let unsubUsers: any;
     if (isAdmin) {
        unsub = onSnapshot(collection(db, 'invite_codes'), snap => {
            setInviteCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'invite_codes'));
        unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
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

  const handlePublishAnnouncement = async () => {
    if(!user || !isAdmin) return;
    try {
        await setDoc(doc(db, 'system', 'announcement'), {
            text: sysAnnounceText,
            isMarquee: sysAnnounceIsMarquee,
            textColor: sysAnnounceColor,
            backgroundColor: sysAnnounceBg,
            fontFamily: sysAnnounceFont,
            fontSize: sysAnnounceSize,
            show: true,
            updatedAt: serverTimestamp()
        }, { merge: true });
        alert('Đã phát thông báo!');
    } catch(e) {
        handleFirestoreError(e, OperationType.UPDATE, 'system/announcement');
    }
  };

  const handleToggleAnnouncement = async (show: boolean) => {
     if(!user || !isAdmin) return;
     try {
       await setDoc(doc(db, 'system', 'announcement'), { show }, { merge: true });
     } catch(e) {
       handleFirestoreError(e, OperationType.UPDATE, 'system/announcement');
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Cài đặt</h2>
          <p className="text-neutral-500 mt-1">Quản lý tài khoản, giao diện và dữ liệu ứng dụng.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
         <button onClick={() => setActiveTab('account')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'account' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
           <UserCircle className="w-4 h-4" /> Tài khoản
         </button>
         <button onClick={() => setActiveTab('appearance')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'appearance' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
           <Palette className="w-4 h-4" /> Giao diện
         </button>
         <button onClick={() => setActiveTab('data')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'data' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
           <Download className="w-4 h-4" /> Dữ liệu & Ngoại tuyến
         </button>
         <button onClick={() => setActiveTab('system')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'system' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
           <Bell className="w-4 h-4" /> Hệ thống
         </button>
      </div>

      <AnimatePresence mode="wait">
      {activeTab === 'account' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="card p-8 space-y-6 max-w-2xl">
               <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
                  <UserCircle className="w-5 h-5 text-neutral-500" />
                  <h3 className="text-lg font-bold text-neutral-900">Hồ sơ cá nhân</h3>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-neo-dark bg-neo-light hover:shadow-[2px_2px_0_var(--color-neo-dark)] transition-all">
                        <AIAvatar
                          uid={user?.uid}
                          name={displayName || user?.email}
                          photoURL={photoURL}
                          className="w-full h-full"
                          editable={true}
                          onAvatarChange={(newUrl) => setPhotoURL(newUrl)}
                        />
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Đường dẫn ảnh (URL)</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 font-mono text-sm" />
                          <button 
                            onClick={async () => {
                               const prompt = window.prompt("Nhập mô tả avatar AI của bạn (VD: Một chú mèo hoạt hình dễ thương đeo kính):", "A cute 3d vector style cartoon animal character profile picture");
                               if (!prompt) return;
                               const prevUrl = photoURL;
                               setPhotoURL("https://api.dicebear.com/7.x/bottts/svg?seed=loading");
                               try {
                                   const res = await fetch("/api/gemini/generateImage", {
                                       method: "POST",
                                       headers: { "Content-Type": "application/json" },
                                       body: JSON.stringify({ prompt })
                                   });
                                   if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tạo ảnh');
                                   const data = await res.json();
                                   setPhotoURL(data.imageUrl);
                               } catch(e: any) {
                                   alert('Tạo ảnh thất bại. Bạn có cần nâng cấp tài khoản hoặc API key trả phí không? Lỗi: ' + e.message);
                                   setPhotoURL(prevUrl);
                               }
                            }}
                            className="whitespace-nowrap px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-3xl text-sm transition-colors"
                          >
                            Tạo bằng AI ✨
                          </button>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Tên hiển thị</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ví dụ: Hoàng Khang" className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Biệt danh</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ví dụ: Gấu Béo" className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Giới tính</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm">
                           <option value="">Chọn giới tính</option>
                           <option value="male">Nam</option>
                           <option value="female">Nữ</option>
                        </select>
                     </div>
                     {gender === 'female' && (
                       <div className="flex items-center gap-2 pt-6">
                          <input type="checkbox" checked={isCycleVisibleToPartner} onChange={(e) => setIsCycleVisibleToPartner(e.target.checked)} className="rounded text-neutral-600 focus:ring-neutral-500" />
                          <label className="text-sm text-neutral-700">Chia sẻ kỳ kinh nguyệt với người yêu</label>
                       </div>
                     )}
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Mã tham gia không gian chung (3 số)</label>
                     <div className="flex gap-2">
                       <input type="text" value={roomCode || 'Đang tải...'} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-3xl px-4 py-2 text-sm text-neutral-700 font-mono tracking-widest cursor-default" />
                       <button onClick={() => { navigator.clipboard.writeText(roomCode); alert('Đã copy!'); }} className="bg-neutral-900 text-white px-4 py-2 rounded-3xl font-bold hover:bg-neutral-800 transition">
                         Copy
                       </button>
                     </div>
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Phiên ẩn danh</label>
                     <input type="text" value={user?.isAnonymous ? 'Đang sử dụng phiên ẩn danh' : (user?.email || 'Phiên ẩn danh')} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-3xl px-4 py-2 text-sm text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                     <button onClick={() => signOut(auth)} className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-6 py-2 rounded-3xl font-bold transition-colors">
                        Đăng xuất
                     </button>
                     <button onClick={handleUpdateProfile} disabled={isSavingProfile} className="bg-neutral-600 hover:bg-neutral-700 text-white px-6 py-2 rounded-3xl font-bold shadow-sm shadow-neutral-200 transition-colors disabled:opacity-50">
                        {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                     </button>
                  </div>
               </div>
            </div>
         </motion.div>
      )}

      {activeTab === 'appearance' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-8 space-y-6 max-w-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-neo-dark pb-4">
                <Type className="w-5 h-5 text-neo-orange" />
                <h3 className="text-lg font-bold text-neo-dark uppercase tracking-widest text-xs">Giao Diện Hệ Thống</h3>
              </div>
              
              <div className="space-y-8">
                {setAppTheme && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Chủ đề (App Theme)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setAppTheme('vintage')}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${appTheme === 'vintage' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                      >
                        Giao diện Neo-Điển
                        {appTheme === 'vintage' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setAppTheme('vietnam')}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${appTheme === 'vietnam' ? 'bg-neo-orange text-white' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                      >
                        Việt Nam Vươn Mình
                        {appTheme === 'vietnam' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setAppTheme('pink_cute')}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${appTheme === 'pink_cute' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                      >
                        Hường Dễ Thương
                        {appTheme === 'pink_cute' && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Phông chữ (Font Family)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FONTS.map(font => (
                      <button
                        key={font.id}
                        onClick={() => setFontFamily(font.id)}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${fontFamily === font.id ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                        style={{ fontFamily: font.id }}
                      >
                        {font.label}
                        {fontFamily === font.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Màu tĩnh chủ đạo (Global Text Color)</p>
                  <div className="flex flex-wrap gap-4">
                    {COLORS.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setTextColor(color.id)}
                        className={`w-12 h-12 bg-neutral-100 rounded-full border-2 transition-all flex items-center justify-center shadow-none ${textColor === color.id ? 'border-neo-orange shadow-[4px_4px_0_var(--color-neo-orange)]' : 'border-neo-dark hover:scale-105'}`}
                        title={color.label}
                        style={{ backgroundColor: color.id }}
                      >
                        {textColor === color.id && <Check className="w-6 h-6 text-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>
                </div>

                {setAccentColor && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Màu nổi bật (Accent Color)</p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { id: '#f97316', label: 'Cam (Mặc định)' },
                        { id: '#10b981', label: 'Xanh Lá' },
                        { id: '#3b82f6', label: 'Xanh Dương' },
                        { id: '#ec4899', label: 'Hồng' },
                        { id: '#a855f7', label: 'Tím' },
                      ].map(color => (
                        <button
                          key={color.id}
                          onClick={() => setAccentColor(color.id)}
                          className={`w-12 h-12 bg-neutral-100 rounded-full border-2 transition-all flex items-center justify-center shadow-none ${accentColor === color.id ? 'border-neo-dark shadow-[4px_4px_0_var(--color-neo-dark)]' : 'border-neo-dark hover:scale-105'}`}
                          title={color.label}
                          style={{ backgroundColor: color.id }}
                        >
                          {accentColor === color.id && <Check className="w-6 h-6 text-white mix-blend-difference" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Đơn Vị Tiền Tệ</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CURRENCIES.map(curr => (
                      <button
                        key={curr.code}
                        onClick={() => setCurrency(curr.code)}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${currency === curr.code ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                      >
                        <div className="flex flex-col">
                          <span>{curr.code} ({curr.symbol})</span>
                          <span className="text-[8px] font-medium opacity-80 mt-1">{curr.name}</span>
                        </div>
                        {currency === curr.code && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="card p-8 space-y-6 max-w-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-neo-dark pb-4">
                <Palette className="w-5 h-5 text-neo-orange" />
                <h3 className="text-lg font-bold text-neo-dark uppercase tracking-widest text-xs">Biểu Đồ & Thống Kê</h3>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-neo-dark/60 uppercase tracking-widest mb-3">Bảng màu biểu đồ</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'default', label: 'Neo Mặc Định', colors: ['#1a1a1a', '#d15814', '#ece5d3', '#5a67d8'] },
                    { id: 'monochrome', label: 'Đen Trắng', colors: ['#1a1a1a', '#444', '#888', '#ccc'] },
                    { id: 'vibrant', label: 'Sắc Màu', colors: ['#FFC107', '#E91E63', '#00BCD4', '#8BC34A'] },
                  ].map(palette => (
                    <button
                      key={palette.id}
                      onClick={() => setChartPalette(palette.id)}
                      className={`text-[10px] uppercase font-bold py-4 px-5 rounded-3xl border border-neo-dark transition-all flex justify-between items-center gap-2 ${chartPalette === palette.id ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                    >
                      <span>{palette.label}</span>
                      <div className="flex -space-x-2">
                         {palette.colors.map((c, i) => <div key={i} className="w-12 h-12 bg-neutral-100 rounded-full border border-neo-dark shadow-none" style={{ backgroundColor: c }} />)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
         </motion.div>
      )}

      {activeTab === 'data' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-8 max-w-2xl">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                 <Download className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Quản lý Xuất & Tải xuống</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all group flex flex-col justify-between">
                  <div>
                     <h4 className="font-bold text-neutral-900 mb-1">Xuất dữ liệu CSV</h4>
                     <p className="text-xs text-neutral-500 mb-4 leading-relaxed">Tải về toàn bộ dữ liệu giao dịch của bạn dưới dạng bảng tính để đối soát.</p>
                  </div>
                  <button 
                    onClick={onDownloadData}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-3xl transition-all shadow-sm active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Tải CSV
                  </button>
               </div>

               <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all group flex flex-col justify-between">
                  <div>
                     <h4 className="font-bold text-neutral-900 mb-1">Lưu dưới dạng PDF</h4>
                     <p className="text-xs text-neutral-500 mb-4 leading-relaxed">In báo cáo giao diện trang hiện tại hoặc lưu thành file PDF.</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-3xl transition-all shadow-sm active:scale-95"
                  >
                    <MonitorDown className="w-4 h-4" />
                    In báo cáo PDF
                  </button>
               </div>
            </div>
            
            <div className="pt-6 border-t border-neutral-100">
              <h4 className="font-bold text-neutral-900 mb-4 flex items-center justify-between">
                Cài đặt App Độc Lập
                <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-3xl uppercase tracking-wider">Cloud App</span>
              </h4>
              
              <div className="bg-neo-bg border border-neutral-100/50 rounded-3xl p-6 mb-4 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-12 h-12 bg-neutral-100 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-full shadow-sm border border-neutral-50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-7 h-7 text-neutral-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral-950 text-lg leading-tight">Fintro App</h5>
                    <p className="text-xs font-semibold text-neutral-600 mt-1 uppercase tracking-wider">iOS • Android • macOS • Windows</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-start gap-3 text-sm text-neutral-900/80">
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-600 mt-0.5"><Check className="w-3 h-3" /></div>
                    <p className="leading-snug">Hoạt động như một ứng dụng độc lập trên thiết bị của bạn.</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-neutral-900/80">
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-600 mt-0.5"><AlertTriangle className="w-3 h-3" /></div>
                    <p className="leading-snug"><strong>Yêu cầu có mạng:</strong> Bạn cần kết nối Internet (Wifi/4G) để sử dụng.</p>
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-neutral-600 hover:bg-neutral-700 text-white font-bold rounded-3xl shadow-lg shadow-neutral-600/30 transition-all relative z-10 active:scale-95"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  Cài Đặt Lên Màn Hình Chính
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-orange-100">
               <div className="flex items-center gap-3 mb-6 border-b border-orange-100 pb-4">
                 <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                 </div>
                 <h3 className="text-xl font-bold text-orange-700">Khu Vực Nguy Hiểm</h3>
               </div>
               
               <div className="space-y-4 bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                 <p className="text-sm text-orange-900/80 leading-relaxed">Hành động này sẽ xóa toàn bộ dữ liệu giao dịch của bạn. Dữ liệu sau khi xóa sẽ <strong className="text-orange-600">không thể khôi phục</strong>.</p>
                 
                 {showDeleteConfirm ? (
                   <div className="flex gap-3 pt-2">
                     <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 px-6 bg-white hover:bg-neutral-50 text-neutral-700 font-bold rounded-3xl border border-neutral-200 transition-all">Hủy</button>
                     <button 
                       onClick={() => {
                         setShowDeleteConfirm(false);
                         onDeleteData();
                       }} 
                       className="flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-3xl transition-all shadow-md shadow-orange-600/30 active:scale-95"
                     >
                       Xác nhận Xóa
                     </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setShowDeleteConfirm(true)}
                     className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-3xl transition-all border border-orange-200/50 active:scale-95 pt-2 mt-2"
                   >
                     <Trash2 className="w-5 h-5" />
                     Xóa toàn bộ dữ liệu giao dịch
                   </button>
                 )}
               </div>
            </div>
         </motion.div>
      )}
      {activeTab === 'system' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {!isAdmin ? (
               <div className="card p-8 text-center text-neutral-500">
                  Phần này chỉ dành cho quản trị viên hệ thống.
               </div>
            ) : (
               <>
            {isAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl mt-8">
                  <div className="flex justify-between items-center mb-6 border-b border-orange-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-orange-500" />
                        <h3 className="text-lg font-bold text-neutral-900">Quản trị viên (Mã mời)</h3>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={generateAnonymousCode} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-4 py-2 rounded-3xl text-sm transition-colors">Tạo Mã Ẩn Danh (3 số)</button>
                       <button onClick={generateInviteCode} className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-4 py-2 rounded-3xl text-sm transition-colors">Tạo Mã Tham Gia (6 chữ)</button>
                       <button onClick={migrateFriendCodes} className="bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold px-4 py-2 rounded-3xl text-sm transition-colors">Đồng bộ ID</button>
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
                         <div key={code.id} className="bg-white border border-orange-200 rounded-3xl p-4 flex flex-col justify-between">
                            <div className="text-2xl font-mono tracking-widest font-bold text-neutral-900 text-center mb-2">{code.id}</div>
                            <div className="text-xs text-center text-neutral-600 mb-2">Lượt: {usage}/{maxUses}</div>
                            <div className={`text-xs text-center font-bold mb-2 ${timeLeft > 0 ? 'text-neutral-600' : 'text-orange-600'}`}>Hết hạn trong: {timeLeftStr}</div>
                            <button onClick={(e) => { const target = e.currentTarget; target.innerText = 'Đã chép!'; navigator.clipboard.writeText(code.id); setTimeout(() => { target.innerText = 'Copy'; }, 2000); }} className="w-full bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-600 py-2 rounded-3xl mb-2 cursor-pointer transition-colors text-center border border-neutral-200">Copy</button>
                            <button onClick={() => deleteInviteCode(code.id)} className="w-full text-xs font-semibold text-orange-500 hover:text-orange-600 flex justify-center items-center gap-1">
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
                  <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-neutral-500" />
                        <h3 className="text-lg font-bold text-neutral-900">Thông báo hệ thống (Toàn bộ người dùng)</h3>
                     </div>
                     <div>
                       {isAnnounceActive ? (
                         <button onClick={() => handleToggleAnnouncement(false)} className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-4 py-2 rounded-3xl text-sm transition-colors">Tắt Thông Báo</button>
                       ) : (
                         <span className="text-sm border border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold px-4 py-2 rounded-3xl">Đang ẩn</span>
                       )}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Nội dung thông báo</label>
                        <textarea value={sysAnnounceText} onChange={e => setSysAnnounceText(e.target.value)} rows={3} placeholder="Ví dụ: App bảo trì lúc..." className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Loại hiển thị</label>
                           <select value={sysAnnounceIsMarquee ? 'marquee' : 'popup'} onChange={e => setSysAnnounceIsMarquee(e.target.value === 'marquee')} className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm">
                             <option value="marquee">Chữ chạy (Marquee)</option>
                             <option value="popup">Bảng hiện ra (Popup)</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Kích thước chữ (px)</label>
                           <input type="number" value={sysAnnounceSize} onChange={e => setSysAnnounceSize(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                           <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Màu chữ</label>
                           <input type="color" value={sysAnnounceColor} onChange={e => setSysAnnounceColor(e.target.value)} className="w-full h-10 border border-neutral-200 rounded-3xl cursor-pointer" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Màu nền</label>
                           <input type="color" value={sysAnnounceBg} onChange={e => setSysAnnounceBg(e.target.value)} className="w-full h-10 border border-neutral-200 rounded-3xl cursor-pointer" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Font chữ</label>
                           <select value={sysAnnounceFont} onChange={e => setSysAnnounceFont(e.target.value)} className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-3xl px-2 text-sm">
                              {FONTS.map(f => (
                                 <option key={f.id} value={f.id}>{f.label}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <div className="pt-4">
                        <button onClick={handlePublishAnnouncement} className="w-full bg-neutral-600 hover:bg-neutral-700 text-white font-bold py-3 rounded-3xl transition-colors shadow-sm">
                           Phát Thông Báo / Cập Nhật
                        </button>
                     </div>
                  </div>
               </div>
            )}

             {isAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl mt-8">
                  <div className="flex justify-between items-center mb-6 border-b border-orange-100 pb-4">
                     <div className="flex items-center gap-3">
                        <UserCircle className="w-5 h-5 text-orange-500" />
                        <h3 className="text-lg font-bold text-neutral-900">Người dùng hệ thống</h3>
                     </div>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {allUsers.map(u => (
                          <div key={u.id} className="bg-white border border-neutral-200 rounded-3xl p-4 flex items-center justify-between">
                             <div>
                                 <div className="font-bold text-neutral-900">{u.displayName || 'Khách'} <span className="text-xs text-neutral-400 font-mono">({u.friendCode || 'Chưa đồng bộ'})</span></div>
                                 <div className="text-sm text-neutral-500">{u.email}</div>
                             </div>
                             <button onClick={() => deleteUserAccount(u.id, u.displayName || u.email)} className="text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-3xl transition-colors">
                                 Xoá
                             </button>
                          </div>
                      ))}
                      {allUsers.length === 0 && <p className="text-sm text-neutral-500">Chưa có dữ liệu người dùng.</p>}
                  </div>
               </div>
            )}

            {isSuperAdmin && (
               <div className="card p-8 space-y-6 max-w-2xl mt-8 bg-neutral-50/30 border border-neutral-100">
                  <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-neutral-600" />
                        <h3 className="text-lg font-bold text-neutral-900">Quản trị viên ủy quyền (Phụ)</h3>
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
                      className="bg-neutral-600 hover:bg-neutral-700 text-white font-bold px-6 py-2.5 rounded-3xl disabled:opacity-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
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
                         <div key={adm.id} className={`p-4 rounded-3xl border ${isExpired ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-neutral-200 shadow-sm'} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                                  <Shield className="w-5 h-5 text-neutral-500" />
                               </div>
                               <div>
                                  <div className="font-bold text-neutral-900 mb-0.5">{usrInfo ? usrInfo.displayName : adm.id}</div>
                                  {usrInfo && usrInfo.email && <div className="text-xs text-neutral-500 mb-1">{usrInfo.email}</div>}
                                  <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded inline-block ${isExpired ? 'text-orange-600 bg-orange-50' : 'text-neutral-600 bg-neutral-50'}`}>
                                     {isExpired ? 'Đã hết hạn' : `Tới: ${exp.toLocaleString()}`}
                                  </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleRemoveAdmin(adm.id)}
                              className="p-2.5 text-orange-500 hover:bg-orange-50 hover:text-orange-600 rounded-3xl transition-all shadow-sm border border-transparent hover:border-orange-100"
                              title="Gỡ quyền"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                       );
                    })}
                    {adminList.length === 0 && (
                        <div className="text-center py-6 bg-neutral-50 rounded-3xl border border-neutral-100 border-dashed">
                           <Shield className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                           <p className="text-sm font-medium text-neutral-500">Chưa có quản trị viên phụ nào.</p>
                        </div>
                    )}
                  </div>
               </div>
            )}
               </>
            )}
         </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
});

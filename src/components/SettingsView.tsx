import React, { useState, useEffect, memo } from 'react';
import { Settings as SettingsIcon, Image as ImageIcon, Layout, Type, Palette, AlertTriangle, Download, MonitorDown, Smartphone, UserCircle, Shield, KeySquare, Copy, Check, Trash2, Bell, DollarSign, Wifi, WifiOff, Database, RefreshCw, Cloud, HardDrive, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';
import AIAvatar from './AIAvatar';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  getGoogleDriveToken,
  setGoogleDriveToken, 
  uploadFinancialBackup, 
  uploadDiaryPhotosBackup, 
  listDriveBackups, 
  restoreFinancialBackup, 
  getDriveStorageQuota,
  DriveBackupFile,
  DriveQuota
} from '../lib/driveService';
import { createBackupNotification } from '../lib/autoNotificationBuilder';

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
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
  setAppTheme?: (theme: "vintage" | "vietnam" | "pink_cute" | "google_material") => void;
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
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
     const handleOnline = () => setIsOnline(true);
     const handleOffline = () => setIsOnline(false);
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
     return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
     };
  }, []);

  const [canInstall, setCanInstall] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
     setIsIframe(window.self !== window.top);
     setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true);
     
     // @ts-ignore
     if (window.deferredPrompt) {
        setCanInstall(true);
     }

     const handlePrompt = () => {
        setCanInstall(true);
     };

     window.addEventListener('beforeinstallprompt', handlePrompt);
     return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleOpenInNewTab = () => {
     window.open(window.location.href, "_blank");
  };

  const handleNativeInstall = () => {
     // @ts-ignore
     const promptEvent = window.deferredPrompt;
     if (promptEvent) {
        promptEvent.prompt();
        promptEvent.userChoice.then((choiceResult: any) => {
           if (choiceResult.outcome === "accepted") {
              // @ts-ignore
              window.deferredPrompt = null;
              setCanInstall(false);
              alert("Cài đặt thành công! Cảm ơn bạn.");
           }
        });
     } else {
        alert("Hiện tại hệ thống chưa sẵn sàng kích hoạt tự động. Bạn hãy click trực tiếp vào nút 'Cài đặt' (Hình chiếc máy tính có mũi tên xuống) trên thanh địa chỉ của trình duyệt.");
     }
  };
  
  // Account settings
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [isCycleVisibleToPartner, setIsCycleVisibleToPartner] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  
  // Custom Personal Profile Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bio, setBio] = useState('');
  const [relationshipAnniversary, setRelationshipAnniversary] = useState('');
  
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

  // Google Drive backup states
  const [driveToken, setDriveTokenState] = useState<string | null>(getGoogleDriveToken());
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [driveQuota, setDriveQuota] = useState<DriveQuota | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState<'daily' | 'weekly' | 'startup'>('daily');
  const [lastBackupTime, setLastBackupTime] = useState('');

  // Loading status
  const [isBackingUpFinancials, setIsBackingUpFinancials] = useState(false);
  const [isBackingUpPhotos, setIsBackingUpPhotos] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<{ current: number; total: number; fileName: string; isSkipped: boolean } | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ backupId: string; loading: boolean; success?: boolean; error?: string } | null>(null);

  // Google Drive backup UX triggers
  const handleConnectDrive = async () => {
    setIsDriveConnecting(true);
    try {
      const result = await connectGoogleDrive();
      if (result) {
        setDriveTokenState(result.accessToken);
        alert('Kết nối Google Drive thành công!');
      }
    } catch (err: any) {
      alert(`Kết nối thất bại: ${err.message || err}`);
    } finally {
      setIsDriveConnecting(false);
    }
  };

  const handleDisconnectDrive = () => {
    if (confirm('Bạn có chắc chắn muốn ngắt kết nối với Google Drive?')) {
      disconnectGoogleDrive();
      setDriveTokenState(null);
      setDriveQuota(null);
      setDriveBackups([]);
    }
  };

  const handleToggleAutoBackup = async (checked: boolean) => {
    if (!user) return;
    try {
      setAutoBackupEnabled(checked);
      await setDoc(doc(db, 'users', user.uid), {
        driveAutoBackupEnabled: checked
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu cài đặt sao lưu tự động.');
    }
  };

  const handleScheduleChange = async (schedule: 'daily' | 'weekly' | 'startup') => {
    if (!user) return;
    try {
      setBackupSchedule(schedule);
      await setDoc(doc(db, 'users', user.uid), {
        driveBackupSchedule: schedule
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert('Lỗi khi sửa đổi tần suất sao lưu.');
    }
  };

  // Perform automatic background backup based on schedule when component/drive is ready
  useEffect(() => {
    if (!user || !driveToken || !autoBackupEnabled) return;
    
    const checkAndRunAutoBackup = async () => {
      if (isBackingUpFinancials) return;
      
      const nowMs = Date.now();
      const lastBackupMs = lastBackupTime ? new Date(lastBackupTime).getTime() : 0;
      const hoursSinceLastBackup = (nowMs - lastBackupMs) / (1000 * 60 * 60);
      
      let shouldBackup = false;
      if (backupSchedule === 'startup') {
        // Run once per app load if we haven't backed up in the last 10 minutes
        shouldBackup = hoursSinceLastBackup > (10 / 60);
      } else if (backupSchedule === 'daily') {
        shouldBackup = hoursSinceLastBackup >= 24;
      } else if (backupSchedule === 'weekly') {
        shouldBackup = hoursSinceLastBackup >= (24 * 7);
      }
      
      if (shouldBackup) {
        console.log(`[Auto Backup] Starting background sync to Google Drive. Schedule limit matched: ${backupSchedule}`);
        setIsBackingUpFinancials(true);
        try {
          const file = await uploadFinancialBackup(driveToken, user.uid, user.email || '');
          setLastBackupTime(file.createdTime);
          
          const updatedBackups = await listDriveBackups(driveToken);
          setDriveBackups(updatedBackups);
          const updatedQuota = await getDriveStorageQuota(driveToken);
          setDriveQuota(updatedQuota);
          
          await createBackupNotification(user.uid, file.name || 'Bản sao lưu tự động', 'auto');
          console.log('[Auto Backup] Financial backup completed successfully in the background!');
        } catch (err: any) {
          console.warn('[Auto Backup] Failed background backup:', err);
        } finally {
          setIsBackingUpFinancials(false);
        }
      }
    };
    
    const timer = setTimeout(() => {
      checkAndRunAutoBackup();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [user, driveToken, autoBackupEnabled, backupSchedule, lastBackupTime]);

  // Sync token from direct auth changes dynamically
  useEffect(() => {
    const checkToken = () => {
      const token = getGoogleDriveToken();
      if (token && token !== driveToken) {
        setDriveTokenState(token);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [driveToken]);

  const handleBackupFinancials = async () => {
    if (!driveToken || !user) return;
    setIsBackingUpFinancials(true);
    try {
      const file = await uploadFinancialBackup(driveToken, user.uid, user.email || '');
      setLastBackupTime(file.createdTime);
      
      // Refresh list & quota
      const updatedBackups = await listDriveBackups(driveToken);
      setDriveBackups(updatedBackups);
      const updatedQuota = await getDriveStorageQuota(driveToken);
      setDriveQuota(updatedQuota);
      await createBackupNotification(user.uid, file.name || 'Financial_Backup', 'financials');
      alert('Sao lưu báo cáo tài chính lên Google Drive thành công!');
    } catch (err: any) {
      console.error(err);
      alert(`Sao lưu báo cáo tài chính thất bại: ${err.message || err}`);
    } finally {
      setIsBackingUpFinancials(false);
    }
  };

  const handleBackupPhotos = async () => {
    if (!driveToken || !user) return;
    setIsBackingUpPhotos(true);
    setPhotoProgress({ current: 0, total: 0, fileName: 'Chuẩn bị danh sách chụp...', isSkipped: false });
    try {
      const stats = await uploadDiaryPhotosBackup(driveToken, user.uid, (fileName, index, total, isSkipped) => {
        setPhotoProgress({ current: index, total, fileName, isSkipped });
      });
      
      const updatedBackups = await listDriveBackups(driveToken);
      setDriveBackups(updatedBackups);
      const updatedQuota = await getDriveStorageQuota(driveToken);
      setDriveQuota(updatedQuota);
      await createBackupNotification(user.uid, 'Photo_Diary_Backup', 'photos');
      
      alert(`Đồng bộ ảnh hoàn tất! Đã tải lên ${stats.uploaded} ảnh mới, bỏ qua ${stats.skipped} ảnh đã tồn hành trên Drive.`);
    } catch (err: any) {
      console.error(err);
      alert(`Đồng bộ ảnh thất bại: ${err.message || err}`);
    } finally {
      setIsBackingUpPhotos(false);
      setPhotoProgress(null);
    }
  };

  const handleRestoreBackup = async (backupId: string, backupName: string) => {
    if (!driveToken || !user) return;
    const confirmed = window.confirm(`CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nBạn có chắc chắn muốn KHÔI PHỤC dữ liệu từ bản sao lưu '${backupName}'?\n\nThao tác này sẽ tải dữ liệu tài chính từ Google Drive và ghi đè / sáp nhập trực tiếp vào hệ thống hiện tại của bạn. Thao tác không thể hoàn tác.`);
    if (!confirmed) return;

    setRestoreStatus({ backupId, loading: true });
    try {
      await restoreFinancialBackup(driveToken, backupId, user.uid);
      setRestoreStatus({ backupId, loading: false, success: true });
      alert('Khôi phục dữ liệu tài chính thành công! Ứng dụng sẽ tự động tải lại để cài đặt bảng dữ liệu mới.');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setRestoreStatus({ backupId, loading: false, error: err.message || 'Lỗi không xác định' });
      alert(`Khôi phục dữ liệu thất bại: ${err.message || err}`);
    }
  };

  const handleRefreshDriveInfo = async () => {
    if (!driveToken) return;
    try {
      const updatedQuota = await getDriveStorageQuota(driveToken);
      setDriveQuota(updatedQuota);
      const updatedBackups = await listDriveBackups(driveToken);
      setDriveBackups(updatedBackups);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (driveToken) {
      getDriveStorageQuota(driveToken).then(setDriveQuota);
      listDriveBackups(driveToken).then(setDriveBackups);
    }
  }, [driveToken]);

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
             setAutoBackupEnabled(data.driveAutoBackupEnabled || false);
             setBackupSchedule(data.driveBackupSchedule || 'daily');
             setLastBackupTime(data.driveLastBackupTime || '');
             setPhoneNumber(data.phoneNumber || '');
             setBirthdate(data.birthdate || '');
             setBio(data.bio || '');
             setRelationshipAnniversary(data.relationshipAnniversary || '');
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
        await setDoc(doc(db, 'users', user.uid), { 
           displayName, 
           photoURL, 
           nickname, 
           gender, 
           isCycleVisibleToPartner,
           phoneNumber,
           birthdate,
           bio,
           relationshipAnniversary
        }, { merge: true });
        await setDoc(doc(db, 'publicProfiles', user.uid), { 
           displayName, 
           photoURL, 
           status: 'online', 
           gender, 
           isCycleVisibleToPartner,
           nickname,
           phoneNumber,
           birthdate,
           bio,
           relationshipAnniversary
        }, { merge: true });
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
         <button onClick={() => setActiveTab('drive')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'drive' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
            <Cloud className="w-4 h-4" /> Sao lưu Google Drive
         </button>
         <button onClick={() => setActiveTab('pwa')} className={`whitespace-nowrap px-6 py-3.5 rounded-3xl uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center gap-2 border border-neo-dark ${activeTab === 'pwa' ? 'bg-neo-dark text-neo-light' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}>
           <MonitorDown className="w-4 h-4" /> Tải & Cài Đặt App
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
                     <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 border-2 border-neo-dark bg-neo-light hover:shadow-[2px_2px_0_var(--color-neo-dark)] transition-all">
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
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Số điện thoại</label>
                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Ví dụ: 0912345678" className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Ngày sinh</label>
                        <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Ngày đặc biệt / Kỷ niệm</label>
                        <input type="date" value={relationshipAnniversary} onChange={(e) => setRelationshipAnniversary(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm" />
                     </div>
                     {gender === 'female' && (
                       <div className="flex items-center gap-2 pt-6">
                          <input type="checkbox" checked={isCycleVisibleToPartner} onChange={(e) => setIsCycleVisibleToPartner(e.target.checked)} className="rounded text-neutral-600 focus:ring-neutral-500" />
                          <label className="text-sm text-neutral-700">Chia sẻ kỳ kinh nguyệt với người yêu</label>
                       </div>
                     )}
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-1">Lời giới thiệu & Châm ngôn tình yêu</label>
                     <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Hãy chia sẻ đôi lời về bản thân hoặc một lời nhắn ngọt ngào dành cho đối phương..." rows={3} className="w-full bg-neutral-50 border border-neutral-200 rounded-[1.5rem] px-4 py-3 text-sm resize-none" />
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
                      <button
                        onClick={() => setAppTheme('google_material')}
                        className={`text-[10px] uppercase font-bold py-3.5 px-4 rounded-3xl border border-neo-dark transition-all text-left flex justify-between items-center ${appTheme === 'google_material' ? 'bg-neo-orange text-white' : 'bg-neo-bg text-neo-dark hover:bg-neo-orange hover:text-white'}`}
                      >
                        Driv
                        {appTheme === 'google_material' && <Check className="w-4 h-4" />}
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
            
            <div className="pt-6 border-t border-neutral-100 space-y-6">
              <div>
                <h4 className="font-bold text-neutral-900 mb-4 flex items-center justify-between">
                  Khả năng Ngoại Tuyến & Trạng Thái PWA
                  <span className="text-[10px] font-bold bg-[#10b981]/15 text-[#10b981] px-2.5 py-1 rounded-3xl uppercase tracking-wider">Hỗ Trợ Offline</span>
                </h4>

                {/* Connection Diagnostics State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 font-sans">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Trạng thái kết nối</span>
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <>
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                          <span className="font-bold text-sm text-neutral-800">Trực Tuyến (Online)</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
                          <span className="font-bold text-sm text-neutral-800">Ngoại Tuyến (Offline Mode)</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      {isOnline 
                        ? "Ứng dụng đang đồng bộ dữ liệu thời gian thực tích hợp tức thời với đám mây." 
                        : "Hệ thống tự chuyển sang CSDL nội bộ. Mọi ghi chép sẽ tự đồng bộ khi có mạng."
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Cơ sở dữ liệu offline</span>
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-sm">
                      <Database className="w-4 h-4 text-neutral-500" />
                      <span>Sẵn Sàng (IndexedDB Cached)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug">
                      Dữ liệu tài chính & nhật ký được đệm an toàn vào bộ nhớ nội bộ của trình duyệt trình duyệt.
                    </p>
                  </div>
                </div>

                {/* Performance Tuning Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button 
                    onClick={() => {
                      if ('caches' in window) {
                        caches.keys().then(names => {
                          for (let name of names) {
                            caches.delete(name);
                          }
                        });
                      }
                      alert("Đã xóa toàn bộ bộ nhớ cache tài nguyên. Ứng dụng sẽ tự động tải lại.");
                      window.location.reload();
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-900 border border-neutral-200 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Xóa Cache Ứng Dụng
                  </button>

                  <button 
                    onClick={() => {
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(regs => {
                          if (regs.length === 0) {
                            alert("Đã kích hoạt làm mới, ứng dụng đang chạy ở bản mới nhất.");
                          } else {
                            regs.forEach(reg => reg.update());
                            alert("Đã gửi tín hiệu kiểm tra cập nhật service worker của Fintro.");
                          }
                        });
                      } else {
                        alert("Nhận diện: Trình duyệt không hỗ trợ Service Worker.");
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-900 border border-neutral-200 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Kiểm Tra Bản Cập Nhật
                  </button>
                </div>
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
      {activeTab === 'pwa' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
            <div className="card p-8 space-y-6">
               <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
                  <MonitorDown className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-neutral-900">Tải & Cài Đặt Ứng Dụng (PWA)</h3>
               </div>

               {isStandalone ? (
                  <div className="p-6 bg-teal-50 border border-teal-150 rounded-3xl flex items-center gap-4 text-teal-850">
                     <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shrink-0">✓</div>
                     <div>
                        <p className="font-bold text-sm">Bạn đang sử dụng phiên bản App chính thức!</p>
                        <p className="text-xs text-teal-600 mt-1">Ứng dụng đã được cài đặt hoàn tất và đang hoạt động độc lập với đầy đủ tính năng ưu việt.</p>
                     </div>
                  </div>
               ) : isIframe ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-4">
                     <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-amber-900">Bị chặn bởi khung bảo mật do chạy trong Google AI Studio</h4>
                           <p className="text-xs text-amber-700 leading-relaxed mt-1">
                              Trình duyệt web chặn tính năng pop-up tải PWA trực tiếp khi ứng dụng chạy bên trong khung xem trước (iframe) của AI Studio. Để tải app về máy, bạn cần chạy app ở một tab trình duyệt riêng biệt.
                           </p>
                        </div>
                     </div>
                     <div className="pt-2">
                        <button 
                           onClick={handleOpenInNewTab}
                           className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-neo-dark hover:bg-neo-dark/95 text-white font-bold text-sm rounded-3xl shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                           <MonitorDown className="w-4 h-4" />
                           <span>Nhấp Vào Đây Để Mở Tab Riêng & Tải App</span>
                        </button>
                        <p className="text-[10px] text-center text-neutral-400 mt-2 italic">
                           * Trình duyệt sẽ hiện nút Cài đặt ngay sau khi bạn mở ứng dụng ở tab mới!
                        </p>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-4">
                     <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl space-y-4">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
                              <MonitorDown className="w-6 h-6 animate-bounce" />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-neutral-950">Gói cài đặt tự động đã sẵn sàng!</h4>
                              <p className="text-xs text-neutral-600 leading-relaxed mt-1">
                                 Hệ thống hỗ trợ cài đặt trực tiếp cực kỳ an toàn. Chạy độc lập, tương thích mượt mảng hoàn hảo cả trên điện thoại lẫn máy tính.
                              </p>
                           </div>
                        </div>
                        
                        <button 
                           onClick={canInstall ? handleNativeInstall : () => {
                              alert("Cấu hình cài đặt đang được tải. Bạn cũng có thể click trực tiếp vào nút 'Cài đặt' (Hình chiếc màn hình kèm mũi tên tải xuống) xuất hiện bên tay phải thanh nhập link (địa chỉ URL) của trình duyệt.");
                           }}
                           className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-3xl shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                           <Download className="w-4 h-4" />
                           <span>Cài Đặt App Trực Tiếp Lên Thiết Bị</span>
                        </button>
                     </div>
                  </div>
               )}

               {/* Hướng dẫn thủ công */}
               <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                     <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block"></span>
                     Cách tải thủ công cho từng hệ điều hành
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-150 text-[11px] text-neutral-600 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-neutral-800 border-b border-neutral-100 pb-2 mb-1">
                           <Smartphone className="w-4 h-4 text-orange-600" />
                           iOS (iPhone / iPad)
                        </div>
                        <p>1. Nhấp nút mở tab mới để chạy app trên trình duyệt <strong>Safari</strong>.</p>
                        <p>2. Chạm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở dưới cùng màn hình.</p>
                        <p>3. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</p>
                     </div>

                     <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-150 text-[11px] text-neutral-600 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-neutral-800 border-b border-neutral-100 pb-2 mb-1">
                           <Smartphone className="w-4 h-4 text-orange-600" />
                           Điện thoại Android
                        </div>
                        <p>1. Chạy app trên trình duyệt <strong>Google Chrome</strong> ở tab mới.</p>
                        <p>2. Chọn biểu tượng <strong>3 chấm ở góc trên đứng</strong> thanh địa chỉ.</p>
                        <p>3. Tìm kích hoạt mục <strong>Cài đặt ứng dụng</strong> (hoặc Thêm vào MH chính).</p>
                     </div>

                     <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-150 text-[11px] text-neutral-600 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-neutral-800 border-b border-neutral-100 pb-2 mb-1">
                           <MonitorDown className="w-4 h-4 text-orange-600" />
                           Máy tính (PC/Mac)
                        </div>
                        <p>1. Chạy app trên trình duyệt <strong>Chrome / Edge / Brave</strong> tab mới.</p>
                        <p>2. Nhìn lên góc phải thanh URL, bạn sẽ thấy <strong>biểu tượng Tải xuống / Cài đặt</strong>.</p>
                        <p>3. Chọn cài đặt để đưa App ngoài màn hình Desktop.</p>
                     </div>
                  </div>
               </div>

               {/* Ưu điểm nổi bật */}
               <div className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200/50 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Ưu điểm cực lớn giống Google AI Studio</h4>
                  <ul className="text-xs text-neutral-600 space-y-2 list-disc list-inside leading-relaxed">
                     <li><strong>Toàn màn hình (Standalone)</strong>: Cho cảm giác mượt mà y hệt như ứng dụng tải trên AppStore hay CH Play.</li>
                     <li><strong>Tốc độ nhảy vọt</strong>: Dữ liệu tải trước cục bộ tăng tốc ứng dụng cực nhanh.</li>
                     <li><strong>Lưu trữ Offline</strong>: Nhập và theo dõi lịch trình, chi tiêu, công việc thoải mái không cần sợ đứt mạng.</li>
                     <li><strong>Tính tiện lợi cực cao</strong>: Có Icon riêng, mở cực nhanh từ màn hình điện thoại hay máy tính PC của bạn.</li>
                  </ul>
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
                                  <AIAvatar uid={adm.id} name={usrInfo ? usrInfo.displayName : undefined} photoURL={usrInfo ? usrInfo.photoURL : undefined} className="w-full h-full border border-neutral-100 rounded-full" />
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
      {activeTab === 'drive' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* GOOGLE DRIVE SYNC CARD */}
            <div className="card p-8 max-w-4xl space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-3xl">
                     <Cloud className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-neutral-900">Sao lưu đám mây với Google Drive</h3>
                     <p className="text-sm text-neutral-500 mt-1">Đồng bộ tự động hoặc thủ công hình ảnh nhật ký và báo cáo tài chính lên Google Drive của bạn.</p>
                   </div>
                 </div>
                 {driveToken && (
                   <button 
                     onClick={handleDisconnectDrive}
                     className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-3xl transition-colors shrink-0"
                   >
                     Ngắt kết nối
                   </button>
                 )}
              </div>

              {!isOnline && (
                <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 rounded-3xl flex items-center gap-3 text-sm">
                   <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                   <span>Vui lòng kiểm tra kết nối mạng. Bạn cần kết nối Internet để thiết lập hoặc sao lưu lên Google Drive.</span>
                </div>
              )}

              {!driveToken ? (
                // NOT CONNECTED VIEW
                <div className="py-8 px-4 text-center max-w-xl mx-auto space-y-6">
                  <div className="relative w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto border border-neutral-100">
                    <Cloud className="w-10 h-10 text-neutral-400" />
                    <Upload className="w-5 h-5 text-blue-500 absolute bottom-1 right-1" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-neutral-800 text-lg">Liên kết tài khoản Drive của bạn</h4>
                    <p className="text-sm text-neutral-500">
                      Tất cả báo cáo thu chi, phân tích tài chính và ảnh kỷ niệm nhật ký sẽ được tự động/thủ công lưu trữ an toàn trong một thư mục riêng biệt <strong>'Fintro_Backups'</strong> trong Google Drive cá nhân. Bạn có thể khôi phục lại dữ liệu bất cứ lúc nào trên thiết bị mới!
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      disabled={isDriveConnecting || !isOnline}
                      onClick={handleConnectDrive}
                      className="inline-flex items-center gap-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-bold px-6 py-3 rounded-3xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {isDriveConnecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                          <span>Đang kết nối...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"></path>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"></path>
                          </svg>
                          <span>Kết nối với Google Drive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // CONNECTED VIEW
                <div className="space-y-6">
                  {/* Quota Check */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col justify-between">
                      <span className="text-xs font-semibold uppercase text-neutral-500 tracking-wider">Trạng thái liên kết</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-bold text-neutral-800">Đã kết nối</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 truncate">{user?.email}</span>
                    </div>

                    <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col justify-between md:col-span-2">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs font-semibold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" /> Dung lượng Google Drive
                        </span>
                        {driveQuota && (
                          <span className="font-mono text-xs font-bold text-neutral-700">
                            {Math.round(Number(driveQuota.usage) / 1024 / 1024 / 1024 * 100) / 100} GB / {Math.round(Number(driveQuota.limit) / 1024 / 1024 / 1024)} GB
                          </span>
                        )}
                      </div>
                      
                      {driveQuota ? (
                        <div>
                          <div className="w-full h-3 bg-neutral-200 rounded-full mt-2 overflow-hidden border border-neutral-100">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500" 
                              style={{ width: `${Math.min(100, (Number(driveQuota.usage) / Number(driveQuota.limit)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-1.5 block">
                            Đã sử dụng {Math.round((Number(driveQuota.usage) / Number(driveQuota.limit)) * 10000) / 100}% dung lượng tổng có sẵn.
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-3 bg-neutral-100 animate-pulse rounded-full mt-2" />
                      )}
                    </div>
                  </div>

                  {/* Auto-backup trigger controls */}
                  <div className="p-6 bg-blue-50/50 border border-blue-100/60 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-display">Cloud Backup</span>
                        <h4 className="font-bold text-neutral-950 text-base">Tự động sao lưu lên đám mây</h4>
                        <p className="text-xs text-neutral-500">Đồng bộ tự động báo cáo mới nhất theo lịch trình được cài đặt.</p>
                      </div>
                      <button 
                         onClick={() => handleToggleAutoBackup(!autoBackupEnabled)}
                         className={`w-14 h-8 rounded-full transition-all flex items-center p-1.5 border ${autoBackupEnabled ? 'bg-blue-600 border-blue-700 justify-end' : 'bg-neutral-200 border-neutral-300 justify-start'}`}
                      >
                         <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>

                    {autoBackupEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-3 border-t border-blue-100/50"
                      >
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1 font-mono">Lịch Trình Sao Lưu</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'startup', label: 'Tải app', desc: 'Mỗi lần khởi chạy' },
                            { id: 'daily', label: 'Hằng ngày', desc: 'Sau mỗi 24 giờ' },
                            { id: 'weekly', label: 'Hằng tuần', desc: 'Sau mỗi 7 ngày' }
                          ].map((sched) => {
                            const isSelected = backupSchedule === sched.id;
                            return (
                              <button
                                key={sched.id}
                                type="button"
                                onClick={() => handleScheduleChange(sched.id as any)}
                                className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl border transition-all text-center ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-700 text-white shadow-sm scale-[1.02]' 
                                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                                }`}
                              >
                                <span className="text-xs font-bold uppercase tracking-wider">{sched.label}</span>
                                <span className={`text-[8px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-neutral-400'}`}>{sched.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {lastBackupTime && (
                      <div className="text-xs text-neutral-500 flex items-center justify-between font-mono pt-2.5 border-t border-blue-100/50">
                        <div className="flex items-center gap-1">
                          <span>Lần sao lưu cuối:</span>
                          <span className="font-bold text-neutral-800">{new Date(lastBackupTime).toLocaleString()}</span>
                        </div>
                        {isBackingUpFinancials && (
                          <span className="text-blue-600 flex items-center gap-1 font-bold animate-pulse text-[10px]">
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang sao lưu...
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual backup execution buttons */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Hành động sao lưu thủ công</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Financials card */}
                      <div className="p-6 bg-white border border-neutral-200 rounded-3xl flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Hợp phần tài chính</span>
                          <h5 className="font-bold text-neutral-900 text-base">Báo cáo & Thu chi</h5>
                          <p className="text-xs text-neutral-500">Đóng gói toàn bộ Giao dịch, Ngân sách, Các khoản nợ, Mục tiêu và Đăng ký thành file JSON đưa lên Drive.</p>
                        </div>
                        <div className="pt-6">
                          <button
                            disabled={isBackingUpFinancials}
                            onClick={handleBackupFinancials}
                            className="w-full bg-neutral-900 border border-neutral-950 hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-3xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isBackingUpFinancials ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Đang gói & tải...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Sao lưu tài chính</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Photo diary card */}
                      <div className="p-6 bg-white border border-neutral-200 rounded-3xl flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Hình ảnh kỷ niệm</span>
                          <h5 className="font-bold text-neutral-900 text-base">Album ảnh nhật ký</h5>
                          <p className="text-xs text-neutral-500">Đồng bộ tất cả ảnh nhật ký bạn đã chụp hoặc tải lên. Sử dụng công nghệ so khớp thông minh, tự bỏ qua ảnh cũ.</p>
                        </div>
                        {photoProgress && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-semibold text-neutral-500">
                              <span className="truncate max-w-[150px]">{photoProgress.fileName}</span>
                              <span>{photoProgress.current}/{photoProgress.total}</span>
                            </div>
                            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200">
                              <div className="h-full bg-blue-500" style={{ width: `${(photoProgress.current / photoProgress.total) * 100}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="pt-6">
                          <button
                            disabled={isBackingUpPhotos}
                            onClick={handleBackupPhotos}
                            className="w-full bg-neutral-600 border border-neutral-700 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded-3xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isBackingUpPhotos ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Đang đồng bộ ảnh...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Đồng bộ ảnh nhật ký</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup History Listings */}
                  <div className="space-y-3 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between pb-1">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Lịch sử bản sao lưu trên Drive</h4>
                      <button 
                        onClick={handleRefreshDriveInfo} 
                        className="text-neutral-500 hover:text-neutral-800 p-1 rounded-full transition-colors"
                        title="Tải lại danh sách"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {driveBackups.filter(b => b.name.endsWith('.json')).map((b) => {
                        const isRestoring = restoreStatus?.backupId === b.id && restoreStatus?.loading;
                        return (
                          <div key={b.id} className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <Database className="w-5 h-5 font-bold" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-neutral-800 text-sm block truncate" title={b.name}>{b.name}</span>
                                <span className="text-[10px] text-neutral-400 font-mono block">
                                  Tạo ngày: {new Date(b.createdTime).toLocaleString()} | Kích thước: {Math.round(Number(b.size || 0) / 10.24) / 100} KB
                                </span>
                              </div>
                            </div>
                            <button
                              disabled={isRestoring}
                              onClick={() => handleRestoreBackup(b.id, b.name)}
                              className="px-4 py-2 text-xs font-bold text-stone-700 border border-neutral-300 hover:bg-neutral-50 rounded-3xl transition-colors shrink-0 disabled:opacity-50"
                            >
                              {isRestoring ? 'Đang khôi phục...' : 'Phục hồi'}
                            </button>
                          </div>
                        );
                      })}

                      {driveBackups.filter(b => b.name.endsWith('.json')).length === 0 && (
                        <div className="text-center py-8 bg-neutral-50 rounded-3xl border border-neutral-100 border-dashed">
                          <Cloud className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-xs font-medium text-neutral-500">Chưa có bản sao lưu tài chính nào trực tuyến.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
         </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
});

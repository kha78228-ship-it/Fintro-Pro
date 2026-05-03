import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy, where, getDoc, setDoc, runTransaction, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { Transaction } from './types';

// Couple Components
import DailyQuestion from './components/DailyQuestion';
import CoupleGames from './components/CoupleGames';
import RelationshipExercises from './components/RelationshipExercises';
import DiscoveryDeck from './components/DiscoveryDeck';
import DateIdeas from './components/DateIdeas';
import ForgetMeNots from './components/ForgetMeNots';
import CycleTracker from './components/CycleTracker';
import Onboarding from './components/Onboarding';

// Finance Components
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CalendarView from './components/CalendarView';
import Planning from './components/Planning';
import SharedFund from './components/SharedFund';
import Reports from './components/Reports';
import Tools from './components/Tools';
import SettingsView from './components/SettingsView';
import AiChatWidget from './components/AiChatWidget';
import FriendsView from './components/FriendsView';
import AIAvatar from './components/AIAvatar';
import VideoCall from './components/VideoCall';

import SocialFeed from './components/SocialFeed';

import { 
  Heart, User as UserIcon, MessageCircleQuestion, Gamepad2, 
  BookOpen, Layers, Map, Bookmark, Settings, CalendarHeart,
  LayoutDashboard, CalendarRange, Target, Users, PieChart, Wrench, Plus, List, Bell, Wallet, FileText, Search, WifiOff, AlertCircle, MessageCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'calendar' | 'history' | 'planning' | 'shared_fund' | 'reports' | 'tools' | 'daily_question' | 'couple_games' | 'exercises' | 'discovery' | 'dates' | 'forget_me_nots' | 'cycle' | 'settings' | 'social_feed';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showFriends, setShowFriends] = useState(false);
  const [appMode, setAppMode] = useState<'finance' | 'love' | 'entertainment'>('finance');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(() => localStorage.getItem('__couple_bg') || '');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('__couple_font') || 'Inter');
  const [textColor, setTextColor] = useState(() => localStorage.getItem('__couple_color') || '#1a1a1a');
  const [chartPalette, setChartPalette] = useState(() => localStorage.getItem('__couple_chart_palette') || 'default');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => localStorage.getItem('__has_seen_onboarding') === 'true');
  
  const [profileVerified, setProfileVerified] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);

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
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const filteredTransactions = transactions.filter(t => 
    !searchQuery || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.categoryObj?.name || t.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeCall, setActiveCall] = useState<{ friendId: string, isIncoming: boolean, isVideo?: boolean } | null>(null);
  const [appToast, setAppToast] = useState<{title: string, body: string, type?: 'info' | 'error'} | null>(null);

  // Global error listener to catch Firestore errors
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || String(event.reason);
      if (errorMsg.includes('[System_Diagnostic_Info]')) {
        const userMessage = errorMsg.split('\n\n[System_Diagnostic_Info]')[0];
        setAppToast({ title: 'Lỗi Thao Tác', body: userMessage, type: 'error' });
        setTimeout(() => setAppToast(null), 5000);
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  // Request notification permissions
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, [user]);

  // Income messages listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
          const chatData = change.doc.data();
          if (chatData.lastMessage && chatData.lastSenderId && chatData.lastSenderId !== user.uid) {
            // Check if it's a new message (within last 5 seconds to avoid old notifications on load)
            const isRecent = chatData.updatedAt?.toMillis ? (Date.now() - chatData.updatedAt.toMillis() < 5000) : false;
            
            if (isRecent && !showFriends) {
              const title = 'Tin nhắn mới từ bạn bè! 💬';
              const body = chatData.lastMessage.substring(0, 50) + (chatData.lastMessage.length > 50 ? '...' : '');

              if ('Notification' in window && Notification.permission === 'granted') {
                // Show notification
                // Check if document is hidden or showFriends is false
                if (document.hidden) {
                  const notification = new Notification(title, { body, icon: '/icon.png' });
                  notification.onclick = () => {
                    window.focus();
                    setShowFriends(true); // Open friends view when clicked
                    notification.close();
                  };
                }
              }
              
              // In-app toast
              setAppToast({ title, body });
              setTimeout(() => setAppToast(null), 4000);
            }
          }
        }
      });
    });
    return () => unsubscribe();
  }, [user, showFriends]);
  // Incoming call listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'calls'),
      where('targetId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          const callData = change.doc.data();
          // If we receive a call and we're not currently in one
          if (callData.offer && callData.callerId !== user.uid) {
            setActiveCall(prev => {
              // If already active, do nothing
              if (prev && prev.friendId === callData.callerId && prev.isIncoming) return prev;
              
              // New call, trigger browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                // Only notify if document is not visible
                if (document.hidden) {
                  const notification = new Notification('Bạn có một cuộc gọi đến! 📞', {
                    body: `Cuộc gọi video từ The Love App`,
                    requireInteraction: true 
                  });
                  notification.onclick = () => {
                    window.focus();
                    notification.close();
                  };
                }
              }
              
              return { friendId: callData.callerId, isIncoming: true };
            });
          }
        }
      });
    });
    return () => unsubscribe();
  }, [user]);

  const handleAppModeChange = (mode: 'finance' | 'love' | 'entertainment') => {
    setAppMode(mode);
    if (mode === 'finance') setCurrentView('dashboard');
    else if (mode === 'love') setCurrentView('daily_question');
    else setCurrentView('social_feed');
  };

  const updateBackground = (url: string) => {
    setBackgroundImage(url);
    localStorage.setItem('__couple_bg', url);
  };

  const updateFontFamily = (font: string) => {
    setFontFamily(font);
    localStorage.setItem('__couple_font', font);
  };

  const updateTextColor = (color: string) => {
    setTextColor(color);
    localStorage.setItem('__couple_color', color);
  };

  const updateChartPalette = (palette: string) => {
    setChartPalette(palette);
    localStorage.setItem('__couple_chart_palette', palette);
  };

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const savedBg = localStorage.getItem('__couple_bg');
    if (savedBg) setBackgroundImage(savedBg);
    
    const savedFont = localStorage.getItem('__couple_font');
    if (savedFont) setFontFamily(savedFont);

    const savedColor = localStorage.getItem('__couple_color');
    if (savedColor) setTextColor(savedColor);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        setIsCheckingProfile(true);
        try {
          const profileRef = doc(db, 'users', u.uid);
          const { getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const snap = await getDoc(profileRef);
          
          if (snap.exists()) {
            setProfileVerified(true);
            await setDoc(profileRef, { status: 'online', lastSeen: serverTimestamp() }, { merge: true });
          } else {
             // For Admin or Anonymous users, allow them through automatically
             if (u.email?.toLowerCase() === 'kha78228@gmail.com' || u.isAnonymous) {
               setProfileVerified(true);
               const friendCode = Math.floor(100+Math.random()*900).toString(); // 3 digit code for anonymous
               await setDoc(profileRef, {
                   displayName: u.displayName || (u.isAnonymous ? 'Người Dùng Ẩn Danh' : 'Người dùng'),
                   email: u.email || '',
                   currency: 'VND',
                   friendCode: friendCode,
                   status: 'online',
                   lastSeen: serverTimestamp()
               });
               await setDoc(doc(db, 'publicProfiles', u.uid), {
                   displayName: u.displayName || (u.isAnonymous ? 'Người Dùng Ẩn Danh' : 'Người dùng'),
                   friendCode: friendCode,
                   status: 'online'
               }, { merge: true });
             } else {
               // Require invite code
               setProfileVerified(false);
             }
          }
        } catch (error) {
          console.error("Lỗi kiểm tra profile:", error);
        } finally {
          setIsCheckingProfile(false);
          setLoading(false);
        }
      } else {
        if (user) {
          const profileRef = doc(db, 'users', user.uid);
          const { updateDoc, serverTimestamp } = await import('firebase/firestore');
          updateDoc(profileRef, { status: 'offline', lastSeen: serverTimestamp() }).catch(console.error);
        }
        setProfileVerified(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleVerifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    
    setIsVerifyingInvite(true);
    setInviteError('');
    
    try {
      const { doc, runTransaction, increment } = await import('firebase/firestore');
      const codeRef = doc(db, 'invite_codes', inviteCode.trim().toUpperCase());
      
      await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);
        
        if (!codeSnap.exists()) {
             throw new Error('NOT_FOUND');
        }
        
        const codeData = codeSnap.data();
        if (codeData.uses >= 10 && codeData.createdBy !== 'kha78228@gmail.com') {
             throw new Error('LIMIT_EXCEEDED');
        }
        
        const expiresAt = codeData.expiresAt || 0;
        if (Date.now() > expiresAt && expiresAt > 0) {
             throw new Error('EXPIRED');
        }                
        
        transaction.update(codeRef, {
            uses: increment(1)
        });
        
        const profileRef = doc(db, 'users', user.uid);
        const newFriendCode = Math.floor(100+Math.random()*900).toString(); // 3 số
        transaction.set(profileRef, {
            displayName: user.displayName || 'Người dùng',
            email: user.email || '',
            currency: 'VND',
            friendCode: newFriendCode,
            status: 'online'
        });

        const publicProfileRef = doc(db, 'publicProfiles', user.uid);
        transaction.set(publicProfileRef, {
            displayName: user.displayName || 'Người dùng',
            friendCode: newFriendCode,
            status: 'online'
        }, { merge: true });
      });
      
      setProfileVerified(true);
      
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') setInviteError('Mã mời không tồn tại hoặc không hợp lệ.');
        else if (error.message === 'LIMIT_EXCEEDED') setInviteError('Mã mời đã đạt giới hạn lượt sử dụng.');
        else if (error.message === 'EXPIRED') setInviteError('Mã mời đã hết hạn.');
        else {                
            console.error(error);
            setInviteError('Có lỗi xảy ra, vui lòng thử lại.');
        }
    } finally {
      setIsVerifyingInvite(false);
    }
  };

  const handleConnectSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setInviteError('');
    
    try {
      const { signInAnonymouslyUser } = await import('./lib/firebase');
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const codeToUse = inviteCode.trim();
      let joinedCode = '';
      let isJoining = false;
      let creatorUid = '';

      if (codeToUse) {
        if (codeToUse.length !== 3) {
          setInviteError('Vui lòng nhập đúng mã ẩn danh (3 số).');
          setIsLoggingIn(false);
          return;
        }

        // Checking existing code
        const codeRef = doc(db, 'invite_codes', codeToUse);
        const codeSnap = await getDoc(codeRef);
        
        if (!codeSnap.exists()) {
          setInviteError('Mã tham gia không tồn tại.');
          setIsLoggingIn(false);
          return;
        }
        
        const data = codeSnap.data();
        if (data.expiresAt < Date.now()) {
          setInviteError('Mã tham gia đã hết hạn.');
          setIsLoggingIn(false);
          return;
        }

        if (data.type === 'anonymous') {
            const limit = data.createdBy === 'kha78228@gmail.com' ? 1 : 2;
            if (data.uses >= limit) {
                setInviteError('Mã tham gia đã được sử dụng hết.');
                setIsLoggingIn(false);
                return;
            }
        }
        
        creatorUid = data.creatorUid;
        joinedCode = codeToUse;
        isJoining = true;
      }

      // Proceed with Anonymously Login (creates new uid if no session)
      let userCred;
      try {
        userCred = await signInAnonymouslyUser();
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
          throw new Error('Tính năng Ẩn danh chưa được bật. Vui lòng bật "Anonymous" trong Firebase Console > Authentication > Sign-in method.');
        }
        throw err;
      }
      const user = userCred.user;

      // If no code provided, generate a new one
      if (!isJoining) {
        // ID 3 số bắt đầu từ 100
        joinedCode = Math.floor(100 + Math.random() * 900).toString();
        await setDoc(doc(db, 'invite_codes', joinedCode), {
          creatorUid: user.uid,
          createdAt: serverTimestamp(),
          expiresAt: Date.now() + 24 * 3600 * 1000, // 24 hours expiry
          uses: 1,
          type: 'anonymous'
        });
      } else {
        const { increment } = await import('firebase/firestore');
        await setDoc(doc(db, 'invite_codes', codeToUse), { uses: increment(1) }, { merge: true });
      }

      // Create their profile and link them
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, {
        displayName: 'Người Dùng Ẩn Danh',
        currency: 'VND',
        status: 'online',
        friendCode: joinedCode, // Share the same code visually
        lastSeen: serverTimestamp()
      }, { merge: true });
      
      const publicProfileRef = doc(db, 'publicProfiles', user.uid);
      await setDoc(publicProfileRef, {
        displayName: 'Người Dùng Ẩn Danh',
        friendCode: joinedCode,
        status: 'online'
      }, { merge: true });

      // Automatically pair them if joining
      if (isJoining && creatorUid && creatorUid !== user.uid) {
        await setDoc(doc(db, `users/${user.uid}/friends/${creatorUid}`), {
          friendId: creatorUid,
          status: 'accepted',
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, `users/${creatorUid}/friends/${user.uid}`), {
          friendId: user.uid,
          status: 'accepted',
          createdAt: serverTimestamp()
        });
      }

      setProfileVerified(true);
    } catch (error: any) {
      console.error(error);
      setInviteError(error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('date', 'desc')
    );

    const unsubscribeT = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`);
    });

    return () => unsubscribeT();
  }, [user]);

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions/${id}`));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const handleDownloadData = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú', 'Cảm xúc'];
    
    const rows = transactions.map(t => {
      const type = t.type === 'income' ? 'Thu' : 'Chi';
      const category = t.categoryObj ? t.categoryObj.name : t.category;
      return [
        t.date,
        type,
        category,
        t.amount,
        t.description || '',
        t.emotion || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fintro_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    try {
      const txQuery = query(collection(db, `users/${user.uid}/transactions`));
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(txQuery);
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, `users/${user.uid}/transactions/${docSnap.id}`)));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/transactions`);
    }
  };

  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={() => {
      localStorage.setItem('__has_seen_onboarding', 'true');
      setHasSeenOnboarding(true);
    }} />;
  }

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900">Không có kết nối mạng</h2>
          <p className="text-neutral-500 max-w-sm mx-auto">
            Fintro là ứng dụng đám mây và yêu cầu kết nối mạng để đồng bộ dữ liệu theo thời gian thực.
          </p>
        </div>
        <p className="text-sm font-medium text-neutral-400 bg-neutral-50 px-4 py-2 rounded-full">
          Vui lòng kiểm tra lại kết nối Wifi hoặc 4G/5G
        </p>
      </div>
    );
  }

  if (loading || (user && isCheckingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="flex flex-col items-center gap-4">
          <Heart className="w-12 h-12 text-pink-500 animate-pulse" />
          <span className="text-pink-400 font-medium font-mono text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (user && !profileVerified) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none" />
          <h2 className="text-2xl font-display font-medium text-neutral-900 mb-2 relative z-10">Nhập Mã Mời</h2>
          <p className="text-neutral-500 mb-8 text-sm relative z-10 leading-relaxed">
            Hệ thống đang trong giai đoạn thử nghiệm. Bạn cần mã mời của quản trị viên để tham gia bằng tài khoản Google.
          </p>
          <form onSubmit={handleVerifyInviteCode} className="space-y-4 relative z-10">
            <div>
               <input 
                 type="text" 
                 value={inviteCode}
                 onChange={(e) => setInviteCode(e.target.value)}
                 className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center tracking-widest uppercase transition-all"
                 placeholder="------"
                 maxLength={6}
                 required
               />
            </div>
            {inviteError && <p className="text-red-500 text-sm mb-4 font-medium text-center">{inviteError}</p>}
            
            <button 
               type="submit" 
               disabled={isVerifyingInvite || inviteCode.length < 6}
               className="w-full py-3.5 bg-neutral-900 font-bold text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20 disabled:opacity-50"
            >
               {isVerifyingInvite ? 'Đang xác thực...' : 'Xác thực & Tham gia'}
            </button>

            <div className="pt-4 border-t border-neutral-100 flex justify-center">
              <button 
                type="button"
                onClick={() => { signOut(auth); setInviteCode(''); setInviteError(''); }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Trở lại Đăng nhập
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex font-sans bg-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto"
          >
            {/* Logo/Icon Area */}
            <div className="flex justify-center mb-10">
               <div className="relative">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -10 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 rotate-[-8deg] relative z-20"
                  >
                    <Heart className="w-8 h-8 text-white fill-white" />
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0.5, rotate: 10 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-[8deg] absolute top-1 -right-8 z-10"
                  >
                    <Wallet className="w-8 h-8 text-white" />
                  </motion.div>
               </div>
            </div>

              {/* Typography */}
            <div className="text-center mb-12">
               <h1 className="text-4xl sm:text-5xl font-display font-medium text-neutral-900 mb-5 tracking-tight">
                 Fintro <span className="text-rose-500">✕</span> Couple
               </h1>
               <p className="text-neutral-500 text-lg leading-relaxed">
                 Không gian ẩn danh để vun đắp tình yêu và tài chính.
               </p>
            </div>
            
            {/* Login Flow */}
            <div className="space-y-4">
               {/* Nút Đăng nhập Google */}
               <button 
                 type="button"
                 onClick={async () => {
                   setIsLoggingIn(true);
                   try {
                      const { signInWithGoogle } = await import('./lib/firebase');
                      await signInWithGoogle();
                   } catch(err) {
                      console.error(err);
                   } finally {
                      setIsLoggingIn(false);
                   }
                 }}
                 disabled={isLoggingIn}
                 className="w-full bg-white text-neutral-800 font-bold flex items-center justify-center gap-3 py-4 rounded-xl shadow-md hover:bg-neutral-50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed border border-neutral-200"
               >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                 Đăng Nhập bằng Google
               </button>

               <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-neutral-200"></div>
                 <span className="flex-shrink-0 mx-4 text-xs font-medium text-neutral-400">hoặc Ẩn Danh</span>
                 <div className="flex-grow border-t border-neutral-200"></div>
               </div>

               <form onSubmit={handleConnectSpace} className="space-y-4 relative z-10 bg-white/80 p-6 rounded-3xl backdrop-blur-sm border border-pink-100 shadow-xl">
                 <div>
                   <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider text-center">Mã kết nối (3 số)</label>
                   <input 
                     type="text" 
                     value={inviteCode}
                     onChange={(e) => setInviteCode(e.target.value.replace(/[^0-9]/g, ''))}
                     className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 font-mono text-center text-xl tracking-[0.5em] transition-all"
                     placeholder="---"
                     maxLength={3}
                   />
                 </div>
                 {inviteError && <p className="text-red-500 text-sm font-medium text-center">{inviteError}</p>}
                 
                 <button
                   type="submit"
                   disabled={isLoggingIn}
                   className="w-full bg-neutral-900 text-white font-bold flex items-center justify-center gap-3 py-4 rounded-xl shadow-xl hover:bg-neutral-800 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {isLoggingIn ? (
                     <div className="w-5 h-5 border-2 border-neutral-300 border-t-white rounded-full animate-spin" />
                   ) : (
                     <span>{inviteCode.trim() ? 'Vào Không Gian' : 'Tạo Mã Ẩn Danh'}</span>
                   )}
                 </button>
               </form>
               <p className="text-xs text-center text-neutral-400 font-medium mt-4">Phiên ẩn danh tồn tại 24h và không lưu thông tin dài hạn.</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-8 flex flex-col ${backgroundImage ? 'bg-cover bg-center bg-fixed transition-all duration-700' : 'bg-pink-50'}`} style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}>
      <style>{`
        :root {
          --theme-text-color: ${textColor} !important;
          --theme-font: "${fontFamily}" !important;
        }
      `}</style>
      
      {backgroundImage && <div className="fixed inset-0 bg-white/70 backdrop-blur-md z-0 pointer-events-none" style={{ willChange: 'transform' }} />}
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-pink-100/50" style={{ willChange: 'transform' }}>
        <div className={`mx-auto px-6 h-20 flex items-center justify-between ${appMode === 'finance' ? 'max-w-7xl' : 'max-w-6xl'}`}>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-10 flex items-center justify-center">
              <div className="absolute left-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg transform -rotate-6 z-10 border-2 border-white">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div className="absolute right-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg transform rotate-6 z-0 border-2 border-white">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-neutral-800 hidden sm:block">Fintro <span className="text-rose-500">✕</span> Couple</span>
          </div>
          
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
             {/* Mode Switcher Button */}
             <button 
               onClick={() => {
                 if (appMode === 'finance') handleAppModeChange('love');
                 else if (appMode === 'love') handleAppModeChange('entertainment');
                 else handleAppModeChange('finance');
               }}
               className={`group flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold transition-all duration-300 shadow-sm border border-neutral-200/60 mr-1 sm:mr-2 overflow-hidden ${
                 appMode === 'finance' 
                 ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                 : appMode === 'love'
                 ? 'bg-rose-500 text-white hover:bg-rose-600'
                 : 'bg-violet-600 text-white hover:bg-violet-700'
               }`}
               title="Nhấn để chuyển đổi chế độ"
             >
               {appMode === 'finance' ? (
                 <>
                   <Wallet className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> 
                   <span className="hidden sm:inline">Tài chính</span>
                 </>
               ) : appMode === 'love' ? (
                 <>
                   <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5 fill-white" /> 
                   <span className="hidden sm:inline">Tình yêu</span>
                 </>
               ) : (
                 <>
                   <Sparkles className="w-[18px] h-[18px] sm:w-5 sm:h-5 fill-white" /> 
                   <span className="hidden sm:inline">Giải trí</span>
                 </>
               )}
               <div className="w-px h-4 bg-white/30 hidden sm:block mx-0.5"></div>
               <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 opacity-70 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>

             <button 
               onClick={() => setCurrentView('calendar')}
               title={appMode === 'finance' ? "Lịch chi tiêu" : "Lịch Dâu"}
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'calendar' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : appMode === 'love' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : appMode === 'love' ? 'hover:text-rose-600' : 'hover:text-violet-600'} hover:bg-neutral-100`}`}
             >
               <CalendarRange className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setCurrentView('history')}
               title="Lịch sử & Thông báo"
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'history' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : appMode === 'love' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : appMode === 'love' ? 'hover:text-rose-600' : 'hover:text-violet-600'} hover:bg-neutral-100`}`}
             >
               <Bell className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setShowFriends(!showFriends)}
               title="Kết nối & Tin nhắn"
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${showFriends ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : appMode === 'love' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : appMode === 'love' ? 'hover:text-rose-600' : 'hover:text-violet-600'} hover:bg-neutral-100`}`}
             >
               <Users className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setCurrentView('settings')}
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'settings' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : appMode === 'love' ? 'bg-rose-100 text-rose-600' : 'bg-violet-100 text-violet-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : appMode === 'love' ? 'hover:text-rose-600' : 'hover:text-violet-600'} hover:bg-neutral-100`}`}
               title="Cài đặt"
             >
               <Settings className="w-5 h-5" />
             </button>

            <div className="hidden sm:flex items-center gap-3 py-1.5 pl-1.5 pr-4 bg-white/60 rounded-full border border-pink-100 shadow-sm ml-2">
              <AIAvatar uid={user.uid} name={user.displayName} photoURL={user.photoURL} className="w-8 h-8 rounded-full border border-neutral-100" />
              <span className="text-sm font-bold text-neutral-700">{user.displayName}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className={`flex-1 w-full px-6 py-10 relative z-10 pb-32 ${appMode === 'finance' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto md:pl-32'}`}>
        <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Dashboard transactions={filteredTransactions} onDeleteTransaction={handleDeleteTransaction} setCurrentView={setCurrentView} />
              </motion.div>
            )}
            {currentView === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} />
              </motion.div>
            )}
            {currentView === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <CalendarView transactions={filteredTransactions} />
              </motion.div>
            )}
            {currentView === 'planning' && (
              <motion.div key="planning" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Planning transactions={filteredTransactions} />
              </motion.div>
            )}
            {currentView === 'shared_fund' && user && (
              <motion.div key="shared_fund" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <SharedFund user={user} />
              </motion.div>
            )}
            {currentView === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Reports transactions={filteredTransactions} chartPalette={chartPalette} />
              </motion.div>
            )}
            {currentView === 'tools' && (
              <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Tools setCurrentView={setCurrentView} appMode={appMode} />
              </motion.div>
            )}


            {currentView === 'daily_question' && (
              <motion.div key="daily_question" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <DailyQuestion user={user} />
              </motion.div>
            )}

            {currentView === 'couple_games' && (
              <motion.div key="couple_games" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CoupleGames user={user} />
              </motion.div>
            )}

            {currentView === 'exercises' && (
              <motion.div key="exercises" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <RelationshipExercises />
              </motion.div>
            )}

            {currentView === 'discovery' && (
              <motion.div key="discovery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DiscoveryDeck />
              </motion.div>
            )}

            {currentView === 'dates' && (
              <motion.div key="dates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DateIdeas />
              </motion.div>
            )}

            {currentView === 'forget_me_nots' && (
              <motion.div key="forget_me_nots" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ForgetMeNots user={user} />
              </motion.div>
            )}

            {currentView === 'cycle' && (
              <motion.div key="cycle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CycleTracker user={user} />
              </motion.div>
            )}

            {currentView === 'social_feed' && (
              <motion.div key="social_feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SocialFeed user={user} userProfile={userProfile} />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SettingsView 
                  user={user}
                  backgroundImage={backgroundImage} 
                  setBackgroundImage={updateBackground} 
                  fontFamily={fontFamily}
                  setFontFamily={updateFontFamily}
                  textColor={textColor}
                  setTextColor={updateTextColor}
                  chartPalette={chartPalette}
                  setChartPalette={updateChartPalette}
                  onDeleteData={handleDeleteAllData}
                  onDownloadData={handleDownloadData}
                />
              </motion.div>
            )}
          </AnimatePresence>
      </main>

      {/* Vertical Navigation Bar */}
      {appMode === 'love' && (
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-pink-100 pb-safe md:fixed md:top-28 md:bottom-auto md:left-6 md:right-auto md:w-20 md:rounded-3xl md:border md:border-pink-100 md:shadow-2xl md:pb-0" style={{ willChange: 'transform' }}>
        <div className="flex md:flex-col items-center justify-between md:justify-start px-2 py-2 md:py-6 gap-2 md:gap-6 w-full h-full overflow-x-auto md:overflow-visible mix-blend-multiply">
          <NavButton 
            active={currentView === 'daily_question'} onClick={() => setCurrentView('daily_question')}
            icon={<MessageCircleQuestion className="w-6 h-6" />} label="Daily Q" color="text-rose-500" layout="vertical"
          />
          <NavButton 
            active={currentView === 'couple_games'} onClick={() => setCurrentView('couple_games')}
            icon={<Gamepad2 className="w-6 h-6" />} label="Games" color="text-indigo-500" layout="vertical"
          />
          <NavButton 
            active={currentView === 'discovery'} onClick={() => setCurrentView('discovery')}
            icon={<Layers className="w-6 h-6" />} label="Khám phá" color="text-violet-500" layout="vertical"
          />
          <NavButton 
            active={currentView === 'exercises'} onClick={() => setCurrentView('exercises')}
            icon={<BookOpen className="w-6 h-6" />} label="Bài tập" color="text-teal-500" layout="vertical"
          />
          <NavButton 
            active={currentView === 'dates'} onClick={() => setCurrentView('dates')}
            icon={<Map className="w-6 h-6" />} label="Kho ngày" color="text-orange-500" layout="vertical"
          />
          <NavButton 
            active={currentView === 'forget_me_nots'} onClick={() => setCurrentView('forget_me_nots')}
            icon={<Bookmark className="w-6 h-6" />} label="Ghi nhớ" color="text-sky-500" layout="vertical"
          />
          {userProfile?.gender === 'female' && (
            <NavButton 
              active={currentView === 'cycle'} onClick={() => setCurrentView('cycle')}
              icon={<CalendarHeart className="w-6 h-6" />} label="Lịch Dâu" color="text-rose-500" layout="vertical"
            />
          )}
        </div>
      </nav>
      )}

      {appMode === 'entertainment' && (
         <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe md:pb-6 pointer-events-none">
           <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-violet-100 rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] h-16 flex items-center justify-around px-2 relative pointer-events-auto">
                 <BottomNavLink active={currentView === 'social_feed'} onClick={() => setCurrentView('social_feed')} label="Bảng tin" icon={<List className="w-5 h-5"/>} color="text-violet-600"/>
                 {/* Reserved for future entertainment features */}
                 <BottomNavLink active={currentView === 'couple_games'} onClick={() => setCurrentView('couple_games')} label="Mini Games" icon={<Gamepad2 className="w-5 h-5"/>} color="text-violet-600"/>
           </div>
        </div>
      )}

      {appMode === 'finance' && (
         <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe md:pb-6 pointer-events-none">
           <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-neutral-100 rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] h-20 flex items-center justify-between px-6 relative pointer-events-auto">
                 <BottomNavLink active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} label="Tổng quan" icon={<LayoutDashboard className="w-5 h-5"/>}/>
                 <BottomNavLink active={currentView === 'planning'} onClick={() => setCurrentView('planning')} label="Ngân sách" icon={<Target className="w-5 h-5"/>}/>
                 
                 <div className="w-16 h-16 flex-shrink-0"></div>
                 <button 
                   onClick={() => setIsTransactionFormOpen(true)}
                   className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-indigo-700 transition-all border-4 border-white"
                 >
                   <Plus className="w-8 h-8 z-10" />
                 </button>

                 <BottomNavLink active={currentView === 'shared_fund'} onClick={() => setCurrentView('shared_fund')} label="Quỹ chung" icon={<Users className="w-5 h-5"/>}/>
                 <BottomNavLink active={currentView === 'tools'} onClick={() => setCurrentView('tools')} label="Công cụ" icon={<Wrench className="w-5 h-5"/>}/>
           </div>
        </div>
      )}
      
      {appMode === 'finance' && <TransactionForm isOpen={isTransactionFormOpen} onClose={() => setIsTransactionFormOpen(false)} onSuccess={() => setIsTransactionFormOpen(false)} transactions={transactions} />}

      <AnimatePresence>
        {showFriends && user && (
          <FriendsView user={user} onClose={() => setShowFriends(false)} onStartCall={(friendId, isVideo = true) => setActiveCall({ friendId, isIncoming: false, isVideo })} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCall && (
          <VideoCall 
            user={user} 
            friendId={activeCall.friendId} 
            isIncoming={activeCall.isIncoming}
            isVideo={activeCall.isVideo}
            onClose={() => setActiveCall(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appToast && (
          <motion.div
             initial={{ opacity: 0, y: -50, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -50, scale: 0.95 }}
             className={`fixed top-6 right-6 md:top-10 md:right-10 z-[300] bg-white rounded-2xl p-4 shadow-2xl border flex items-start gap-4 max-w-sm cursor-pointer ${appToast.type === 'error' ? 'border-rose-200' : 'border-sky-100'}`}
             onClick={() => {
                if (appToast.type !== 'error') setShowFriends(true);
                setAppToast(null);
             }}
          >
             <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${appToast.type === 'error' ? 'bg-rose-100' : 'bg-sky-100'}`}>
               {appToast.type === 'error' ? (
                 <AlertCircle className="w-5 h-5 text-rose-600" />
               ) : (
                 <MessageCircle className="w-5 h-5 text-sky-600" />
               )}
             </div>
             <div className="flex-1 min-w-0 pr-4">
               <h4 className={`font-bold text-sm mb-0.5 ${appToast.type === 'error' ? 'text-rose-800' : 'text-slate-800'}`}>{appToast.title}</h4>
               <p className="text-slate-600 text-sm truncate">{appToast.body}</p>
             </div>
             <div className={`w-2 h-2 rounded-full absolute top-5 right-5 ${appToast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'}`} />
          </motion.div>
        )}
      </AnimatePresence>

    <AiChatWidget transactions={filteredTransactions} appMode={appMode} user={user} />
    </div>
  );
}

function TopNavLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 transition-all text-sm font-semibold whitespace-nowrap rounded-xl ${
        active 
          ? 'text-indigo-600 bg-indigo-50/80 shadow-sm' 
          : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      {icon}
      {label}
      {active && <motion.div layoutId="top-nav-active" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-t-full bg-indigo-600" />}
    </button>
  );
}

function BottomNavLink({ active, onClick, icon, label, color = 'text-indigo-600' }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all ${
        active 
          ? color 
          : 'text-neutral-400 hover:text-neutral-600'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? '-translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute'}`}>
        {label}
      </span>
    </button>
  );
}

function NavButton({ active, onClick, icon, label, color, layout = 'auto' }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string, layout?: 'horizontal' | 'vertical' | 'auto' }) {
  const indicatorHorizontalClass = "absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-t-full";
  const indicatorVerticalClass = "hidden md:block absolute -right-1 md:-right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full";
  
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl transition-all active:scale-95 touch-manipulation min-w-[64px] sm:min-w-[72px] md:min-w-0 ${
        active 
          ? `bg-neutral-900 ${color}` 
          : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
      }`}
    >
      {icon}
      <span className={`text-[9px] sm:text-[10px] font-bold mt-1 md:mt-2 max-w-[60px] md:max-w-none truncate w-full text-center ${active ? color : 'text-neutral-500'}`}>{label}</span>
      {active && (
        <>
          {layout === 'auto' && <motion.div layoutId="nav-active" className={`${indicatorHorizontalClass} md:hidden ${color.replace('text-', 'bg-')}`} />}
          {layout === 'vertical' && <motion.div layoutId="nav-active-v" className={`${indicatorHorizontalClass} md:hidden ${color.replace('text-', 'bg-')}`} />}
          {layout === 'vertical' && <motion.div layoutId="nav-active-v-d" className={`${indicatorVerticalClass} ${color.replace('text-', 'bg-')}`} />}
          {layout === 'horizontal' && <motion.div layoutId="nav-active-h" className={`${indicatorHorizontalClass} md:-bottom-2 ${color.replace('text-', 'bg-')}`} />}
        </>
      )}
    </button>
  );
}


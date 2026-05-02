import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
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

import { 
  Heart, User as UserIcon, LogOut, MessageCircleQuestion, Gamepad2, 
  BookOpen, Layers, Map, Bookmark, Settings, CalendarHeart,
  LayoutDashboard, CalendarRange, Target, Users, PieChart, Wrench, Plus, List, Bell, Wallet, FileText, Search, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'calendar' | 'history' | 'planning' | 'shared_fund' | 'reports' | 'tools' | 'daily_question' | 'couple_games' | 'exercises' | 'discovery' | 'dates' | 'forget_me_nots' | 'cycle' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [appMode, setAppMode] = useState<'finance' | 'love'>('finance');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(() => localStorage.getItem('__couple_bg') || '');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('__couple_font') || 'Inter');
  const [textColor, setTextColor] = useState(() => localStorage.getItem('__couple_color') || '#1a1a1a');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleAppModeChange = (mode: 'finance' | 'love') => {
    setAppMode(mode);
    if (mode === 'finance') setCurrentView('dashboard');
    else setCurrentView('daily_question');
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
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

  useEffect(() => {
    const savedBg = localStorage.getItem('__couple_bg');
    if (savedBg) setBackgroundImage(savedBg);
    
    const savedFont = localStorage.getItem('__couple_font');
    if (savedFont) setFontFamily(savedFont);

    const savedColor = localStorage.getItem('__couple_color');
    if (savedColor) setTextColor(savedColor);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <Heart className="w-12 h-12 text-pink-500 animate-pulse" />
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
                 Không gian riêng tư để vun đắp tình yêu và lên kế hoạch tài chính cùng nhau.
               </p>
            </div>
            
            {/* Login Button */}
            <div className="space-y-4">
               <button
                 onClick={handleLogin}
                 disabled={isLoggingIn}
                 className="w-full bg-neutral-900 text-white font-bold flex items-center justify-center gap-3 py-4.5 rounded-2xl shadow-xl shadow-neutral-900/10 hover:bg-neutral-800 hover:shadow-2xl hover:shadow-neutral-900/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
               >
                 {isLoggingIn ? (
                   <>
                     <div className="w-5 h-5 border-2 border-neutral-300 border-t-white rounded-full animate-spin" />
                     <span>Đang kết nối...</span>
                   </>
                 ) : (
                   <>
                     <div className="bg-white p-1 rounded-full flex items-center justify-center">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-[18px] h-[18px]" alt="Google" />
                     </div>
                     <span>Đăng nhập với Google</span>
                   </>
                 )}
               </button>
               <p className="text-xs text-center text-neutral-400 font-medium">Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng.</p>
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
      
      {backgroundImage && <div className="fixed inset-0 bg-white/60 backdrop-blur-3xl z-0 pointer-events-none" />}
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-2xl border-b border-pink-100/50">
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
          
          {appMode === 'finance' && (
            <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-sm mx-4">
              <div className="relative w-full flex items-center shadow-sm">
                <Search className="w-4 h-4 absolute left-3 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm giao dịch (vd: ăn uống)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/70 backdrop-blur-md border border-neutral-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium placeholder:text-neutral-400"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
             {/* Mode Switcher Button */}
             <button 
               onClick={() => handleAppModeChange(appMode === 'finance' ? 'love' : 'finance')}
               className={`group flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold transition-all duration-300 shadow-sm border border-neutral-200/60 mr-1 sm:mr-2 overflow-hidden ${
                 appMode === 'finance' 
                 ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                 : 'bg-rose-500 text-white hover:bg-rose-600'
               }`}
               title="Nhấn để chuyển đổi chế độ"
             >
               {appMode === 'finance' ? (
                 <>
                   <Wallet className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> 
                   <span className="hidden sm:inline">Tài chính</span>
                 </>
               ) : (
                 <>
                   <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5 fill-white" /> 
                   <span className="hidden sm:inline">Tình yêu</span>
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
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'calendar' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : 'hover:text-rose-600'} hover:bg-neutral-100`}`}
             >
               <CalendarRange className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setCurrentView('reports')}
               title="Báo cáo"
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'reports' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : 'hover:text-rose-600'} hover:bg-neutral-100`}`}
             >
               <FileText className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setCurrentView('history')}
               title="Lịch sử & Thông báo"
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'history' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : 'hover:text-rose-600'} hover:bg-neutral-100`}`}
             >
               <Bell className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setCurrentView('settings')}
               className={`p-2 sm:p-2.5 rounded-xl transition-all ${currentView === 'settings' ? (appMode === 'finance' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600') : `text-neutral-500 ${appMode === 'finance' ? 'hover:text-indigo-600' : 'hover:text-rose-600'} hover:bg-neutral-100`}`}
               title="Cài đặt"
             >
               <Settings className="w-5 h-5" />
             </button>

            <div className="hidden sm:flex items-center gap-3 py-1.5 pl-1.5 pr-4 bg-white/60 rounded-full border border-pink-100 shadow-sm ml-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-neutral-100" />
              ) : (
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-neutral-500" />
                </div>
              )}
              <span className="text-sm font-bold text-neutral-700">{user.displayName}</span>
            </div>
            <button 
              onClick={() => setShowSignOutConfirm(true)}
              className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
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
                  <Reports transactions={filteredTransactions} />
              </motion.div>
            )}
            {currentView === 'tools' && (
              <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Tools setCurrentView={setCurrentView} />
              </motion.div>
            )}


            {currentView === 'daily_question' && (
              <motion.div key="daily_question" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <DailyQuestion user={user} />
              </motion.div>
            )}

            {currentView === 'couple_games' && (
              <motion.div key="couple_games" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CoupleGames />
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
                <ForgetMeNots />
              </motion.div>
            )}

            {currentView === 'cycle' && (
              <motion.div key="cycle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <CycleTracker user={user} />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SettingsView 
                  backgroundImage={backgroundImage} 
                  setBackgroundImage={updateBackground} 
                  fontFamily={fontFamily}
                  setFontFamily={updateFontFamily}
                  textColor={textColor}
                  setTextColor={updateTextColor}
                  onDeleteData={handleDeleteAllData}
                  onDownloadData={handleDownloadData}
                />
              </motion.div>
            )}
          </AnimatePresence>
      </main>

      {/* Vertical Navigation Bar */}
      {appMode === 'love' && (
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-2xl border-t border-pink-100 pb-safe md:fixed md:top-28 md:bottom-auto md:left-6 md:right-auto md:w-20 md:rounded-3xl md:border md:border-pink-100 md:shadow-2xl md:pb-0">
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
          <NavButton 
            active={currentView === 'cycle'} onClick={() => setCurrentView('cycle')}
            icon={<CalendarHeart className="w-6 h-6" />} label="Lịch Dâu" color="text-rose-500" layout="vertical"
          />
        </div>
      </nav>
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
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setShowSignOutConfirm(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <LogOut className="w-8 h-8 ml-1" />
              </div>
              <h3 className="text-2xl font-display font-medium text-neutral-900 mb-2 text-center tracking-tight">Đăng xuất</h3>
              <p className="text-neutral-500 mb-8 text-[15px] text-center leading-relaxed">Bạn có chắc chắn muốn đăng xuất tài khoản? Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOutConfirm(false)} className="flex-1 py-3.5 bg-neutral-100 font-semibold text-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors">Hủy bỏ</button>
                <button onClick={() => { setShowSignOutConfirm(false); signOut(auth); }} className="flex-1 py-3.5 bg-red-500 font-bold text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Đăng xuất</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AiChatWidget />
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

function BottomNavLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all ${
        active 
          ? 'text-indigo-600' 
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
      className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl transition-all min-w-[64px] sm:min-w-[72px] md:min-w-0 ${
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


import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback } from "react";
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  where,
  getDoc,
  setDoc,
  runTransaction,
  increment,
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { Transaction } from "./types";

// Couple Components
const DailyQuestion = lazy(() => import("./components/DailyQuestion"));
const CoupleGames = lazy(() => import("./components/CoupleGames"));
const LoveGames = lazy(() => import("./components/LoveGames"));
const LoveMemory = lazy(() => import("./components/LoveMemory"));
const RelationshipExercises = lazy(() => import("./components/RelationshipExercises"));
const DiscoveryDeck = lazy(() => import("./components/DiscoveryDeck"));
const DateIdeas = lazy(() => import("./components/DateIdeas"));
const ForgetMeNots = lazy(() => import("./components/ForgetMeNots"));
const CycleTracker = lazy(() => import("./components/CycleTracker"));
const PhotoAlbum = lazy(() => import("./components/PhotoAlbum"));
const NotificationCenter = lazy(() => import("./components/NotificationCenter"));
const Onboarding = lazy(() => import("./components/Onboarding"));

// Finance Components
const Dashboard = lazy(() => import("./components/Dashboard"));
const TransactionForm = lazy(() => import("./components/TransactionForm"));
const TransactionList = lazy(() => import("./components/TransactionList"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const Planning = lazy(() => import("./components/Planning"));
const SharedFund = lazy(() => import("./components/SharedFund"));
const Reports = lazy(() => import("./components/Reports"));
const Tools = lazy(() => import("./components/Tools"));
const WebAppWrapper = lazy(() => import("./components/WebAppWrapper"));
const SettingsView = lazy(() => import("./components/SettingsView"));
const AiChatWidget = lazy(() => import("./components/AiChatWidget"));
const FriendsView = lazy(() => import("./components/FriendsView"));
const AIAvatar = lazy(() => import("./components/AIAvatar"));
const VideoCall = lazy(() => import("./components/VideoCall"));

const SocialFeed = lazy(() => import("./components/SocialFeed"));
const VietnamBackground = lazy(() => import("./components/VietnamBackground").then(m => ({ default: m.VietnamBackground })));
const VintageBackground = lazy(() => import("./components/VintageBackground").then(m => ({ default: m.VintageBackground })));
const GoogleMaterialBackground = lazy(() => import("./components/GoogleMaterialBackground").then(m => ({ default: m.GoogleMaterialBackground })));
const VietnamLoadingScreen = lazy(() => import("./components/VietnamLoadingScreen").then(m => ({ default: m.VietnamLoadingScreen })));
const VintageLoadingScreen = lazy(() => import("./components/VintageLoadingScreen").then(m => ({ default: m.VintageLoadingScreen })));
const PinkCuteBackground = lazy(() => import("./components/PinkCuteBackground").then(m => ({ default: m.PinkCuteBackground })));
const PinkCuteLoadingScreen = lazy(() => import("./components/PinkCuteLoadingScreen").then(m => ({ default: m.PinkCuteLoadingScreen })));
const DongSonDrumHUD = lazy(() => import("./components/DongSonDrumHUD").then(m => ({ default: m.DongSonDrumHUD })));
const VietnamLoginForm = lazy(() => import("./components/VietnamLoginForm").then(m => ({ default: m.VietnamLoginForm })));
const VintageLoginForm = lazy(() => import("./components/VintageLoginForm").then(m => ({ default: m.VintageLoginForm })));
import { LoadingSpinner } from "./components/LoadingSpinner";
import PwaInstallBanner from "./components/PwaInstallBanner";

import {
  Heart,
  Banknote,
  User as UserIcon,
  MessageCircleQuestion,
  Gamepad2,
  BookOpen,
  Layers,
  Map,
  Bookmark,
  Settings,
  CalendarHeart,
  LayoutDashboard,
  CalendarRange,
  Target,
  Users,
  PieChart,
  Wrench,
  AppWindow,
  Plus,
  List,
  Bell,
  Wallet,
  FileText,
  Search,
  WifiOff,
  AlertCircle,
  MessageCircle,
  Sparkles,
  X,
  HardDrive,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ThemeStyles = ({ appTheme, textColor, accentColor, fontFamily }: { appTheme: 'vintage' | 'vietnam' | 'pink_cute' | 'google_material', textColor: string, accentColor: string, fontFamily: string }) => {
  if (appTheme === 'google_material') {
    return (
      <style>{`
        :root {
          --color-neo-bg: #f8f9fa !important;
          --color-neo-dark: #1f1f1f !important;
          --color-neo-light: #ffffff !important;
          --color-neo-orange: #1a73e8 !important;
          --font-sans: "${fontFamily}", "Google Sans", "Inter", ui-sans-serif, system-ui, sans-serif !important;
        }
        body {
          background-color: #f8f9fa !important;
          color: #1f1f1f !important;
        }
        .card {
          background-color: #ffffff !important;
          border: 1px solid #e3e3e3 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
          border-radius: 24px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
          transform: translateY(-2px) !important;
        }
        .border-neo-dark {
          border-color: #e5e7eb !important;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #dadce0 !important;
          border-radius: 9999px !important;
        }
        ::-webkit-scrollbar-track {
          background-color: #f1f3f4 !important;
        }
        .bg-neo-orange {
           background-color: #1a73e8 !important;
           color: #fff !important;
           border: 1px solid #1a73e8 !important;
           box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
           transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .bg-neo-orange:hover {
           background-color: #1557b0 !important;
           box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25) !important;
           transform: translateY(-1px);
        }
        .bg-neo-orange:active {
           transform: translateY(0);
        }
        .text-neo-orange {
           color: #1a73e8 !important;
        }
        button, a {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>
    );
  }
  if (appTheme === 'pink_cute') {
    return (
      <style>{`
        :root {
          --color-neo-bg: #fff0f5 !important;
          --color-neo-dark: #be185d !important;
          --color-neo-light: #ffffff !important;
          --color-neo-orange: ${accentColor} !important;
          --font-sans: "${fontFamily}", ui-sans-serif, system-ui, sans-serif !important;
        }
        .card {
          background-color: #ffffff !important;
          border: 2px solid #fbcfe8 !important; /* pink-200 */
          box-shadow: 6px 6px 0 #fbcfe8 !important;
          border-radius: 20px !important;
        }
        .border-neo-dark {
          border-color: #fbcfe8 !important;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #f9a8d4 !important;
        }
        .bg-neo-orange {
           background-color: #f43f5e !important;
           color: #fff !important;
           border: 1px solid #f43f5e !important;
           box-shadow: 0 0 10px rgba(244, 63, 94, 0.4) !important;
        }
        .text-neo-orange {
           color: #f43f5e !important;
        }
      `}</style>
    );
  }
  if (appTheme === 'vietnam') {
    return (
      <style>{`
        :root {
          --color-neo-bg: #030914 !important;
          --color-neo-dark: #e0f7fa !important;
          --color-neo-light: rgba(3, 9, 20, 0.7) !important;
          --color-neo-orange: ${accentColor} !important;
          --font-sans: "${fontFamily}", ui-sans-serif, system-ui, sans-serif !important;
        }
        .card {
          background-color: rgba(3, 9, 20, 0.72) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(0, 191, 255, 0.4) !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0, 191, 255, 0.1) !important;
          border-radius: 12px !important;
        }
        .border-neo-dark {
          border-color: rgba(255, 59, 59, 0.5) !important;
        }
        ::-webkit-scrollbar-thumb {
          background-color: rgba(0, 191, 255, 0.4) !important;
        }
        .bg-neo-orange {
           background-color: #ff3b3b !important;
           color: #fff !important;
           border: 1px solid #ff3b3b !important;
           box-shadow: 0 0 10px rgba(255, 59, 59, 0.4) !important;
        }
        .text-neo-orange {
           color: #ffcc00 !important;
           text-shadow: 0 0 8px rgba(255, 204, 0, 0.4) !important;
        }
      `}</style>
    );
  }
  return (
    <style>{`
      :root {
        --color-neo-dark: ${textColor} !important;
        --color-neo-orange: ${accentColor} !important;
        --font-sans: "${fontFamily}", ui-sans-serif, system-ui, sans-serif !important;
      }
    `}</style>
  );
};

type View =
  | "dashboard"
  | "calendar"
  | "history"
  | "planning"
  | "shared_fund"
  | "reports"
  | "tools"
  | "web_app_wrapper"
  | "love_home"
  | "love_memory"
  | "couple_games"
  | "exercises"
  | "discovery"
  | "dates"
  | "forget_me_nots"
  | "cycle"
  | "photo_album"
  | "settings"
  | "social_feed"
  | "notifications"
  | "friends";

export default function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [introTab, setIntroTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, _setCurrentView] = useState<View>("dashboard");
  const [appMode, setAppMode] = useState<"finance" | "love" | "entertainment">(
    "finance",
  );

  const setCurrentView = useCallback((view: View) => {
    _setCurrentView(view);
    const financeViews: View[] = ["dashboard", "history", "planning", "shared_fund", "reports", "tools", "calendar"];
    const loveViews: View[] = ["love_home", "love_memory", "exercises", "discovery", "dates", "forget_me_nots", "cycle", "photo_album"];
    const entertainmentViews: View[] = ["social_feed", "couple_games"];
    if (financeViews.includes(view)) {
      setAppMode("finance");
    } else if (loveViews.includes(view)) {
      setAppMode("love");
    } else if (entertainmentViews.includes(view)) {
      setAppMode("entertainment");
    }
  }, []);

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const closeTransactionForm = useCallback(() => setIsTransactionFormOpen(false), []);
  const closeFriendsView = useCallback(() => {
    if (appMode === "finance") {
      setCurrentView("dashboard");
    } else if (appMode === "love") {
      setCurrentView("love_home");
    } else {
      setCurrentView("social_feed");
    }
  }, [appMode, setCurrentView]);
  const startCall = useCallback((friendId: string, isVideo = true) => setActiveCall({ friendId, isIncoming: false, isVideo }), []);
  const closeActiveCall = useCallback(() => setActiveCall(null), []);
  const [chartPalette, setChartPalette] = useState(
    () => localStorage.getItem("__couple_chart_palette") || "default",
  );
  const [fontFamily, setFontFamily] = useState(
    () => localStorage.getItem("__couple_font") || "Inter",
  );
  const [textColor, setTextColor] = useState(
    () => localStorage.getItem("__couple_color") || "#1a1a1a",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("__couple_accent") || "#f97316",
  );
  
  const [appTheme, setAppTheme] = useState<"vintage" | "vietnam" | "pink_cute" | "google_material">(
    () => (localStorage.getItem("__couple_theme") as any) || "vietnam",
  );
  const [graphicsQuality, setGraphicsQuality] = useState<"high" | "low">(
    () => (localStorage.getItem("__couple_graphics") as "high" | "low") || "low"
  );

  const reducedMotion = useMemo(() => graphicsQuality === "low", [graphicsQuality]);

  const handleUpdateTheme = useCallback(async (newTheme: "vintage" | "vietnam" | "pink_cute" | "google_material") => {
    setAppTheme(newTheme as any);
    localStorage.setItem("__couple_theme", newTheme);
    if (user) {
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), { appTheme: newTheme });
    }
  }, [user]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem("__has_seen_onboarding") === "true",
  );

  const [profileVerified, setProfileVerified] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);
  const [systemAnnouncement, setSystemAnnouncement] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "announcement"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().show) {
        setSystemAnnouncement(docSnap.data());
      } else {
        setSystemAnnouncement(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (t) =>
        !searchQuery ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.categoryObj?.name || t.category)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const [activeCall, setActiveCall] = useState<{
    friendId: string;
    isIncoming: boolean;
    isVideo?: boolean;
  } | null>(null);
  const [appToast, setAppToast] = useState<{
    title: string;
    body: string;
    type?: "info" | "error";
  } | null>(null);

  // Global error listener to catch Firestore errors
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || String(event.reason);
      if (errorMsg.includes("[System_Diagnostic_Info]")) {
        const userMessage = errorMsg.split("\n\n[System_Diagnostic_Info]")[0];
        setAppToast({
          title: "Lỗi Thao Tác",
          body: userMessage,
          type: "error",
        });
        setTimeout(() => setAppToast(null), 5000);
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  // Redirect standard browser alerts to custom elegant in-app toasts
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      // Don't show toast for empty messages
      if (!message) return;
      const isError = message.toLowerCase().includes("lỗi") || 
                      message.toLowerCase().includes("failed") || 
                      message.toLowerCase().includes("error") || 
                      message.toLowerCase().includes("thất bại") || 
                      message.toLowerCase().includes("thất bại.") || 
                      message.toLowerCase().includes("cảnh báo") ||
                      message.toLowerCase().includes("⚠️");
      
      setAppToast({
        title: isError ? "Chi tiết thông báo" : "Thông báo",
        body: message,
        type: isError ? "error" : "info",
      });
      
      const timer = setTimeout(() => {
        setAppToast((prev) => prev?.body === message ? null : prev);
      }, 4000);
      return () => clearTimeout(timer);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Request notification permissions
  useEffect(() => {
    if (
      user &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(console.error);
    }
  }, [user]);

  // Income messages listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const chatData = change.doc.data();
          if (
            chatData.lastMessage &&
            chatData.lastSenderId &&
            chatData.lastSenderId !== user.uid
          ) {
            // Check if it's a new message (within last 5 seconds to avoid old notifications on load)
            const isRecent = chatData.updatedAt?.toMillis
              ? Date.now() - chatData.updatedAt.toMillis() < 5000
              : false;

            if (isRecent && currentView !== "friends") {
              const title = "Tin nhắn mới từ bạn bè! 💬";
              const body =
                chatData.lastMessage.substring(0, 50) +
                (chatData.lastMessage.length > 50 ? "..." : "");

              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                // Show notification
                // Check if document is hidden or showFriends is false
                if (document.hidden) {
                  const notification = new Notification(title, {
                    body,
                    icon: "/icon.png",
                  });
                  notification.onclick = () => {
                    window.focus();
                    setCurrentView("friends"); // Open friends view when clicked
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });
    return () => unsubscribe();
  }, [user, currentView]);
  // Incoming call listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "calls"), where("targetId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const callData = change.doc.data();
          // If we receive a call and we're not currently in one
          if (callData.offer && callData.callerId !== user.uid) {
            setActiveCall((prev) => {
              // If already active, do nothing
              if (
                prev &&
                prev.friendId === callData.callerId &&
                prev.isIncoming
              )
                return prev;

              // New call, trigger browser notification
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                // Only notify if document is not visible
                if (document.hidden) {
                  const notification = new Notification(
                    "Bạn có một cuộc gọi đến! 📞",
                    {
                      body: `Cuộc gọi video từ The Love App`,
                      requireInteraction: true,
                    },
                  );
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'calls');
    });
    return () => unsubscribe();
  }, [user]);

  const handleAppModeChange = (
    mode: "finance" | "love" | "娱乐" | "entertainment",
  ) => {
    setAppMode(mode as "finance" | "love" | "entertainment");
    if (mode === "finance") setCurrentView("dashboard");
    else if (mode === "love") setCurrentView("love_home");
    else setCurrentView("social_feed");
  };

  const updateChartPalette = useCallback((palette: string) => {
    setChartPalette(palette);
    localStorage.setItem("__couple_chart_palette", palette);
  }, []);

  const updateFontFamily = useCallback((font: string) => {
    setFontFamily(font);
    localStorage.setItem("__couple_font", font);
  }, []);

  const updateTextColor = useCallback((color: string) => {
    setTextColor(color);
    localStorage.setItem("__couple_color", color);
  }, []);

  const updateAccentColor = useCallback((color: string) => {
    setAccentColor(color);
    localStorage.setItem("__couple_accent", color);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", appTheme);
  }, [appTheme]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.appTheme && data.appTheme !== appTheme) {
          setAppTheme(data.appTheme);
          localStorage.setItem("__couple_theme", data.appTheme);
        } else if (!data.appTheme) {
          const defaultTheme = data.role === "admin" ? "vietnam" : "vintage";
          setAppTheme(defaultTheme);
          localStorage.setItem("__couple_theme", defaultTheme);
          // Don't await here, just fire and forget to update DB
          import("firebase/firestore").then(({ updateDoc, doc }) => {
            updateDoc(doc(db, "users", user.uid), { appTheme: defaultTheme });
          });
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        setIsCheckingProfile(true);
        try {
          const profileRef = doc(db, "users", u.uid);
          const publicProfileRef = doc(db, "publicProfiles", u.uid);
          const { getDoc, getDocFromCache, setDoc, serverTimestamp } =
            await import("firebase/firestore");
            
          let snap;
          try {
            snap = await getDoc(profileRef);
          } catch (getErr: any) {
            console.warn("getDoc failed (could be offline/lagging), trying to get from cache:", getErr);
            try {
              snap = await getDocFromCache(profileRef);
            } catch (cacheErr) {
              console.error("getDocFromCache also failed:", cacheErr);
            }
          }

          const isAdminEmail = u.email?.toLowerCase() === "kha78228@gmail.com";

          if (isAdminEmail) {
            setProfileVerified(true);
            const friendCode = (snap && snap.exists()) ? (snap.data()?.friendCode || "777") : "777";
            try {
              await setDoc(
                profileRef,
                {
                  displayName: u.displayName || "Admin Kha",
                  email: u.email || "",
                  currency: "VND",
                  friendCode: friendCode,
                  status: "online",
                  role: "admin",
                  lastSeen: serverTimestamp(),
                },
                { merge: true },
              );
              await setDoc(
                publicProfileRef,
                {
                  displayName: u.displayName || "Admin Kha",
                  friendCode: friendCode,
                  status: "online",
                  lastSeen: serverTimestamp(),
                },
                { merge: true },
              );
            } catch (writeErr) {
              console.warn("Could not write profile update to server (offline queue active):", writeErr);
            }
          } else if (snap && snap.exists()) {
            setProfileVerified(true);
            try {
              await setDoc(
                profileRef,
                { status: "online", lastSeen: serverTimestamp() },
                { merge: true },
              );
              await setDoc(
                publicProfileRef,
                { status: "online", lastSeen: serverTimestamp() },
                { merge: true },
              );
            } catch (writeErr) {
              console.warn("Could not write status update to server (offline queue active):", writeErr);
            }
          } else {
            // For Admin or Anonymous users, allow them through automatically
            if (u.isAnonymous || isAdminEmail) {
              setProfileVerified(true);
              const friendCode = Math.floor(
                100 + Math.random() * 900,
              ).toString(); // 3 digit code for anonymous
              try {
                await setDoc(profileRef, {
                  displayName:
                    u.displayName ||
                    (u.isAnonymous ? "Người Dùng Ẩn Danh" : "Người dùng"),
                  email: u.email || "",
                  currency: "VND",
                  friendCode: friendCode,
                  status: "online",
                  lastSeen: serverTimestamp(),
                });
                await setDoc(
                  publicProfileRef,
                  {
                    displayName:
                      u.displayName ||
                      (u.isAnonymous ? "Người Dùng Ẩn Danh" : "Người dùng"),
                    friendCode: friendCode,
                    status: "online",
                    lastSeen: serverTimestamp(),
                  },
                  { merge: true },
                );
              } catch (writeErr) {
                console.warn("Could not write profile to database (offline queue active):", writeErr);
              }
            } else {
              // Gracefully fallback to letting them in with basic verified state if it can't be fetched but they are authenticated
              console.warn("Authentic user profile cannot be fetched. Assuming permission/offline fallback to grant access.");
              setProfileVerified(true);
            }
          }
        } catch (error) {
          console.error("Lỗi kiểm tra profile:", error);
          // Don't lock them out if an error occurred during profile check
          setProfileVerified(true);
        } finally {
          setIsCheckingProfile(false);
          setLoading(false);
        }
      } else {
        if (user) {
          const profileRef = doc(db, "users", user.uid);
          const publicProfileRef = doc(db, "publicProfiles", user.uid);
          const { updateDoc, serverTimestamp } =
            await import("firebase/firestore");
          updateDoc(profileRef, {
            status: "offline",
            lastSeen: serverTimestamp(),
          }).catch(console.error);
          updateDoc(publicProfileRef, {
            status: "offline",
            lastSeen: serverTimestamp(),
          }).catch(console.error);
        }
        setProfileVerified(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Presence management effect
  useEffect(() => {
    if (!user) return;

    let isUnmounted = false;

    const setupPresence = async () => {
      const { updateDoc, serverTimestamp, doc } =
        await import("firebase/firestore");
      const profileRef = doc(db, "users", user.uid);
      const publicProfileRef = doc(db, "publicProfiles", user.uid);

      const updatePresence = (status: "online" | "offline") => {
        if (isUnmounted) return;
        updateDoc(profileRef, { status, lastSeen: serverTimestamp() }).catch(
          console.error,
        );
        updateDoc(publicProfileRef, {
          status,
          lastSeen: serverTimestamp(),
        }).catch(console.error);
      };

      const handleUnload = () => updatePresence("offline");
      window.addEventListener("beforeunload", handleUnload);

      const handleVisibilityChange = () => {
        updatePresence(
          document.visibilityState === "visible" ? "online" : "offline",
        );
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        isUnmounted = true;
        window.removeEventListener("beforeunload", handleUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        updatePresence("offline");
      };
    };

    let cleanupPromise = setupPresence();

    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [user]);

  const handleVerifyInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    setIsVerifyingInvite(true);
    setInviteError("");

    try {
      const { doc, runTransaction, increment } =
        await import("firebase/firestore");
      const codeRef = doc(db, "invite_codes", inviteCode.trim().toUpperCase());

      await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);

        if (!codeSnap.exists()) {
          throw new Error("NOT_FOUND");
        }

        const codeData = codeSnap.data();
        if (
          codeData.uses >= 10 &&
          codeData.createdBy !== "kha78228@gmail.com"
        ) {
          throw new Error("LIMIT_EXCEEDED");
        }

        const expiresAt = codeData.expiresAt || 0;
        if (Date.now() > expiresAt && expiresAt > 0) {
          throw new Error("EXPIRED");
        }

        transaction.update(codeRef, {
          uses: increment(1),
        });

        const profileRef = doc(db, "users", user.uid);
        const newFriendCode = Math.floor(100 + Math.random() * 900).toString(); // 3 số
        transaction.set(profileRef, {
          displayName: user.displayName || "Người dùng",
          email: user.email || "",
          currency: "VND",
          friendCode: newFriendCode,
          status: "online",
        });

        const publicProfileRef = doc(db, "publicProfiles", user.uid);
        transaction.set(
          publicProfileRef,
          {
            displayName: user.displayName || "Người dùng",
            friendCode: newFriendCode,
            status: "online",
          },
          { merge: true },
        );
      });

      setProfileVerified(true);
    } catch (error: any) {
      if (error.message === "NOT_FOUND")
        setInviteError("Mã mời không tồn tại hoặc không hợp lệ.");
      else if (error.message === "LIMIT_EXCEEDED")
        setInviteError("Mã mời đã đạt giới hạn lượt sử dụng.");
      else if (error.message === "EXPIRED")
        setInviteError("Mã mời đã hết hạn.");
      else {
        console.error(error);
        setInviteError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setIsVerifyingInvite(false);
    }
  };

  const handleConnectSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setInviteError("");

    try {
      const { signInAnonymouslyUser } = await import("./lib/firebase");
      const { doc, getDoc, setDoc, serverTimestamp } =
        await import("firebase/firestore");

      const codeToUse = inviteCode.trim();
      let joinedCode = "";
      let isJoining = false;
      let creatorUid = "";

      if (codeToUse) {
        if (codeToUse.length !== 3) {
          setInviteError("Vui lòng nhập đúng mã ẩn danh (3 số).");
          setIsLoggingIn(false);
          return;
        }

        // Checking existing code
        const codeRef = doc(db, "invite_codes", codeToUse);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists()) {
          setInviteError("Mã tham gia không tồn tại.");
          setIsLoggingIn(false);
          return;
        }

        const data = codeSnap.data();
        if (data.expiresAt < Date.now()) {
          setInviteError("Mã tham gia đã hết hạn.");
          setIsLoggingIn(false);
          return;
        }

        if (data.type === "anonymous") {
          const limit = data.createdBy === "kha78228@gmail.com" ? 1 : 2;
          if (data.uses >= limit) {
            setInviteError("Mã tham gia đã được sử dụng hết.");
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
        if (
          err.code === "auth/operation-not-allowed" ||
          err.code === "auth/admin-restricted-operation"
        ) {
          throw new Error(
            'Tính năng Ẩn danh chưa được bật. Vui lòng bật "Anonymous" trong Firebase Console > Authentication > Sign-in method.',
          );
        }
        throw err;
      }
      const user = userCred.user;

      // If no code provided, generate a new one
      if (!isJoining) {
        // ID 3 số bắt đầu từ 100
        joinedCode = Math.floor(100 + Math.random() * 900).toString();
        await setDoc(doc(db, "invite_codes", joinedCode), {
          creatorUid: user.uid,
          createdAt: serverTimestamp(),
          expiresAt: Date.now() + 24 * 3600 * 1000, // 24 hours expiry
          uses: 1,
          type: "anonymous",
        });
      } else {
        const { increment } = await import("firebase/firestore");
        await setDoc(
          doc(db, "invite_codes", codeToUse),
          { uses: increment(1) },
          { merge: true },
        );
      }

      // Create their profile and link them
      const profileRef = doc(db, "users", user.uid);
      await setDoc(
        profileRef,
        {
          displayName: "Người Dùng Ẩn Danh",
          currency: "VND",
          status: "online",
          friendCode: joinedCode, // Share the same code visually
          lastSeen: serverTimestamp(),
          role: !isJoining ? "admin" : "member",
          appTheme: "vietnam", // Default theme
        },
        { merge: true },
      );

      const publicProfileRef = doc(db, "publicProfiles", user.uid);
      await setDoc(
        publicProfileRef,
        {
          displayName: "Người Dùng Ẩn Danh",
          friendCode: joinedCode,
          status: "online",
        },
        { merge: true },
      );

      // Automatically pair them if joining
      if (isJoining && creatorUid && creatorUid !== user.uid) {
        await setDoc(doc(db, `users/${user.uid}/friends/${creatorUid}`), {
          friendId: creatorUid,
          status: "accepted",
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, `users/${creatorUid}/friends/${user.uid}`), {
          friendId: user.uid,
          status: "accepted",
          createdAt: serverTimestamp(),
        });
      }

      setProfileVerified(true);
    } catch (error: any) {
      console.error(error);
      setInviteError(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setIsFetchingData(false);
      return;
    }

    setIsFetchingData(true);

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy("date", "desc"),
    );

    const unsubscribeT = onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(txs);
        setIsFetchingData(false);
      },
      (error) => {
        setIsFetchingData(false);
        handleFirestoreError(
          error,
          OperationType.LIST,
          `users/${user.uid}/transactions`,
        );
      },
    );

    return () => unsubscribeT();
  }, [user]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions/${id}`));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${user.uid}/transactions/${id}`,
      );
    }
  }, [user]);

  const handleDownloadData = useCallback(() => {
    if (transactions.length === 0) return;

    const headers = [
      "Ngày",
      "Loại",
      "Danh mục",
      "Số tiền",
      "Ghi chú",
      "Cảm xúc",
    ];

    const rows = transactions.map((t) => {
      const type = t.type === "income" ? "Thu" : "Chi";
      const category = t.categoryObj ? t.categoryObj.name : t.category;
      return [
        t.date,
        type,
        category,
        t.amount,
        t.description || "",
        t.emotion || "",
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fintro_transactions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  const handleDeleteAllData = useCallback(async () => {
    if (!user) return;
    try {
      const txQuery = query(collection(db, `users/${user.uid}/transactions`));
      const { getDocs } = await import("firebase/firestore");
      const snapshot = await getDocs(txQuery);
      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, `users/${user.uid}/transactions/${docSnap.id}`)),
      );
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `users/${user.uid}/transactions`,
      );
    }
  }, [user]);

  if (!hasSeenOnboarding) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-neo-bg flex items-center justify-center -m-4"><Loader2 className="w-8 h-8 animate-spin text-neo-orange" /></div>}>
        <Onboarding
          onComplete={() => {
            localStorage.setItem("__has_seen_onboarding", "true");
            setHasSeenOnboarding(true);
          }}
        />
      </Suspense>
    );
  }

  if (loading || (user && isCheckingProfile)) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {appTheme === 'pink_cute' ? (
          <PinkCuteLoadingScreen appMode={appMode} />
        ) : appTheme === 'vintage' ? (
          <VintageLoadingScreen appMode={appMode} />
        ) : (
          <VietnamLoadingScreen appMode={appMode} graphicsQuality={graphicsQuality} />
        )}
      </Suspense>
    );
  }

  if (user && !profileVerified && user.email?.toLowerCase() !== "kha78228@gmail.com") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neo-light border border-neo-dark p-8 max-w-sm w-full shadow-[10px_10px_0_var(--color-neo-dark)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255, 204, 0, 0.15) 0%, transparent 70%)" }} />
          <h2 className="text-2xl font-display font-medium text-neo-dark mb-2 relative z-10 uppercase tracking-widest border-b border-neo-dark pb-4">
            Xác Tựt Quyền
          </h2>
          <p className="text-neo-dark/70 mt-4 mb-8 text-xs font-mono tracking-widest uppercase relative z-10 leading-relaxed">
            HỆ THỐNG BÁO MẬT. VUI LÒNG NHẬP MÃ BẢO MẬT ĐỂ TRUY CẬP KHÔNG GIAN.
          </p>
          <form
            onSubmit={handleVerifyInviteCode}
            className="space-y-6 relative z-10"
          >
            <div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-neo-bg border border-neo-dark px-4 py-4 outline-none focus:ring-0 font-mono text-center tracking-[0.5em] text-lg uppercase transition-all"
                placeholder="MÃ"
                maxLength={6}
                required
              />
            </div>
            {inviteError && (
              <p className="text-neo-orange text-xs font-bold uppercase tracking-widest text-center mt-2">
                {inviteError}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifyingInvite || inviteCode.length < 6}
              className="btn-primary w-full"
            >
              {isVerifyingInvite ? "ĐANG XÁC THỰC..." : "BẮT ĐẦU"}
            </button>

            <div className="pt-6 border-t border-neo-dark/20 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  signOut(auth);
                  setInviteCode("");
                  setInviteError("");
                }}
                className="text-[10px] font-bold tracking-widest uppercase text-neo-dark hover:text-neo-orange transition-colors"
              >
                &larr; Trở lại màn hình chính
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div data-theme={appTheme} className="min-h-screen flex flex-col font-sans text-neo-dark relative overflow-hidden selection:bg-neo-orange selection:text-white pb-safe">
        <ThemeStyles appTheme={appTheme} textColor={textColor} accentColor={accentColor} fontFamily={fontFamily} />
        <Suspense fallback={<div className="fixed inset-0 bg-neutral-900" />}>
          {appTheme === "vietnam" ? (
            <VietnamBackground appMode={appMode} graphicsQuality={graphicsQuality} />
          ) : appTheme === "pink_cute" ? (
            <PinkCuteBackground appMode={appMode} />
          ) : appTheme === "google_material" ? (
            <GoogleMaterialBackground />
          ) : (
            <VintageBackground appMode={appMode} />
          )}
        </Suspense>

        {/* Top bar */}
        <header className="relative flex items-center justify-between px-6 py-4 md:px-12 md:py-8 z-20">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className={`relative relative w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full shrink-0 ${appTheme === "vietnam" ? "border-[#ff3b3b] bg-[#ff3b3b] shadow-md" : "border-neo-dark bg-neo-orange shadow-[2px_2px_0_var(--color-neo-dark)]"}`}
              >
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(-90deg)" }} />
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(30deg)" }} />
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(150deg)" }} />
                
                <div className="absolute" style={{ left: "calc(50% + 24%)", top: "calc(50% - 14%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Wallet className={`w-3 h-3 md:w-4 md:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "50%", top: "calc(50% + 27%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Heart className={`w-3 h-3 md:w-4 md:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "calc(50% - 24%)", top: "calc(50% - 14%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Sparkles className={`w-3 h-3 md:w-4 md:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className="font-bold text-sm tracking-widest uppercase flex flex-col leading-none">
              <span className="font-display">Fintro</span>
              <span className="text-[9px] text-neo-orange mt-1">{appTheme === "vietnam" ? "Không Gian Mới" : "Couple App"}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[10px] font-bold tracking-[0.2em] uppercase">
            <span className="flex flex-col items-center gap-1 cursor-pointer">
              Trang Chủ{" "}
              <span className="w-1 h-1 bg-neo-dark rounded-full"></span>
            </span>
            <span className="cursor-pointer hover:text-neo-orange transition-colors">
              Tầm Nhìn
            </span>
            <span className="cursor-pointer hover:text-neo-orange transition-colors">
              Ý Nghĩa
            </span>
            <span className="cursor-pointer hover:text-neo-orange transition-colors">
              Trải Nghiệm
            </span>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleUpdateTheme(appTheme === "vietnam" ? "vintage" : appTheme === "vintage" ? "pink_cute" : appTheme === "pink_cute" ? "google_material" : "vietnam")}
              className="px-4 py-2 border border-neo-dark text-[10px] uppercase font-bold tracking-widest hover:bg-neo-dark hover:text-neo-light active:scale-95 transition-all hidden sm:block"
            >
              Giao Diện: {appTheme === "vietnam" ? "Việt Nam 2026" : appTheme === 'pink_cute' ? "Hường Dễ Thương" : appTheme === 'google_material' ? "Google Material" : "Neo-Brutalism"}
            </button>
            <button
              onClick={() => {
                const newQ = graphicsQuality === "high" ? "low" : "high";
                setGraphicsQuality(newQ);
                localStorage.setItem("__couple_graphics", newQ);
              }}
              className="px-4 py-2 border border-neo-dark text-[10px] uppercase font-bold tracking-widest hover:bg-neo-dark hover:text-neo-light active:scale-95 transition-all hidden sm:block"
            >
              Đồ Hoạ: {graphicsQuality === "high" ? "Cao" : "Tối Giản"}
            </button>
            <button className="bg-neo-dark text-neo-light px-6 py-3 text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-neo-orange active:scale-95 transition-all hidden sm:block">
              Kết Nối
            </button>
            <div className="w-8 h-8 rounded-full border border-neo-dark flex items-center justify-center sm:hidden border border-neo-dark flex flex-center items-center justify-center sm:hidden">
              <Plus className="w-4 h-4 text-neo-dark" />
            </div>
          </div>
        </header>

        {/* Main Structure */}
        <div className="flex flex-col md:flex-row flex-1 relative z-10 w-full max-w-[1600px] mx-auto border-x border-neo-dark border-opacity-20 shadow-none">
          {/* Left column */}
          <div className="flex-1 border-r border-neo-dark flex flex-col relative p-6 md:p-12 lg:p-20 overflow-y-auto">
            {/* Vertical text */}
            <div className={`absolute left-6 top-20 vertical-text text-xs font-medium hidden md:block ${appTheme === "vietnam" ? "tracking-[0.6em] uppercase text-neo-dark/70" : "tracking-[0.6em] text-neo-dark/70"}`}>
              {appTheme === "vietnam" ? "Kỷ Nguyên Vươn Mình" : "未来を描き、共に創る。"}
            </div>

            <div className="md:pl-16 relative">
              {appTheme === "vietnam" && (
                <div className={`absolute inset-0 z-20 pointer-events-none transform -translate-y-24 -translate-x-20 scale-[0.8] md:scale-[1.5] origin-top-left md:origin-center sm:translate-y-[-10%] sm:translate-x-[-20%] overflow-visible ${graphicsQuality === "high" ? "opacity-30 mix-blend-plus-lighter" : "opacity-20"}`}>
                  <DongSonDrumHUD appMode={appMode} graphicsQuality={graphicsQuality} />
                </div>
              )}
              <h1 className={`text-7xl md:text-[8rem] lg:text-[10rem] leading-[0.85] font-display font-medium text-neo-dark mb-6 tracking-tighter uppercase relative z-10 pointer-events-none ${graphicsQuality === "high" ? "mix-blend-overlay" : ""}`}>
                Fintro Pro <br /> {appTheme === "vietnam" ? "Không Gian" : "Couple"}
                <br /> {appTheme === "vietnam" ? "Mới" : "App"}
              </h1>

              {appTheme === "vietnam" ? (
                <>
                  <p className="text-2xl md:text-3xl text-neo-orange font-sans border-l-4 border-neo-orange pl-4 mb-10 italic tracking-[0.15em] font-light">
                    Việt Nam 2026
                  </p>

                  <p className="text-sm md:text-base tracking-[0.2em] font-sans uppercase mb-12 max-w-md leading-relaxed font-bold text-neo-dark">
                    Kỷ Nguyên <br />
                    <span className="text-neo-orange">Vươn Mình Của Dân Tộc</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-3xl text-neo-orange font-display mb-12 italic tracking-wide">
                    Phiên Bản 2026
                  </p>

                  <p className="text-xs md:text-sm tracking-[0.15em] uppercase mb-10 max-w-sm leading-relaxed font-semibold text-neo-dark/80">
                    Tài Chính, Kết Nối,
                    <br /> Tình Yêu, Lạc Quan
                  </p>
                </>
              )}

              {/* Added 3 App Logos to fill empty space */}
              <div className="flex flex-wrap gap-4 md:gap-8 mb-12">
                <div className="flex items-center gap-2 md:gap-3 opacity-90 transition-opacity hover:opacity-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-light flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)]">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Tài Chính</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 opacity-90 transition-opacity hover:opacity-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-white flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-orange)]">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-neo-orange" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Tình Yêu</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 opacity-90 transition-opacity hover:opacity-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-orange flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)]">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Giải Trí</span>
                </div>
              </div>

              <div className="flex items-end gap-2 text-[10px] md:text-xs font-mono font-bold border border-neo-dark p-2 w-fit mb-12 hover:bg-neo-dark hover:text-neo-light transition-colors cursor-pointer group">
                <span>KẾT NỐI VÀ KIẾN TẠO</span>
                <ArrowRight className="w-3 h-3 group-hover:text-neo-orange transition-colors" />
              </div>
            </div>

            {/* Login Form Area */}
            <div className="mt-auto md:pl-16 max-w-xl">
              <div className="border-t border-neo-dark pt-4 lg:-ml-16 lg:pl-16">
                {systemAnnouncement &&
                  systemAnnouncement.show &&
                  systemAnnouncement.text && (
                    <div className="overflow-hidden whitespace-nowrap border-b border-neo-dark py-2 mb-6 bg-transparent relative flex items-center w-full">
                      <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-neo-dark absolute left-0 bg-transparent z-10 px-4 border-r border-neo-dark">
                        Hệ Thống
                      </span>
                      {React.createElement(
                        "marquee",
                        {
                          className: "text-xs font-bold tracking-widest text-neo-orange ml-24",
                          scrollamount: "5"
                        } as any,
                        systemAnnouncement.text
                      )}
                    </div>
                  )}
                <div className="pt-8 w-full">
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-neo-dark mb-6">
                    Trải nghiệm ngay
                  </p>

                  <div className="grid grid-cols-1 gap-6">
                    <Suspense fallback={<div className="h-44 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neo-orange" /></div>}>
                      {appTheme === "vietnam" ? (
                        <VietnamLoginForm
                          isLoggingIn={isLoggingIn}
                          inviteCode={inviteCode}
                          setInviteCode={setInviteCode}
                          handleConnectSpace={handleConnectSpace}
                          inviteError={inviteError}
                          graphicsQuality={graphicsQuality}
                          onGoogleSignIn={async () => {
                            setIsLoggingIn(true);
                            try {
                              const { signInWithGoogle } = await import("./lib/firebase");
                              await signInWithGoogle();
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsLoggingIn(false);
                            }
                          }}
                        />
                      ) : (
                        <VintageLoginForm
                          isLoggingIn={isLoggingIn}
                          inviteCode={inviteCode}
                          setInviteCode={setInviteCode}
                          handleConnectSpace={handleConnectSpace}
                          inviteError={inviteError}
                          onGoogleSignIn={async () => {
                            setIsLoggingIn(true);
                            try {
                              const { signInWithGoogle } = await import("./lib/firebase");
                              await signInWithGoogle();
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsLoggingIn(false);
                            }
                          }}
                        />
                      )}
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column / Graphic */}
          <div className="w-full md:w-[40%] text-neo-dark relative flex flex-col min-h-[500px] border-l border-neo-dark bg-transparent">
            <div className="absolute right-0 top-0 w-[2px] h-full bg-neo-dark/10 z-0" />
            <div className="absolute right-12 top-0 w-[1px] h-full bg-neo-dark/5 z-0" />

            <div className="p-4 md:p-8 border-b border-neo-dark flex items-center justify-between gap-4 relative z-20 bg-transparent backdrop-blur-sm">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {introTab === 0 && (
                    <motion.div
                      key="tab0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-transparent flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)] shrink-0">
                        <Wallet className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Tài Chính</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Quản lý chi tiêu minh bạch, theo dõi ngân sách chung và nền tảng bền vững.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {introTab === 1 && (
                    <motion.div
                      key="tab1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-white flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-orange)] shrink-0">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-neo-orange" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Tình Yêu</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Lưu giữ kỷ niệm, những ngày quan trọng và chia sẻ không gian cảm xúc.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {introTab === 2 && (
                    <motion.div
                      key="tab2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-orange flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)] shrink-0">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Giải Trí</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Thư giãn với trò chơi thú vị và chia sẻ không gian trò chuyện.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2 md:gap-4 shrink-0 justify-end">
                <button
                  onClick={() => setIntroTab(0)}
                  className={`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border p-3 md:p-4 transition-colors ${appTheme === "vietnam" ? (introTab === 0 ? "bg-[#00bfff] text-white border-[#00bfff] shadow-[-4px_4px_0_rgba(0,191,255,0.4)]" : "bg-transparent text-[#00bfff] border-[#00bfff] opacity-50 hover:opacity-100 shadow-[-4px_4px_0_rgba(0,191,255,0.4)]") : (introTab === 0 ? "bg-neo-bg/50 border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)]" : "bg-transparent border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)] opacity-50 hover:opacity-100")}`}
                >
                  Tài Chính
                </button>
                <button
                  onClick={() => setIntroTab(1)}
                  className={`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border p-3 md:p-4 transition-colors ${appTheme === "vietnam" ? (introTab === 1 ? "bg-[#ff3b3b] text-white border-[#ff3b3b] shadow-[-4px_4px_0_rgba(255,59,59,0.4)]" : "bg-transparent text-[#ff3b3b] border-[#ff3b3b] opacity-50 hover:opacity-100 shadow-[-4px_4px_0_rgba(255,59,59,0.4)]") : (introTab === 1 ? "bg-white text-neo-dark border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)]" : "bg-transparent border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)] opacity-50 hover:opacity-100")}`}
                >
                  Tình Yêu
                </button>
                <button
                  onClick={() => setIntroTab(2)}
                  className={`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border p-3 md:p-4 transition-colors ${appTheme === "vietnam" ? (introTab === 2 ? "bg-[#ffcc00] text-[#030914] border-[#ffcc00] shadow-[-4px_4px_0_rgba(255,204,0,0.4)]" : "bg-transparent text-[#ffcc00] border-[#ffcc00] opacity-50 hover:opacity-100 shadow-[-4px_4px_0_rgba(255,204,0,0.4)]") : (introTab === 2 ? "bg-neo-orange text-neo-dark border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)]" : "bg-transparent border-neo-dark shadow-[-4px_4px_0_var(--color-neo-dark)] opacity-50 hover:opacity-100")}`}
                >
                  Giải Trí
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 flex items-center justify-center relative mt-8 md:mt-12 bg-transparent text-neo-dark">
              {appTheme === "vietnam" ? (
                <DongSonDrumHUD appMode={appMode} graphicsQuality={graphicsQuality} />
              ) : (
                <>
                  {/* Center abstract circle representing sun/horizon */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 25,
                        ease: "linear",
                      }}
                      className="w-64 h-64 md:w-[22rem] md:h-[22rem] rounded-full border border-dashed border-neo-dark flex items-center justify-center relative overflow-hidden border border-dashed border-neo-dark flex items-center justify-center relative overflow-hidden"
                    >
                      <div className="w-full h-[1px] bg-neo-dark absolute top-1/2" />
                      <div className="w-[1px] h-full bg-neo-dark absolute left-1/2" />
                      <div className="w-full h-[1px] bg-neo-dark absolute top-1/2 rotate-45" />
                      <div className="w-[1px] h-full bg-neo-dark absolute left-1/2 -rotate-45" />
                    </motion.div>
                  </div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 15,
                      ease: "linear",
                    }}
                    className={`w-56 h-56 md:w-72 md:h-72 rounded-full border border-neo-dark shadow-[10px_10px_0_var(--color-neo-dark)] flex items-center justify-center relative z-10 bg-[#e7d8c6] opacity-90 border border-neo-dark shadow-[10px_10px_0_var(--color-neo-dark)] flex items-center justify-center relative z-10 bg-[#e7d8c6] opacity-90`}
                  >
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-3xl" style={{ transform: "rotate(-90deg)" }} />
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-3xl" style={{ transform: "rotate(30deg)" }} />
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-3xl" style={{ transform: "rotate(150deg)" }} />
                    {/* Icons around the inner circle */}
                    <div className="absolute" style={{ left: "calc(50% + 26%)", top: "calc(50% - 15%)", transform: "translate(-50%, -50%)" }}>
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-3xl shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                      >
                        <Wallet className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                      </motion.div>
                    </div>
                    <div className="absolute" style={{ left: "50%", top: "calc(50% + 30%)", transform: "translate(-50%, -50%)" }}>
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-3xl shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                      >
                        <Heart className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                      </motion.div>
                    </div>
                    <div className="absolute" style={{ left: "calc(50% - 26%)", top: "calc(50% - 15%)", transform: "translate(-50%, -50%)" }}>
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-3xl shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                      >
                        <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                      </motion.div>
                    </div>
                    <div className="absolute w-[25%] h-[25%] rounded-3xl border border-neo-dark bg-transparent z-10" />
                  </motion.div>
                </>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-neo-dark grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-bold text-neo-dark/80 bg-transparent relative z-20">
              <div>
                <p className="text-neo-dark mb-1">{appTheme === "vietnam" ? "Khát Vọng" : "Kiến trúc"}</p>
                <p>{appTheme === "vietnam" ? "Nâng Tầm Vóc" : "Hệ thống Không"}</p>
                <p>{appTheme === "vietnam" ? "Tương Lai 2026" : "Cấu trúc 001"}</p>
              </div>
              <div className="text-right">
                <p className="text-neo-dark mb-1">{appTheme === "vietnam" ? "Tinh Thần" : "Trạng thái"}</p>
                <p>{appTheme === "vietnam" ? "Bứt Phá" : "Trực Tuyến"}</p>
                <p>{appTheme === "vietnam" ? "Tiên Phong" : "Dữ Liệu An Toàn"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderViewContent = () => {
    if (isFetchingData) {
      return (
        <motion.div
          key="loading_data"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as any }}
        >
          <LoadingSpinner />
        </motion.div>
      );
    }

    const motionProps = {
      initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.99 },
      transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as any }
    };

    switch (currentView) {
      case "dashboard":
        return (
          <motion.div key="dashboard" {...motionProps}>
            <Dashboard
              transactions={filteredTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              setCurrentView={setCurrentView}
              appTheme={appTheme}
            />
          </motion.div>
        );
      case "history":
        return (
          <motion.div key="history" {...motionProps}>
            <TransactionList
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        );
      case "calendar":
        return (
          <motion.div key="calendar" {...motionProps}>
            <CalendarView transactions={filteredTransactions} reducedMotion={reducedMotion} user={user} />
          </motion.div>
        );
      case "planning":
        return (
          <motion.div key="planning" {...motionProps}>
            <Planning transactions={filteredTransactions} reducedMotion={reducedMotion} appTheme={appTheme} />
          </motion.div>
        );
      case "shared_fund":
        if (!user) return null;
        return (
          <motion.div key="shared_fund" {...motionProps}>
            <SharedFund user={user} />
          </motion.div>
        );
      case "reports":
        return (
          <motion.div key="reports" {...motionProps}>
            <Reports
              transactions={filteredTransactions}
              chartPalette={chartPalette}
              setChartPalette={setChartPalette}
            />
          </motion.div>
        );
      case "tools":
        return (
          <motion.div key="tools" {...motionProps}>
            <Tools setCurrentView={setCurrentView} appMode={appMode} />
          </motion.div>
        );
      case "web_app_wrapper":
        return (
          <motion.div key="web_app_wrapper" {...motionProps}>
            <WebAppWrapper appMode={appMode} />
          </motion.div>
        );
      case "love_home":
        return (
          <motion.div key="love_home" {...motionProps}>
            <LoveGames user={user} />
          </motion.div>
        );
      case "love_memory":
        return (
          <motion.div key="love_memory" {...motionProps}>
            <LoveMemory user={user} />
          </motion.div>
        );
      case "couple_games":
        if (appMode === "love") return null;
        return (
          <motion.div key="couple_games" {...motionProps}>
            <CoupleGames user={user} />
          </motion.div>
        );
      case "exercises":
        return (
          <motion.div key="exercises" {...motionProps}>
            <RelationshipExercises />
          </motion.div>
        );
      case "discovery":
        return (
          <motion.div key="discovery" {...motionProps}>
            <DiscoveryDeck />
          </motion.div>
        );
      case "dates":
        return (
          <motion.div key="dates" {...motionProps}>
            <DateIdeas user={user} />
          </motion.div>
        );
      case "forget_me_nots":
        return (
          <motion.div key="forget_me_nots" {...motionProps}>
            <ForgetMeNots user={user} />
          </motion.div>
        );
      case "cycle":
        return (
          <motion.div key="cycle" {...motionProps}>
            <CycleTracker user={user} />
          </motion.div>
        );
      case "photo_album":
        return (
          <motion.div key="photo_album" {...motionProps}>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-neo-orange" /></div>}>
              <PhotoAlbum appTheme={appTheme} />
            </Suspense>
          </motion.div>
        );
      case "social_feed":
        return (
          <motion.div key="social_feed" {...motionProps}>
            <SocialFeed user={user} userProfile={userProfile} />
          </motion.div>
        );
      case "notifications":
        return (
          <motion.div key="notifications" {...motionProps}>
            <Suspense fallback={<div className="h-40 flex justify-center items-center">Đang tải...</div>}>
              <NotificationCenter onNavigate={(v) => setCurrentView(v as View)} />
            </Suspense>
          </motion.div>
        );
      case "friends":
        if (!user) return null;
        return (
          <motion.div key="friends" {...motionProps}>
            <FriendsView
              user={user}
              onClose={closeFriendsView}
              onStartCall={startCall}
            />
          </motion.div>
        );
      case "settings":
        return (
          <motion.div key="settings" {...motionProps}>
            <SettingsView
              user={user}
              fontFamily={fontFamily}
              setFontFamily={updateFontFamily}
              textColor={textColor}
              setTextColor={updateTextColor}
              accentColor={accentColor}
              setAccentColor={updateAccentColor}
              chartPalette={chartPalette}
              setChartPalette={updateChartPalette}
              onDeleteData={handleDeleteAllData}
              onDownloadData={handleDownloadData}
              appTheme={appTheme}
              setAppTheme={handleUpdateTheme}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div data-theme={appTheme} className="min-h-screen pb-24 md:pb-8 flex flex-col font-sans bg-transparent text-neo-dark selection:bg-neo-orange selection:text-white relative">
      <ThemeStyles appTheme={appTheme} textColor={textColor} accentColor={accentColor} fontFamily={fontFamily} />
      <Suspense fallback={null}>
        {appTheme === "vietnam" ? (
          <VietnamBackground appMode={appMode} graphicsQuality={graphicsQuality} />
        ) : appTheme === "pink_cute" ? (
          <PinkCuteBackground appMode={appMode} />
        ) : appTheme === "google_material" ? (
          <GoogleMaterialBackground />
        ) : (
          <VintageBackground appMode={appMode} />
        )}
      </Suspense>

      {/* Offline Status Top Alert */}
      {!isOnline && (
        <div className="bg-[#fb923c] text-neutral-950 font-bold tracking-widest text-center py-2.5 px-4 shadow-md uppercase sticky top-0 z-[1001] flex items-center justify-center gap-2 text-[10px] border-b border-neo-dark">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Bạn đang ngoại tuyến • Hệ thống đã tự động kích hoạt Cơ Sở Dữ Liệu Ngoại Tuyến (Offline Persistence Mode)</span>
        </div>
      )}

      {/* PWA Update Ready Toast */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-[1000] bg-neutral-950 border border-neutral-800 text-white rounded-3xl p-5 shadow-2xl md:max-w-sm flex flex-col gap-3.5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-wide text-white">BẢN CẬP NHẬT MỚI! 🎉</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">Fintro đã sẵn sàng phiên bản mới mượt mà hơn. Hãy cập nhật ngay để áp dụng!</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pl-13">
              <button
                onClick={() => setNeedRefresh(false)}
                className="text-xs font-bold text-neutral-400 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
              >
                Để sau
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="text-xs font-bold text-neutral-900 bg-emerald-400 hover:bg-emerald-300 px-4.5 py-2 rounded-xl transition-colors hover:shadow-lg shadow-emerald-400/20"
              >
                Cập nhật ngay ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Decorative vertical lines for Neo layout */}
      <div className="fixed inset-0 pointer-events-none z-0 max-w-[1600px] mx-auto border-x border-neo-dark/10 shadow-md" />
      <div className="fixed top-0 bottom-0 left-1/4 w-[1px] bg-neo-dark/5 pointer-events-none z-0 hidden lg:block" />
      <div className="fixed top-0 bottom-0 right-1/4 w-[1px] bg-neo-dark/5 pointer-events-none z-0 hidden lg:block" />

      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-neo-light/95 backdrop-blur-md border-b border-neo-dark flex flex-col"
        style={{ willChange: "transform" }}
      >
        <AnimatePresence>
          {systemAnnouncement &&
            !systemAnnouncement.hiddenLocally &&
            systemAnnouncement.isMarquee && (
              <div
                className="w-full relative shadow-sm pointer-events-auto border-b border-neo-dark"
                style={{
                  backgroundColor: systemAnnouncement.backgroundColor || "#fbbf24",
                  color: systemAnnouncement.textColor || "#000",
                  fontFamily: systemAnnouncement.fontFamily || "Inter",
                }}
              >
                <div
                  className="whitespace-nowrap overflow-hidden py-2"
                  style={{ fontSize: `${systemAnnouncement.fontSize || 14}px` }}
                >
                  <div className="animate-marquee inline-block font-bold mt-1">
                    <span className="mx-8">{systemAnnouncement.text}</span>
                    <span className="mx-8">{systemAnnouncement.text}</span>
                    <span className="mx-8">{systemAnnouncement.text}</span>
                    <span className="mx-8">{systemAnnouncement.text}</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSystemAnnouncement({
                      ...systemAnnouncement,
                      hiddenLocally: true,
                    })
                  }
                  className="absolute top-1/2 -translate-y-1/2 right-2 bg-black/10 hover:bg-black/20 rounded-3xl p-1 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
        </AnimatePresence>
        <div
          className={`mx-auto px-4 md:px-8 h-20 w-full flex items-center justify-between ${appMode === "finance" ? "max-w-[1600px]" : "max-w-[1600px]"} border-x border-neo-dark/10`}
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full shrink-0 ${appTheme === "vietnam" ? "border-[#ff3b3b] bg-[#ff3b3b] shadow-md" : "border-neo-dark bg-neo-orange shadow-[2px_2px_0_var(--color-neo-dark)]"}`}
              >
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(-90deg)" }} />
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(30deg)" }} />
                <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left mt-[-1px] ${appTheme === 'vietnam' ? 'bg-white' : 'bg-neo-dark'}`} style={{ transform: "rotate(150deg)" }} />
                
                <div className="absolute" style={{ left: "calc(50% + 24%)", top: "calc(50% - 14%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Wallet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "50%", top: "calc(50% + 27%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "calc(50% - 24%)", top: "calc(50% - 14%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }}>
                    <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${appTheme === 'vietnam' ? 'text-white' : 'text-neo-dark'}`} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
            <div className="flex flex-col leading-none hidden sm:flex">
              <span className="font-display font-medium text-lg tracking-widest text-neo-dark uppercase">
               Fintro
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-neo-orange uppercase">
                {appTheme === "vietnam" ? "Không Gian Mới" : "Couple App"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Segmented Mode Switcher */}
            <div className={`flex p-1 rounded-full border mr-1 sm:mr-3 relative ${appTheme === 'vietnam' ? 'bg-[#1a1c1e] border-neutral-700/50' : 'bg-neutral-100/80 border-neutral-200/50'}`}>
              <button
                onClick={() => handleAppModeChange("finance")}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs transition-colors duration-300 select-none ${
                  appMode === "finance" 
                    ? "text-white" 
                    : appTheme === 'vietnam' ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
                }`}
                title="Chế độ Tài chính"
              >
                {appMode === "finance" && (
                  <motion.div
                    layoutId="active-mode-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${appTheme === 'vietnam' ? 'bg-[#ff3b3b]' : 'bg-neutral-900'}`}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline leading-none">Tài chính</span>
              </button>

              <button
                onClick={() => handleAppModeChange("love")}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs transition-colors duration-300 select-none ${
                  appMode === "love" 
                    ? "text-white" 
                    : appTheme === 'vietnam' ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
                }`}
                title="Chế độ Tình yêu"
              >
                {appMode === "love" && (
                  <motion.div
                    layoutId="active-mode-pill"
                    className="absolute inset-0 bg-rose-500 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Heart className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline leading-none">Tình yêu</span>
              </button>

              <button
                onClick={() => handleAppModeChange("entertainment")}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs transition-colors duration-300 select-none ${
                  appMode === "entertainment" 
                    ? "text-white" 
                    : appTheme === 'vietnam' ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
                }`}
                title="Chế độ Giải trí"
              >
                {appMode === "entertainment" && (
                  <motion.div
                    layoutId="active-mode-pill"
                    className="absolute inset-0 bg-teal-600 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline leading-none">Giải trí</span>
              </button>
            </div>

            <motion.button
              onClick={() => setCurrentView("calendar")}
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
              title={appMode === "finance" ? "Lịch chi tiêu" : appMode === "love" ? "Lịch hẹn hò & Kỷ niệm" : "Lịch sự kiện & Giải trí"}
              className={`p-2 sm:p-2.5 border ${appTheme === 'vietnam' ? (currentView === "calendar" ? "bg-[#ffcc00] text-[#030914] border-[#ffcc00] rounded-3xl shadow-md" : "text-[#00bfff] border-transparent rounded-3xl hover:bg-[#ffcc00] hover:text-[#030914]") : (currentView === "calendar" ? "rounded-3xl bg-neo-dark text-neo-light border-neo-dark" : "rounded-3xl border-transparent text-neo-dark hover:bg-neo-orange hover:text-white hover:border-neo-dark")}`}
            >
              <CalendarRange className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("notifications")}
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
              title="Thông báo"
              className={`p-2 sm:p-2.5 border ${appTheme === 'vietnam' ? (currentView === "notifications" ? "bg-[#ff3b3b] text-white border-[#ff3b3b] rounded-3xl shadow-md" : "text-[#ffcc00] border-transparent rounded-3xl hover:bg-[#ff3b3b] hover:text-white") : (currentView === "notifications" ? "rounded-3xl bg-neo-dark text-neo-light border-neo-dark" : "rounded-3xl border-transparent text-neo-dark hover:bg-neo-orange hover:text-white hover:border-neo-dark")}`}
            >
              <Bell className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("friends")}
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
              title="Kết nối & Tin nhắn"
              className={`p-2 sm:p-2.5 border ${appTheme === 'vietnam' ? (currentView === "friends" ? "bg-[#00bfff] text-white border-[#00bfff] rounded-3xl shadow-md" : "text-[#ff3b3b] border-transparent rounded-3xl hover:bg-[#00bfff] hover:text-white") : (currentView === "friends" ? "rounded-3xl bg-neo-dark text-neo-light border-neo-dark" : "rounded-3xl border-transparent text-neo-dark hover:bg-neo-orange hover:text-white hover:border-neo-dark")}`}
            >
              <Users className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setCurrentView("settings")}
              whileHover={{ scale: 1.1, rotate: 18 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 sm:p-2.5 rounded-3xl border border-transparent ${currentView === "settings" ? "bg-neo-dark text-neo-light border-neo-dark" : "text-neo-dark hover:bg-neo-orange hover:text-white hover:border-neo-dark"}`}
              title="Cài đặt"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            <div className="hidden sm:flex items-center gap-3 py-1.5 pl-1.5 pr-4 bg-neo-bg border border-neo-dark ml-2">
              <AIAvatar
                uid={user.uid}
                name={user.displayName}
                photoURL={user.photoURL}
                className="w-12 h-12 bg-neutral-100 rounded-full"
              />
              <span className="text-xs font-bold text-neo-dark uppercase tracking-widest">
                {user.displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* PWA Installation Assistant Banner */}
      <PwaInstallBanner />

      {/* Main Layout Container */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-0 md:gap-8 items-start relative z-10">
        {/* Vertical Navigation Bar - DESKTOP Only */}
        <nav
          className="hidden md:flex flex-col items-center justify-start py-6 px-1.5 gap-4 w-24 bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-200/50 shadow-xl sticky top-24 mt-10 active:scale-100 shrink-0"
          style={{ willChange: "transform" }}
        >
          {appMode === "love" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <NavButton
                active={currentView === "love_home"}
                onClick={() => setCurrentView("love_home")}
                icon={<Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Tương tác"
                color="text-orange-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "love_memory"}
                onClick={() => setCurrentView("love_memory")}
                icon={<Heart className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Kỷ niệm"
                color="text-pink-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "exercises"}
                onClick={() => setCurrentView("exercises")}
                icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Bài tập"
                color="text-teal-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "dates"}
                onClick={() => setCurrentView("dates")}
                icon={<Map className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Kho ngày"
                color="text-orange-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "forget_me_nots"}
                onClick={() => setCurrentView("forget_me_nots")}
                icon={<Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Ghi nhớ"
                color="text-neutral-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "photo_album"}
                onClick={() => setCurrentView("photo_album")}
                icon={<ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Abum Ảnh"
                color="text-pink-500"
                layout="vertical"
              />
              {userProfile?.gender === "female" && (
                <NavButton
                  active={currentView === "cycle"}
                  onClick={() => setCurrentView("cycle")}
                  icon={<CalendarHeart className="w-5 h-5 sm:w-6 sm:h-6" />}
                  label="Lịch Dâu"
                  color="text-orange-500"
                  layout="vertical"
                />
              )}
            </div>
          )}

          {appMode === "finance" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <NavButton
                active={currentView === "dashboard"}
                onClick={() => setCurrentView("dashboard")}
                icon={<LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Tổng quan"
                color="text-blue-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "planning"}
                onClick={() => setCurrentView("planning")}
                icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Ngân sách"
                color="text-emerald-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "shared_fund"}
                onClick={() => setCurrentView("shared_fund")}
                icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Quỹ chung"
                color="text-indigo-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "reports"}
                onClick={() => setCurrentView("reports")}
                icon={<PieChart className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Phân tích"
                color="text-amber-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "tools"}
                onClick={() => setCurrentView("tools")}
                icon={<Wrench className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Công cụ"
                color="text-purple-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "web_app_wrapper"}
                onClick={() => setCurrentView("web_app_wrapper")}
                icon={<AppWindow className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Đóng gói"
                color="text-orange-500"
                layout="vertical"
              />
              <button
                onClick={() => setIsTransactionFormOpen(true)}
                className="w-14 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 mt-2 active:scale-95 duration-200"
                title="Thêm giao dịch mới"
              >
                <Plus className="w-6 h-6 text-white" />
                <span className="text-[9px] font-bold mt-0.5 select-none uppercase">Thêm</span>
              </button>
            </div>
          )}

          {appMode === "entertainment" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <NavButton
                active={currentView === "social_feed"}
                onClick={() => setCurrentView("social_feed")}
                icon={<List className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Bảng tin"
                color="text-teal-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "couple_games"}
                onClick={() => setCurrentView("couple_games")}
                icon={<Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Trò chơi"
                color="text-fuchsia-500"
                layout="vertical"
              />
              <NavButton
                active={currentView === "web_app_wrapper"}
                onClick={() => setCurrentView("web_app_wrapper")}
                icon={<AppWindow className="w-5 h-5 sm:w-6 sm:h-6" />}
                label="Đóng gói App"
                color="text-orange-500"
                layout="vertical"
              />
            </div>
          )}
        </nav>

        {/* Central main content container */}
        <main className="flex-1 w-full py-10 md:py-16 relative z-10 pb-32 min-w-0">
          <Suspense fallback={<LoadingSpinner />}>
            <AnimatePresence mode="wait">
              {renderViewContent()}
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* Sticky bottom Navigation Bar - MOBILE Only */}
      {appMode === "love" && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-orange-100 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
          style={{ willChange: "transform" }}
        >
          <div className="flex items-center justify-between px-3 py-2 gap-2 w-full overflow-x-auto custom-scrollbar-hide">
            <NavButton
              active={currentView === "love_home"}
              onClick={() => setCurrentView("love_home")}
              icon={<Gamepad2 className="w-5 h-5" />}
              label="Tương tác"
              color="text-orange-500"
              layout="vertical"
            />
            <NavButton
              active={currentView === "love_memory"}
              onClick={() => setCurrentView("love_memory")}
              icon={<Heart className="w-5 h-5" />}
              label="Kỷ niệm"
              color="text-pink-500"
              layout="vertical"
            />
            <NavButton
              active={currentView === "exercises"}
              onClick={() => setCurrentView("exercises")}
              icon={<BookOpen className="w-5 h-5" />}
              label="Bài tập"
              color="text-teal-500"
              layout="vertical"
            />
            <NavButton
              active={currentView === "dates"}
              onClick={() => setCurrentView("dates")}
              icon={<Map className="w-5 h-5" />}
              label="Kho ngày"
              color="text-orange-500"
              layout="vertical"
            />
            <NavButton
              active={currentView === "forget_me_nots"}
              onClick={() => setCurrentView("forget_me_nots")}
              icon={<Bookmark className="w-5 h-5" />}
              label="Ghi nhớ"
              color="text-neutral-500"
              layout="vertical"
            />
            <NavButton
              active={currentView === "photo_album"}
              onClick={() => setCurrentView("photo_album")}
              icon={<ImageIcon className="w-5 h-5" />}
              label="Album"
              color="text-pink-500"
              layout="vertical"
            />
            {userProfile?.gender === "female" && (
              <NavButton
                active={currentView === "cycle"}
                onClick={() => setCurrentView("cycle")}
                icon={<CalendarHeart className="w-5 h-5" />}
                label="Lịch Dâu"
                color="text-orange-500"
                layout="vertical"
              />
            )}
          </div>
        </nav>
      )}

      {appMode === "entertainment" && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe pointer-events-none">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-neutral-100 rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] h-16 flex items-center justify-around px-2 relative pointer-events-auto">
            <BottomNavLink
              active={currentView === "social_feed"}
              onClick={() => setCurrentView("social_feed")}
              label="Bảng tin"
              icon={<List className="w-5 h-5" />}
              color="text-neutral-600"
            />
            <BottomNavLink
              active={currentView === "couple_games"}
              onClick={() => setCurrentView("couple_games")}
              label="Mini Games"
              icon={<Gamepad2 className="w-5 h-5" />}
              color="text-neutral-600"
            />
            <BottomNavLink
              active={currentView === "web_app_wrapper"}
              onClick={() => setCurrentView("web_app_wrapper")}
              label="Đóng gói"
              icon={<AppWindow className="w-5 h-5" />}
              color="text-neutral-600"
            />
          </div>
        </div>
      )}

      {appMode === "finance" && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pb-safe pointer-events-none">
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-neutral-100 rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] h-20 flex items-center justify-between px-6 relative pointer-events-auto">
            <BottomNavLink
              active={currentView === "dashboard"}
              onClick={() => setCurrentView("dashboard")}
              label="Tổng quan"
              icon={<LayoutDashboard className="w-5 h-5" />}
            />
            <BottomNavLink
              active={currentView === "planning"}
              onClick={() => setCurrentView("planning")}
              label="Ngân sách"
              icon={<Target className="w-5 h-5" />}
            />

            <div className="w-16 h-16 flex-shrink-0"></div>
            <button
              onClick={() => setIsTransactionFormOpen(true)}
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-16 h-16 bg-neutral-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-neutral-700 transition-all border-4 border-white flex items-center justify-center shadow-xl hover:scale-105 hover:bg-neutral-700 transition-all border-4 border-white"
            >
              <Plus className="w-8 h-8 z-10" />
            </button>

            <BottomNavLink
              active={currentView === "shared_fund"}
              onClick={() => setCurrentView("shared_fund")}
              label="Quỹ chung"
              icon={<Users className="w-5 h-5" />}
            />
            <BottomNavLink
              active={currentView === "tools"}
              onClick={() => setCurrentView("tools")}
              label="Công cụ"
              icon={<Wrench className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {appMode === "finance" && (
        <Suspense fallback={null}>
          <TransactionForm
            isOpen={isTransactionFormOpen}
            onClose={closeTransactionForm}
            onSuccess={closeTransactionForm}
            transactions={transactions}
          />
        </Suspense>
      )}



      <AnimatePresence>
        {systemAnnouncement &&
          !systemAnnouncement.hiddenLocally &&
          !systemAnnouncement.isMarquee && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-sm sm:max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
                style={{
                  backgroundColor:
                    systemAnnouncement.backgroundColor || "#ffffff",
                  color: systemAnnouncement.textColor || "#000000",
                  fontFamily: systemAnnouncement.fontFamily || "Inter",
                }}
              >
                <button
                  onClick={() =>
                    setSystemAnnouncement({
                      ...systemAnnouncement,
                      hiddenLocally: true,
                    })
                  }
                  className="absolute top-4 right-4 bg-black/5 hover:bg-black/10 rounded-3xl p-2 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mb-4 pr-8">
                  <h2 className="text-xl font-bold opacity-90">
                    Thông báo hệ thống
                  </h2>
                </div>
                <div
                  className="font-medium max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap"
                  style={{ fontSize: `${systemAnnouncement.fontSize || 16}px` }}
                >
                  {systemAnnouncement.text}
                </div>
              </motion.div>
            </div>
          )}

        {activeCall && (
          <VideoCall
            user={user}
            friendId={activeCall.friendId}
            isIncoming={activeCall.isIncoming}
            isVideo={activeCall.isVideo}
            onClose={closeActiveCall}
            appTheme={appTheme}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className={`fixed top-6 right-6 md:top-10 md:right-10 z-[300] bg-white rounded-3xl p-4 shadow-2xl border flex items-start gap-4 max-w-sm cursor-pointer ${appToast.type === "error" ? "border-orange-200" : "border-neutral-100"}`}
            onClick={() => {
              if (appToast.type !== "error") setCurrentView("friends");
              setAppToast(null);
            }}
          >
            <div
              className={`w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 ${appToast.type === "error" ? "bg-orange-100" : "bg-neutral-100"}`}
            >
              {appToast.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              ) : (
                <MessageCircle className="w-5 h-5 text-neutral-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h4
                className={`font-semibold text-sm mb-1 ${appToast.type === "error" ? "text-orange-850 font-bold" : "text-neutral-850 font-bold"}`}
              >
                {appToast.title}
              </h4>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{appToast.body}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAppToast(null);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-neutral-100 transition-colors absolute top-2 right-2 cursor-pointer z-10"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AiChatWidget
          transactions={filteredTransactions}
          appMode={appMode}
          user={user}
        />
      </Suspense>
    </div>
  );
}

function TopNavLink({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-3xl transition-colors ${
        active
          ? "text-neutral-600 bg-neutral-50/80 shadow-sm"
          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {icon}
      {label}
      {active && (
        <motion.div
          layoutId="top-nav-active"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-neutral-600"
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        />
      )}
    </motion.button>
  );
}

const BottomNavLink = React.memo(({
  active,
  onClick,
  icon,
  label,
  color = "text-neutral-600",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`relative flex flex-col items-center justify-center gap-1.5 w-16 select-none focus:outline-none ${
        active ? color : "text-neutral-400 hover:text-neutral-600"
      }`}
    >
      <motion.div
        animate={active ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span
        className={`text-[10px] font-bold tracking-wide transition-all duration-200 ${
          active ? "opacity-100 scale-100" : "opacity-40 scale-95"
        }`}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="bottom-nav-dot"
          className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-current"
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        />
      )}
    </motion.button>
  );
});

const NavButton = React.memo(({
  active,
  onClick,
  icon,
  label,
  color,
  layout = "auto",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  layout?: "horizontal" | "vertical" | "auto";
}) => {
  const indicatorHorizontalClass =
    "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full";
  const indicatorVerticalClass =
    "hidden md:block absolute -right-1 md:-right-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-3xl touch-manipulation min-w-[64px] sm:min-w-[72px] md:min-w-0 transition-colors duration-200 z-10 ${
        active
          ? `${color}`
          : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/50"
      }`}
    >
      {active && (
        <motion.div
          layoutId={`nav-pill-bg-${layout}`}
          className="absolute inset-0 bg-neutral-900 rounded-3xl -z-10"
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {icon}
        <span
          className={`text-[9px] sm:text-[10px] font-bold mt-1 md:mt-2 max-w-[60px] md:max-w-none truncate w-full text-center ${active ? color : "text-neutral-500"}`}
        >
          {label}
        </span>
      </div>
      {active && (
        <>
          {layout === "auto" && (
            <motion.div
              layoutId="nav-active"
              className={`${indicatorHorizontalClass} md:hidden ${color.replace("text-", "bg-")}`}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          {layout === "vertical" && (
            <motion.div
              layoutId="nav-active-v"
              className={`${indicatorHorizontalClass} md:hidden ${color.replace("text-", "bg-")}`}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          {layout === "vertical" && (
            <motion.div
              layoutId="nav-active-v-d"
              className={`${indicatorVerticalClass} ${color.replace("text-", "bg-")}`}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          {layout === "horizontal" && (
            <motion.div
              layoutId="nav-active-h"
              className={`${indicatorHorizontalClass} md:-bottom-2 ${color.replace("text-", "bg-")}`}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
        </>
      )}
    </motion.button>
  );
});

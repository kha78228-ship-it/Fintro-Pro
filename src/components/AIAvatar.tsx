import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AIAvatarProps {
  uid: string;
  name?: string;
  photoURL?: string | null;
  className?: string;
  onAvatarChange?: (newUrl: string) => void;
  editable?: boolean;
}

export default function AIAvatar({ uid, name, photoURL, className = "w-12 h-12 bg-neutral-100 rounded-full border border-neutral-100", editable, onAvatarChange }: AIAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(photoURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminRole, setAdminRole] = useState<'super' | 'admin' | null>(null);

  useEffect(() => {
    if (photoURL) {
      setAvatarUrl(photoURL);
      return;
    }

    if (!uid) return;

    let mounted = true;

    const fetchOrGenerateAvatar = async () => {
      try {
        // Check Firestore first
        const userDocRef = doc(db, 'publicProfiles', uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().avatarUrl) {
          if (mounted) setAvatarUrl(userDoc.data().avatarUrl);
          return;
        }

        // Only generate for the current user
        if (uid !== auth.currentUser?.uid) {
           if (mounted) setIsLoading(false);
           return;
        }

        if (mounted) setIsLoading(true);
        
        const displayName = name || 'User';
        const initials = displayName.substring(0, 2).toUpperCase();
        
        const colors = [
          'bg-orange-500', 'bg-orange-500', 'bg-yellow-500', 'bg-neutral-500',
          'bg-teal-500', 'bg-neutral-500', 'bg-neutral-500', 'bg-purple-500', 'bg-orange-500'
        ];
        // simple hash for consistent colors
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
          hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorClass = colors[Math.abs(hash) % colors.length];

        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <rect width="100" height="100" fill="hsl(${Math.abs(hash) % 360}, 70%, 50%)" />
            <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" fill="white" font-weight="bold" text-anchor="middle" dy=".3em">${initials}</text>
          </svg>
        `;
        let newAvatarUrl = '';
        try {
          newAvatarUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        } catch (e) {
          console.error("UTF-8 encoding error, using URL-encoded SVG:", e);
          newAvatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        }

        if (newAvatarUrl && mounted) {
          setAvatarUrl(newAvatarUrl);
          try {
             await setDoc(userDocRef, { avatarUrl: newAvatarUrl }, { merge: true });
          } catch(e) {}
        }
      } catch (error: any) {
        console.error("AI Avatar Error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOrGenerateAvatar();

    return () => { mounted = false; };
  }, [uid, photoURL, name]);

  // Dedicated effect to query Admin privileges from collection & current user email
  useEffect(() => {
    if (!uid) {
      setAdminRole(null);
      return;
    }

    let mounted = true;

    const checkAdminStatus = async () => {
      // 1. Check if they are the current super admin (by email) to be quick
      const isMe = uid === auth.currentUser?.uid;
      const myEmail = auth.currentUser?.email?.toLowerCase();
      if (isMe && myEmail === 'kha78228@gmail.com') {
        if (mounted) setAdminRole('super');
        return;
      }

      // 2. Fetch admins record from Firestore to see if this UID belongs to an active administrator
      try {
        const adminDocRef = doc(db, 'admins', uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          if (data && data.expiresAt > Date.now()) {
            if (data.isSuper) {
              if (mounted) setAdminRole('super');
            } else {
              if (mounted) setAdminRole('admin');
            }
            return;
          }
        }
      } catch (err) {
        console.error("Error loading admin information for avatar:", err);
      }

      // 3. Optional fallback: Check public user record to see if email matches the super admin
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const emailValue = userDoc.data()?.email?.toLowerCase();
          if (emailValue === 'kha78228@gmail.com') {
            if (mounted) setAdminRole('super');
            return;
          }
        }
      } catch (e) {}

      if (mounted) setAdminRole(null);
    };

    checkAdminStatus();
    return () => { mounted = false; };
  }, [uid]);

  const handleEditableClick = async () => {
    if (!editable || uid !== auth.currentUser?.uid) return;
    const prompt = window.prompt("Nhập mô tả cho AI Avatar của bạn (VD: Một chú gấu trúc dễ thương đeo kính):", "A cute cartoon illustration of an animal");
    if(!prompt) return;
    
    setIsLoading(true);
    try {
        const res = await fetch("/api/gemini/generateImage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tạo ảnh');
        const data = await res.json();
        setAvatarUrl(data.imageUrl);
        if (onAvatarChange) onAvatarChange(data.imageUrl);
        const userDocRef = doc(db, 'publicProfiles', uid);
        await setDoc(userDocRef, { avatarUrl: data.imageUrl }, { merge: true });
        if (auth.currentUser) await setDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: data.imageUrl }, { merge: true });
    } catch(e: any) {
        alert('Tạo ảnh thất bại. Bạn có cần nâng cấp tài khoản hoặc API key trả phí không? Lỗi: ' + e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const wrapperClass = `relative group overflow-hidden ${className} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-orange-400' : ''}`;

  let avatarElement;
  if (avatarUrl) {
    avatarElement = (
      <div className={wrapperClass} onClick={editable ? handleEditableClick : undefined}>
        <img src={avatarUrl} alt={name || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        {editable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white font-bold tracking-widest uppercase text-center leading-normal">Tạo AI</span>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  } else {
    avatarElement = (
      <div className={`bg-neutral-200 flex items-center justify-center ${wrapperClass}`} onClick={editable ? handleEditableClick : undefined}>
        {isLoading ? (
          <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center animate-pulse z-10">
             <div className="w-4 h-4 border-2 border-neo-dark/30 border-t-neo-dark rounded-full animate-spin" />
          </div>
        ) : name ? (
          <span className="font-bold text-neutral-500 font-mono text-xs sm:text-sm tracking-wider">
             {name.substring(0, 2).toUpperCase()}
          </span>
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-neutral-500" />
        )}
        {editable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <span className="text-[10px] text-white font-bold tracking-widest uppercase text-center leading-tight">Tạo AI</span>
          </div>
        )}
      </div>
    );
  }

  if (adminRole) {
    const isFullRound = className.includes('rounded-full');
    const ringRadiusClass = isFullRound ? 'rounded-full' : 'rounded-3xl';
    const isSuper = adminRole === 'super';

    // Premium Google AI Pro / Gemini Advanced Visual Styling
    return (
      <div className="relative inline-block shrink-0 p-[4px] select-none group/avatar" title={isSuper ? 'Sáng Lập / Google AI Pro Ultra ✨' : 'Quản Trị Viên Google AI Safe 🛡️'}>
        {/* Injecting CSS Keyframes directly for ultra-performance customized animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes gemini-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes gemini-breathe {
            0%, 100% { filter: blur(8px) opacity(0.7); transform: scale(0.98); }
            50% { filter: blur(14px) opacity(0.95); transform: scale(1.08); }
          }
          @keyframes star-twinkle {
            0%, 100% { transform: scale(0.5) rotate(0deg); opacity: 0.3; }
            50% { transform: scale(1.1) rotate(90deg); opacity: 1; filter: drop-shadow(0 0 8px #fff); }
          }
          @keyframes orbit-1 {
            0% { transform: rotate(0deg) translateX(36px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(36px) rotate(-360deg); }
          }
          @keyframes orbit-2 {
            0% { transform: rotate(180deg) translateX(36px) rotate(-180deg); }
            100% { transform: rotate(540deg) translateX(36px) rotate(-540deg); }
          }
        `}} />

        {/* Layer 1: Hyper-glowing backing aura breathing */}
        <div 
          className="absolute inset-x-0 inset-y-0 rounded-full z-0 transition-all duration-700 pointer-events-none"
          style={{
            background: isSuper 
              ? 'linear-gradient(135deg, #12c2e9, #c471ed, #f64f59, #ff007f)'
              : 'linear-gradient(135deg, #f5af19, #e12d27, #f5af19)',
            animation: 'gemini-breathe 4s ease-in-out infinite',
          }}
        />

        {/* Layer 2: Speeding Rotating Spectrum Rainbow Border */}
        <div 
          className={`absolute inset-0 ${ringRadiusClass} z-0 transition-transform duration-500`}
          style={{
            background: isSuper
              ? 'linear-gradient(to right, #00f0ff, #7000ff, #ff007f, #ffbc00, #00f0ff)'
              : 'linear-gradient(to right, #ff9900, #ff5500, #ffcc00, #ff9900)',
            backgroundSize: '200% auto',
            animation: 'gemini-spin 6s linear infinite',
          }}
        />

        {/* Interactive Corner Light Accents / Sparkles orbiting container */}
        {isSuper && (
          <>
            {/* Twinkling Star 1 Orbiting */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-2 z-30 pointer-events-none"
              style={{ animation: 'orbit-1 8s linear infinite' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-cyan-300 drop-shadow-[0_0_4px_#00e5ff]" style={{ animation: 'star-twinkle 1.8s ease-in-out infinite' }}>
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.6L12 0Z" />
              </svg>
            </div>
            {/* Twinkling Star 2 Orbiting */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-2 z-30 pointer-events-none"
              style={{ animation: 'orbit-2 10s linear infinite' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-pink-300 drop-shadow-[0_0_4px_#ff007f]" style={{ animation: 'star-twinkle 2.5s ease-in-out infinite' }}>
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.6L12 0Z" />
              </svg>
            </div>
          </>
        )}

        {/* Layer 3: Contrast Ring Separator Mask to isolate the glowing outline elegantly */}
        <div className={`absolute inset-[3px] bg-neutral-950 ${ringRadiusClass} z-1 transition-all duration-300 group-hover/avatar:inset-[2px]`} />

        {/* Layer 4: Premium Golden/Silver inner geometric HUD line */}
        <div className={`absolute inset-[4.5px] border ${isSuper ? 'border-cyan-400/20' : 'border-amber-400/20'} ${ringRadiusClass} z-2 pointer-events-none`} />

        {/* Master Avatar frame with scaling animation */}
        <div className="relative z-10 scale-[0.92] origin-center group-hover/avatar:scale-100 transition-all duration-500 rounded-full overflow-hidden">
          {avatarElement}
        </div>

        {/* Premium floating Badge: Google Gemini Star/Shield Crest */}
        <div className={`absolute -top-1.5 -right-1.5 z-30 flex items-center justify-center rounded-all p-1.5 border shadow-xl transition-all duration-500 group-hover/avatar:scale-125 group-hover/avatar:rotate-45 ${
          isSuper
            ? 'bg-gradient-to-tr from-cyan-400 via-purple-600 to-pink-500 border-white/80 text-white rounded-full'
            : 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-amber-200 text-neutral-900 rounded-full'
        }`}>
          {isSuper ? (
            // Official Google Gemini 4-Pointed Star Sparkle (Highly recognizable AI symbol)
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] animate-pulse">
              <path d="M12 2C12 2 12 9.5 9.5 12C9.5 12 12 12 12 12C12 12 12 14.5 14.5 12C14.5 12 12 12 12 12C12 12 12 2 12 2ZM12 22C12 22 12 14.5 9.5 12M12 22C12 22 12 14.5 14.5 12M2 12C2 12 9.5 12 12 9.5M2 12C2 12 9.5 12 12 14.5M22 12C22 12 14.5 12 12 12" />
              <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
            </svg>
          ) : (
            // High Resolution Guard Crest Shield for Admin
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-neutral-900">
              <path d="M12 2C17.5 2 20 4.5 20 9C20 14.5 15.5 19.5 12 21.5C8.5 19.5 4 14.5 4 9C4 4.5 6.5 2 12 2ZM12 4C8 4.5 6 6 6 9C6 13.5 9.5 17.5 12 19.2C14.5 17.5 18 13.5 18 9C18 6 16 4.5 12 4ZM10.5 13.5L8 11L9.4 9.6L10.5 10.7L14.1 7.1L15.5 8.5L10.5 13.5Z" />
            </svg>
          )}
        </div>

        {/* Hover label for Gemini AI level styling */}
        <div className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 translate-y-3 opacity-0 group-hover/avatar:opacity-100 group-hover/avatar:translate-y-1 transition-all duration-300 pointer-events-none z-30 whitespace-nowrap">
          <span className={`text-[8.5px] font-sans font-black tracking-widest px-2.5 py-0.5 rounded-full border shadow-lg ${
            isSuper 
              ? 'bg-neutral-900 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 border-purple-500/50' 
              : 'bg-neutral-900 text-amber-400 border-amber-500/50'
          }`}>
            {isSuper ? 'GEMINI ULTRA ✦' : 'AI ADMIN'}
          </span>
        </div>
      </div>
    );
  }

  return avatarElement;
}

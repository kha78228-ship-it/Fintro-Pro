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

        // Instead of generating an image, we just save a flag indicating we use initials so we don't try again
        // Actually, we can just save it as text or empty to avoid retriggering. For now, let's just create a deterministic data URI or SVG if needed, but since we can just render the initials if no URL, we don't need to save an image data URL!
        // Wait, if it doesn't have an avatarUrl, it renders the fallback in the component below `if (avatarUrl) ... return (...)`
        // So we can just save a flag that it's processed, or save a simple SVG
        
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <rect width="100" height="100" fill="hsl(${Math.abs(hash) % 360}, 70%, 50%)" />
            <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" fill="white" font-weight="bold" text-anchor="middle" dy=".3em">${initials}</text>
          </svg>
        `;
        const newAvatarUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

        if (newAvatarUrl && mounted) {
          setAvatarUrl(newAvatarUrl);
          try {
             await setDoc(userDocRef, { avatarUrl: newAvatarUrl }, { merge: true });
          } catch(e) {}
        }
      } catch (error: any) {
        console.error("AI Avatar Error:", error);
        // We can safely ignore avatar generation failures
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOrGenerateAvatar();

    return () => { mounted = false; };
  }, [uid, photoURL, name]);

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

  if (avatarUrl) {
    return (
      <div className={wrapperClass} onClick={editable ? handleEditableClick : undefined}>
        <img src={avatarUrl} alt={name || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        {editable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white font-bold tracking-widest uppercase">Tạo AI</span>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-neutral-200 flex items-center justify-center ${wrapperClass}`} onClick={editable ? handleEditableClick : undefined}>
      {isLoading ? (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center animate-pulse z-10">
           <div className="w-4 h-4 border-2 border-neo-dark/30 border-t-neo-dark rounded-full animate-spin" />
        </div>
      ) : name ? (
        <span className="font-bold text-neutral-500 font-mono text-sm tracking-wider">
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

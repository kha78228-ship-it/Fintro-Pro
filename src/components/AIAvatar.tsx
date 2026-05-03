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
}

export default function AIAvatar({ uid, name, photoURL, className = "w-8 h-8 rounded-full border border-neutral-100" }: AIAvatarProps) {
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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const displayName = name || 'User';
        const initials = displayName.substring(0, 2).toUpperCase();

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [{ text: `A minimal, modern, abstract digital art avatar for the initials "${initials}". High quality, clean design, vibrant complementary colors, centered subject.` }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        let newAvatarUrl = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            newAvatarUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (newAvatarUrl && mounted) {
          setAvatarUrl(newAvatarUrl);
          // Try to save it. If we aren't the owner, this might fail, which is fine.
          try {
             await setDoc(userDocRef, { avatarUrl: newAvatarUrl }, { merge: true });
          } catch(e) {}
        }
      } catch (error) {
        console.error("AI Avatar Error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOrGenerateAvatar();

    return () => { mounted = false; };
  }, [uid, photoURL, name]);

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name || 'User'} className={className} referrerPolicy="no-referrer" />;
  }

  return (
    <div className={`bg-neutral-200 flex items-center justify-center overflow-hidden relative ${className}`}>
      {isLoading ? (
        <div className="absolute inset-0 bg-sky-100 flex items-center justify-center animate-pulse">
           <span className="text-[10px] font-mono text-sky-500 loading-dots">...</span>
        </div>
      ) : name ? (
        <span className="font-bold text-neutral-500 font-mono text-sm tracking-wider">
           {name.substring(0, 2).toUpperCase()}
        </span>
      ) : (
        <UserIcon className="w-1/2 h-1/2 text-neutral-500" />
      )}
    </div>
  );
}

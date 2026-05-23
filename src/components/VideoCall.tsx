import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, Loader2, AlertCircle, Phone, Heart, User, Sparkles, Maximize2, Minimize2, Expand, Shrink } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';

interface VideoCallProps {
  user: any;
  friendId: string;
  isIncoming?: boolean;
  isVideo?: boolean;
  onClose: () => void;
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
}

const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 2,
};

export default function VideoCall({ user, friendId, isIncoming, isVideo = true, onClose, appTheme = "pink_cute" }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(isVideo);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Friend profile loaded from DB
  const [friendProfile, setFriendProfile] = useState<{ displayName?: string; nickname?: string; photoURL?: string } | null>(null);
  // Active call timer
  const [callDuration, setCallDuration] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFitContain, setIsFitContain] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!containerRef.current) return;
      const element = containerRef.current;
      
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error toggling fullscreen mode:", err);
      // Fallback
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  // Create a consistent call ID based on both users
  const participants = [user.uid, friendId].sort();
  const callId = `call_${participants[0]}_${participants[1]}`;

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Fetch friend's real details
  useEffect(() => {
    const fetchFriendProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', friendId));
        if (snap.exists()) {
          setFriendProfile(snap.data());
        }
      } catch (err) {
        console.error("Error fetching friend profile:", err);
      }
    };
    fetchFriendProfile();
  }, [friendId]);

  useEffect(() => {
    if (callStatus === 'idle' && localStream && !isIncoming) {
      handleCreateCall();
    }
  }, [callStatus, localStream, isIncoming]);

  useEffect(() => {
    if (callStatus === 'connected' && remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [callStatus, remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const setupMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideo ? { 
            width: { ideal: 360, max: 640 },
            height: { ideal: 640, max: 1280 },
            facingMode: 'user',
            frameRate: { ideal: 15, max: 24 }
          } : false, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setLocalStream(stream);
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setErrorMsg(isVideo ? 'Không thể truy cập camera hoặc micro.' : 'Không thể truy cập micro.');
      }
    };
    setupMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      pcRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Listen for incoming calls
    const callDoc = doc(db, 'calls', callId);
    
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        if (callStatus === 'connected' || callStatus === 'calling' || callStatus === 'receiving') {
          handleEndCall(false); // Call ended by the other party
        }
        return;
      }
      
      // If someone else created the offer and I am answering
      if (data.offer && data.callerId !== user.uid && callStatus === 'idle') {
        setCallStatus('receiving');
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Bạn có cuộc gọi đến!');
        } else if ('Notification' in window && Notification.permission !== 'denied') {
             Notification.requestPermission().then(permission => {
                 if (permission === 'granted') {
                     new Notification('Bạn có cuộc gọi đến!');
                 }
              });
        }
      }

      // If I am the caller and the answer is added
      if (data.answer && data.callerId === user.uid && pcRef.current && !pcRef.current.currentRemoteDescription) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        pcRef.current.setRemoteDescription(rtcSessionDescription);
        setCallStatus('connected');
      }
    });

    return () => unsubscribe();
  }, [callStatus, callId, user.uid]);

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection(servers);
    pcRef.current = pc;
    
    // Create remote stream
    const remStream = new MediaStream();
    setRemoteStream(remStream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remStream;
    }

    // Push local tracks to PC
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Pull remote tracks from PC
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remStream.addTrack(track);
      });
    };

    return pc;
  };

  const handleCreateCall = async () => {
    try {
      setCallStatus('calling');
      const pc = initPeerConnection();

      const callDoc = doc(db, 'calls', callId);

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(callDoc, { 
        offer, 
        callerId: user.uid,
        targetId: friendId,
        participants: [user.uid, friendId],
        offerCandidates: [],
        answerCandidates: []
      });

      // Get candidates for caller, save to db
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(callDoc, {
            offerCandidates: arrayUnion(event.candidate.toJSON())
          }).catch(console.error);
        }
      };

      const addedAnswers = new Set();
      // Listen for remote answer and Remote ICE candidates
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        
        if (!pc.currentRemoteDescription && data.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription).catch(console.error);
        }

        const answerCandidates = data.answerCandidates || [];
        answerCandidates.forEach((cand: any) => {
          const key = cand.candidate;
          if (!addedAnswers.has(key)) {
            addedAnswers.add(key);
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
          }
        });
      });
    } catch (e) {
      console.error(e);
      setErrorMsg('Lỗi thiết lập cuộc gọi');
      setCallStatus('idle');
    }
  };

  const handleAnswerCall = async () => {
    try {
      setCallStatus('connected');
      const pc = initPeerConnection();

      const callDoc = doc(db, 'calls', callId);

      // Get call data
      const callData = (await getDoc(callDoc)).data();
      if (!callData?.offer) {
        throw new Error("No offer to answer");
      }

      // 1. Set Remote Description from caller's offer
      const offerDescription = new RTCSessionDescription(callData.offer);
      await pc.setRemoteDescription(offerDescription);

      // 2. Create local answer and set Local Description
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(callDoc, { answer });

      // 3. Save my local candidates to answerCandidates array
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          updateDoc(callDoc, {
            answerCandidates: arrayUnion(event.candidate.toJSON())
          }).catch(console.error);
        }
      };

      const addedOffers = new Set();
      // 4. Listen for caller's ICE candidates
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const offerCandidates = data.offerCandidates || [];
        offerCandidates.forEach((cand: any) => {
          const key = cand.candidate;
          if (!addedOffers.has(key)) {
            addedOffers.add(key);
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
          }
        });
      });
    } catch (e) {
      console.error(e);
      setErrorMsg('Lỗi kết nối cuộc gọi');
      setCallStatus('idle');
    }
  };

  const handleEndCall = async (isInitiator: boolean = true) => {
    pcRef.current?.close();
    setCallStatus('idle');
    
    // Only delete document if we explicitly end it
    if (isInitiator) {
      const callDoc = doc(db, 'calls', callId);
      await deleteDoc(callDoc);
    }
    
    onClose();
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !micActive;
      });
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoActive;
      });
      setVideoActive(!videoActive);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Theme-specific styling parameters
  const themeAccentColor = appTheme === 'pink_cute' ? 'text-pink-500' : appTheme === 'vintage' ? 'text-amber-800' : 'text-yellow-400';
  const themeBgGradient = appTheme === 'pink_cute' 
    ? 'from-pink-900/40 via-purple-950/70 to-neutral-950' 
    : appTheme === 'vintage' 
    ? 'from-amber-950/50 via-[#2d2217]/80 to-[#18110b]' 
    : 'from-rose-950/50 via-[#0a1128]/80 to-[#030914]';
    
  const themeButtonActive = appTheme === 'pink_cute' 
    ? 'bg-pink-600 text-white hover:bg-pink-500' 
    : appTheme === 'vintage' 
    ? 'bg-amber-800 text-white hover:bg-amber-700' 
    : 'bg-red-600 text-white hover:bg-red-500';

  const themeRing = appTheme === 'pink_cute' 
    ? 'ring-pink-400/30' 
    : appTheme === 'vintage' 
    ? 'ring-amber-500/20' 
    : 'ring-yellow-400/30';

  const targetName = friendProfile?.nickname || friendProfile?.displayName || 'Đối phương';
  const targetAvatar = friendProfile?.photoURL;

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[200] flex flex-col font-sans bg-black`}
    >
      {/* Remote Video / Audio Area */}
      <div className={`flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b ${themeBgGradient}`}>
        {/* Dynamic Background Blur (if avatar present, blur it as backdrop) */}
        {targetAvatar && (
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-110 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `url(${targetAvatar})` }}
          />
        )}
        
        {/* WebRTC Video Stream - Hidden when in Voice Mode, rendering Full Screen in Video Mode */}
        {isVideo && callStatus === 'connected' && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`absolute inset-0 w-full h-full z-10 transition-all duration-500 ease-out ${isFitContain ? 'object-contain bg-neutral-950/95' : 'object-cover'}`}
          />
        )}

        {/* Floating Controls for Fullscreen & Fitting of Peer Video - ONLY in Connected Video Mode */}
        {isVideo && callStatus === 'connected' && (
          <div className="absolute top-6 left-6 z-30 flex gap-3">
            {/* Aspect Fit/Fill Toggle Button */}
            <button
              onClick={() => setIsFitContain(!isFitContain)}
              className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl text-white text-xs font-semibold shadow-lg transition-all active:scale-95"
              title={isFitContain ? 'Chuyển sang Tràn màn hình (Fill)' : 'Chuyển sang Khớp tỉ lệ (Fit)'}
            >
              {isFitContain ? (
                <>
                  <Expand className="w-4 h-4 text-pink-400" />
                  <span className="hidden sm:inline">Phóng to (Fill)</span>
                </>
              ) : (
                <>
                  <Shrink className="w-4 h-4 text-pink-400" />
                  <span className="hidden sm:inline">Thu nhỏ (Fit)</span>
                </>
              )}
            </button>

            {/* True Native Monitor Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl text-white text-xs font-semibold shadow-lg transition-all active:scale-95"
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình thiết bị'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-pink-400" />
                  <span className="hidden sm:inline">Thoát toàn màn hình</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-pink-400" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Fallback WebRTC video connection so we still receive audio even if physically hidden */}
        {!isVideo && (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="hidden"
          />
        )}

        {/* Foreground Content */}
        <AnimatePresence mode="wait">
          {callStatus === 'connected' ? (
            /* ==================== CONNECTED STATE ==================== */
            isVideo ? (
              /* --- Connected Video Call Layout --- */
              (!remoteStream || remoteStream.getVideoTracks().length === 0) ? (
                <motion.div 
                  key="video-waiting-partner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white flex flex-col items-center justify-center z-10"
                >
                  <div className="relative w-28 h-28 mb-4">
                    <div className="absolute inset-0 bg-neutral-800 rounded-full animate-pulse border border-neutral-700 flex items-center justify-center">
                      <User className="w-12 h-12 text-neutral-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium">{targetName}</h3>
                  <p className="text-neutral-400 text-sm mt-1">Đang chờ đối phương bật camera...</p>
                  <div className="mt-3 font-mono text-sm bg-black/40 px-3 py-1 rounded-full text-neutral-300">
                    {formatDuration(callDuration)}
                  </div>
                </motion.div>
              ) : null
            ) : (
              /* --- Connected Audio Call Layout --- */
              <motion.div 
                key="audio-connected"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-white flex flex-col items-center justify-center z-10 max-w-sm w-full px-6 text-center"
              >
                {/* Glowing Circular Avatar representation */}
                <div className="relative mb-8">
                  {/* Outer pulsating wave ring 1 */}
                  <div className="absolute -inset-4 bg-pink-500/10 rounded-full animate-ping opacity-60 pointer-events-none" />
                  {/* Outer pulsating wave ring 2 */}
                  <div className="absolute -inset-8 bg-purple-500/5 rounded-full animate-pulse opacity-40 pointer-events-none" />
                  
                  {/* Main Avatar Circle */}
                  <div className={`relative w-36 h-36 rounded-full overflow-hidden border-4 ${appTheme === 'vietnam' ? 'border-yellow-400 shadow-yellow-500/30' : appTheme === 'vintage' ? 'border-amber-700 shadow-amber-900/30' : 'border-pink-400 shadow-pink-500/30'} shadow-2xl flex items-center justify-center bg-neutral-800`}>
                    {targetAvatar ? (
                      <img 
                        src={targetAvatar} 
                        alt={targetName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl font-bold uppercase text-neutral-300">
                        {targetName.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* Miniature Love badge */}
                  <div className={`absolute bottom-1 right-1 p-2 rounded-full ${appTheme === 'pink_cute' ? 'bg-pink-500 text-white' : appTheme === 'vintage' ? 'bg-amber-800 text-[#fffbeb]' : 'bg-red-600 text-yellow-400'} shadow-md`}>
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-wide truncate max-w-xs">{targetName}</h2>
                <div className={`mt-2 flex items-center gap-1.5 text-sm ${appTheme === 'pink_cute' ? 'text-pink-300' : 'text-amber-400'}`}>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-yellow-300" style={{ animationDuration: '6s' }} />
                  <span>Cuộc gọi thoại đang kết nối</span>
                </div>

                {/* Animated Audio Waveform */}
                <div className="flex items-end justify-center gap-1.5 h-12 my-8 px-4 w-full">
                  <div className="audio-bar bar-1 bg-pink-400/80 rounded-full" />
                  <div className="audio-bar bar-2 bg-purple-400/80 rounded-full" />
                  <div className="audio-bar bar-3 bg-pink-500/90 rounded-full" />
                  <div className="audio-bar bar-4 bg-purple-500/90 rounded-full" />
                  <div className="audio-bar bar-5 bg-pink-400/80 rounded-full" />
                  <div className="audio-bar bar-6 bg-purple-400/80 rounded-full" />
                </div>

                {/* Call Timer */}
                <div className="font-mono text-2xl font-semibold bg-black/30 border border-white/5 py-1.5 px-6 rounded-full tracking-wider shadow-inner text-neutral-100">
                  {formatDuration(callDuration)}
                </div>
              </motion.div>
            )
          ) : callStatus === 'calling' ? (
            /* ==================== OUTGOING CALL STATE ==================== */
            <motion.div 
              key="outgoing-calling"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-white flex flex-col items-center z-10 text-center px-6"
            >
              <div className="relative w-32 h-32 mb-8">
                {/* Outgoing ringing wave circles */}
                <div className={`absolute inset-0 bg-neutral-500/10 rounded-full animate-ping opacity-30 ${themeRing}`} />
                <div className="absolute inset-0 bg-neutral-850 rounded-full flex items-center justify-center border border-white/10 shadow-xl overflow-hidden bg-neutral-850">
                  {targetAvatar ? (
                    <img 
                      src={targetAvatar} 
                      alt={targetName} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Loader2 className="w-10 h-10 animate-spin text-neutral-100" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">{targetName}</h2>
              <p className={`mt-3 font-medium ${themeAccentColor} animate-pulse tracking-widest text-sm uppercase`}>
                Đang liên lạc...
              </p>
              
              <div className="mt-2 text-xs text-neutral-400">
                {isVideo ? "Cuộc gọi video bảo mật" : "Cuộc gọi thoại bảo mật"} S2S
              </div>
            </motion.div>
          ) : callStatus === 'receiving' ? (
            /* ==================== INCOMING CALL STATE ==================== */
            <motion.div 
              key="incoming-receiving"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              className="text-white flex flex-col items-center z-10 text-center px-6"
            >
              <div className="relative w-36 h-36 mb-8">
                <div className={`absolute -inset-4 bg-rose-500/10 rounded-full animate-ping opacity-40`} />
                <div className="absolute inset-0 bg-neutral-800 rounded-full flex items-center justify-center border-2 border-white/10 shadow-2xl overflow-hidden">
                  {targetAvatar ? (
                    <img 
                      src={targetAvatar} 
                      alt={targetName} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <PhoneCall className={`w-14 h-14 ${themeAccentColor} animate-pulse`} />
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight mb-2 font-display">{targetName}</h2>
              <p className={`text-sm tracking-widest uppercase font-semibold ${themeAccentColor} mb-8 animate-pulse`}>
                Có cuộc gọi {isVideo ? "Video" : "Thoại"} đến...
              </p>
              
              {errorMsg && (
                <div className="text-center px-4 max-w-sm mb-6 bg-red-500/10 border border-red-500/25 py-2.5 rounded-2xl">
                  <p className="text-red-400 font-medium text-sm">{errorMsg}</p>
                </div>
              )}

              {/* Accept / Decline triggers */}
              <div className="flex gap-10 sm:gap-14">
                {/* DECLINE */}
                <button 
                  onClick={() => handleEndCall(true)}
                  className="group flex flex-col items-center gap-3.5"
                >
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 group-hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-600/30">
                    <PhoneOff className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Từ chối</span>
                </button>

                {/* ACCEPT */}
                <button 
                  onClick={handleAnswerCall}
                  disabled={!localStream}
                  className="group flex flex-col items-center gap-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-16 h-16 ${themeButtonActive} rounded-full flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all shadow-lg`}>
                    {isVideo ? (
                      <Video className="w-6 h-6 text-white" />
                    ) : (
                      <Phone className="w-6 h-6 text-white fill-current" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    {localStream ? 'Nhận cuộc gọi' : 'Đang tải...'}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ==================== IDLE STATE ==================== */
            <motion.div 
              key="idle-ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white flex flex-col items-center z-10 text-center px-6"
            >
              <div className="w-24 h-24 bg-neutral-800/80 backdrop-blur-md rounded-full border border-neutral-700/60 flex items-center justify-center mb-6 shadow-2xl">
                {errorMsg ? (
                  <AlertCircle className="w-11 h-11 text-red-500 animate-bounce" />
                ) : isVideo ? (
                  <Video className={`w-11 h-11 ${themeAccentColor}`} />
                ) : (
                  <Phone className={`w-11 h-11 ${themeAccentColor} fill-current`} />
                )}
              </div>
              
              {errorMsg ? (
                <div className="text-center px-4 max-w-sm mb-6">
                  <p className="text-red-400 font-medium">{errorMsg}</p>
                  <p className="text-neutral-400 text-sm mt-2">Đảm bảo bạn đã cấp quyền truy cập thiết bị trong trình duyệt của mình.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-1">{targetName}</h2>
                  <p className="text-neutral-400 text-sm mb-8">Bạn đã sẵn sàng kết nối cùng anh ấy / cô ấy chưa?</p>
                  
                  <button 
                    onClick={handleCreateCall}
                    disabled={!localStream}
                    className="group relative px-10 py-4 bg-white hover:bg-neutral-100 text-neutral-900 font-bold rounded-full transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVideo ? (
                      <Video className="w-5 h-5 text-neutral-900" />
                    ) : (
                      <Phone className="w-5 h-5 text-neutral-900 fill-current" />
                    )}
                    <span>{isVideo ? 'Bắt đầu gọi Video' : 'Bắt đầu gọi Thoại'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Picture in Picture (Local Video Stream) - ONLY visible in Video Mode */}
      <AnimatePresence>
        {isVideo && localStream && (
          <motion.div 
            drag
            dragConstraints={{ 
              top: 10, 
              left: -((typeof window !== 'undefined' ? window.innerWidth : 1000) - 180), 
              right: 10, 
              bottom: (typeof window !== 'undefined' ? window.innerHeight : 1000) - 280 
            }}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className={`absolute top-6 right-6 w-28 h-40 sm:w-36 sm:h-52 bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border-2 ${appTheme === 'pink_cute' ? 'border-pink-500/50' : appTheme === 'vintage' ? 'border-amber-600/50' : 'border-yellow-400/50'} z-50 group hover:scale-105 cursor-grab active:cursor-grabbing transition-all`}
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover mirror"
            />
            {(!videoActive || !micActive) && (
               <div className="absolute bottom-2 left-2 flex gap-1 bg-black/70 px-2 py-0.5 rounded-full">
                 {!videoActive && <VideoOff className="w-3.5 h-3.5 text-red-500" />}
                 {!micActive && <MicOff className="w-3.5 h-3.5 text-red-500" />}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Actions Bar */}
      <div className="h-28 bg-neutral-950 sm:backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-6 sm:gap-9 px-6 z-50">
        {/* Toggle MIC */}
        <button 
          onClick={toggleMic}
          disabled={!localStream}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50 active:scale-90 ${micActive ? 'bg-neutral-800 text-white hover:bg-neutral-700 hover:scale-105' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}`}
          title={micActive ? 'Tắt âm' : 'Bật âm'}
        >
          {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        {/* End / Hangup call Button */}
        <button 
          onClick={() => handleEndCall(true)}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-600/40"
          title="Dập máy"
        >
          <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        {/* Toggle VIDEO (Disabled in Voice Call Mode totally, only works for Video call mode) */}
        {isVideo ? (
          <button 
            onClick={toggleVideo}
            disabled={!localStream}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50 active:scale-90 ${videoActive ? 'bg-neutral-800 text-white hover:bg-neutral-700 hover:scale-105' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}`}
            title={videoActive ? 'Tắt Video' : 'Mở Video'}
          >
            {videoActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-neutral-900 border border-white/5 opacity-30 cursor-not-allowed">
            <VideoOff className="w-6 h-6 text-neutral-500" />
          </div>
        )}
      </div>

      {/* Styled Embed for Audio animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .mirror { transform: rotateY(180deg); }
        .audio-bar {
          width: 6px;
          height: 100%;
          animation: stream-pulser 1.6s ease-in-out infinite alternate;
        }
        .bar-1 { animation-delay: 0.1s; height: 30%; }
        .bar-2 { animation-delay: 0.4s; height: 75%; }
        .bar-3 { animation-delay: 0.2s; height: 50%; }
        .bar-4 { animation-delay: 0.6s; height: 95%; }
        .bar-5 { animation-delay: 0.3s; height: 40%; }
        .bar-6 { animation-delay: 0.5s; height: 60%; }

        @keyframes stream-pulser {
          0% {
            transform: scaleY(0.25);
            opacity: 0.5;
          }
          100% {
            transform: scaleY(1.0);
            opacity: 1;
          }
        }
      `}} />
    </motion.div>
  );
}

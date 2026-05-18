import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';

interface VideoCallProps {
  user: any;
  friendId: string;
  isIncoming?: boolean;
  isVideo?: boolean;
  onClose: () => void;
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

export default function VideoCall({ user, friendId, isIncoming, isVideo = true, onClose }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(isVideo);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  // Create a consistent call ID based on both users
  const participants = [user.uid, friendId].sort();
  const callId = `call_${participants[0]}_${participants[1]}`;

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-neutral-900 flex flex-col font-sans"
    >
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden relative">
        {/* Dynamic Background Blur */}
        <div className="absolute inset-0 bg-neo-bg opacity-60 pointer-events-none" />

        <AnimatePresence mode="wait">
          {callStatus === 'connected' ? (
            <motion.video 
              key="connected-video"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          ) : callStatus === 'calling' ? (
            <motion.div 
              key="calling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white flex flex-col items-center z-10"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-neutral-500 rounded-3xl animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-neutral-600 rounded-3xl flex items-center justify-center shadow-md">
                  <Loader2 className="w-10 h-10 animate-spin text-neutral-100" />
                </div>
              </div>
              <h2 className="text-2xl font-bold font-display tracking-wide mb-2">Đang liên lạc...</h2>
              <p className="text-neutral-200/60 font-mono text-sm">{friendId.substring(0, 10)}</p>
            </motion.div>
          ) : callStatus === 'receiving' ? (
            <motion.div 
              key="receiving"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-white flex flex-col items-center z-10"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-neutral-500 rounded-3xl animate-ping opacity-30 shadow-md"></div>
                <div className="absolute inset-0 bg-neo-bg rounded-3xl flex items-center justify-center shadow-xl">
                  {errorMsg ? <AlertCircle className="w-12 h-12 text-white" /> : <PhoneCall className="w-12 h-12 text-white drop-shadow-md animate-pulse" />}
                </div>
              </div>
              <h2 className="text-3xl font-bold font-display tracking-tight mb-2">Cuộc gọi đến</h2>
              <p className="text-neutral-100/70 font-mono text-sm mb-8">Từ: {friendId.substring(0, 10)}</p>
              
              {errorMsg && (
                <div className="text-center px-4 max-w-sm mb-6 bg-orange-500/10 border border-orange-500/20 py-2 rounded-3xl">
                  <p className="text-orange-400 font-medium text-sm">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-8">
                <button 
                  onClick={() => handleEndCall(true)}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:scale-110 transition-all shadow-lg shadow-orange-500/30">
                    <PhoneOff className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Từ chối</span>
                </button>
                <button 
                  onClick={handleAnswerCall}
                  disabled={!localStream}
                  className="group flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-16 h-16 bg-neutral-500 rounded-full flex items-center justify-center group-hover:bg-neutral-600 group-hover:scale-110 transition-all shadow-lg shadow-neutral-500/40">
                    <Video className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {localStream ? 'Trả lời' : 'Đang tải...'}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white flex flex-col items-center z-10"
            >
              <div className="w-28 h-28 bg-neutral-800/90 sm:backdrop-blur-xl rounded-full border border-neutral-700/50 flex items-center justify-center mb-8 shadow-2xl">
                {errorMsg ? (
                  <AlertCircle className="w-12 h-12 text-orange-500" />
                ) : (
                  <Video className="w-12 h-12 text-neutral-400" />
                )}
              </div>
              {errorMsg ? (
                <div className="text-center px-4 max-w-sm mb-8">
                  <p className="text-orange-400 font-medium">{errorMsg}</p>
                  <p className="text-neutral-500 text-sm mt-2">Vui lòng cấp quyền truy cập thiết bị hoặc kiểm tra lại kết nối.</p>
                </div>
              ) : (
                <button 
                  onClick={handleCreateCall}
                  disabled={!localStream}
                  className="group relative px-8 py-4 bg-white text-neutral-900 font-bold rounded-3xl hover:bg-neutral-100 transition-all shadow-md hover:shadow-md flex items-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-neo-bg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Video className="w-5 h-5" /> 
                  <span>Bắt đầu gọi Video</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local Video (PiP) */}
      <AnimatePresence>
        {localStream && (
          <motion.div 
            drag
            dragConstraints={{ top: 0, left: -((typeof window !== 'undefined' ? window.innerWidth : 1000) - 200), right: 0, bottom: (typeof window !== 'undefined' ? window.innerHeight : 1000) - 300 }}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="absolute top-6 right-6 absolute top-6 right-6 w-28 h-40 sm:w-40 sm:h-56 bg-neutral-800 rounded-full overflow-hidden shadow-2xl border-2 border-neutral-700/50 z-50 group hover:border-neutral-500/50 cursor-grab active:cursor-grabbing transition-colors"
          >
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover mirror"
            />
            {(!videoActive || !micActive) && (
               <div className="absolute top-2 right-2 flex gap-1.5 bg-black/70 px-2 py-1 rounded-3xl">
                 {!videoActive && <VideoOff className="w-3.5 h-3.5 text-orange-400" />}
                 {!micActive && <MicOff className="w-3.5 h-3.5 text-orange-400" />}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="h-28 bg-neo-bg sm:backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 sm:gap-8 px-6 z-50">
        <button 
          onClick={toggleMic}
          disabled={!localStream}
          className={`relative relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${micActive ? 'bg-neutral-800 text-white hover:bg-neutral-700 hover:scale-105' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20'}`}
        >
          {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={() => handleEndCall(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-orange-600 text-white hover:bg-orange-700 hover:scale-110 transition-all shadow-md hover:shadow-md"
        >
          <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        <button 
          onClick={toggleVideo}
          disabled={!localStream}
          className={`relative relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${videoActive ? 'bg-neutral-800 text-white hover:bg-neutral-700 hover:scale-105' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20'}`}
        >
          {videoActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mirror { transform: rotateY(180deg); }
      `}} />
    </motion.div>
  );
}

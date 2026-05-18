import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, Users, Search, Copy, Check, Play } from 'lucide-react';

interface GameInviteModalProps {
   user: any;
   gameName: string;
   gameType: string;
   onJoin: (players: string[], isSimulation?: boolean) => void;
   onCancel: () => void;
   isSimulationOnly?: boolean;
   maxPlayers?: number;
}

export default function GameInviteModal({ user, gameName, gameType, onJoin, onCancel, isSimulationOnly = false, maxPlayers = 4 }: GameInviteModalProps) {
   const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
   const [roomCode, setRoomCode] = useState('');
   const [joinCode, setJoinCode] = useState('');
   const [error, setError] = useState('');
   const [copied, setCopied] = useState(false);
   const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
   const [isHost, setIsHost] = useState(false);

   const generateCode = () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const l = letters[Math.floor(Math.random() * letters.length)];
      const n = numbers[Math.floor(Math.random() * numbers.length)];
      return Math.random() > 0.5 ? l + n : n + l;
   };

   useEffect(() => {
      let code = roomCode || joinCode.toUpperCase();
      if (!code && mode === 'create') {
         code = generateCode();
         setRoomCode(code);
         setIsHost(true);
         
         setDoc(doc(db, 'game_rooms', code), { 
             hostUid: user.uid,
             players: [user.uid],
             type: gameType,
             status: 'waiting',
             maxPlayers: maxPlayers,
             createdAt: serverTimestamp() 
         }, { merge: true });
      }

      if (code && (mode === 'create' || mode === 'join' && !error)) {
         const unsub = onSnapshot(doc(db, 'game_rooms', code), (snap) => {
             if (snap.exists()) {
                 const data = snap.data();
                 if (data.players) {
                     setLobbyPlayers(data.players);
                 }
                 if (data.status === 'playing') {
                     // Host already called onJoin when clicking Start, guests call it here
                     if (data.hostUid !== user.uid) {
                         onJoin(data.players, false);
                     }
                 }
             }
         });
         return () => unsub();
      }
   }, [mode, user.uid, gameType, onJoin, roomCode, joinCode, error]);

   const handleJoinRoom = async () => {
       const code = joinCode.trim().toUpperCase();
       if (code.length !== 2) { 
           setError('Mã phòng gồm 1 số và 1 chữ in hoa (Ví dụ: 8M, A5)'); 
           return; 
       }
       try {
           const d = await getDoc(doc(db, 'game_rooms', code));
           if (!d.exists() || d.data().type !== gameType) {
               setError('Mã phòng không hợp lệ hoặc không phải trò chơi này.');
               return;
           }
           if (d.data().status === 'playing') {
               setError('Phòng này đã bắt đầu chơi.');
               return;
           }
           const currentMax = d.data().maxPlayers || maxPlayers;
           if (d.data().players?.length >= currentMax) {
               setError(`Phòng đã đầy (tối đa ${currentMax} người).`);
               return;
           }
           setIsHost(false);
           await updateDoc(doc(db, 'game_rooms', code), { 
               players: arrayUnion(user.uid) 
           });
       } catch(e) {
           setError('Lỗi khi vào phòng');
       }
   };

   const handleStartGame = async () => {
       if (isSimulationOnly) {
           onJoin([user.uid], true);
           return;
       }
       const code = roomCode || joinCode.toUpperCase();
       if (code) {
           await updateDoc(doc(db, 'game_rooms', code), { 
               status: 'playing' 
           });
           onJoin(lobbyPlayers, false);
       }
   };

   return (
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-neutral-900 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
              <button onClick={onCancel} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-3xl p-2 transition">
                  <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black mb-2 text-center">{gameName}</h3>
              <p className="text-sm text-neutral-500 text-center mb-6">Chế độ chơi cùng Bạn Bè</p>
              
              {mode === 'select' && (
                  <div className="space-y-3">
                      <button onClick={() => setMode('create')} className="w-full py-4 bg-neutral-50 border-2 border-neutral-100 text-neutral-700 rounded-3xl font-bold hover:bg-neutral-100 hover:border-neutral-200 transition flex items-center justify-center gap-2">
                          <Users className="w-5 h-5" /> Tạo Phòng Mới
                      </button>
                      <button onClick={() => setMode('join')} className="w-full py-4 bg-neutral-50 border-2 border-neutral-100 text-neutral-700 rounded-3xl font-bold hover:bg-neutral-100 hover:border-neutral-200 transition flex items-center justify-center gap-2">
                          <Search className="w-5 h-5" /> Vào Phòng Bằng Mã
                      </button>
                  </div>
              )}

              {mode === 'create' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center">
                      <p className="text-sm font-medium text-neutral-500 mb-2">Mã phòng của bạn</p>
                      <div className="text-5xl font-black text-neutral-600 mb-4 tracking-widest font-mono">
                          {roomCode || '...'}
                      </div>
                      <button onClick={() => {
                          navigator.clipboard.writeText(roomCode);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                      }} className="w-full py-3 mb-6 bg-neutral-100 text-neutral-700 rounded-3xl font-bold hover:bg-neutral-200 transition flex items-center justify-center gap-2">
                          {copied ? <><Check className="w-5 h-5" /> Đã sao chép</> : <><Copy className="w-5 h-5" /> Chép mã</>}
                      </button>

                      <div className="w-full bg-neutral-50 rounded-3xl p-4 mb-6 border border-neutral-100 text-center">
                          <p className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Người chơi hiện tại ({lobbyPlayers.length}/{maxPlayers})</p>
                          <div className="flex justify-center gap-2">
                             {lobbyPlayers.map((uid, i) => (
                                 <div key={uid} className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-bold shadow-sm" title={uid === user.uid ? 'Bạn' : 'Người chơi khác'}>
                                    {i + 1}
                                 </div>
                             ))}
                             {Array.from({length: Math.max(0, maxPlayers - lobbyPlayers.length)}).map((_, i) => (
                                 <div key={`empty-${i}`} className="w-10 h-10 rounded-full bg-neutral-200/50 flex items-center justify-center text-neutral-400/50 border border-neutral-300 border-dashed">
                                    ?
                                 </div>
                             ))}
                          </div>
                      </div>
                      
                      <button 
                         onClick={handleStartGame} 
                         disabled={(!isSimulationOnly && lobbyPlayers.length < 2)}
                         className="w-full py-4 bg-neutral-600 text-white rounded-3xl font-bold hover:bg-neutral-700 transition shadow-lg shadow-neutral-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                         <Play className="w-5 h-5 fill-current" /> {isSimulationOnly ? 'Bắt đầu (Đấu Máy)' : 'Bắt đầu ngay'}
                      </button>
                  </div>
              )}

              {mode === 'join' && lobbyPlayers.length === 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-sm font-medium text-neutral-600 mb-2 text-center">Nhập mã phòng do bạn bè tạo</p>
                      <input 
                         type="text" 
                         value={joinCode} 
                         onChange={e => {
                             setJoinCode(e.target.value.toUpperCase());
                             setError('');
                         }}
                         maxLength={2}
                         className="w-full bg-neutral-50 border-2 border-neutral-200 rounded-3xl px-4 py-4 text-center text-4xl font-black font-mono tracking-widest mb-4 focus:border-neutral-500 focus:ring-0 outline-none uppercase"
                         placeholder="A5"
                      />
                      
                      {error && <p className="text-orange-500 text-sm font-medium text-center mb-4">{error}</p>}

                      <button 
                         onClick={handleJoinRoom} 
                         disabled={joinCode.length !== 2}
                         className="w-full py-4 bg-neutral-600 text-white rounded-3xl font-bold hover:bg-neutral-700 transition shadow-lg shadow-neutral-600/30 disabled:opacity-50"
                      >
                          Vào Phòng
                      </button>
                      <div className="mt-4 text-center">
                          <button onClick={() => setMode('select')} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition">
                              Quay lại
                          </button>
                      </div>
                  </div>
              )}

              {mode === 'join' && lobbyPlayers.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center text-center">
                       <div className="w-16 h-16 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mb-4">
                           <Check className="w-8 h-8" />
                       </div>
                       <h4 className="text-lg font-bold text-neutral-800 mb-2">Đã vào phòng thành công!</h4>
                       <p className="text-sm text-neutral-500 mb-6">Đang chờ chủ phòng bắt đầu...</p>
                       <div className="flex justify-center gap-2 mb-4">
                             {lobbyPlayers.map((uid, i) => (
                                 <div key={uid} className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-800 font-bold shadow-sm" title={uid === user.uid ? 'Bạn' : 'Người chơi khác'}>
                                    {i + 1}
                                 </div>
                             ))}
                        </div>
                  </div>
              )}

          </motion.div>
      </div>
   );
}

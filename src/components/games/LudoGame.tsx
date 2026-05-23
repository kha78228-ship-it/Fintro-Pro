import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Ghost, Dices, AlertCircle, Play, Crown, RefreshCw, Users, Brain, Star } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, query, getDocs, serverTimestamp } from 'firebase/firestore';
import { PlayerColor, HorseStatus, Horse, TRACK, STARTS, FINISH_STARTS, FINISH_PATHS, HOME_ZONES, getHorseCoords } from './LudoLogic';

interface LudoGameProps {
  user: any;
  onExit?: () => void;
}

type GameMode = 'ai' | 'friend' | null;

interface GameState {
  players: string[];
  colors: Record<string, PlayerColor>;
  turnOrder: PlayerColor[];
  turn: PlayerColor;
  horses: Horse[];
  dice: number | null;
  lastRollTime: number;
  winner: string | null;
  hasRolled: boolean;
}

const ALL_COLORS: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
const COLOR_CLASSES = {
  red: 'bg-neo-bg',
  green: 'bg-neo-bg',
  blue: 'bg-neo-bg',
  yellow: 'bg-neo-bg'
};
const RING_CLASSES = {
  red: 'ring-orange-200/50',
  green: 'ring-neutral-200/50',
  blue: 'ring-neutral-200/50',
  yellow: 'ring-orange-200/50'
};
const BORDER_CLASSES = {
  red: 'border-orange-600 border-b-orange-700',
  green: 'border-neutral-600 border-b-neutral-700',
  blue: 'border-neutral-600 border-b-neutral-700',
  yellow: 'border-orange-500 border-b-orange-600'
};

const initHorses = (colors: PlayerColor[]): Horse[] => {
  const h: Horse[] = [];
  colors.forEach(c => {
    for (let i = 0; i < 4; i++) {
      h.push({ id: `${c}_${i}`, color: c, status: 'home', position: -1 });
    }
  });
  return h;
};

const StaticLudoBoard = React.memo(() => {
  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)', gap: '1px', backgroundColor: '#e5e5e5' }}>
      {/* Draw 15x15 Grid */}
      {Array.from({ length: 225 }).map((_, i) => {
        const x = i % 15;
        const y = Math.floor(i / 15);
        const isRedHome = x < 6 && y < 6;
        const isGreenHome = x > 8 && y < 6;
        const isBlueHome = x > 8 && y > 8;
        const isYellowHome = x < 6 && y > 8;
        
        let bg = "bg-neutral-50";
        if (isRedHome) bg = "bg-orange-100 border-r-2 border-b-2 border-orange-200/50";
        if (isGreenHome) bg = "bg-neutral-100 border-l-2 border-b-2 border-neutral-200/50";
        if (isBlueHome) bg = "bg-neutral-100 border-l-2 border-t-2 border-neutral-200/50";
        if (isYellowHome) bg = "bg-orange-100 border-r-2 border-t-2 border-orange-200/50";

        // Center 3x3
        if (x >= 6 && x <= 8 && y >= 6 && y <= 8) bg = "bg-neutral-900 border border-neutral-950";

        // Track colors
        if (x === 1 && y === 6) bg = "bg-orange-400 flex items-center justify-center";
        if (y === 7 && x > 0 && x < 6) bg = "bg-orange-200/60";
        
        if (x === 8 && y === 1) bg = "bg-neutral-400 flex items-center justify-center";
        if (x === 7 && y > 0 && y < 6) bg = "bg-neutral-200/60";

        if (x === 13 && y === 8) bg = "bg-neutral-400 flex items-center justify-center";
        if (y === 7 && x > 8 && x < 14) bg = "bg-neutral-200/60";

        if (x === 6 && y === 13) bg = "bg-orange-400 flex items-center justify-center";
        if (x === 7 && y > 8 && y < 14) bg = "bg-orange-200/60";

        const isStartSpot = (x===1&&y===6) || (x===8&&y===1) || (x===13&&y===8) || (x===6&&y===13);
        const isSafeSpot = (x===6&&y===2) || (x===12&&y===6) || (x===8&&y===12) || (x===2&&y===8);
        if (isSafeSpot) bg = "bg-neutral-300 flex items-center justify-center";

        // Draw the home circles
        let circle = null;
        if (isRedHome && x === 3 && y === 3) circle = <div className="absolute w-[200%] h-[200%] -left-[50%] -top-[50%] rounded-3xl bg-orange-500/20 shadow-inner flex items-center justify-center"><div className="w-[60%] h-[60%] rounded-3xl bg-orange-100/50" /></div>;
        if (isGreenHome && x === 11 && y === 3) circle = <div className="absolute w-[200%] h-[200%] -left-[50%] -top-[50%] rounded-3xl bg-neutral-500/20 shadow-inner flex items-center justify-center"><div className="w-[60%] h-[60%] rounded-3xl bg-neutral-100/50" /></div>;
        if (isBlueHome && x === 11 && y === 11) circle = <div className="absolute w-[200%] h-[200%] -left-[50%] -top-[50%] rounded-3xl bg-neutral-500/20 shadow-inner flex items-center justify-center"><div className="w-[60%] h-[60%] rounded-3xl bg-neutral-100/50" /></div>;
        if (isYellowHome && x === 3 && y === 11) circle = <div className="absolute w-[200%] h-[200%] -left-[50%] -top-[50%] rounded-3xl bg-orange-500/20 shadow-inner flex items-center justify-center"><div className="w-[60%] h-[60%] rounded-3xl bg-orange-100/50" /></div>;

        return (
          <div key={i} className={`w-full h-full relative overflow-hidden flex items-center justify-center ${bg}`} style={{ gridColumn: x+1, gridRow: y+1 }}>
             {isStartSpot && <Star className="w-3/5 h-3/5 text-white/60 fill-current drop-shadow-sm" />}
             {isSafeSpot && <Star className="w-3/5 h-3/5 text-neutral-500/30 fill-current" />}
             {circle}
          </div>
        );
      })}
    </div>
  );
});
StaticLudoBoard.displayName = 'StaticLudoBoard';

import GameInviteModal from './GameInviteModal';

export default function LudoGame({ user, onExit }: LudoGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<GameMode>(null);
  const [aiCount, setAiCount] = useState<number>(3);
  const [gameId, setGameId] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [activeGames, setActiveGames] = useState<Record<string, any>>({});
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const uid = user?.uid || 'guest';

  // Fetch Friends Data
  useEffect(() => {
    if (!user) return;
    const unsubscribers: (() => void)[] = [];
    
    const fetchFriendsAndGames = async () => {
      const q = query(collection(db, `users/${user.uid}/friends`));
      const snap = await getDocs(q);
      const friendsList = snap.docs.map(d => ({ friendId: d.id, ...d.data() }));
      setFriends(friendsList);
      
      friendsList.forEach(f => {
        const unsub = onSnapshot(doc(db, 'publicProfiles', f.friendId), (docSnap) => {
          if (docSnap.exists()) {
             setFriendProfiles(prev => ({ ...prev, [f.friendId]: docSnap.data() }));
          }
        });
        unsubscribers.push(unsub);
      });

      const gamesStatus: Record<string, any> = {};
      await Promise.all(friendsList.map(async (f) => {
        const newGameId = `ludo_${[user.uid, f.friendId].sort().join('_')}`;
        const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
        if (matchDoc.exists()) {
          const data = matchDoc.data();
          if (data.type === 'ludo') gamesStatus[f.friendId] = data;
        }
      }));
      setActiveGames(gamesStatus);
    };
    fetchFriendsAndGames();
    
    return () => unsubscribers.forEach(u => u());
  }, [user]);

  // Online Multiplayer Listener
  useEffect(() => {
    if (!gameId || mode !== 'friend') return;
    const unsub = onSnapshot(doc(db, 'couple_data', gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.ludoState && data.ludoState.lastRollTime !== gameState?.lastRollTime) {
          setGameState(data.ludoState);
        }
      }
    });
    return () => unsub();
  }, [gameId, mode, gameState?.lastRollTime]);

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    if (mode === 'friend' && gameId) {
      setDoc(doc(db, 'couple_data', gameId), {
        type: 'ludo',
        ludoState: newState,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  const startAIGame = (count: number) => {
     setMode('ai');
     setAiCount(count);
     const players = [uid];
     const colorsMap: Record<string, PlayerColor> = { [uid]: 'red' };
     const turnOrder: PlayerColor[] = ['red'];
     
     if (count >= 1) { players.push('bot1'); colorsMap['bot1'] = 'blue'; turnOrder.push('blue'); }
     if (count >= 2) { players.push('bot2'); colorsMap['bot2'] = 'green'; turnOrder.splice(1, 0, 'green'); } // red, green, blue
     if (count === 3) { players.push('bot3'); colorsMap['bot3'] = 'yellow'; turnOrder.push('yellow'); } // red, green, blue, yellow
     
     setGameState({
       players,
       colors: colorsMap,
       turnOrder,
       turn: turnOrder[0],
       horses: initHorses(turnOrder),
       dice: null,
       lastRollTime: Date.now(),
       winner: null,
       hasRolled: false
     });
  };

  const startFriendGame = async (uids: string[]) => {
    // Collect all players including self
    const allPlayers = Array.from(new Set([uid, ...uids])).sort();
    
    // Set for 1v1 compat but mostly we rely on allPlayers
    const opponentUid = allPlayers.find(p => p !== uid) || uid;
    setSelectedFriend({ friendId: opponentUid, displayName: 'Đối thủ' });
    setMode('friend');
    const newGameId = `ludo_${allPlayers.join('_')}`;
    setGameId(newGameId);

    const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
    if (matchDoc.exists() && matchDoc.data().type === 'ludo' && matchDoc.data().ludoState) {
        setGameState(matchDoc.data().ludoState);
    } else {
        const availableColors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
        const turnOrder: PlayerColor[] = [];
        const colors: Record<string, PlayerColor> = {};
        allPlayers.forEach((playerUid, index) => {
             const color = availableColors[index];
             turnOrder.push(color);
             colors[playerUid] = color;
        });

        const initialState: GameState = {
            players: allPlayers,
            colors: colors,
            turnOrder,
            turn: turnOrder[0],
            horses: initHorses(turnOrder),
            dice: null,
            lastRollTime: Date.now(),
            winner: null,
            hasRolled: false
        };
        setGameState(initialState);
        await setDoc(doc(db, 'couple_data', newGameId), {
          type: 'ludo',
          ludoState: initialState,
          players: allPlayers,
          updatedAt: serverTimestamp()
        }, { merge: true });
    }
  };

  useEffect(() => {
    // Basic AI / Auto-play for bot
    if (!gameState || gameState.winner || mode !== 'ai') return;

    if (gameState.turn !== gameState.colors[uid]) {
       // If it hasn't rolled, roll it after 1 sec
       if (!gameState.hasRolled) {
          const timeout = setTimeout(() => {
             const v = Math.floor(Math.random() * 6) + 1;
             setGameState({ ...gameState, dice: v, hasRolled: true, lastRollTime: Date.now() });
          }, 1000);
          return () => clearTimeout(timeout);
       } else {
          // It has rolled. Pick a move after 1 sec
          const timeout = setTimeout(() => {
             if (gameState.dice === null) return;
             const moves = getValidMoves(gameState, gameState.turn, gameState.dice);
             if (moves.length === 0) {
                 skipTurn();
             } else {
                 // Upgrade AI: prioritize kill, finish_climb, finish_enter, deploy, move
                 let chosenMove = moves[0];
                 const killMove = moves.find(m => {
                     if (m.type !== 'move' && m.type !== 'deploy') return false;
                     let targetPos = m.type === 'deploy' ? STARTS[m.horse.color] : (m.horse.position + gameState.dice!) % 52;
                     return gameState.horses.some(h => h.status === 'track' && h.position === targetPos && h.color !== m.horse.color);
                 });
                 if (killMove) {
                     chosenMove = killMove;
                 } else {
                     const finishClimbMove = moves.find(m => m.type === 'finish_climb');
                     const finishEnterMove = moves.find(m => m.type === 'finish_enter');
                     const deployMove = moves.find(m => m.type === 'deploy');
                     chosenMove = finishClimbMove || finishEnterMove || deployMove || moves[Math.floor(Math.random() * moves.length)];
                 }
                 handleHorseClick(chosenMove.horse);
             }
          }, 1500);
          return () => clearTimeout(timeout);
       }
    }
  }, [gameState, uid]);

  const rollDice = () => {
    if (!gameState || gameState.hasRolled || gameState.winner) return;
    if (gameState.turn !== gameState.colors[uid] && mode === 'friend') return;
    const v = Math.floor(Math.random() * 6) + 1;
    updateGameState({ ...gameState, dice: v, hasRolled: true, lastRollTime: Date.now() });
  };

  const getValidMoves = (state: GameState, color: PlayerColor, dice: number) => {
    const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48];
    return state.horses.filter(h => h.color === color).map(h => {
        if (h.status === 'home') {
            if (dice === 1 || dice === 6) {
                const targetPos = STARTS[color];
                // Cannot deploy if our own horse is at the start position
                const isBlockedByOwn = state.horses.some(other => other.status === 'track' && other.position === targetPos && other.color === color);
                if (isBlockedByOwn) return { horse: h, valid: false };
                return { horse: h, valid: true, type: 'deploy' };
            }
            return { horse: h, valid: false };
        }
        if (h.status === 'track') {
           const endPositions = FINISH_STARTS[color];
           // Calculate distance to end
           let dist = endPositions - h.position;
           if (dist < 0) dist += 52;
           if (dist === 0) {
              // Wait, if finish is blocked, we can't enter?
              const targetStair = dice - 1;
              if (dice <= 6) {
                 const isBlockedByOwn = state.horses.some(other => other.status === 'finish_path' && other.position === targetStair && other.color === color);
                 if (isBlockedByOwn) return { horse: h, valid: false };
                 return { horse: h, valid: true, type: 'finish_enter', target: targetStair };
              }
              return { horse: h, valid: false };
           }
           if (dist >= dice) {
               const targetPos = (h.position + dice) % 52;
               // Cannot land on our own horse
               const isBlockedByOwn = state.horses.some(other => other.status === 'track' && other.position === targetPos && other.color === color);
               if (isBlockedByOwn) return { horse: h, valid: false };
               
               // Cannot kick opponent on a safe spot
               const isBlockedBySafeSpot = SAFE_POSITIONS.includes(targetPos) && state.horses.some(other => other.status === 'track' && other.position === targetPos && other.color !== color);
               if (isBlockedBySafeSpot) return { horse: h, valid: false };

               return { horse: h, valid: true, type: 'move' };
           }
           // If dist < dice, they overshot the door. Cannot move.
           return { horse: h, valid: false };
        }
        if (h.status === 'finish_path') {
           // On stairs, need to roll exactly the next step. e.g. on pos 0 (step 1), needs to roll 2 to go to pos 1 (step 2).
           if (dice === h.position + 2) {
               const targetPos = h.position + 1;
               const isBlockedByOwn = state.horses.some(other => other.status === 'finish_path' && other.position === targetPos && other.color === color);
               if (isBlockedByOwn) return { horse: h, valid: false };
               return { horse: h, valid: true, type: 'finish_climb', target: targetPos };
           }
           return { horse: h, valid: false };
        }
        return { horse: h, valid: false };
    }).filter(m => m.valid);
  };

  const handleHorseClick = (horse: Horse) => {
    if (!gameState || !gameState.hasRolled || gameState.turn !== horse.color || !gameState.dice) return;
    if (gameState.turn !== gameState.colors[uid] && mode === 'friend') return;
    const validMoves = getValidMoves(gameState, gameState.turn, gameState.dice);
    const move = validMoves.find(m => m.horse.id === horse.id);
    if (!move) return;

    let newHorses = [...gameState.horses];
    let hIndex = newHorses.findIndex(h => h.id === horse.id);
    let targetPos = -1;

    if (move.type === 'deploy') {
       targetPos = STARTS[horse.color];
       newHorses[hIndex] = { ...horse, status: 'track', position: targetPos };
    } else if (move.type === 'move') {
       targetPos = (horse.position + gameState.dice) % 52;
       newHorses[hIndex] = { ...horse, position: targetPos };
    } else if (move.type === 'finish_enter') {
       targetPos = move.target as number;
       newHorses[hIndex] = { ...horse, status: 'finish_path', position: targetPos };
    } else if (move.type === 'finish_climb') {
       targetPos = move.target as number;
       newHorses[hIndex] = { ...horse, position: targetPos };
       if (targetPos === 5) {
          newHorses[hIndex].status = 'finished';
       }
    }

    // Check Kill - kick ALL opponent horses at target position
    if (move.type === 'deploy' || move.type === 'move') {
       newHorses = newHorses.map(h => {
           // if this is an opponent horse standing exactly at the target track position
           if (h.status === 'track' && h.position === targetPos && h.color !== horse.color) {
               return { ...h, status: 'home', position: -1 };
           }
           return h;
       });
    }

    // Check Win
    const hasWon = newHorses.filter(h => h.color === gameState.turn && (h.status === 'finished' || (h.status === 'finish_path' && h.position >= 2))).length === 4; // Simplification

    let nextTurn = gameState.turn;
    if (gameState.dice !== 6 && gameState.dice !== 1) { // 1 or 6 gives another turn
        const currentTurnIndex = gameState.turnOrder.indexOf(gameState.turn);
        nextTurn = gameState.turnOrder[(currentTurnIndex + 1) % gameState.turnOrder.length];
    }

    updateGameState({
       ...gameState,
       horses: newHorses,
       turn: nextTurn,
       hasRolled: false,
       dice: null,
       winner: hasWon ? gameState.turn : gameState.winner
    });
  };

  const skipTurn = () => {
    if (!gameState) return;
    if (gameState.turn !== gameState.colors[uid] && mode === 'friend') return;
    const currentTurnIndex = gameState.turnOrder.indexOf(gameState.turn);
    const nextTurn = gameState.turnOrder[(currentTurnIndex + 1) % gameState.turnOrder.length];
    updateGameState({ ...gameState, turn: nextTurn, hasRolled: false, dice: null });
  };

  if (!mode) {
    return (
      <>
      <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
        <button onClick={onExit} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Trở lại
        </button>
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-200/50 border border-neutral-100 text-center">
          <Ghost className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-900 mb-2">Cờ Cá Ngựa</h2>
          <p className="text-neutral-500 text-sm sm:text-base mb-6 sm:mb-8">Chọn cấu hình để chơi</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-5 sm:p-6 rounded-3xl text-left border border-neutral-200">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600">
                   <Brain className="w-4 h-4" />
                 </div>
                 <h3 className="font-semibold text-neutral-900 text-base">Chơi với Máy</h3>
               </div>
               <div className="space-y-2">
                 <button onClick={() => startAIGame(1)} className="w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-600 border border-neutral-100">
                   <span>1 Người vs 1 Máy</span>
                 </button>
                 <button onClick={() => startAIGame(2)} className="w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-600 border border-neutral-100">
                   <span>1 Người vs 2 Máy</span>
                 </button>
                 <button onClick={() => startAIGame(3)} className="w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-600 border border-neutral-100">
                   <span>1 Người vs 3 Máy</span>
                 </button>
               </div>
            </div>

            <div className="bg-neutral-50 p-5 sm:p-6 rounded-3xl text-left border border-neutral-100 flex flex-col">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                   <Users className="w-4 h-4" />
                 </div>
                 <h3 className="font-semibold text-neutral-900 text-base">Chơi với Bạn (2-4 Người)</h3>
               </div>
               
               <p className="text-sm text-neutral-500 mt-2 bg-white p-3 rounded-3xl border border-neutral-100 text-center col-span-3">
                 Tạo phòng và chia sẻ mã, hoặc nhập mã để tham gia bàn chơi có sẵn.
                 <br/><br/>
                 <button onClick={() => setShowInviteModal(true)} className="px-6 py-2 bg-neutral-600 text-white rounded-3xl font-semibold hover:bg-neutral-700 transition">Vào Sảnh Mời</button>
               </p>
            </div>
          </div>
        </div>
      </div>
      {showInviteModal && (
        <GameInviteModal 
           user={user}
           gameName="Cờ Cá Ngựa"
           gameType="ludo"
           onJoin={(players) => {
               setShowInviteModal(false);
               if (players && players.length > 0) startFriendGame(players);
           }}
           onCancel={() => setShowInviteModal(false)}
        />
      )}
      </>
    );
  }

  if (!gameState) return <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-white" /></div>;

  const validMoves = gameState.hasRolled && gameState.dice ? getValidMoves(gameState, gameState.turn, gameState.dice) : [];
  const canMove = validMoves.length > 0;

  return (
    <div className="flex flex-col h-full absolute inset-0 bg-neutral-950 z-50 overflow-hidden text-neutral-100">
       <div className="p-4 flex items-center justify-between border-b border-neutral-800/80 shrink-0 bg-neutral-950/90 backdrop-blur-md z-30 relative shadow-md">
        <button onClick={onExit} className="flex items-center gap-2 hover:bg-neutral-800 px-3 py-2 rounded-3xl transition-colors text-sm font-semibold text-neutral-300">
          <ArrowLeft className="w-5 h-5" /> Rời bàn
        </button>
        <div className="font-bold text-base sm:text-lg flex items-center gap-2 text-white">
           <Ghost className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" /> Cờ Cá Ngựa
        </div>
        <div className="flex flex-col items-end gap-2">
          {gameState.colors[uid] && (
             <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold bg-neutral-800/50 px-2 py-1 rounded-3xl border border-neutral-700/50">
               <span className="text-neutral-400">Phe của bạn:</span>
               <div className={`w-3 h-3 rounded-full shadow-sm ${gameState.colors[uid] === 'red' ? 'bg-orange-500' : gameState.colors[uid] === 'green' ? 'bg-neutral-500' : gameState.colors[uid] === 'blue' ? 'bg-neutral-500' : 'bg-orange-500'}`} />
             </div>
          )}
          <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-3xl bg-neutral-800/80 border border-neutral-700/50 shadow-inner font-bold text-xs sm:text-sm">
             Lượt: <span className={`uppercase tracking-widest ${gameState.turn === 'red' ? 'text-orange-400' : gameState.turn === 'green' ? 'text-neutral-400' : gameState.turn === 'blue' ? 'text-neutral-400' : 'text-orange-400'}`}>{gameState.turn}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full flex flex-col items-center justify-start sm:justify-center relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
        
        {/* Subtle background glow based on turn */}
        <div 
          className={`absolute top-[-50px] left-1/2 -translate-x-1/2 w-[150%] h-[300px] opacity-20 pointer-events-none transition-colors duration-1000 ${gameState.turn === 'red' ? 'text-orange-500' : gameState.turn === 'green' ? 'text-neutral-500' : gameState.turn === 'blue' ? 'text-neutral-500' : 'text-orange-500'}`} 
          style={{ backgroundImage: "radial-gradient(ellipse at top, currentColor 0%, transparent 60%)" }}
        />

        {/* Ludo Board */}
        <div className="w-full max-w-[500px] mt-4 sm:mt-0 p-4 sm:p-6 relative z-10">
            <div className="relative w-full rounded-3xl overflow-hidden border-[14px] border-neutral-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] bg-neutral-100 ring-4 ring-neutral-900 ring-offset-4 ring-offset-neutral-800" style={{ paddingTop: '100%' }}>
                <StaticLudoBoard />

                {/* Draw Horses */}
                {gameState.horses.map(h => {
                    const coords = getHorseCoords(h);
                    const isSelectable = validMoves.some(m => m.horse.id === h.id);
                    return (
                        <motion.div
                            key={h.id}
                            initial={false}
                            animate={{
                                left: `${(coords.x / 15) * 100}%`,
                                top: `${(coords.y / 15) * 100}%`,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`absolute w-[6.66%] h-[6.66%] p-1.5 z-10 ${isSelectable ? 'cursor-pointer' : ''}`}
                            onClick={() => handleHorseClick(h)}
                        >
                            <div className={`w-full h-full rounded-3xl shadow-lg border-[3px] ${COLOR_CLASSES[h.color]} ${BORDER_CLASSES[h.color]} ${isSelectable ? 'animate-pulse ring-4 ' + RING_CLASSES[h.color] : ''} flex items-center justify-center text-[9px] font-black text-white drop-shadow-md relative overflow-hidden`}>
                               <div className="absolute inset-0 bg-neo-bg"></div>
                               <span className="relative z-10">{h.status === 'finish_path' ? h.position + 1 : ''}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:p-6 sm:pb-10 bg-neo-bg flex flex-col items-center gap-4 pointer-events-none z-20">
            <div className="pointer-events-auto flex items-center justify-center gap-4">
                {gameState.turn === gameState.colors[uid] && !gameState.hasRolled && (
                    <button 
                        onClick={rollDice}
                        disabled={gameState.hasRolled}
                        className={`shrink-0 shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all border-b-4 focus:outline-none bg-neo-bg border-neutral-700 hover:brightness-110 active:border-b-0 active:translate-y-1 text-white`}
                    >
                        <Dices className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md" />
                        <span className="font-bold text-[10px] sm:text-xs">GIEO</span>
                    </button>
                )}

                {gameState.turn !== gameState.colors[uid] && !gameState.hasRolled && (
                    <div className="px-8 py-4 rounded-3xl bg-neutral-900/90 backdrop-blur-md border border-white/10 flex items-center gap-3 shadow-2xl">
                        <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
                        <span className="font-medium text-neutral-200">Đợi đối thủ gieo...</span>
                    </div>
                )}

                {gameState.hasRolled && (
                    <div className="flex items-center gap-3 sm:gap-4">
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }} 
                          animate={{ scale: 1, rotate: 0 }} 
                          className="shrink-0 shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neo-bg bg-neo-bg border-4 border-neutral-300 flex items-center justify-center shadow-[inset_0_-8px_10px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.4)] relative"
                        >
                            <span className={`text-4xl sm:text-5xl font-black drop-shadow-sm ${gameState.dice === 6 || gameState.dice === 1 ? 'text-orange-500' : 'text-neutral-800'}`}>{gameState.dice}</span>
                        </motion.div>

                        {gameState.turn !== gameState.colors[uid] && !canMove && (
                             <div className="px-6 py-4 rounded-3xl bg-neutral-900/90 backdrop-blur-md border border-white/10 flex items-center shadow-2xl">
                                 <span className="font-bold text-neutral-200">Đối thủ đang đi...</span>
                             </div>
                        )}

                        {gameState.turn === gameState.colors[uid] && !canMove && (
                             <motion.button 
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                onClick={skipTurn} 
                                className="shrink-0 px-6 py-4 sm:px-8 sm:py-5 rounded-3xl bg-neo-bg hover:from-neutral-600 hover:to-neutral-700 border-b-4 border-neutral-900 text-white font-bold transition-all shadow-xl active:border-b-0 active:translate-y-1 text-sm sm:text-base"
                             >
                                 Bỏ lượt
                             </motion.button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Winner message */}
        <AnimatePresence>
          {gameState.winner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-center"
            >
              <Crown className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-md" />
              <h2 className="text-4xl font-bold text-white mb-4">
                 {gameState.winner === 'red' ? 'Đỏ' : gameState.winner === 'green' ? 'Xanh Lá' : gameState.winner === 'blue' ? 'Xanh Dương' : 'Vàng'} Chiến Thắng!
              </h2>
              <button 
                onClick={onExit}
                className="bg-white text-neutral-900 px-8 py-3 rounded-3xl font-bold hover:bg-neutral-200 transition-colors"
               >
                Thoát sảnh
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RefreshCw, Trophy, AlertCircle, Shield } from 'lucide-react';
import { Card, Suit, Rank, createDeck, shuffleDeck, canPlay, PlayedCards, analyzePlay, getBotPlay } from './TienLenLogic';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, query, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';

interface Props {
  user: any;
  onExit?: () => void;
}

type TurnState = 'playing' | 'game_over';

interface GameState {
  players: string[];
  hands: Record<string, Card[]>;
  table: PlayedCards | null;
  turnIndex: number;
  passedPlayers: string[];
  status: TurnState;
  winner: string | null;
  logs: string[];
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-neutral-900',
  clubs: 'text-neutral-900',
  diamonds: 'text-orange-600',
  hearts: 'text-orange-600',
};

const RANK_LABELS: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2'
};

const PLAYER_NAMES = ['Bạn', 'Ngọc', 'Tùng', 'Mai'];

import GameInviteModal from './GameInviteModal';

export default function TienLenGame({ user, onExit }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [sortType, setSortType] = useState<'value' | 'suit'>('value');
  const [isDealing, setIsDealing] = useState(false);
  const [mode, setMode] = useState<'bot' | 'friend' | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isMienBacMode, setIsMienBacMode] = useState(false);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const uid = user?.uid || 'guest';

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    if (mode === 'friend' && gameId) {
      setDoc(doc(db, 'couple_data', gameId), {
        type: 'tienlen',
        state: newState,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  useEffect(() => {
    if (!gameId || mode !== 'friend') return;
    const unsub = onSnapshot(doc(db, 'couple_data', gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.type === 'tienlen' && data.state) {
           setGameState(data.state);
        }
      }
    });
    return () => unsub();
  }, [gameId, mode]);

  const startFriendGame = async (uids: string[]) => {
    setIsDealing(true);
    const allPlayers = Array.from(new Set(uids)).sort();
    setPlayerCount(allPlayers.length);
    setMode('friend');
    const newGameId = `tienlen_${allPlayers.join('_')}`;
    setGameId(newGameId);

    const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
    if (matchDoc.exists() && matchDoc.data().type === 'tienlen' && matchDoc.data().state) {
        setGameState(matchDoc.data().state);
    } else {
        if (allPlayers[0] === uid) {
            let deck = shuffleDeck(createDeck());
            const hands: Record<string, Card[]> = {};
            for (let i = 0; i < allPlayers.length; i++) {
                hands[allPlayers[i]] = deck.splice(0, 13);
            }
            
            // Give turn to person with 3 spades
            let startingPlayerIndex = 0;
            let found = false;
            for (let i = 0; i < allPlayers.length; i++) {
                if (hands[allPlayers[i]].some(c => c.id === '3_spades')) {
                    startingPlayerIndex = i;
                    found = true;
                    break;
                }
            }
            if(!found){
               // if no 3 spades in dealt hands (e.g. less than 4 players), just first player
               startingPlayerIndex = 0;
            }

            for (let i = 0; i < allPlayers.length; i++) {
                hands[allPlayers[i]].sort((a,b) => a.value - b.value);
            }
            
            const initialState: GameState = {
                players: allPlayers,
                hands,
                table: null,
                turnIndex: startingPlayerIndex,
                passedPlayers: [],
                status: 'playing',
                winner: null,
                logs: [`Bắt đầu bàn chơi. Lượt của người có 3 Bích.`]
            };
            setGameState(initialState);
            await setDoc(doc(db, 'couple_data', newGameId), {
                type: 'tienlen',
                state: initialState,
                players: allPlayers,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }
    setTimeout(() => {
        setIsDealing(false);
    }, 2000);
  };

  const initGame = (count: number) => {
    setIsDealing(true);
    setPlayerCount(count);
    let deck = shuffleDeck(createDeck());
    const hands: Record<string, Card[]> = {};
    const pids = [];
    for (let i = 0; i < count; i++) {
       const hand = deck.splice(0, 13);
       hands[i.toString()] = hand;
       pids.push(i.toString());
    }
    
    // Ensure player 0 (Bạn) always has 3 Spades to go first
    const userHand = hands['0'];
    if (!userHand.some(c => c.id === '3_spades')) {
        let spadesOwner = '1';
        let spadesIndex = 0;
        let foundSpades = false;
        for (let i = 1; i < count; i++) {
            const idx = hands[i.toString()].findIndex(c => c.id === '3_spades');
            if (idx !== -1) {
                spadesOwner = i.toString();
                spadesIndex = idx;
                foundSpades = true;
                break;
            }
        }
        if (foundSpades) {
            const temp = userHand[0];
            userHand[0] = hands[spadesOwner][spadesIndex];
            hands[spadesOwner][spadesIndex] = temp;
        } else {
            const deckIdx = deck.findIndex(c => c.id === '3_spades');
            if (deckIdx !== -1) {
                const temp = userHand[0];
                userHand[0] = deck[deckIdx];
                deck[deckIdx] = temp;
            }
        }
    }

    // sort hands
    for (let i = 0; i < count; i++) {
       hands[i.toString()].sort((a,b) => a.value - b.value);
    }
    
    setGameState({
       players: pids,
       hands,
       table: null,
       turnIndex: 0,
       passedPlayers: [],
       status: 'playing',
       winner: null,
       logs: [`Bạn đi trước vì có 3 Bích.`]
    });
    setSelectedCardIds([]);
    
    setTimeout(() => {
        setIsDealing(false);
    }, 2000); // deal animation duration
  };

  useEffect(() => {
    // Game starts when playerCount is selected
  }, [mode]);

  // AI Logic
  useEffect(() => {
    if (!gameState) return;
    if (gameState.status !== 'playing') return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (mode === 'friend' || currentPlayer === '0') return; // Human turn in bot mode OR any turn in friend mode (friends handle their own clients)

    const timeout = setTimeout(() => {
       const hand = gameState.hands[currentPlayer];
       
       let played: Card[] = getBotPlay(hand, gameState.table, isMienBacMode) || [];

       if (played.length > 0 && !canPlay(played, gameState.table, isMienBacMode)) {
           played = [];
       }

       if (played.length > 0) {
           handlePlayAction(currentPlayer, played);
       } else {
           handlePassAction(currentPlayer);
       }

    }, 1500);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handlePlayAction = (playerId: string, cardsToPlay: Card[]) => {
      if (!gameState) return;
      
      const isFirstMoveOfGame = !gameState.table && gameState.passedPlayers.length === 0 && !gameState.logs.some(l => l.includes('đánh'));
      if (isFirstMoveOfGame) {
          // Must include 3 spades
          const has3Spades = cardsToPlay.some(c => c.id === '3_spades');
          if (!has3Spades) {
              if (playerId === '0') {
                  setErrorMsg('Ván đầu tiên phải đánh lá 3 Bích!');
                  setTimeout(() => setErrorMsg(''), 3000);
                  return;
              } else {
                  // AI should have played 3 spades... fix AI if this triggers
                  const threeSpades = gameState.hands[playerId].find(c => c.id === '3_spades');
                  if (threeSpades) cardsToPlay = [threeSpades];
              }
          }
      }

      const type = analyzePlay(cardsToPlay, isMienBacMode);
      const isHuman = mode === 'friend' ? playerId === uid : playerId === '0';

      if (!canPlay(cardsToPlay, gameState.table, isMienBacMode)) {
          if (isHuman) {
              setErrorMsg('Bài đánh không hợp lệ hoặc không thể chặt!');
              setTimeout(() => setErrorMsg(''), 3000);
          }
          return;
      }

      const highestValue = Math.max(...cardsToPlay.map(c => c.value));
      const newHand = gameState.hands[playerId].filter(c => !cardsToPlay.some(pc => pc.id === c.id));
      
      if (isMienBacMode && newHand.length === 0 && cardsToPlay.some(c => c.rank === 15)) {
          if (isHuman) {
              setErrorMsg('Miền Bắc: Không được để heo cuối cùng!');
              setTimeout(() => setErrorMsg(''), 3000);
          } else {
              // Bot accidentally played a pig as last card, force it to pass or play something else. 
              // Since the bot logic handles validPlays and sorts them, if it's the only play, it must pass.
              handlePassAction(playerId);
          }
          return;
      }
      
      let nextState = { ...gameState };
      nextState.table = {
          cards: cardsToPlay,
          type,
          highestValue,
          owner: playerId
      };
      nextState.hands = { ...nextState.hands, [playerId]: newHand };
      let typeName = cardsToPlay.length > 1 ? `bộ ${cardsToPlay.length} lá` : '1 lá';
      if (type === 'quad') typeName = 'Tứ quý';
      else if (type === '3_pairs_straight') typeName = '3 đôi thông';
      else if (type === '4_pairs_straight') typeName = '4 đôi thông';
      else if (type === 'straight') typeName = `Sảnh ${cardsToPlay.length} lá`;
      else if (type === 'triple') typeName = 'Sám cô';
      else if (type === 'pair') typeName = 'Đôi';

      const playerName = mode === 'friend' ? (playerId === uid ? 'Bạn' : 'Đối thủ') : PLAYER_NAMES[parseInt(playerId)];
      nextState.logs = [`${playerName} đánh ${typeName}.`, ...nextState.logs.slice(0, 4)];
      setSelectedCardIds([]);

      if (newHand.length === 0) {
          nextState.status = 'game_over';
          nextState.winner = playerId;
          nextState.logs = [`${playerName} tới trắng!`, ...nextState.logs];
      } else {
          // pass to next player who hasn't passed
          const count = nextState.players.length;
          let nextIdx = (nextState.turnIndex + 1) % count;
          while (nextState.passedPlayers.includes(nextIdx.toString())) {
              nextIdx = (nextIdx + 1) % count;
          }
          nextState.turnIndex = nextIdx;
      }

      updateGameState(nextState);
  };

  const handlePassAction = (playerId: string) => {
      if (!gameState) return;
      if (!gameState.table) {
          if ((mode === 'friend' && playerId === uid) || (mode === 'bot' && playerId === '0')) {
               setErrorMsg('Bạn không thể bỏ lượt khi vòng mới bắt đầu!');
               setTimeout(() => setErrorMsg(''), 3000);
          }
          return;
      }

      let nextState = { ...gameState };
      nextState.passedPlayers = [...nextState.passedPlayers, playerId];
      const playerName = mode === 'friend' ? (playerId === uid ? 'Bạn' : 'Đối thủ') : PLAYER_NAMES[parseInt(playerId)];
      nextState.logs = [`${playerName} bỏ lượt.`, ...nextState.logs.slice(0, 4)];
      
      const count = nextState.players.length;
      let nextIdx = (nextState.turnIndex + 1) % count;
      
      // if everyone else passed, the last player gets a new round
      if (nextState.passedPlayers.length === count - 1) {
          nextIdx = parseInt(nextState.table?.owner || '0'); 
          nextState.table = null; // Clear table for new round
          nextState.passedPlayers = [];
          nextState.logs = [`Bắt đầu vòng mới.`, ...nextState.logs.slice(0, 4)];
      } else {
          while (nextState.passedPlayers.includes(nextIdx.toString())) {
             nextIdx = (nextIdx + 1) % count;
          }
      }

      nextState.turnIndex = nextIdx;
      updateGameState(nextState);
  };

  const toggleSelectCard = (cardId: string) => {
      const currentPlayerId = mode === 'friend' ? uid : '0';
      if (gameState?.players[gameState.turnIndex] !== currentPlayerId) return;
      setSelectedCardIds(prev => 
          prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
      );
  };

  const humanPlay = () => {
      if (!gameState) return;
      const currentPlayerId = mode === 'friend' ? uid : '0';
      const cardsToPlay = gameState.hands[currentPlayerId].filter(c => selectedCardIds.includes(c.id));
      if (cardsToPlay.length === 0) return;
      handlePlayAction(currentPlayerId, cardsToPlay);
  };

  const getSortedHand = () => {
      if (!gameState) return [];
      const currentPlayerId = mode === 'friend' ? uid : '0';
      
      if (!gameState.hands[currentPlayerId]) return [];
      
      let hand = [...gameState.hands[currentPlayerId]];
      if (sortType === 'suit') {
          // Sort by rank first, then suit, or suit first then rank. Let's do suit first (Spades, Clubs, Diamonds, Hearts), then rank.
          // Spades: 0, Clubs: 1, Diamonds: 2, Hearts: 3
          hand.sort((a,b) => {
              const suitOrder = { 'spades': 0, 'clubs': 1, 'diamonds': 2, 'hearts': 3 };
              if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
              return a.rank - b.rank;
          });
      } else {
          // Default: by value
          hand.sort((a,b) => a.value - b.value);
      }
      return hand;
  };

  const toggleSort = () => {
      setSortType(prev => prev === 'value' ? 'suit' : 'value');
  };

  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
        <button onClick={onExit} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Trở lại
        </button>
        <div className="text-center mb-8">
           <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
           <h1 className="text-4xl font-display font-black text-neutral-900 tracking-tight">Tiến Lên {isMienBacMode ? 'Miền Bắc' : 'Miền Nam'}</h1>
           <p className="text-neutral-500 mt-2">Chọn chế độ chơi và luật chơi để bắt đầu</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8 flex justify-center">
            <div className="bg-white p-2 rounded-3xl border border-neutral-200 inline-flex shadow-sm">
                <button 
                   onClick={() => setIsMienBacMode(false)}
                   className={`px-6 py-2.5 rounded-3xl font-bold transition ${!isMienBacMode ? 'bg-orange-500 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}
                >
                    Luật Miền Nam
                </button>
                <button 
                   onClick={() => setIsMienBacMode(true)}
                   className={`px-6 py-2.5 rounded-3xl font-bold transition ${isMienBacMode ? 'bg-orange-500 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}
                >
                    Luật Miền Bắc
                </button>
            </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
           <button onClick={() => setMode('bot')} className="group bg-white p-8 rounded-3xl border-2 border-neutral-100 hover:border-orange-400 hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-neutral-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Play className="w-8 h-8 text-neutral-600 group-hover:text-orange-600" />
               </div>
               <h3 className="text-xl font-bold text-neutral-900 mb-2">Chơi với Máy</h3>
               <p className="text-neutral-500 text-sm">Ván đấu offline với AI thư giãn. Luôn luôn được đánh trước.</p>
           </button>
           
           <button onClick={() => setMode('friend')} className="group bg-white p-8 rounded-3xl border-2 border-neutral-100 hover:border-neutral-400 hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-neutral-100 group-hover:bg-neutral-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <span className="text-2xl">👥</span>
               </div>
               <h3 className="text-xl font-bold text-neutral-900 mb-2">Chơi cùng Bạn Bè</h3>
               <p className="text-neutral-500 text-sm">Tạo phòng và mời bạn bè vào chơi (chế độ mô phỏng).</p>
           </button>
        </div>
      </div>
    );
  }

  if (playerCount === null) {
    return (
      <div className="flex flex-col h-[85vh] bg-neutral-900 rounded-3xl overflow-hidden text-neutral-100 shadow-2xl relative border-4 border-neutral-800 items-center justify-center p-6">
         
         {showInviteModal && (
              <GameInviteModal 
                 user={user}
                 gameName={`Tiến Lên ${isMienBacMode ? 'Miền Bắc' : 'Miền Nam'} - ${pendingCount} Người`}
                 gameType="tienlen"
                 maxPlayers={pendingCount || 4}
                 onJoin={(players) => {
                     setShowInviteModal(false);
                     if (mode === 'friend') {
                         startFriendGame(players);
                     } else {
                         initGame(pendingCount || 4);
                     }
                 }}
                 onCancel={() => { setShowInviteModal(false); setMode(null); pendingCount && setPendingCount(null); }}
              />
         )}

         {!showInviteModal && (
             <>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                 <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-bold text-orange-300 drop-shadow-md mb-8">Tiến Lên</h1>
                    <p className="text-neutral-100 mb-8 text-lg">Chọn số lượng người chơi</p>
                    <div className="flex flex-col gap-4">
                        {[2, 3, 4].map(num => (
                            <button 
                                key={num} 
                                onClick={() => {
                                    if (mode === 'friend') {
                                        setPendingCount(num);
                                        setShowInviteModal(true);
                                    } else {
                                        initGame(num);
                                    }
                                }}
                                className="px-8 py-4 bg-neutral-600 hover:bg-neutral-500 text-white font-bold rounded-3xl shadow-lg border-2 border-neutral-500 transition-all active:scale-95 text-xl"
                            >
                                {num} Người
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setMode(null)} className="mt-8 px-6 py-2 bg-black/20 hover:bg-black/40 text-neutral-100 font-medium rounded-3xl transition-all">
                        Quay Lại
                    </button>
                 </div>
             </>
         )}
      </div>
    );
  }

  if (!gameState) return null;

  const currentPlayerId = mode === 'friend' ? uid : '0';
  const myIndex = gameState.players.indexOf(currentPlayerId);
  const getRelativePlayer = (offset: number) => {
      if (myIndex === -1) return null; // observing?
      return gameState.players[(myIndex + offset) % gameState.players.length];
  };

  const p1 = getRelativePlayer(1);
  const p2 = getRelativePlayer(2);
  const p3 = getRelativePlayer(3);

  // Layout assignment based on player count
  let leftOpponent = null;
  let topOpponent = null;
  let rightOpponent = null;

  if (gameState.players.length === 2) {
      topOpponent = p1;
  } else if (gameState.players.length === 3) {
      leftOpponent = p1;
      topOpponent = p2;
  } else if (gameState.players.length === 4) {
      leftOpponent = p1;
      topOpponent = p2;
      rightOpponent = p3;
  }

  const getOpponentName = (pid: string) => mode === 'friend' ? `Người chơi` : PLAYER_NAMES[parseInt(pid)] || 'Máy';

  return (
    <div className="flex flex-col h-[85vh] bg-neutral-900 rounded-3xl overflow-hidden text-neutral-100 shadow-2xl relative border-4 border-neutral-800">
       
       <div className="p-4 flex items-center justify-between border-b border-neutral-800 shrink-0 bg-neutral-950/80 backdrop-blur-md z-30 relative shadow-md">

        <button onClick={onExit} className="flex items-center gap-2 hover:bg-neutral-800 px-3 py-2 rounded-3xl transition-colors text-sm font-semibold text-neutral-300">
          <ArrowLeft className="w-5 h-5" /> Rời bàn
        </button>
        <div className="font-bold text-base sm:text-lg flex items-center gap-2 text-white">
           <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" /> Tiến Lên {isMienBacMode ? 'Miền Bắc' : 'Miền Nam'}
        </div>
        <div className="px-4 py-1.5 rounded-3xl bg-neutral-800/80 border border-neutral-700/50 shadow-inner font-bold text-xs sm:text-sm">
           {isMienBacMode ? 'Luật MB' : 'Luật MN'}
        </div>
      </div>
      
      {/* Game Table */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-700 via-neutral-800 to-neutral-900 overflow-hidden flex items-center justify-center">
         
         {/* Top Opponent */}
         {topOpponent && gameState.hands[topOpponent] && (
             <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all ${gameState.players[gameState.turnIndex] === topOpponent ? 'scale-110' : 'opacity-80'}`}>
                 <div className="flex gap-[-20px] bg-black/20 p-2 rounded-3xl">
                     {gameState.hands[topOpponent].map((_, i) => (
                         <div key={i} className="w-8 h-12 bg-white rounded-full border border-neutral-300 shadow-sm -ml-4 first:ml-0 overflow-hidden relative" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), repeating-linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}></div>
                     ))}
                 </div>
                 <div className="bg-black/50 px-3 py-1 rounded-3xl text-xs font-bold text-white shadow-lg border border-white/10 flex items-center gap-2">
                     {getOpponentName(topOpponent)} {gameState.passedPlayers.includes(topOpponent) && <span className="text-orange-400 text-[10px]">(Bỏ qua)</span>}
                     {gameState.players[gameState.turnIndex] === topOpponent && <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping absolute -top-1 -right-1" />}
                 </div>
             </div>
         )}

         {/* Left Opponent */}
         {leftOpponent && gameState.hands[leftOpponent] && (
             <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all ${gameState.players[gameState.turnIndex] === leftOpponent ? 'scale-110' : 'opacity-80'}`}>
                 <div className="bg-black/50 px-3 py-1 rounded-3xl text-xs font-bold text-white shadow-lg border border-white/10 flex items-center gap-2 mb-2">
                     {getOpponentName(leftOpponent)} {gameState.passedPlayers.includes(leftOpponent) && <span className="text-orange-400 text-[10px]">(Bỏ qua)</span>}
                 </div>
                 <div className="bg-black/20 p-2 rounded-3xl text-center">
                     <div className="text-xl font-bold text-white">{gameState.hands[leftOpponent].length}</div>
                     <div className="text-[10px] text-white/50 uppercase">Lá bài</div>
                 </div>
             </div>
         )}

         {/* Right Opponent */}
         {rightOpponent && gameState.hands[rightOpponent] && (
             <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all ${gameState.players[gameState.turnIndex] === rightOpponent ? 'scale-110' : 'opacity-80'}`}>
                 <div className="bg-black/50 px-3 py-1 rounded-3xl text-xs font-bold text-white shadow-lg border border-white/10 flex items-center gap-2 mb-2">
                     {getOpponentName(rightOpponent)} {gameState.passedPlayers.includes(rightOpponent) && <span className="text-orange-400 text-[10px]">(Bỏ qua)</span>}
                 </div>
                 <div className="bg-black/20 p-2 rounded-3xl text-center">
                     <div className="text-xl font-bold text-white">{gameState.hands[rightOpponent].length}</div>
                     <div className="text-[10px] text-white/50 uppercase">Lá bài</div>
                 </div>
             </div>
         )}

         {/* Center Table */}
         <div className="w-64 h-64 border-4 border-neutral-600/30 rounded-full flex flex-col items-center justify-center relative shadow-[inset_0_0_50px_rgba(0,0,0,0.3)]">
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-6xl text-neutral-800/10 font-bold rotate-[-15deg]">TIẾN LÊN</div>
             </div>

             <AnimatePresence>
                 {gameState.table && (
                     <motion.div 
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex justify-center relative z-10"
                     >
                         {gameState.table.cards.map((c, i) => (
                             <motion.div 
                                key={c.id} 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1, transition: { delay: i * 0.1 } }}
                                className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-full shadow-xl flex flex-col items-center justify-center font-bold text-2xl -ml-8 first:ml-0 transform ${i % 2 === 0 ? 'rotate-2' : '-rotate-2'} border sm:border-2 border-neutral-200`}
                             >
                                 <span className={SUIT_COLORS[c.suit]}>{RANK_LABELS[c.rank] || c.rank}</span>
                                 <span className={`text-3xl ${SUIT_COLORS[c.suit]}`}>{SUIT_SYMBOLS[c.suit]}</span>
                             </motion.div>
                         ))}
                     </motion.div>
                 )}
                 {!gameState.table && gameState.passedPlayers.length === 0 && gameState.status === 'playing' && (
                     <div className="text-white/40 font-medium tracking-widest uppercase text-sm animate-pulse">Vòng mới bắt đầu</div>
                 )}
             </AnimatePresence>
         </div>

         {/* Human Hand */}
         <div className="absolute bottom-6 left-0 right-0 px-4">
             <div className="flex justify-between items-end max-w-lg mx-auto mb-4">
                 
                 <div className="bg-black/50 sm:bg-transparent p-2 sm:p-0 rounded-3xl max-h-[80px] sm:max-h-[100px] overflow-y-auto text-[10px] sm:text-xs text-white/70 space-y-1 w-[150px] sm:w-[200px]">
                     {gameState.logs.map((L, i) => <div key={i} className="truncate">{L}</div>)}
                 </div>

                 {gameState.status === 'playing' && gameState.players[gameState.turnIndex] === currentPlayerId && (
                     <div className="flex flex-col items-end gap-2">
                         <div className="text-orange-400 font-bold uppercase tracking-wider text-sm animate-pulse flex items-center gap-2">
                             <AlertCircle className="w-4 h-4" /> Tới lượt bạn!
                         </div>
                         <div className="flex gap-2">
                            <button 
                                onClick={toggleSort}
                                className="px-4 py-2 bg-neutral-800 text-white font-bold rounded-3xl shadow-lg border border-neutral-700 hover:bg-neutral-700 transition"
                            >
                                Xếp bài
                            </button>
                            <button 
                                onClick={() => handlePassAction(currentPlayerId)}
                                disabled={!gameState.table}
                                className="px-4 py-2 bg-neutral-800 text-white font-bold rounded-3xl disabled:opacity-50 shadow-lg border border-neutral-700 hover:bg-neutral-700 transition"
                            >
                                Bỏ lượt
                            </button>
                            <button 
                                onClick={humanPlay}
                                disabled={selectedCardIds.length === 0}
                                className="px-6 py-2 bg-neo-bg text-white font-bold rounded-3xl disabled:opacity-50 shadow-lg shadow-orange-500/30 hover:from-orange-400 hover:to-orange-500 transition"
                            >
                                Đánh
                            </button>
                         </div>
                     </div>
                 )}
             </div>

             {errorMsg && (
                 <div className="text-orange-400 font-medium text-center mb-2 animate-bounce bg-black/60 w-fit mx-auto px-4 py-1.5 rounded-3xl">{errorMsg}</div>
             )}

             <div className="flex justify-center -space-x-4 sm:-space-x-2 px-4 max-w-2xl mx-auto items-end h-[120px]">
                 {getSortedHand().map((card, idx) => {
                     const isSelected = selectedCardIds.includes(card.id);
                     return (
                         <motion.div
                            layout
                            initial={isDealing ? { y: 200, opacity: 0 } : false}
                            animate={{ y: isSelected ? -24 : 0, opacity: 1, zIndex: isSelected ? 50 : idx, transition: { delay: isDealing ? idx * 0.05 : 0 } }}
                            key={card.id}
                            onClick={() => toggleSelectCard(card.id)}
                            className={`w-14 h-20 sm:w-20 sm:h-28 bg-white rounded-full sm:rounded-3xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between py-1 sm:py-2 font-bold text-lg sm:text-2xl cursor-pointer transition-colors border-2 ${isSelected ? 'border-orange-400 !shadow-orange-400/20' : 'border-neutral-200 hover:border-orange-200'}`}
                            style={{ zIndex: idx }}
                         >
                             <div className={`w-full text-left pl-1 sm:pl-2 text-sm sm:text-base leading-none ${SUIT_COLORS[card.suit]}`}>{RANK_LABELS[card.rank] || card.rank}</div>
                             <div className={`text-2xl sm:text-4xl ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</div>
                         </motion.div>
                     );
                 })}
             </div>
         </div>

         {/* Game Over Screen */}
         {gameState.status === 'game_over' && (
             <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                 <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                     <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-200">
                         <Trophy className="w-10 h-10 text-orange-500" />
                     </div>
                     <h2 className="text-3xl font-display font-black text-neutral-900 mb-2">
                         {gameState.winner === currentPlayerId ? 'Bạn đã thắng!' : `${mode === 'friend' ? 'Người chơi' : PLAYER_NAMES[parseInt(gameState.winner || '1')]} đã nhất!`}
                     </h2>
                     <p className="text-neutral-500 mb-8 font-medium">Bàn chơi đã kết thúc.</p>
                     
                     <div className="space-y-3">
                         <button onClick={() => {
                             if (mode === 'friend') {
                                 startFriendGame(gameState.players);
                             } else {
                                 initGame(playerCount!);
                             }
                         }} className="w-full py-3.5 bg-neutral-900 text-white rounded-3xl font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-2">
                             <RefreshCw className="w-5 h-5" /> Chơi Lại Khoá Mới
                         </button>
                         <button onClick={onExit} className="w-full py-3.5 bg-neutral-100 text-neutral-700 rounded-3xl font-bold hover:bg-neutral-200 transition">
                             Quay Về Sảnh
                         </button>
                     </div>
                 </motion.div>
             </div>
         )}
      </div>
    </div>
  );
}

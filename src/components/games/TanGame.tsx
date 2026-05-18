import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RefreshCw, Trophy, AlertCircle, Hand, Info, X, Users as UsersIcon } from 'lucide-react';
import { Card, createDeck, shuffleDeck, TanTable, canDefend, getBotDefense, getBotAttacks, Suit } from './TanLogic';
import GameInviteModal from './GameInviteModal';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';

interface Props {
  user: any;
  onExit: () => void;
}

interface GameState {
  status: 'playing' | 'ended';
  players: string[]; // '0' is human, '1' is bot
  hands: Record<string, Card[]>;
  deck: Card[];
  trumpCard: Card;
  trumpSuit: Suit;
  turnIndex: number; // Who is attacking
  table: TanTable;
  winner: string | null;
  message: string;
}

export default function TanGame({ user, onExit }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [targetAttackIndex, setTargetAttackIndex] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [mode, setMode] = useState<'bot' | 'friend' | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const uid = user?.uid || 'guest';

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    if (mode === 'friend' && gameId) {
      setDoc(doc(db, 'couple_data', gameId), {
        type: 'tan',
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
        if (data.type === 'tan' && data.state) {
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
    const newGameId = `tan_${allPlayers.join('_')}`;
    setGameId(newGameId);

    const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
    if (matchDoc.exists() && matchDoc.data().type === 'tan' && matchDoc.data().state) {
        setGameState(matchDoc.data().state);
    } else {
        if (allPlayers[0] === uid) {
            const deck = shuffleDeck(createDeck());
            const initialHands: Record<string, Card[]> = {};
            for (let i = 0; i < allPlayers.length; i++) {
                initialHands[allPlayers[i]] = deck.splice(0, 8);
            }
            
            const trumpCard = deck.splice(0, 1)[0];
            deck.push(trumpCard);
            
            for (const pid of allPlayers) {
                initialHands[pid] = sortHand(initialHands[pid], trumpCard.suit);
            }
            
            const initialState: GameState = {
              status: 'playing',
              players: allPlayers,
              hands: initialHands,
              deck,
              trumpCard,
              trumpSuit: trumpCard.suit,
              turnIndex: 0,
              table: { attacks: [], defenses: [] },
              winner: null,
              message: 'Lượt tấn đầu tiên.'
            };
            setGameState(initialState);
            await setDoc(doc(db, 'couple_data', newGameId), {
                type: 'tan',
                state: initialState,
                players: allPlayers,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }
    setTimeout(() => setIsDealing(false), 1500);
  };

  const sortHand = (hand: Card[], trumpSuit: Suit) => {

    return [...hand].sort((a, b) => {
      const aTr = a.suit === trumpSuit ? 1 : 0;
      const bTr = b.suit === trumpSuit ? 1 : 0;
      if (aTr !== bTr) return aTr - bTr;
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.value - b.value;
    });
  };

  const [showRules, setShowRules] = useState(false);

  const drawCards = (hands: Record<string, Card[]>, deck: Card[], drawOrder: string[], trumpSuit: Suit) => {
    for (const pid of drawOrder) {
      while (hands[pid].length < 8 && deck.length > 0) {
        hands[pid].push(deck.shift()!);
      }
    }
    for (const pid of drawOrder) {
      hands[pid] = sortHand(hands[pid], trumpSuit);
    }
  };

  const initGame = (count: number) => {
    setIsDealing(true);
    setPlayerCount(count);
    const deck = shuffleDeck(createDeck());
    const initialHands: Record<string, Card[]> = {};
    const pids = [];
    
    for (let i = 0; i < count; i++) {
        pids.push(i.toString());
        initialHands[i.toString()] = deck.splice(0, 8);
    }
    
    const trumpCard = deck.splice(0, 1)[0];
    deck.push(trumpCard); // Put it at the bottom
    
    for (const pid of pids) {
        initialHands[pid] = sortHand(initialHands[pid], trumpCard.suit);
    }
    
    setGameState({
      status: 'playing',
      players: pids,
      hands: initialHands,
      deck,
      trumpCard,
      trumpSuit: trumpCard.suit,
      turnIndex: 0, // human attacks first
      table: { attacks: [], defenses: [] },
      winner: null,
      message: 'Lượt của bạn. Chọn bài để tấn.'
    });
    setSelectedCards([]);
    setTargetAttackIndex(null);
    setTimeout(() => setIsDealing(false), 1500);
  };

  useEffect(() => {
    // Game is initialized when user selects player count instead
  }, []);

  const endTurn = (defenderPickedUp: boolean) => {
    if (!gameState) return;
    const currentState = { ...gameState };
    const attackerIdx = currentState.turnIndex;
    const count = currentState.players.length;
    const defenderIdx = (currentState.turnIndex + 1) % count;
    const attackerId = currentState.players[attackerIdx];
    const defenderId = currentState.players[defenderIdx];

    if (defenderPickedUp) {
      // Defender picks up table
      const cardsToPickUp = [...currentState.table.attacks, ...currentState.table.defenses];
      currentState.hands[defenderId].push(...cardsToPickUp);
      currentState.hands[defenderId] = sortHand(currentState.hands[defenderId], currentState.trumpSuit);
      currentState.message = `${defenderId === '0' ? 'Bạn' : `Máy ${defenderId}`} đã bốc bài. Chuyển lượt.`;
      // Turn goes to the next person after the defender
      currentState.turnIndex = (defenderIdx + 1) % count;
    } else {
      currentState.message = `${defenderId === '0' ? 'Bạn' : `Máy ${defenderId}`} đỡ thành công.`;
      // Turn goes to the defender
      currentState.turnIndex = defenderIdx;
    }

    const drawOrder = [];
    for(let i = 0; i < count; i++) {
        drawOrder.push(currentState.players[(attackerIdx + i) % count]);
    }
    drawCards(currentState.hands, currentState.deck, drawOrder, currentState.trumpSuit);
    currentState.table = { attacks: [], defenses: [] };
    
    // Check win condition
    for (const pid of currentState.players) {
        if (currentState.hands[pid].length === 0 && currentState.deck.length === 0) {
            currentState.status = 'ended';
            currentState.winner = pid;
            currentState.message = pid === '0' ? 'Bạn đã thắng!' : `Máy ${pid} đã thắng!`;
            break;
        }
    }
    
    setGameState(currentState);
    updateGameState(currentState);
    setSelectedCards([]);
    setTargetAttackIndex(null);
  };

  // Bot Logic
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || mode === 'friend') return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    const isHumanTurn = currentPlayer === '0';
    
    // In multi-player, the defender is the next player clockwise from attacker.
    // If the attacker is a bot, it attacks.
    // Wait, what if the attacker is human, and defender is bot?
    // It's just: is the current player (attacker) a bot? If yes, they attack.
    // Is the defender a bot? Wait! The turnIndex points to the ATTACKER.
    // What if the table has attacks from the attacker, and the defender needs to defend?
    // The defender is: (turnIndex + 1) % players.length
    // This effect runs whenever gameState changes.
    // Let's decide who needs to act:
    
    const count = gameState.players.length;
    const defenderId = gameState.players[(gameState.turnIndex + 1) % count];
    
    const defenderNeedsToAct = gameState.table.attacks.length > gameState.table.defenses.length;
    
    // If there are attacks that need defense, the Defender must act.
    if (defenderNeedsToAct) {
        if (defenderId !== '0') { // Bot needs to defend
            const timeout = setTimeout(() => {
                const undefendedIndex = gameState.table.defenses.length;
                const attackCard = gameState.table.attacks[undefendedIndex];
                const botHand = gameState.hands[defenderId];
                
                const defense = getBotDefense(attackCard, botHand, gameState.trumpSuit);
                
                if (defense) {
                    const nextState = { ...gameState };
                    nextState.hands[defenderId] = nextState.hands[defenderId].filter(c => c.id !== defense.id);
                    nextState.table.defenses.push(defense);
                    nextState.message = `Máy ${defenderId} đỡ ${defense.label}`;
                    setGameState(nextState);
                } else {
                    // Bot picks up
                    endTurn(true);
                }
            }, 1000);
            return () => clearTimeout(timeout);
        }
    } else {
        // No pending defenses. It's the attacker's turn to act (or pass).
        if (currentPlayer !== '0') { // Bot is attacker
            const timeout = setTimeout(() => {
                const botHand = gameState.hands[currentPlayer];
                const tableRanks = [...gameState.table.attacks, ...gameState.table.defenses].map(c => c.rank);
                const maxCanAttack = Math.min(gameState.hands[defenderId].length, 8 - gameState.table.attacks.length);
                
                if (gameState.table.attacks.length > 0 && maxCanAttack <= 0) {
                    // Must pass
                    endTurn(false);
                    return;
                }

                // Sort bot hand considering trump for attacks
                const handForAttack = [...botHand].sort((a, b) => {
                    const aTr = a.suit === gameState.trumpSuit ? 1 : 0;
                    const bTr = b.suit === gameState.trumpSuit ? 1 : 0;
                    if (aTr !== bTr) return aTr - bTr;
                    return a.value - b.value;
                });

                let attacks = getBotAttacks(handForAttack, tableRanks, maxCanAttack);

                if (attacks.length > 0) {
                    const nextState = { ...gameState };
                    nextState.hands[currentPlayer] = nextState.hands[currentPlayer].filter(c => !attacks.includes(c));
                    nextState.table.attacks.push(...attacks);
                    nextState.message = `Máy ${currentPlayer} tấn ${attacks.map(c => c.label).join(', ')}`;
                    setGameState(nextState);
                } else {
                    if (gameState.table.attacks.length > 0) {
                        endTurn(false); // Bot passes attack
                    } else if (botHand.length > 0) {
                        // Have to play something if it's the first attack!
                        // This happens if getBotAttacks returns empty but we MUST attack.
                        const singleAttack = [handForAttack[0]];
                        const nextState = { ...gameState };
                        nextState.hands[currentPlayer] = nextState.hands[currentPlayer].filter(c => c.id !== singleAttack[0].id);
                        nextState.table.attacks.push(...singleAttack);
                        nextState.message = `Máy ${currentPlayer} tấn ${singleAttack.map(c => c.label).join(', ')}`;
                        setGameState(nextState);
                    }
                }
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }
  }, [gameState]);

  const handleCardClick = (card: Card) => {
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const attack = () => {
    const currentPlayerId = mode === 'friend' ? uid : '0';
    if (!gameState || gameState.players[gameState.turnIndex] !== currentPlayerId || selectedCards.length === 0) return;
    
    // In multi-player, the defender is the next player from attacker.
    const count = gameState.players.length;
    const defenderId = gameState.players[(gameState.turnIndex + 1) % count];
    
    // Check if valid attack
    const maxCanAttack = Math.min(gameState.hands[defenderId].length, 8 - gameState.table.attacks.length);
    if (selectedCards.length > maxCanAttack) {
        setErrorMsg('Không thể tấn nhiều hơn số bài trên tay đối thủ hoặc vượt quá 8 lá trên bàn.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    const firstRank = selectedCards[0].rank;
    if (!selectedCards.every(c => c.rank === firstRank)) {
        setErrorMsg('Các lá bài tấn phải cùng số.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    const tableRanks = [...gameState.table.attacks, ...gameState.table.defenses].map(c => c.rank);
    if (gameState.table.attacks.length > 0 && !tableRanks.includes(firstRank)) {
        setErrorMsg('Bài tấn tiếp theo phải có số khớp với bài đã có trên bàn.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    const nextState = { ...gameState };
    nextState.hands[currentPlayerId] = nextState.hands[currentPlayerId].filter(c => !selectedCards.some(s => s.id === c.id));
    nextState.table.attacks.push(...selectedCards);
    nextState.message = `Bạn tấn ${selectedCards.map(c => c.label).join(', ')}`;
    updateGameState(nextState);
    setSelectedCards([]);
  };

  const passAttack = () => {
    const currentPlayerId = mode === 'friend' ? uid : '0';
    if (!gameState || gameState.players[gameState.turnIndex] !== currentPlayerId || gameState.table.attacks.length === 0) return;
    if (gameState.table.attacks.length > gameState.table.defenses.length) return; // Cant pass if defender hasnt defended
    endTurn(false);
  };

  const defend = () => {
    if (!gameState || selectedCards.length !== 1 || targetAttackIndex === null) return;
    
    // Check if human is really the defender
    const currentPlayerId = mode === 'friend' ? uid : '0';
    const count = gameState.players.length;
    const defenderId = gameState.players[(gameState.turnIndex + 1) % count];
    if (defenderId !== currentPlayerId) return;
    
    const attackCard = gameState.table.attacks[targetAttackIndex];
    if (gameState.table.defenses[targetAttackIndex]) {
        setErrorMsg('Lá bài này đã được đỡ.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    const defenseCard = selectedCards[0];
    if (!canDefend(attackCard, defenseCard, gameState.trumpSuit)) {
        setErrorMsg('Lá bài này không thể đè lá bài tấn.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    const nextState = { ...gameState };
    nextState.hands[currentPlayerId] = nextState.hands[currentPlayerId].filter(c => c.id !== defenseCard.id);
    
    if (targetAttackIndex !== nextState.table.defenses.length) {
        setErrorMsg('Vui lòng đỡ lần lượt từ trái qua phải.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
    }

    nextState.table.defenses.push(defenseCard);
    nextState.message = `Bạn đỡ ${defenseCard.label}`;
    updateGameState(nextState);
    setSelectedCards([]);
    setTargetAttackIndex(null);
  };

  const pickup = () => {
    if (!gameState || gameState.table.attacks.length === 0) return;
    const count = gameState.players.length;
    const currentPlayerId = mode === 'friend' ? uid : '0';
    const defenderId = gameState.players[(gameState.turnIndex + 1) % count];
    if (defenderId !== currentPlayerId) return;
    endTurn(true);
  };

  const getSuitColor = (suit: Suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-orange-500' : 'text-slate-800';
  };

  const getSuitSymbol = (suit: Suit) => {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const renderCard = (card: Card, isSelected: boolean, onClick?: () => void) => (
    <motion.button
      key={card.id}
      whileHover={{ y: -10 }}
      animate={{ y: isSelected ? -20 : 0 }}
      onClick={onClick}
      className={`relative relative w-16 h-24 sm:w-20 sm:h-32 bg-white rounded-full shadow-lg border-2 flex flex-col justify-between p-2 
        ${isSelected ? 'border-orange-400 shadow-orange-200/50' : 'border-slate-200'}
        ${getSuitColor(card.suit)}`}
    >
      <div className="text-left leading-none">
        <div className="text-lg sm:text-xl font-bold">{card.label}</div>
        <div className="text-lg sm:text-2xl">{getSuitSymbol(card.suit)}</div>
      </div>
      <div className="rotate-180 text-left leading-none">
        <div className="text-lg sm:text-xl font-bold">{card.label}</div>
        <div className="text-lg sm:text-2xl">{getSuitSymbol(card.suit)}</div>
      </div>
    </motion.button>
  );

  const renderDeck = () => {
    if (!gameState) return null;
    return (
      <div className="relative">
        {gameState.deck.length > 0 && (
          <div className="relative w-16 h-24 sm:w-20 sm:h-32">
             <div className="absolute top-0 left-0 hover:z-10 group">
                <div className={`w-16 h-24 sm:w-20 sm:h-32 bg-white rounded-full shadow-lg border-2 border-slate-200 flex items-center justify-center rotate-90 translate-y-6 flex-col ${getSuitColor(gameState.trumpCard.suit)}`}>
                   <div className="text-xl font-bold">{gameState.trumpCard.label}</div>
                   <div className="text-2xl">{getSuitSymbol(gameState.trumpCard.suit)}</div>
                </div>
             </div>
             {gameState.deck.length > 1 && (
               <div className="absolute top-0 left-0 absolute top-0 left-0 w-16 h-24 sm:w-20 sm:h-32 bg-neutral-200 rounded-full shadow-md border-2 border-neutral-300 z-10 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-300 to-neutral-500 text-white font-bold opacity-90">
                 {gameState.deck.length}
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  if (!mode) {
    return (
      <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
        <button onClick={onExit} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Trở lại
        </button>
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Trophy className="w-8 h-8 text-neutral-500" />
           </div>
           <h1 className="text-4xl font-display font-black text-neutral-900 tracking-tight">Bài Tấn</h1>
           <p className="text-neutral-500 mt-2">Chọn chế độ chơi để bắt đầu</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
           <button onClick={() => setMode('bot')} className="group bg-white p-8 rounded-3xl border-2 border-neutral-100 hover:border-neutral-400 hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-neutral-100 group-hover:bg-neutral-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <Play className="w-8 h-8 text-neutral-600 group-hover:text-neutral-600" />
               </div>
               <h3 className="text-xl font-bold text-neutral-900 mb-2">Chơi với Máy</h3>
               <p className="text-neutral-500 text-sm">Với tùy chọn lên đến 4 người chơi giả lập.</p>
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
      <div className="flex flex-col h-[85vh] bg-neutral-800 rounded-3xl overflow-hidden text-neutral-100 shadow-2xl relative border-4 border-neutral-700 items-center justify-center p-6">
         
         {showInviteModal && (
              <GameInviteModal 
                 user={user}
                 gameName={`Bài Tấn - ${pendingCount} Người`}
                 gameType="tan"
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
                    <h1 className="text-4xl font-bold text-orange-300 drop-shadow-md mb-8">Bài Tấn</h1>
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
  const isAttacking = gameState.players[gameState.turnIndex] === currentPlayerId;
  const isDefending = gameState.players[(gameState.turnIndex + 1) % gameState.players.length] === currentPlayerId;

  // Render opponents by position
  const myIndex = gameState.players.indexOf(currentPlayerId);
  const getRelativePlayer = (offset: number) => {
      if (myIndex === -1) return null; // observer
      return gameState.players[(myIndex + offset) % gameState.players.length];
  };

  const p1 = getRelativePlayer(1);
  const p2 = getRelativePlayer(2);
  const p3 = getRelativePlayer(3);
  let opponents = [];
  if (gameState.players.length === 2 && p1) opponents = [p1];
  else if (gameState.players.length === 3 && p1 && p2) opponents = [p1, p2];
  else if (gameState.players.length === 4 && p1 && p2 && p3) opponents = [p1, p2, p3];

  return (
    <div className="flex flex-col h-[85vh] bg-neutral-800 rounded-3xl overflow-hidden text-neutral-100 shadow-2xl relative border-4 border-neutral-700">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
       
       <div className="flex justify-between items-center p-4 bg-black/20 z-10">
          <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-3xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold tracking-tight text-orange-300 drop-shadow-md">Giao Hữu Tấn</h2>
             {gameState.trumpSuit && (
                <div className={`px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-orange-300/50 flex items-center gap-1.5 font-bold ${getSuitColor(gameState.trumpSuit)}`}>
                   Chất Chủ: <span className="text-xl leading-none">{getSuitSymbol(gameState.trumpSuit)}</span>
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowRules(true)} className="p-2 hover:bg-white/10 rounded-3xl transition-colors text-neutral-300">
              <Info className="w-6 h-6" />
            </button>
            <button onClick={() => initGame(playerCount!)} className="p-2 hover:bg-white/10 rounded-3xl transition-colors text-orange-300">
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-hidden flex flex-col relative z-10 p-4">
          
          {/* Bot Areas */}
          <div className="flex justify-between h-20 mb-4 px-4 w-full relative">
             {opponents.map((oppId, idx, arr) => {
                 const alignClass = arr.length === 1 ? 'mx-auto' : idx === 0 ? 'ml-0' : idx === arr.length - 1 ? 'mr-0' : 'mx-auto';
                 const oppName = mode === 'friend' ? `Người chơi ${idx+1}` : `Máy ${oppId}`;
                 return (
                    <div key={`opp-${oppId}`} className={`flex flex-col items-center relative ${alignClass}`}>
                       <div className="flex -space-x-10 sm:-space-x-12">
                         {gameState.hands[oppId].map((c, i) => (
                            <div key={`opp-${oppId}-${i}`} className="w-12 h-16 sm:w-16 sm:h-24 bg-neutral-200 rounded-full shadow-md border border-neutral-300 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-300 to-neutral-500">
                            </div>
                         ))}
                       </div>
                       <div className="absolute -bottom-3 bg-black/40 px-3 py-1 rounded-3xl text-xs font-medium whitespace-nowrap">
                         {oppName}: {gameState.hands[oppId].length} lá
                       </div>
                       {gameState.players[gameState.turnIndex] === oppId && (
                          <div className="absolute -top-3 right-0 bg-orange-500 text-xs px-2 py-0.5 rounded shadow">Tấn</div>
                       )}
                       {gameState.players[(gameState.turnIndex + 1) % gameState.players.length] === oppId && (
                          <div className="absolute -top-3 right-0 bg-neutral-500 text-xs px-2 py-0.5 rounded shadow text-white">Đỡ</div>
                       )}
                    </div>
                 );
             })}
          </div>

          {/* Table Area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-4 relative">
             <div className="absolute left-8 top-1/2 -translate-y-1/2">
               {renderDeck()}
             </div>

             <div className="text-center bg-black/30 px-6 py-2 rounded-3xl font-medium text-orange-200 border-b-2 border-orange-500/50 min-w-[200px] mb-4">
               {gameState.message}
             </div>

             {/* Attacks & Defenses */}
             <div className="flex flex-wrap justify-center gap-6 items-center">
                 <AnimatePresence>
                    {gameState.table.attacks.map((attackCard, idx) => {
                       const defenseCard = gameState.table.defenses[idx];
                       return (
                         <motion.div 
                           initial={{ scale: 0, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           key={attackCard.id} 
                           className="relative"
                           onClick={() => setTargetAttackIndex(idx)}
                         >
                            <div className={`${targetAttackIndex === idx ? 'ring-4 ring-orange-400 rounded-3xl' : ''}`}>
                               {renderCard(attackCard, false)}
                            </div>
                            {defenseCard && (
                               <motion.div 
                                 initial={{ y: -50, opacity: 0 }}
                                 animate={{ y: 20, rotate: 10, opacity: 1 }}
                                 className="absolute top-0 left-0 z-10"
                               >
                                 {renderCard(defenseCard, false)}
                               </motion.div>
                            )}
                         </motion.div>
                       );
                    })}
                 </AnimatePresence>
             </div>
          </div>

          <div className="h-6 flex items-center justify-center mb-2">
             {errorMsg && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-orange-400 text-sm font-bold flex items-center gap-2 bg-orange-900/50 px-3 py-1 rounded-3xl">
                     <AlertCircle className="w-4 h-4" /> {errorMsg}
                 </motion.div>
             )}
          </div>

          {/* Player Hand Area */}
          <div className="h-32 sm:h-40 relative">
             {isAttacking && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-orange-500 text-xs px-2 py-0.5 rounded shadow text-orange-950 font-bold z-20">Lượt Tấn</div>
             )}
             {isDefending && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-neutral-500 text-xs px-2 py-0.5 rounded shadow text-white font-bold z-20">Lượt Đỡ</div>
             )}
             <div className="absolute inset-x-0 bottom-4 flex justify-center w-full">
                 <div className="flex -space-x-8 sm:-space-x-6">
                    <AnimatePresence>
                       {gameState.hands[currentPlayerId] && gameState.hands[currentPlayerId].map(card => (
                         <motion.div 
                           key={card.id}
                           initial={{ y: 50, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ y: -50, opacity: 0, scale: 0 }}
                         >
                           {renderCard(card, selectedCards.some(c => c.id === card.id), () => handleCardClick(card))}
                         </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-4 pb-4">
              {isAttacking ? (
                  <>
                     <button 
                       onClick={attack}
                       disabled={selectedCards.length === 0}
                       className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-orange-950 font-bold rounded-3xl disabled:opacity-50 transition-colors shadow-lg shadow-orange-500/20"
                     >
                        Tấn
                     </button>
                     {gameState.table.attacks.length > 0 && gameState.table.attacks.length === gameState.table.defenses.length && (
                         <button 
                           onClick={passAttack}
                           className="px-6 py-3 bg-black/30 hover:bg-black/50 text-white font-bold rounded-3xl transition-colors"
                         >
                            Cho qua
                         </button>
                     )}
                  </>
              ) : (
                  <>
                     <button 
                       onClick={() => {
                          if (targetAttackIndex === null) {
                             if (gameState.table.defenses.length < gameState.table.attacks.length) {
                                setTargetAttackIndex(gameState.table.defenses.length);
                                setTimeout(defend, 0);
                             } else {
                                setErrorMsg('Vui lòng chọn lá bài tấn (nhấn vào lá bài trên bàn) để đỡ.');
                                setTimeout(() => setErrorMsg(''), 3000);
                             }
                          } else {
                             defend();
                          }
                       }}
                       disabled={selectedCards.length !== 1}
                       className="px-6 py-3 bg-neutral-500 hover:bg-neutral-400 text-white font-bold rounded-3xl disabled:opacity-50 transition-colors shadow-lg shadow-neutral-500/20 flex items-center gap-2"
                     >
                        <Hand className="w-5 h-5"/> Đỡ
                     </button>
                     <button 
                       onClick={pickup}
                       className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-3xl transition-colors shadow-lg shadow-orange-500/20"
                     >
                        Bốc bài
                     </button>
                  </>
              )}
          </div>
       </div>

       {gameState.status === 'ended' && (
         <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${gameState.winner === '0' ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-500'}`}>
                    <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    {gameState.winner === currentPlayerId ? 'Bạn Thắng!' : (mode === 'friend' ? 'Người Khác Thắng!' : 'Máy Thắng!')}
                </h3>
                <p className="text-neutral-500 mb-8">{gameState.winner === currentPlayerId ? 'Tuyệt vời, bạn đã đánh bại đối thủ!' : 'Bạn đã hết bài sau, chúc may mắn lần sau.'}</p>
                <button
                   onClick={() => {
                       if (mode === 'friend') {
                           startFriendGame(gameState.players);
                       } else {
                           initGame(playerCount!);
                       }
                   }}
                   className="w-full bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-4 rounded-3xl transition-colors"
                >
                   Chơi lại
                </button>
            </motion.div>
         </div>
       )}

       <AnimatePresence>
         {showRules && (
           <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
             >
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative">
                 <h2 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
                   <Info className="w-6 h-6 text-neutral-500" /> Hướng Dẫn Chơi Tấn
                 </h2>
                 <button onClick={() => setShowRules(false)} className="p-2 bg-white rounded-3xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shadow-sm">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-6 sm:p-8 overflow-y-auto text-slate-600 space-y-6">
                 <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">1. Mục Tiêu Trò Chơi</h3>
                   <p>Người chơi nào đánh hết bài trên tay trước (khi nọc đã hết) sẽ là người chiến thắng.</p>
                 </div>
                 
                 <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">2. Chất Chủ (Trump)</h3>
                   <p>Vào đầu ván, một lá bài được lật từ nọc lên bốc làm <b>Chất Chủ</b>. Bất kỳ lá bài nào mang <b>Chất Chủ</b> đều có thể đè (đỡ) các lá bài khác không phải Chất Chủ, bất kể số là bao nhiêu.</p>
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">3. Tấn (Tấn công)</h3>
                   <ul className="list-disc pl-5 space-y-1">
                     <li>Đến lượt đi, người Tấn chọn 1 hoặc nhiều lá bài (phải <b>cùng số</b>, ví dụ: đôi 6, ba 9) để đánh ra bàn.</li>
                     <li>Lưu ý: Không được đánh ra số quân bài nhiều hơn số quân bài mà đối phương đang cầm trên tay (hoặc không quá 8 lá).</li>
                     <li>Các lần Tấn tiếp theo trong cùng vòng phải <b>có số khớp với bất kỳ lá bài nào</b> (kể cả bài tấn và bài đỡ) đang có trên bàn.</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">4. Đỡ (Phòng thủ)</h3>
                   <ul className="list-disc pl-5 space-y-1">
                     <li>Mỗi lá bài Tấn tương ứng cần 1 lá bài Đỡ. Bạn phải đỡ lần lượt từng lá tấn.</li>
                     <li>Để đỡ 1 lá bài, bạn cần dùng lá bài <b>Cùng Chất và có Số Lớn Hơn</b>.</li>
                     <li>Hoặc dùng một lá bài mang <b>Chất Chủ</b> để đỡ lá bài khác chất. Nếu lá Tấn đã là Chất Chủ, bạn bắt buộc phải đỡ bằng Chất Chủ Lớn Hơn.</li>
                     <li>Nếu đỡ thành công toàn bộ, bài trên bàn được bỏ đi, người đỡ được quyền Tấn ở vòng kế tiếp.</li>
                     <li>Nếu không thể đỡ (hoặc không muốn đỡ), chọn <b>Bốc bài</b> để gom toàn bộ bài trên bàn về tay. Quyền Tấn lúc này lặp lại thuộc về người tấn.</li>
                   </ul>
                 </div>
               </div>
               
               <div className="p-6 bg-slate-50 border-t border-slate-100 mt-auto">
                 <button onClick={() => setShowRules(false)} className="w-full py-3 bg-neutral-500 hover:bg-neutral-600 text-white font-bold rounded-3xl transition-all shadow-md active:scale-95">
                   Đã Rõ
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}

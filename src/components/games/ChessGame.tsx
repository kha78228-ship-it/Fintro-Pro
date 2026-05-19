import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'motion/react';
import { Crown, User, Brain, ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, collection, query, getDocs, getDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import GameInviteModal from './GameInviteModal';

interface ChessGameProps {
  user: any;
  onExit?: () => void;
}

type GameMode = 'ai' | 'friend' | null;
type AIDifficulty = 'easy' | 'medium' | 'hard';

export default function ChessGame({ user, onExit }: ChessGameProps) {
  const savedStateStr = localStorage.getItem('__couple_chess_state');
  const savedState = savedStateStr ? JSON.parse(savedStateStr) : null;

  const [game, setGame] = useState(() => {
    if (savedState?.mode === 'ai' && savedState?.fen) {
      const newGame = new Chess();
      newGame.load(savedState.fen);
      return newGame;
    }
    return new Chess();
  });
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(() => savedState?.boardOrientation || 'white');
  const [mode, setMode] = useState<GameMode>(() => savedState?.mode === 'ai' ? savedState.mode : null);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(() => savedState?.difficulty || 'easy');
  const [winner, setWinner] = useState<string | null>(() => savedState?.winner || null);
  const [scores, setScores] = useState(() => savedState?.scores || { you: 0, opponent: 0 });

  const [gameId, setGameId] = useState<string | null>(null);
  const [isWaitOpponent, setIsWaitOpponent] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [activeGames, setActiveGames] = useState<Record<string, any>>({});
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [isThinking, setIsThinking] = useState(false);
  
  const [aiColor, setAiColor] = useState<'white' | 'black'>('white');
  const [isCoachingMode, setIsCoachingMode] = useState(false);
  const [aiCoachMessage, setAiCoachMessage] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Load from local storage for AI mode
  useEffect(() => {
    // Initialized from state directly above
  }, []);

  // Save to local storage for AI mode
  useEffect(() => {
    if (mode === 'ai') {
      localStorage.setItem('__couple_chess_state', JSON.stringify({
        fen: game.fen(),
        mode,
        difficulty,
        boardOrientation,
        scores,
        winner
      }));
    } else if (mode === null) {
       localStorage.removeItem('__couple_chess_state');
    }
  }, [game.fen(), mode, difficulty, boardOrientation, scores, winner]);

  useEffect(() => {
    if (winner && winner !== 'draw' && mode === 'ai') {
      // Avoid incrementing on load by checking if the game state matches the win condition newly
      // Actually, since winner is restored from local storage, this might run again on load.
      // We will handle score increments inside handleMove instead to avoid duplicate increments.
    }
  }, [winner, mode]);

  const handleAskAICoach = async () => {
    setIsCoachingMode(true);
    setAiCoachMessage(null);
    try {
      const { generateContent } = await import('../../lib/gemini');
      const prompt = `Bạn là hệ thống Gemma 4 Coach - Vua Cờ Vua ảo. Hãy phân tích sâu tình thế hiện tại dựa trên mã FEN: ${game.fen()} . Lượt tiếp theo là của ${game.turn() === 'w' ? 'Trắng' : 'Đen'}. Hãy đưa ra đánh giá chiến thuật cực chuẩn: lợi thế đang nghiêng về ai? Nên tập trung phòng thủ nhánh nào hay tấn công vào đâu? (Trả về phân tích ngắn gọn, súc tích nhưng sắc bén, hướng dẫn như một đại kiện tướng).`;
      
      const response = await generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response.text) {
        setAiCoachMessage(response.text);
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = e instanceof Error ? e.message : 'Hãy thử lại';
      if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("not find API key") || errMsg.includes("API key") || errMsg.includes("Khóa API") || errMsg.includes("API_KEY")) {
         errMsg = "Khóa API không hợp lệ. Vui lòng vào Cài đặt (Settings) -> Secrets để nhập hoặc đổi khóa GEMINI_API_KEY. Sau đó Tải lại trang (F5).";
      } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
         errMsg = "Hệ thống đang quá tải hoặc hết hạn mức. Vui lòng thêm/đổi khóa GEMINI_API_KEY trong Settings -> Secrets.";
      }
      setAiCoachMessage(`Oops! Lỗi AI: ${errMsg}`);
    } finally {
      setIsCoachingMode(false);
    }
  };

  // Load friends and their games
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
        const newGameId = `chess_${[user.uid, f.friendId].sort().join('_')}`;
        const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
        if (matchDoc.exists()) {
          gamesStatus[f.friendId] = matchDoc.data();
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
        if (data.white && data.black) {
          setBoardOrientation(data.white === user.uid ? 'white' : 'black');
        }
        if (data.fen !== game.fen()) {
          const newGame = new Chess();
          try { newGame.load(data.fen); } catch(e) {}
          setGame(newGame);
          
          if (data.fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            setWinner(null);
          } else {
            checkGameOver(newGame);
          }
        }
      }
    });
    return () => unsub();
  }, [gameId, mode, user.uid, game]);

  const startAIGame = (diff: AIDifficulty, color: 'white' | 'black') => {
    setMode('ai');
    setDifficulty(diff);
    setBoardOrientation(color);
    const newGame = new Chess();
    setGame(newGame);
    setWinner(null);
    if (color === 'black') {
      setTimeout(() => makeAIMove(newGame, diff), 300);
    }
  };

  const startFriendGame = async (opponentUid: string) => {
    setSelectedFriend({ friendId: opponentUid, displayName: 'Đối thủ' });
    setMode('friend');
    const newGameId = `chess_${[user.uid, opponentUid].sort().join('_')}`;
    setGameId(newGameId);
    setWinner(null);

    const matchDoc = await getDoc(doc(db, 'couple_data', newGameId));
    
    if (matchDoc.exists()) {
      const data = matchDoc.data();
      const loadedGame = new Chess();
      if (data.fen) {
        try { loadedGame.load(data.fen); } catch(e) {}
      }
      setGame(loadedGame);
      setBoardOrientation(data.white === user.uid ? 'white' : 'black');
      checkGameOver(loadedGame);
    } else {
      const newGame = new Chess();
      setGame(newGame);
      setBoardOrientation('white');
      await setDoc(doc(db, 'couple_data', newGameId), {
        type: 'chess',
        fen: newGame.fen(),
        players: [user.uid, opponentUid],
        white: user.uid,
        black: opponentUid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  const restartFriendGame = async () => {
    if (!gameId || !selectedFriend) return;
    const newGame = new Chess();
    setGame(newGame);
    setWinner(null);
    // Swap colors
    const newWhite = boardOrientation === 'white' ? selectedFriend.friendId : user.uid;
    const newBlack = boardOrientation === 'white' ? user.uid : selectedFriend.friendId;
    setBoardOrientation(newWhite === user.uid ? 'white' : 'black');
    
    await setDoc(doc(db, 'couple_data', gameId), {
      fen: newGame.fen(),
      white: newWhite,
      black: newBlack,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const checkGameOver = (cg: Chess, updateScore: boolean = false) => {
    if (cg.isCheckmate()) {
      const winString = cg.turn() === 'w' ? 'black' : 'white';
      setWinner(winString);
      if (updateScore && mode === 'ai') {
        if (winString === boardOrientation) {
          setScores(s => ({ ...s, you: s.you + 1 }));
        } else {
          setScores(s => ({ ...s, opponent: s.opponent + 1 }));
        }
      }
    } else if (cg.isDraw() || cg.isStalemate() || cg.isThreefoldRepetition()) {
      setWinner('draw');
    }
  };

  const [moveFrom, setMoveFrom] = useState<string | null>(null);

  const handleMove = useCallback((sourceSquare: string, targetSquare: string) => {
    if (winner) return false;
    if (mode === 'ai' && game.turn() !== boardOrientation[0]) {
      return false;
    }
    if (mode === 'friend' && gameId) {
      const myTurnObj = boardOrientation === 'white' ? 'w' : 'b';
      if (game.turn() !== myTurnObj) {
        return false;
      }
    }

    const gameCopy = new Chess();
    gameCopy.load(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      setGame(gameCopy);
      checkGameOver(gameCopy, true);
      
      if (mode === 'ai' && !gameCopy.isGameOver()) {
        setIsThinking(true);
        setTimeout(() => makeAIMove(gameCopy, difficulty), 250);
      } else if (mode === 'friend' && gameId) {
        setDoc(doc(db, 'couple_data', gameId), {
          fen: gameCopy.fen(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      return true;
    } catch (e) {
      return false;
    }
  }, [winner, mode, game, boardOrientation, gameId, difficulty]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    if (!targetSquare) return false;
    const isSuccess = handleMove(sourceSquare, targetSquare);
    if (isSuccess) setMoveFrom(null);
    return isSuccess;
  }, [handleMove]);

  const onSquareClick = useCallback((square: string) => {
    if (winner) return;
    if (mode === 'ai' && game.turn() !== boardOrientation[0]) return;
    if (mode === 'friend' && gameId) {
      const myTurnObj = boardOrientation === 'white' ? 'w' : 'b';
      if (game.turn() !== myTurnObj) return;
    }

    if (!moveFrom) {
      // First click: select piece
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
      }
      return;
    }

    // Second click: attempt to move
    const gameCopy = new Chess();
    gameCopy.load(game.fen());
    try {
      gameCopy.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });
      // the move is valid
      handleMove(moveFrom, square);
      setMoveFrom(null);
    } catch (e) {
      // the move is invalid. If clicking on another piece of the same color, select it
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null); // click on empty or opponent piece (invalid)
      }
    }
  }, [moveFrom, game, mode, boardOrientation, gameId, winner, handleMove]);

  const makeAIMove = async (cg: Chess, diff: AIDifficulty) => {
    const legalMoves = cg.moves({ verbose: true });
    if (legalMoves.length === 0) return;
    
    let bestMove: Move | null = null;
    
    if (diff === 'easy') {
      // 70% random, 30% basic depth 1
      if (Math.random() > 0.3) {
        bestMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        bestMove = await getBestMoveAsync(cg, 1);
      }
    } else if (diff === 'medium') {
      // Depth 1
      bestMove = await getBestMoveAsync(cg, 1);
    } else {
      // Hard: minimax depth 2
      // In JS, depth 3 can cause UI freeze in complex middle games
      bestMove = await getBestMoveAsync(cg, 2);
    }

    if (bestMove) {
      cg.move(bestMove);
      setGame(new Chess(cg.fen()));
      checkGameOver(cg, true);
    }
    setIsThinking(false);
  };

  // Piece values and basic piece-square tables for better AI
  const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  
  const pawnEvalWhite = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];
  const knightEval = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];
  const bishopEvalWhite = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ];
  const rookEvalWhite = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ];

  const evaluateBoard = (cg: Chess) => {
    let totalEvaluation = 0;
    const board = cg.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const val = pieceValues[piece.type] || 0;
          let pstVal = 0;
          const isWhite = piece.color === 'w';
          const r = isWhite ? i : 7 - i; // reverse rows for black

          if (piece.type === 'p') pstVal = pawnEvalWhite[r][j];
          else if (piece.type === 'n') pstVal = knightEval[r][j];
          else if (piece.type === 'b') pstVal = bishopEvalWhite[r][j];
          else if (piece.type === 'r') pstVal = rookEvalWhite[r][j];

          const pieceScore = val + pstVal;
          totalEvaluation += isWhite ? pieceScore : -pieceScore;
        }
      }
    }
    return totalEvaluation;
  };

  const minimax = (cg: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean) => {
    if (depth === 0 || cg.isGameOver()) {
      return evaluateBoard(cg);
    }

    const moves = cg.moves({ verbose: true });

    if (isMaximizingPlayer) {
      let bestVal = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        cg.move(moves[i]);
        bestVal = Math.max(bestVal, minimax(cg, depth - 1, alpha, beta, !isMaximizingPlayer));
        cg.undo();
        alpha = Math.max(alpha, bestVal);
        if (beta <= alpha) break;
      }
      return bestVal;
    } else {
      let bestVal = Infinity;
      for (let i = 0; i < moves.length; i++) {
        cg.move(moves[i]);
        bestVal = Math.min(bestVal, minimax(cg, depth - 1, alpha, beta, !isMaximizingPlayer));
        cg.undo();
        beta = Math.min(beta, bestVal);
        if (beta <= alpha) break;
      }
      return bestVal;
    }
  };

  const getBestMoveAsync = async (cg: Chess, depth: number): Promise<Move> => {
    const moves = cg.moves({ verbose: true });
    // sort moves: captures first, then random to add variety
    moves.sort((a, b) => {
      if (a.flags.includes('c') && !b.flags.includes('c')) return -1;
      if (!a.flags.includes('c') && b.flags.includes('c')) return 1;
      return Math.random() - 0.5;
    });

    let bestMove = moves[0];
    const isMaximizingPlayer = cg.turn() === 'w';
    let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

    for (let i = 0; i < moves.length; i++) {
      // Yield to the UI thread
      await new Promise(r => setTimeout(r, 0));

      cg.move(moves[i]);
      const boardValue = minimax(cg, depth - 1, -Infinity, Infinity, !isMaximizingPlayer);
      cg.undo();
      if (isMaximizingPlayer) {
        if (boardValue > bestValue) {
          bestValue = boardValue;
          bestMove = moves[i];
        }
      } else {
        if (boardValue < bestValue) {
          bestValue = boardValue;
          bestMove = moves[i];
        }
      }
    }
    return bestMove;
  };

  const chessboardOptions = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (moveFrom) {
      styles[moveFrom] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      const moves = game.moves({ square: moveFrom as any, verbose: true });
      moves.forEach(m => {
        styles[m.to] = { 
          background: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
          borderRadius: "50%"
        };
      });
    }

    return {
      id: 'CoupleChessBoard',
      position: game.fen(),
      onPieceDrop: (args: any) => onDrop(args.sourceSquare, args.targetSquare),
      onSquareClick: (args: any) => onSquareClick(args.square),
      boardOrientation: boardOrientation,
      animationDurationInMs: 200,
      allowDragging: true,
      darkSquareStyle: { backgroundColor: '#779556' },
      lightSquareStyle: { backgroundColor: '#ebecd0' },
      customSquareStyles: styles,
      squareStyles: styles
    };
  }, [game, boardOrientation, onDrop, onSquareClick, moveFrom]);

  if (!mode) {
    return (
      <>
      <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
        <button onClick={onExit} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium">
          <ArrowLeft className="w-5 h-5" /> Trở lại
        </button>
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-neutral-200/50 border border-neutral-100 text-center">
          <Crown className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-900 mb-2">Cờ Vua</h2>
          <p className="text-neutral-500 text-sm sm:text-base mb-6 sm:mb-8">Chọn chế độ chơi để bắt đầu</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-5 sm:p-6 rounded-3xl text-left border border-neutral-100">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                   <Brain className="w-4 h-4" />
                 </div>
                 <h3 className="font-semibold text-neutral-900 text-base">Chơi với Máy</h3>
               </div>
               <div className="space-y-4">
                 <div className="flex bg-neutral-100/50 p-1 rounded-3xl">
                   <button 
                     onClick={() => setAiColor('white')}
                     className={`flex-1 py-1.5 text-sm font-medium rounded-3xl transition-all ${aiColor === 'white' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:bg-neutral-100/50'}`}
                   >
                     Màu Trắng
                   </button>
                   <button 
                     onClick={() => setAiColor('black')}
                     className={`flex-1 py-1.5 text-sm font-medium rounded-3xl transition-all ${aiColor === 'black' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100/50'}`}
                   >
                     Màu Đen
                   </button>
                 </div>
                 <div className="space-y-2">
                   <button onClick={() => startAIGame('easy', aiColor)} className={`w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm ${aiColor === 'white' ? 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-600 border border-neutral-100' : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'}`}>
                     <span>Máy tính - Dễ</span>
                   </button>
                   <button onClick={() => startAIGame('medium', aiColor)} className={`w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm ${aiColor === 'white' ? 'bg-white text-neutral-700 hover:bg-orange-50 hover:text-orange-600 border border-neutral-100' : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'}`}>
                     <span>Máy tính - Trung Bình</span>
                   </button>
                   <button onClick={() => startAIGame('hard', aiColor)} className={`w-full px-4 py-2.5 rounded-3xl font-medium transition-colors shadow-sm text-left flex justify-between items-center text-sm ${aiColor === 'white' ? 'bg-white text-neutral-700 hover:bg-orange-50 hover:text-orange-600 border border-neutral-100' : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'}`}>
                     <span>Máy tính - Khó</span>
                   </button>
                 </div>
               </div>
            </div>

            <div className="bg-neutral-50 p-5 sm:p-6 rounded-3xl text-left border border-neutral-100 flex flex-col">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600">
                   <User className="w-4 h-4" />
                 </div>
                 <h3 className="font-semibold text-neutral-900 text-base">Chơi với Bạn</h3>
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
           gameName="Cờ Vua Đa Nền Tảng"
           gameType="chess"
           maxPlayers={2}
           onJoin={(players) => {
               setShowInviteModal(false);
               const opponentUid = players.find(p => p !== user.uid);
               if (opponentUid) startFriendGame(opponentUid);
           }}
           onCancel={() => setShowInviteModal(false)}
        />
      )}
      </>
    );
  }

  return (
    <div className="max-w-[600px] w-full mx-auto p-2 sm:p-4 animate-in fade-in zoom-in duration-300 flex flex-col items-center">
      <div className="flex items-center justify-between mb-4 w-full">
        <button onClick={() => setMode(null)} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium bg-white px-3 py-1.5 rounded-3xl shadow-sm border border-neutral-100 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Rời bàn
        </button>
        <div className="bg-white px-3 py-1.5 rounded-3xl shadow-sm border border-neutral-100 font-semibold text-neutral-700 text-sm">
          {mode === 'ai' ? `Máy (${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'TB' : 'Khó'})` : selectedFriend?.displayName || 'Bạn'}
        </div>
      </div>

      <div className="bg-neutral-800 p-2 sm:p-5 rounded-3xl sm:rounded-3xl shadow-2xl relative w-full">
         {winner && (
           <div className="absolute inset-0 z-20 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white rounded-3xl p-6 text-center max-w-xs mx-4 transform scale-100 shadow-2xl">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold font-display mb-1">
                  {winner === 'draw' ? 'Hòa rồi!' : winner === boardOrientation ? 'Bạn Thắng!' : 'Bạn Thua!'}
                </h3>
                <p className="text-neutral-500 text-sm mb-6">Trận đấu đã kết thúc.</p>
                <div className="space-y-2">
                  {mode === 'friend' && (
                    <button onClick={restartFriendGame} className="w-full bg-neutral-500 text-white font-semibold py-2.5 rounded-3xl hover:bg-neutral-600 transition-colors text-sm">
                      Chơi Lại (Đổi màu)
                    </button>
                  )}
                  {mode === 'ai' && (
                    <button onClick={() => startAIGame(difficulty, boardOrientation)} className="w-full bg-neutral-500 text-white font-semibold py-2.5 rounded-3xl hover:bg-neutral-600 transition-colors text-sm">
                      Chơi Lại
                    </button>
                  )}
                  <button onClick={() => setMode(null)} className="w-full bg-neutral-600 text-white font-semibold py-2.5 rounded-3xl hover:bg-neutral-700 transition-colors text-sm">
                    Về Sảnh
                  </button>
                </div>
             </div>
           </div>
         )}
         
         <div className="flex justify-between items-center mb-3 px-1 sm:px-2">
           <div className="flex items-center gap-2 text-white font-medium">
             <div className="w-7 h-7 bg-neutral-700 rounded-full flex items-center justify-center">
               {mode === 'ai' ? <Brain className="w-4 h-4 text-neutral-400" /> : <User className="w-4 h-4 text-neutral-400" />}
             </div>
             <div className="leading-tight">
               <div className="text-sm font-semibold flex items-center gap-2">
                 {mode === 'ai' ? 'Máy' : selectedFriend?.displayName || 'Đối thủ'}
                 {mode === 'ai' && <span className="text-[10px] bg-neutral-600 px-1.5 py-0.5 rounded-3xl text-neutral-300">Thua: {scores.opponent}</span>}
               </div>
               {isThinking && <div className="text-[10px] text-neutral-400 animate-pulse font-normal mt-0.5">Đang suy nghĩ...</div>}
             </div>
           </div>
           
           <div className="text-[10px] font-semibold bg-neutral-700 border border-neutral-600 text-neutral-300 px-2 py-0.5 rounded-3xl uppercase tracking-wider backdrop-blur-sm">
             {game.turn() === (boardOrientation === 'white' ? 'w' : 'b') ? 'Lượt của bạn' : 'Lượt đối thủ'}
           </div>
         </div>

         <div className="rounded-3xl overflow-hidden shadow-2xl bg-[#ebecd0] aspect-square w-full mx-auto select-none">
            <Chessboard options={chessboardOptions} />
         </div>
         
          <div className="flex items-center justify-between text-white mt-3 px-1 sm:px-2">
             <div className="flex items-center gap-2">
               <div className="w-7 h-7 bg-neutral-700 rounded-full flex items-center justify-center">
                 <User className="w-4 h-4 text-orange-400" />
               </div>
               <div className="text-sm font-semibold flex items-center gap-2">
                 Bạn ({boardOrientation === 'white' ? 'Trắng' : 'Đen'})
                 {mode === 'ai' && <span className="text-[10px] bg-neutral-600 px-1.5 py-0.5 rounded-3xl text-orange-300">Thắng: {scores.you}</span>}
               </div>
             </div>
             <button 
               onClick={handleAskAICoach}
               disabled={isCoachingMode}
               className="flex items-center gap-1.5 text-xs bg-neutral-500/20 hover:bg-neutral-500/40 text-neutral-300 px-3 py-1.5 rounded-3xl font-medium transition-colors"
             >
               {isCoachingMode ? <span className="animate-pulse">Đang huấn luyện...</span> : <> <Brain className="w-4 h-4" /> Hỏi ý kiến AI </>}
             </button>
          </div>
          {aiCoachMessage && (
            <div className="mt-4 bg-neutral-900/50 border border-neutral-500/30 rounded-3xl p-3 text-neutral-100 text-sm font-medium">
              <span className="font-bold text-neutral-400 uppercase text-xs mr-2">Gemma 4 Coach:</span>
              {aiCoachMessage}
            </div>
          )}
      </div>
    </div>
  );
}

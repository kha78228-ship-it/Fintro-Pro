import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Swords, Ghost, Diamond, Crown, ChevronLeft, Users, Zap, Clock, Play } from 'lucide-react';

const ChessGame = lazy(() => import('./games/ChessGame'));
const LudoGame = lazy(() => import('./games/LudoGame'));
const TienLenGame = lazy(() => import('./games/TienLenGame'));
const TanGame = lazy(() => import('./games/TanGame'));

const GAMES_LIST = [
  {
    id: 'chess',
    name: 'Cờ Vua',
    description: 'Đấu trí căng thẳng trên bàn cờ 64 ô.',
    icon: <Crown className="w-8 h-8 text-orange-500" />,
    color: 'from-orange-100 to-orange-50',
    borderColor: 'border-orange-200',
    tag: '2 Người',
    banner: 'bg-orange-500',
  },
  {
    id: 'ludo',
    name: 'Cờ Cá Ngựa',
    description: 'Cuộc đua kỳ thú về đích của 4 màu quân.',
    icon: <Ghost className="w-8 h-8 text-neutral-500" />,
    color: 'from-neutral-100 to-neutral-50',
    borderColor: 'border-neutral-200',
    tag: '2-4 Người',
    banner: 'bg-neutral-500',
  },
  {
    id: 'tien-len',
    name: 'Tiến Lên',
    description: 'Chặt heo, tới trắng, trải nghiệm phong cách Nam/Bắc.',
    icon: <Diamond className="w-8 h-8 text-orange-500" />,
    color: 'from-orange-100 to-orange-50',
    borderColor: 'border-orange-200',
    tag: '2-4 Người',
    banner: 'bg-orange-500',
  },
  {
    id: 'tan',
    name: 'Tấn',
    description: 'Đỡ bão, tấn công, phòng thủ tuyệt đối.',
    icon: <Zap className="w-8 h-8 text-neutral-500" />,
    color: 'from-neutral-100 to-purple-50',
    borderColor: 'border-neutral-200',
    tag: '2-4 Người',
    banner: 'bg-neutral-500',
  }
];

export default function CoupleGames({ user }: { user?: any }) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const renderGameLobby = () => {
    let GameComponent = null;

    if (selectedGame === 'chess') GameComponent = ChessGame;
    else if (selectedGame === 'ludo') GameComponent = LudoGame;
    else if (selectedGame === 'tien-len') GameComponent = TienLenGame;
    else if (selectedGame === 'tan') GameComponent = TanGame;

    if (GameComponent) {
      return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
          <GameComponent user={user} onExit={() => setSelectedGame(null)} />
        </Suspense>
      );
    }

    const game = GAMES_LIST.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl mx-auto"
      >
        <button 
          onClick={() => setSelectedGame(null)}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Trở lại sảnh game
        </button>

        <div className={`rounded-3xl p-8 text-white shadow-xl ${game.banner} mb-8 relative overflow-hidden`}>
           <div className="absolute top-0 right-0 p-8 opacity-20 transform scale-150 translate-x-4 -translate-y-4">
              {game.icon}
           </div>
           
           <div className="relative z-10">
             <div className="bg-white/20 inline-block px-4 py-1.5 rounded-3xl text-sm font-bold tracking-widest uppercase mb-4 shadow-sm backdrop-blur-md">
                Phòng chờ
             </div>
             <h2 className="text-4xl font-display font-bold mb-2 tracking-tight">{game.name}</h2>
             <p className="text-white/80 font-medium text-lg max-w-lg mb-6">{game.description}</p>
             
             <div className="flex flex-wrap gap-3">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-3xl flex items-center gap-2">
                 <Users className="w-5 h-5" />
                 <span className="font-medium">{game.tag}</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-3xl flex items-center gap-2">
                 <Clock className="w-5 h-5" />
                 <span className="font-medium">Thời gian thực</span>
               </div>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-10 text-center shadow-xl shadow-neutral-200/50 border border-neutral-100 flex flex-col items-center justify-center min-h-[300px]">
           <Gamepad2 className="w-16 h-16 text-neutral-300 mb-6 animate-bounce" />
           <h3 className="text-2xl font-bold text-neutral-800 mb-3 font-display">Hệ thống đang bảo trì</h3>
           <p className="text-neutral-500 max-w-md mx-auto mb-8 leading-relaxed">
             Tính năng {game.name} đang trong quá trình phát triển và hoàn thiện. Vui lòng quay lại trong các bản cập nhật sắp tới!
           </p>
           <button 
             onClick={() => setSelectedGame(null)}
             className="bg-neutral-900 text-white px-8 py-3 rounded-3xl font-bold shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all active:scale-95"
           >
             Khám phá game khác
           </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pb-safe">
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            <div className="text-center space-y-3 mb-10 pt-4">
              <h2 className="text-4xl font-display font-bold text-neutral-600 tracking-tight flex items-center justify-center gap-3">
                <Gamepad2 className="w-10 h-10" />
                Sảnh Trò Chơi
              </h2>
              <p className="text-neutral-500 text-lg">Giây phút giải trí vui vẻ cùng bạn bè và người ấy!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAMES_LIST.map((game, idx) => (
                <motion.button
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`bg-gradient-to-br ${game.color} border ${game.borderColor} rounded-3xl p-6 text-left shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 z-0"></div>
                  
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-3xl w-fit mb-5 shadow-sm relative z-10 border border-white/50 group-hover:rotate-12 transition-transform">
                    {game.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-900 mb-2 font-display relative z-10 tracking-tight">{game.name}</h3>
                  <p className="text-sm text-neutral-600 mb-6 flex-1 relative z-10 leading-relaxed">{game.description}</p>
                  
                  <div className="mt-auto flex items-center justify-between relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/80 px-3 py-1.5 rounded-3xl text-neutral-600 shadow-sm">
                      {game.tag}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Chơi Ngay <ChevronLeft className="w-4 h-4 rotate-180" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="game" className="h-full">
            {renderGameLobby()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

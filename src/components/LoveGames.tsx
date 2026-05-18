import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, HeartHandshake, Sparkles, Map, Loader2, ChevronLeft } from 'lucide-react';
import DailyQuestion from './DailyQuestion';
import DiscoveryDeck from './DiscoveryDeck';

const WhoKnowsBetter = lazy(() => import('./games/WhoKnowsBetter'));
const StorytellingGame = lazy(() => import('./games/StorytellingGame'));
const WouldYouRather = lazy(() => import('./games/WouldYouRather'));
const LoveQuizGame = lazy(() => import('./games/LoveQuizGame'));

const GAMES_LIST = [
  {
    id: 'love-quiz',
    name: 'Mức độ thấu hiểu',
    description: 'Trò chơi 10 câu hỏi trắc nghiệm xem ai là người hiểu đối phương hơn.',
    icon: <HeartHandshake className="w-8 h-8 text-pink-500" />,
    color: 'from-pink-100 to-pink-50',
    borderColor: 'border-pink-200',
    tag: 'Thử thách',
  },
  {
    id: 'who-knows-better',
    name: 'Ai hiểu tôi hơn?',
    description: 'Bộ câu hỏi trắc nghiệm trả lời tự do thử thách độ hiểu ý nhau của cả hai.',
    icon: <HeartHandshake className="w-8 h-8 text-rose-500" />,
    color: 'from-rose-100 to-rose-50',
    borderColor: 'border-rose-200',
    tag: 'Tương tác',
  },
  {
    id: 'storytelling',
    name: 'Truyền thuyết kết nối',
    description: 'Người tung kẻ hứng để cùng viết nên tiểu thuyết tình yêu!',
    icon: <Sparkles className="w-8 h-8 text-fuchsia-500" />,
    color: 'from-fuchsia-100 to-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    tag: 'Sáng tạo',
  },
  {
    id: 'would-you-rather',
    name: 'Bạn Chọn Gì?',
    description: 'Hai lựa chọn khó khăn, xem thử hai người có đồng điệu không.',
    icon: <Map className="w-8 h-8 text-orange-500" />,
    color: 'from-orange-100 to-orange-50',
    borderColor: 'border-orange-200',
    tag: 'Tâm lý',
  }
];

export default function LoveGames({ user }: { user?: any }) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (selectedGame) {
    let GameComponent = null;
    if (selectedGame === 'love-quiz') GameComponent = LoveQuizGame;
    else if (selectedGame === 'who-knows-better') GameComponent = WhoKnowsBetter;
    else if (selectedGame === 'storytelling') GameComponent = StorytellingGame;
    else if (selectedGame === 'would-you-rather') GameComponent = WouldYouRather;

    if (GameComponent) {
      return (
        <div className="w-full">
          <button 
            onClick={() => setSelectedGame(null)}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-6 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Trở lại Trang chủ
          </button>
          <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
            <GameComponent user={user} onExit={() => setSelectedGame(null)} />
          </Suspense>
        </div>
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <DailyQuestion user={user} />
      <hr className="border-orange-100 my-8"/>

      {/* Mini Games Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-100/50 border border-orange-50/50 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <Gamepad2 className="w-8 h-8 text-orange-500" />
          <h3 className="text-2xl font-bold font-display text-neutral-800">Mini Game Tình Yêu</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GAMES_LIST.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`bg-gradient-to-br ${game.color} border ${game.borderColor} rounded-3xl p-5 text-left shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col relative overflow-hidden`}
            >
              <div className="bg-white/80 p-2.5 rounded-2xl w-fit mb-3 shadow-sm border border-white/50 group-hover:scale-110 transition-transform">
                {game.icon}
              </div>
              <h4 className="font-bold text-neutral-900 mb-1">{game.name}</h4>
              <p className="text-xs text-neutral-600 line-clamp-2 md:mb-1">{game.description}</p>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-orange-100 my-8"/>
      
      {/* Khám Phá Section */}
      <div className="bg-white rounded-3xl pb-8 shadow-xl shadow-orange-100/50 border border-orange-50/50 overflow-hidden">
         <DiscoveryDeck />
      </div>

    </div>
  );
}
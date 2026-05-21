import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, BrainCircuit, Trash2, Bot, Ghost, Settings, RefreshCw, Palette, Wallet, Heart } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, Debt, Subscription } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AiAvatarConfig {
  type: 'icon' | 'generated';
  value: string;
}

const PREDEFINED_ICONS = [
  { id: 'Sparkles', icon: Sparkles },
  { id: 'Bot', icon: Bot },
  { id: 'Ghost', icon: Ghost },
  { id: 'BrainCircuit', icon: BrainCircuit },
  { id: 'MessageSquare', icon: MessageSquare }
];

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
}

interface AiChatWidgetProps {
  transactions?: Transaction[];
  appMode?: 'finance' | 'love' | 'entertainment';
  user?: any;
}

type ChatMode = 'finance' | 'love' | 'entertainment';

export default function AiChatWidget({ transactions = [], appMode = 'finance', user }: AiChatWidgetProps) {
  const { formatMoney, currency, currencySymbol } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeMode, setActiveMode] = useState<ChatMode>(appMode || 'finance');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [messagesData, setMessagesData] = useState<Record<ChatMode, Message[]>>({
    finance: [],
    love: [],
    entertainment: []
  });

  const [avatarConfig, setAvatarConfig] = useState<AiAvatarConfig>({ type: 'icon', value: 'Sparkles' });
  const [showSettings, setShowSettings] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState('Fintro');

  useEffect(() => {
    setActiveMode(appMode || 'finance');
  }, [appMode]);

  useEffect(() => {
    const stored = localStorage.getItem('ai_avatar_config');
    if (stored) {
      try {
        setAvatarConfig(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  const handleUpdateAvatar = (config: AiAvatarConfig) => {
    setAvatarConfig(config);
    localStorage.setItem('ai_avatar_config', JSON.stringify(config));
  };

  const AvatarIcon = ({ className }: { className?: string }) => {
    if (avatarConfig.type === 'generated') {
       return <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarConfig.value}`} alt="AI" className={`object-cover rounded-full bg-white/20 ${className || ""}`} />;
    }
    const IconObj = PREDEFINED_ICONS.find(i => i.id === avatarConfig.value)?.icon || Sparkles;
    return <IconObj className={className} />;
  };

  useEffect(() => {
    if (!user?.uid) return;
    const debtsRef = collection(db, `users/${user.uid}/debts`);
    const subsRef = collection(db, `users/${user.uid}/subscriptions`);

    const unsubDebts = onSnapshot(debtsRef, (snap) => {
      const d: Debt[] = [];
      snap.forEach(doc => d.push({ id: doc.id, ...doc.data() } as Debt));
      setDebts(d);
    });

    const unsubSubs = onSnapshot(subsRef, (snap) => {
      const s: Subscription[] = [];
      snap.forEach(doc => s.push({ id: doc.id, ...doc.data() } as Subscription));
      setSubscriptions(s);
    });

    return () => {
      unsubDebts();
      unsubSubs();
    };
  }, [user?.uid]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (!user?.uid) return;
    
    const defaultMessages: Record<ChatMode, Message> = {
      finance: {
        id: 'welcome-finance', role: 'assistant',
        content: 'Chào bạn! Mình là AI cố vấn tài chính. Mình có thể giúp bạn phân tích chi tiêu, lập ngân sách hoặc đưa ra hướng dẫn tài chính.',
        timestamp: Date.now(), status: 'delivered'
      },
      love: {
        id: 'welcome-love', role: 'assistant',
        content: 'Chào cậu! Mình là AI tư vấn tình cảm đây. Cậu cần tâm sự hay hỏi về các gợi ý hẹn hò, quà tặng hôm nay?',
        timestamp: Date.now(), status: 'delivered'
      },
      entertainment: {
        id: 'welcome-ent', role: 'assistant',
        content: 'Chào bạn! Mình là AI giải trí. Sẵn sàng gợi ý các mẩu chuyện vui, trò chơi hoặc kế hoạch thư giãn chưa?',
        timestamp: Date.now(), status: 'delivered'
      }
    };

    const loadedData: Record<ChatMode, Message[]> = { finance: [], love: [], entertainment: [] };
    const modes: ChatMode[] = ['finance', 'love', 'entertainment'];
    
    modes.forEach(mode => {
       const stored = localStorage.getItem(`ai_chat_history_${mode}_${user.uid}`);
       if (stored) {
         try {
           const parsed = JSON.parse(stored);
           if (parsed && Array.isArray(parsed) && parsed.length > 0) {
             loadedData[mode] = parsed;
             return;
           }
         } catch(e) {}
       }
       loadedData[mode] = [defaultMessages[mode]];
    });
    setMessagesData(loadedData);
  }, [user?.uid]);

  // Save chat history to localStorage when changed
  useEffect(() => {
    if (!user?.uid) return;
    const modes: ChatMode[] = ['finance', 'love', 'entertainment'];
    modes.forEach(mode => {
       if (messagesData[mode] && messagesData[mode].length > 0) {
          localStorage.setItem(`ai_chat_history_${mode}_${user.uid}`, JSON.stringify(messagesData[mode]));
       }
    });
  }, [messagesData, user?.uid]);

  const setMessagesForCurrentMode = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setMessagesData(prev => ({
      ...prev,
      [activeMode]: typeof updater === 'function' ? updater(prev[activeMode] || []) : updater
    }));
  };

  const currentMessages = messagesData[activeMode] || [];

  useEffect(() => {
    if (isOpen) {
        setMessagesForCurrentMode(prev => prev.map(m => m.role === 'assistant' && m.status === 'delivered' ? {...m, status: 'read'} : m));
    }
  }, [isOpen, activeMode]);

  const clearHistory = () => {
    const defaultMessages: Record<ChatMode, Message> = {
      finance: { id: Date.now().toString(), role: 'assistant', content: 'Lịch sử tư vấn tài chính đã được xóa. Mình bắt đầu lại nhé!', timestamp: Date.now() },
      love: { id: Date.now().toString(), role: 'assistant', content: 'Lịch sử trò chuyện tình cảm đã được xóa. Cậu muốn tâm sự gì nào?', timestamp: Date.now() },
      entertainment: { id: Date.now().toString(), role: 'assistant', content: 'Lịch sử giải trí đã được xóa. Cùng chơi tiếp nha!', timestamp: Date.now() }
    };
    
    if (user?.uid) {
      localStorage.removeItem(`ai_chat_history_${activeMode}_${user.uid}`);
    }
    setMessagesForCurrentMode([defaultMessages[activeMode]]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const isAiCall = input.trim().startsWith('@');
    const cleanInput = isAiCall ? input.trim().substring(1).trim() : input.trim();
    
    if (cleanInput === '') return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now(), status: 'sent' };
    setMessagesForCurrentMode(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate delivered status
    setTimeout(() => {
        setMessagesForCurrentMode(prev => prev.map(m => m.id === userMessage.id ? {...m, status: 'delivered'} : m));
    }, 500);

    const targetMode = activeMode;

    try {
      const msgsToUse = messagesData[targetMode] || [];
      const conversationHistory = msgsToUse.slice(-20).map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`).join('\n');

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      const debtSummary = debts.map(d => `- ${d.title}: ${formatMoney(d.amount)} (${d.type === 'owe' ? 'Tôi nợ' : 'Họ nợ tôi'}, ${d.status === 'completed' ? 'Đã xong' : 'Chưa xong'})`).join('\n');
      const subSummary = subscriptions.map(s => `- ${s.name}: ${formatMoney(s.amount)}/${s.billingCycle === 'monthly' ? 'tháng' : 'năm'} (Hạn: ${s.nextBillingDate})`).join('\n');

      const systemPrompts = {
        finance: `Bạn là "Fintro AI" - Chuyên gia cố vấn tài chính cá nhân thông thái và tinh tế. 
        Nhiệm vụ: Giúp người dùng quản lý tiền bạc, phân tích chi tiêu, và đưa ra lời khuyên tiết kiệm.
        Dữ liệu hiện tại:
        - Thu nhập: ${formatMoney(totalIncome)}
        - Chi tiêu: ${formatMoney(totalExpense)}
        - Vay nợ: \n${debtSummary || 'Không có dữ liệu nợ'}
        - Đăng ký dịch vụ: \n${subSummary || 'Không có dữ liệu đăng ký'}`,
        
        love: `Bạn là "Valentine AI" - Chuyên gia tư vấn tâm lý và mối quan hệ.
        Nhiệm vụ: Lắng nghe, thấu hiểu và đưa ra lời khuyên chân thành về tình yêu, sự kết nối và quà tặng.
        Phong cách: Ấm áp, lãng mạn nhưng thực tế.`,
        
        entertainment: `Bạn là "Joy AI" - Người bạn đồng hành giải trí vui nhộn.
        Nhiệm vụ: Kể chuyện cười, gợi ý phim/nhạc, lên kế hoạch đi chơi hoặc đơn giản là tán gẫu vui vẻ.`
      };

      const prompt = `${systemPrompts[targetMode]}
      
      Thông tin bối cảnh:
      - Đơn vị tiền tệ: ${currency} (${currencySymbol})
      - Số lượng giao dịch: ${transactions.length}
      
      Lịch sử trò chuyện gần nhất:
      ${conversationHistory}
      
      Người dùng nói: "${cleanInput}"
      
      Hướng dẫn TRẢ LỜI:
      - Trả lời TRỰC TIẾP, chân thực, không máy móc.
      - Nếu là tài chính, hãy dùng dữ liệu nợ/đăng ký nếu liên quan.
      - Ngôn ngữ: TIẾNG VIỆT. Trình bày đẹp mắt bằng Markdown (đậm, nghiêng, list).`;

      const { generateContent } = await import('../lib/gemini');
      const response = await generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể nói rõ hơn được không?",
        timestamp: Date.now(),
        status: 'delivered'
      };
      
      setMessagesData(prev => ({
        ...prev,
        [targetMode]: [...(prev[targetMode] || []), assistantMessage]
      }));
    } catch (error: any) {
      console.error(error);
      let errMsg = error instanceof Error ? error.message : "Chưa xác định";
      if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("not find API key") || errMsg.includes("API key") || errMsg.includes("Khóa API") || errMsg.includes("API_KEY")) {
         errMsg = "Khóa API không hợp lệ. Vui lòng vào Cài đặt (Settings) -> Secrets để nhập hoặc đổi khóa GEMINI_API_KEY. Sau đó Tải lại trang (F5).";
      } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
         errMsg = "Hệ thống đang quá tải hoặc hết hạn mức. Vui lòng thêm/đổi khóa GEMINI_API_KEY trong Settings -> Secrets.";
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Oops! Lỗi hệ thống: ${errMsg}`,
        timestamp: Date.now(),
        status: 'delivered'
      };
      setMessagesData(prev => ({
        ...prev,
        [targetMode]: [...(prev[targetMode] || []), errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-40 w-16 h-16 bg-neutral-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-neutral-700 transition-all sm:active:scale-95 group"
      >
        <AvatarIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-6 md:bottom-32 md:right-12 z-50 w-[calc(100vw-3rem)] md:w-96 bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col"
            style={{ height: '550px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-neutral-600 p-4 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner">
                  <AvatarIcon className="w-5 h-5 text-neutral-50" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Fintro AI</h3>
                  <div className="flex gap-1 mt-1">
                    <button 
                      onClick={() => setActiveMode('finance')} 
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${activeMode === 'finance' ? 'bg-white text-neutral-800' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                    >
                      <Wallet className="w-2.5 h-2.5" /> Finance
                    </button>
                    <button 
                      onClick={() => setActiveMode('love')} 
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${activeMode === 'love' ? 'bg-orange-500 text-white' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                    >
                      <Heart className="w-2.5 h-2.5" /> Love
                    </button>
                    <button 
                      onClick={() => setActiveMode('entertainment')} 
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${activeMode === 'entertainment' ? 'bg-purple-500 text-white' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Fun
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 hover:bg-white/20 rounded-full transition-all ${showSettings ? 'bg-white/30' : 'bg-white/10'}`}
                  title="Cài đặt Avatar"
                >
                  <Palette className="w-4 h-4 text-neutral-50" />
                </button>
                <button 
                  onClick={clearHistory}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                  title="Xóa lịch sử hiện tại"
                >
                  <Trash2 className="w-4 h-4 text-neutral-50" />
                </button>
                <button 
                  onClick={() => { setIsOpen(false); setShowSettings(false); }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showSettings ? (
              <div className="flex-1 p-6 overflow-y-auto bg-neutral-50/50">
                <h4 className="font-bold text-neutral-900 mb-4">Tùy chỉnh Avatar AI</h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Biểu tượng có sẵn</h5>
                    <div className="flex gap-3 flex-wrap">
                      {PREDEFINED_ICONS.map((icon) => (
                        <button
                          key={icon.id}
                          onClick={() => handleUpdateAvatar({ type: 'icon', value: icon.id })}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${avatarConfig.type === 'icon' && avatarConfig.value === icon.id ? 'bg-neutral-900 text-white shadow-md' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'}`}
                        >
                          <icon.icon className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Avatar độc bản (Dicebear)</h5>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-neutral-200 flex flex-col items-center gap-4">
                      {avatarConfig.type === 'generated' ? (
                         <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarConfig.value}`} alt="Generated" className="w-20 h-20 bg-neutral-100 rounded-full object-cover" />
                      ) : (
                         <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
                           <Bot className="w-10 h-10 text-neutral-400" />
                         </div>
                      )}
                      <div className="w-full flex gap-2">
                        <input
                          type="text"
                          value={avatarSeed}
                          onChange={(e) => setAvatarSeed(e.target.value)}
                          placeholder="Nhập tên để tạo..."
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        />
                        <button
                          onClick={() => handleUpdateAvatar({ type: 'generated', value: avatarSeed || 'Fintro' })}
                          className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-3xl hover:bg-neutral-800 transition-colors"
                        >
                          Tạo & Chọn
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/50 scrollbars-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <AnimatePresence initial={false}>
                {currentMessages.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                     {activeMode === 'finance' && (
                       <>
                         <button onClick={() => setInput("Phân tích nợ của mình")} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-2xl text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 shrink-0 shadow-sm">Phân tích nợ</button>
                         <button onClick={() => setInput("Dịch vụ nào sắp hết hạn?")} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-2xl text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 shrink-0 shadow-sm">Gia hạn dịch vụ</button>
                         <button onClick={() => setInput("Gợi ý tiết kiệm tháng này")} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-2xl text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 shrink-0 shadow-sm">Mẹo tiết kiệm</button>
                       </>
                     )}
                     {activeMode === 'love' && (
                       <>
                         <button onClick={() => setInput("Gợi ý quà tặng lãng mạn")} className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-2xl text-[11px] font-bold text-orange-600 hover:bg-orange-100 shrink-0 shadow-sm">Gợi ý quà</button>
                         <button onClick={() => setInput("Làm sao để làm hòa?")} className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-2xl text-[11px] font-bold text-orange-600 hover:bg-orange-100 shrink-0 shadow-sm">Làm hòa</button>
                       </>
                     )}
                   </div>
                )}
                {currentMessages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-1 overflow-hidden transition-colors ${activeMode === 'love' ? 'bg-orange-100' : activeMode === 'entertainment' ? 'bg-purple-100' : 'bg-neutral-200'}`}>
                          <AvatarIcon className={`w-5 h-5 object-cover ${activeMode === 'love' ? 'text-orange-600' : activeMode === 'entertainment' ? 'text-purple-600' : 'text-neutral-600'}`} />
                       </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div 
                        className={`max-w-[80%] p-3.5 rounded-3xl text-[13px] leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-neutral-900 text-white shadow-md' 
                            : 'bg-white text-neutral-800 shadow-sm border border-neutral-100'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <div className={`text-[10px] text-neutral-400 flex items-center gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start ml-1'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.status && (
                          <span className="capitalize text-[9px] opacity-70"> • {msg.status}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex justify-start"
                  >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 self-end mb-1 overflow-hidden ${activeMode === 'love' ? 'bg-orange-100' : activeMode === 'entertainment' ? 'bg-purple-100' : 'bg-neutral-200'}`}>
                        <AvatarIcon className={`w-5 h-5 animate-pulse object-cover ${activeMode === 'love' ? 'text-orange-600' : activeMode === 'entertainment' ? 'text-purple-600' : 'text-neutral-600'}`} />
                     </div>
                     <div className="max-w-[80%] px-5 py-4 bg-white border border-neutral-100 rounded-3xl shadow-sm flex items-center h-[52px]">
                       <div className="flex gap-1.5 items-center justify-center">
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className={`w-1.5 h-1.5 rounded-full ${activeMode === 'love' ? 'bg-orange-400' : activeMode === 'entertainment' ? 'bg-purple-400' : 'bg-neutral-400'}`} />
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className={`w-1.5 h-1.5 rounded-full ${activeMode === 'love' ? 'bg-orange-400' : activeMode === 'entertainment' ? 'bg-purple-400' : 'bg-neutral-400'}`} />
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className={`w-1.5 h-1.5 rounded-full ${activeMode === 'love' ? 'bg-orange-400' : activeMode === 'entertainment' ? 'bg-purple-400' : 'bg-neutral-400'}`} />
                       </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-neutral-100 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative"
              >
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Trò chuyện về ${activeMode === 'finance' ? 'tài chính' : activeMode === 'love' ? 'tình yêu' : 'giải trí'}...`}
                  className="w-full bg-neutral-50 border-none rounded-3xl py-3.5 pl-5 pr-14 text-[13px] focus:ring-2 focus:ring-neutral-100 transition-all text-neutral-900 placeholder:text-neutral-400 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-full hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center ${activeMode === 'love' ? 'bg-orange-500' : activeMode === 'entertainment' ? 'bg-purple-500' : 'bg-neutral-800'}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
            </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

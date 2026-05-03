import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, BrainCircuit, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatWidgetProps {
  transactions?: Transaction[];
  appMode?: 'finance' | 'love';
  user?: any;
}

export default function AiChatWidget({ transactions = [], appMode = 'finance', user }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const defaultMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào bạn! Mình là Cố vấn AI Fintro. Lịch sử trò chuyện của bạn đã được ghi nhớ. Bạn muốn hỏi thêm gì nào?'
    };
    
    if (user?.uid) {
      const stored = localStorage.getItem(`ai_chat_history_${appMode}_${user.uid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        } catch (e) {}
      }
    }
    setMessages([defaultMessage]);
  }, [user?.uid, appMode]);

  // Save chat history to localStorage
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      localStorage.setItem(`ai_chat_history_${appMode}_${user.uid}`, JSON.stringify(messages));
    }
  }, [messages, user?.uid, appMode]);

  const clearHistory = () => {
    if (user?.uid) {
      localStorage.removeItem(`ai_chat_history_${appMode}_${user.uid}`);
    }
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Lịch sử trò chuyện đã được xóa. Chúng ta bắt đầu lại nhé! Bạn cần mình giúp gì?'
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const conversationHistory = messages.slice(-20).map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`).join('\n');

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      const prompt = `Bạn là "Fintro AI", một cố vấn tài chính và người bạn tâm giao ấm áp, thông minh, tinh tế.
      
      Thông tin người dùng:
      - Tên: ${user?.displayName || 'Người dùng'}
      - Chế độ ứng dụng hiện tại: ${appMode === 'finance' ? 'Tài chính cá nhân' : 'Khoảng không gian cặp đôi (về tình cảm, quỹ chung)'}
      - Tổng thu nhập đã ghi nhận: ${totalIncome.toLocaleString()}đ
      - Tổng chi tiêu đã ghi nhận: ${totalExpense.toLocaleString()}đ
      - Số lượng giao dịch: ${transactions.length}
      
      Lịch sử trò chuyện gần nhất:
      ${conversationHistory}
      
      Người dùng nói: "${userMessage.content}"
      
      Hướng dẫn TRẢ LỜI NGHIÊM NGẶT:
      - Trả lời TRỰC TIẾP, tập trung vào điều người dùng vừa hỏi.
      - Nếu người dùng hỏi số dư, chi tiêu, hãy dùng thông tin cung cấp ở trên để trả lời.
      - Câu trả lời phải súc tích, RẤT DỄ ĐỌC (dùng đoạn ngắn, bullet point nếu cần).
      - Ngôn ngữ: TIẾNG VIỆT, ấm áp thấu cảm, dùng các emoji phổ biến nhẹ nhàng. 
      - Nếu ở chế độ 'cặp đôi', lời khuyên tài chính phải hướng đến sự đồng thuận, thấu hiểu lẫn nhau.
      - Tuyệt đối không xưng là AI một cách máy móc, hãy trò chuyện tự nhiên như một người bạn thực thụ.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể nói rõ hơn được không?"
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! Có lỗi kết nối với trung tâm AI. Bạn thử lại sau nhé."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-40 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-700 transition-all sm:active:scale-95 group"
      >
        <Sparkles className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-6 md:bottom-32 md:right-12 z-50 w-[calc(100vw-3rem)] md:w-96 bg-white rounded-[2rem] shadow-2xl border border-neutral-100 overflow-hidden flex flex-col"
            style={{ height: '550px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                  <Sparkles className="w-6 h-6 text-indigo-50" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">AI Advisor</h3>
                  <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-semibold mt-0.5">Powered by Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button 
                  onClick={clearHistory}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                  title="Xóa lịch sử trò chuyện"
                >
                  <Trash2 className="w-5 h-5 text-indigo-50" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/50 scrollbars-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                       </div>
                    )}
                    <div 
                      className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-neutral-900 text-white rounded-br-sm shadow-md' 
                          : 'bg-white text-neutral-800 shadow-sm border border-neutral-100 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
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
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                     </div>
                     <div className="max-w-[80%] px-5 py-4 rounded-[1.5rem] bg-white border border-neutral-100 rounded-bl-sm shadow-sm flex items-center h-[52px]">
                       <div className="flex gap-1.5 items-center justify-center">
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                         <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
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
                  placeholder="Hỏi AI về tài chính, tình cảm, quà tặng..."
                  className="w-full bg-neutral-50 border-none rounded-full py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-indigo-100 transition-all text-neutral-900 placeholder:text-neutral-400 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

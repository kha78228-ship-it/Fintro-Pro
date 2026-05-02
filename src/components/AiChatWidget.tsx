import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào bạn! Mình là Cố vấn AI. Mình có thể giúp bạn phân tích chi tiêu hoặc giải đáp các thắc mắc về dữ liệu tài chính. Bạn cần mình giúp gì?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      const conversationHistory = messages.map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`).join('\n');

      const prompt = `Bạn là một người bạn tâm giao và trợ lý cá nhân thông minh tên là "Fintro AI".
      
      Lịch sử trò chuyện để bạn ghi nhớ bối cảnh:
      ${conversationHistory}
      
      Người dùng vừa hỏi: "${userMessage.content}"
      
      Yêu cầu:
      - Nếu người dùng hỏi các định nghĩa, kiến thức hoặc tư vấn về các chủ đề sau đây, hãy trả lời chi tiết, đáng tin cậy, chân thành, thấu hiểu tâm lý và dùng ngôn từ thân thiện, trendy (Gen Z) nhưng luôn tinh tế, duyên dáng và tôn trọng:
        1. Tài chính: đầu tư, quỹ chung, tiết kiệm, lạm phát, quản lý chi tiêu cặp đôi...
        2. Tình yêu & Mối quan hệ: cách quan tâm người ấy, giải quyết mâu thuẫn, tâm lý học tình yêu, thấu hiểu đối phương...
        3. Các ngày lễ quan trọng (Holidays): gợi ý quà tặng, lời chúc ý nghĩa, cách lên kế hoạch và tổ chức những ngày lễ như Valentine, Quốc tế Phụ nữ 8/3, Phụ nữ VN 20/10, Giáng sinh, sinh nhật, kỷ niệm ngày quen/cưới...
        4. An toàn trong tình yêu & Mối quan hệ lành mạnh: bao gồm an toàn tình dục/sức khỏe sinh sản, cách nhận biết dấu hiệu độc hại (red flags, gaslighting, thao túng tâm lý, bạo lực), cách bảo vệ bản thân, thiết lập ranh giới an toàn, và xây dựng một mối quan hệ bình đẳng, lành mạnh.
        5. Sức khỏe Phụ nữ / Sinh lý: chu kỳ kinh nguyệt, cách chăm sóc bản thân, chế độ ăn uống, hiểu biết về cơ thể.
      - Nếu người dùng hỏi các câu hỏi xã giao chung chung (xin chào, khỏe không, bạn là ai...), hãy trả lời thân thiện, vui vẻ.
      - Nếu người dùng cần tóm tắt/phân tích chi tiêu (ví dụ: tháng này tiêu bao nhiêu, ăn uống hết bao nhiêu...), hãy tính toán dựa trên dữ liệu cung cấp để đưa ra phân tích chân thực, số liệu trực quan.
      - Trả lời bằng tiếng Việt, ngôn từ tự nhiên, ngắn gọn, súc tích, đi thẳng vào trọng tâm.
      - Sử dụng emoji vừa phải, dễ mến.`;

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
        content: "Oops! Có lỗi kết nối với bộ não AI. Bạn thử lại sau nhé."
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
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
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

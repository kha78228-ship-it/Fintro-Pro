import React, { useState, useRef } from 'react';
import { X, Plus, Minus, Calendar, Tag, FileText, Check, Mic, Loader2, Sparkles, Image as ImageIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionType, Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { GoogleGenAI } from "@google/genai";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactions: Transaction[];
  inline?: boolean;
}

export default function TransactionForm({ isOpen, onClose, inline, onSuccess, transactions }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES.find(c => c.type === 'expense')?.id || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [smartText, setSmartText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageInput = async (file: File) => {
    setAiProcessing(true);
    setAiError('');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY as string });
          const prompt = `Phân tích hóa đơn, hình ảnh chuyển khoản ngân hàng, hoặc biên lai này. 
          Trả về kết quả dưới định dạng JSON nguyên bản với chữ thường như sau (số tiền lấy chính xác ĐỊNH DẠNG SỐ KHÔNG CHỨA DẤU CHẤM HOẶC PHẨY, type tự xác định xem là thu hay chi, description ghi rõ nội dung chi tiêu và nguồn tiền ví dụ Momo, VCB):
          {
            "amount": số tiền (kiểu số nguyên, e.g. 50000),
            "type": "expense" hoặc "income",
            "description": "ghi chú + nguồn tiền (ví dụ: Highland Coffee - Nguồn: Momo)",
            "categoryKeyword": "từ khóa thể loại ví dụ: ăn uống, di chuyển, mua sắm"
          }`;

          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [
              prompt,
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                }
              }
            ],
          });

          const resultText = response.text || '';
          const jsonStrMatch = resultText.match(/\{[\s\S]*\}/);
          if (jsonStrMatch) {
             const data = JSON.parse(jsonStrMatch[0]);
             if (data.amount) {
               const cleanedStr = data.amount.toString().replace(/[^\d]/g, '');
               setAmount(cleanedStr);
             }
             if (data.type === 'expense' || data.type === 'income') setType(data.type as TransactionType);
             if (data.description) setDescription(data.description);
             
             if (data.categoryKeyword) {
                const kw = data.categoryKeyword.toLowerCase();
                const cats = DEFAULT_CATEGORIES.filter(c => c.type === data.type || c.type === 'both');
                const found = cats.find(c => c.name.toLowerCase().includes(kw) || c.id.toLowerCase().includes(kw));
                if (found) {
                   setCategory(found.id);
                } else if (cats.length > 0) {
                   setCategory(cats[0].id);
                }
             }
          } else {
             setAiError('Không hiểu được ảnh, vui lòng nhập thủ công');
          }
        } catch (error) {
          console.error(error);
          setAiError('Lỗi kết nối AI hoặc ảnh không hợp lệ');
        } finally {
          setAiProcessing(false);
        }
      };
      reader.onerror = () => {
         setAiError('Lỗi khi đọc ảnh');
         setAiProcessing(false);
      }
    } catch (error) {
      console.error(error);
      setAiError('Lỗi hệ thống');
      setAiProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       processImageInput(e.target.files[0]);
    }
  };

  const handleDescriptionBlur = async () => {
    if (!description.trim() || description.length < 3 || isAutoCategorizing) return;
    
    setIsAutoCategorizing(true);
    setAiError('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const recentTxs = transactions.slice(0, 30).map(t => ({
        desc: t.description,
        cat: t.category,
        type: t.type
      }));

      const categoriesInfo = DEFAULT_CATEGORIES.map(c => ({ id: c.id, name: c.name, type: c.type }));

      const prompt = `Bạn là AI phân loại giao dịch.
      Một giao dịch mới vừa được nhập:
      - Loại: ${type}
      - Mô tả: "${description}"
      
      Lịch sử giao dịch gần đây của người dùng (để học thói quen):
      ${JSON.stringify(recentTxs)}
      
      Danh sách các ID thể loại có sẵn:
      ${JSON.stringify(categoriesInfo)}
      
      Hãy chọn ID thể loại phù hợp BẮT BUỘC TRONG SỐ CÁC ID CÓ SẴN (id). Chỉ trả về đúng 1 chuỗi ID đó, không có dấu ngoặc kép hay chữ nào khác.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const predictedId = response.text?.trim() || '';
      const validCategory = DEFAULT_CATEGORIES.find(c => c.id === predictedId && (c.type === type || c.type === 'both'));
      if (validCategory) {
        setCategory(validCategory.id);
      }
    } catch (error) {
      console.error("Auto categorize error:", error);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const processSmartInput = async (text: string) => {
    setAiProcessing(true);
    setAiError('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = `Phân tích câu nói: "${text}". 
      Trả về kết quả dưới định dạng JSON nguyên bản với chữ thường như sau:
      {
        "amount": số tiền (kiểu số KHÔNG CHỨA DẤU CHẤM HOẶC PHẨY, e.g. 50000),
        "type": "expense" hoặc "income",
        "description": "ghi chú",
        "categoryKeyword": "từ khóa thể loại ví dụ: ăn uống, di chuyển, mua sắm"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const resultText = response.text || '';
      const jsonStrMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonStrMatch) {
         const data = JSON.parse(jsonStrMatch[0]);
         if (data.amount) {
           const cleanedStr = data.amount.toString().replace(/[^\d]/g, '');
           setAmount(cleanedStr);
         }
         if (data.type === 'expense' || data.type === 'income') setType(data.type as TransactionType);
         if (data.description) setDescription(data.description);
         
         if (data.categoryKeyword) {
            // Find best matching category
            const kw = data.categoryKeyword.toLowerCase();
            const cats = DEFAULT_CATEGORIES.filter(c => c.type === data.type || c.type === 'both');
            const found = cats.find(c => c.name.toLowerCase().includes(kw) || c.id.toLowerCase().includes(kw));
            if (found) {
               setCategory(found.id);
            } else if (cats.length > 0) {
               setCategory(cats[0].id);
            }
         }
      } else {
         setAiError('Không hiểu được, vui lòng nhập thủ công');
      }
    } catch (error) {
      console.error(error);
      setAiError('Lỗi kết nối AI');
    } finally {
      setAiProcessing(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ nhận dạng giọng nói");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processSmartInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    const path = `users/${auth.currentUser.uid}/transactions`;
    try {
      const transactionData: Omit<Transaction, 'id'> = {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: new Date(date).toISOString(),
        userId: auth.currentUser.uid,
      };

      await addDoc(collection(db, path), transactionData);
      onSuccess();
      onClose();
      // Reset
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = DEFAULT_CATEGORIES.filter(c => c.type === type || c.type === 'both');

  const formContent = (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Thêm giao dịch</h2>
        {!inline && (
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        )}
      </div>

      <div className="mb-6 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        <div className={`flex items-center bg-indigo-50/50 border ${isListening ? 'border-red-300 ring-2 ring-red-100' : 'border-indigo-100'} focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-1.5 transition-all`}>
          <div className="pl-3 pr-2 hidden sm:flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <input 
            type="text" 
            placeholder="AI thông minh (vd: ăn trưa 50k)..."
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && smartText.trim()) {
                 e.preventDefault();
                 processSmartInput(smartText);
                 setSmartText('');
              }
            }}
            disabled={aiProcessing || isListening}
            className="flex-1 bg-transparent border-none outline-none text-base p-2.5 font-medium text-indigo-900 placeholder:text-indigo-400"
          />
          <div className="flex items-center gap-1 shrink-0">
             {smartText.trim() ? (
               <button 
                 type="button"
                 onClick={() => { processSmartInput(smartText); setSmartText(''); }} 
                 className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20"
               >
                 <Send className="w-4 h-4 ml-0.5" />
               </button>
             ) : (
               <>
                 <button 
                   type="button"
                   onClick={handleVoiceInput} 
                   className={`p-3 rounded-xl transition-colors ${
                     isListening 
                       ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                       : 'text-indigo-600 hover:bg-indigo-100/80 bg-white shadow-sm border border-indigo-50'
                   }`}
                 >
                    <Mic className="w-4 h-4" />
                 </button>
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()} 
                   className="p-3 text-indigo-600 hover:bg-indigo-100/80 bg-white shadow-sm border border-indigo-50 rounded-xl transition-colors"
                 >
                    <ImageIcon className="w-4 h-4" />
                 </button>
               </>
             )}
          </div>
        </div>
        <AnimatePresence>
          {aiProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 z-10 border border-indigo-100">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600 animate-pulse">AI đang phân tích...</span>
            </motion.div>
          )}
        </AnimatePresence>
        {aiError && (
           <div className="mt-3 text-xs text-red-500 font-semibold text-center">{aiError}</div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
         <div className="h-px bg-neutral-100 flex-1"></div>
         <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hoặc nhập thủ công</span>
         <div className="h-px bg-neutral-100 flex-1"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex p-1 bg-neutral-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Minus className="w-4 h-4" /> Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              type === TransactionType.INCOME ? 'bg-white shadow-sm text-green-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Plus className="w-4 h-4" /> Thu nhập
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Số tiền</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">đ</span>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold font-mono text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all placeholder:text-neutral-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Danh mục</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Ngày</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Ghi chú</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-4 h-4 text-neutral-400" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={2}
              className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all resize-none placeholder:text-neutral-300"
              placeholder="Nhập ghi chú..."
            />
            {isAutoCategorizing && (
              <div className="absolute right-3 top-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" /> Xác nhận
            </>
          )}
        </button>
      </form>
    </>
  );

  if (inline) {
    return (
       <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 mb-8 lg:mb-0">
          {formContent}
       </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {formContent}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

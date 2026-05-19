import React, { useState, useRef, memo } from 'react';
import { X, Plus, Minus, Calendar, Tag, FileText, Check, Mic, Loader2, Sparkles, Image as ImageIcon, Send, Clock, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionType, Transaction, TransactionStatus } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { GoogleGenAI, Type } from "@google/genai";
import { useCurrency } from '../lib/CurrencyContext';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactions: Transaction[];
  inline?: boolean;
}

export default memo(function TransactionForm({ isOpen, onClose, inline, onSuccess, transactions }: TransactionFormProps) {
  const { currencySymbol } = useCurrency();
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES.find(c => c.type === 'expense')?.id || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.COMPLETED);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [smartText, setSmartText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\./g, ''); // Remove existing dots
      if (rawValue === '') {
          setAmount('');
          return;
      }
      if (/^\d*$/.test(rawValue)) { // Only digits allowed
          const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          setAmount(formattedValue);
      }
  };

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
          const { generateContent } = await import('../lib/gemini');
          
          const categoriesInfo = DEFAULT_CATEGORIES.map(c => ({ id: c.id, name: c.name, type: c.type }));
          const catsStr = JSON.stringify(categoriesInfo);

          const prompt = `Phân tích hóa đơn, hình ảnh chuyển khoản ngân hàng, lịch sử trả tiền, hoặc biên lai này. 
CHÚ Ý CÁC BƯỚC SAU THẬT KỸ:
1. Xác định giao dịch GẦN NHẤT (trên cùng) nếu có nhiều giao dịch. BỎ QUA các giao dịch có chữ "Đã hủy". Chỉ lấy giao dịch thành công.
2. Dòng tiền:
   - Nếu số tiền có dấu "+" (cộng) hoặc chữ "Nhận" / "Tiền vào" -> type là "income".
   - Nếu số tiền có dấu "-" (trừ) hoặc chữ "Thanh toán" / "Nạp" / "Trừ" -> type là "expense".
3. TRÍCH XUẤT MÔ TẢ (description):
   - Ghi rõ nội dung giao dịch, ví dụ "Nạp điện thoại", "Nhận tiền từ TRUONG THI THUY", "FUNTAP - Goi-50000".
   - BẮT BUỘC nhận diện Nguồn tiền/Ví điện tử từ giao diện hoặc logo và THÊM VÀO CUỐI MÔ TẢ dạng "- Nguồn: [Tên nguồn]".
   - Nhìn màu sắc giao diện/icon để đoán ví nếu không có chữ rõ: Đỏ/Hồng -> MoMo; Xanh lá sẫm -> Viettel Money; Xanh dương -> ZaloPay.
   - Nhìn dòng chữ nhỏ ở dưới (VD: "Từ Túi Thần Tài", "Số dư sinh lời", "MBBank") để ghi rõ nguồn. 
   - Ví dụ: "Nạp điện thoại - Nguồn: Viettel Money" hoặc "FUNTAP - Nguồn: ZaloPay (Số dư sinh lời)".
4. PHÂN LOẠI (categoryId):
   - Chọn ra MỘT categoryId phù hợp nhất trong danh sách sau: ${catsStr}
   - Đóng vai là hệ thống AI đa phương thức Gemma 4 tiên tiến, hãy phân tích cực kỳ cẩn thận từ bối cảnh giao dịch, thông tin nhỏ xíu trong ảnh. Dựa vào nội dung giao dịch hoặc icon của giao dịch (chẳng hạn nạp thẻ game -> Giải trí -> cat_entertainment, điện thoại -> cat_utils, ăn uống -> cat_food, nhận tiền -> cat_other_inc). Chọn chính xác ID (ví dụ: "cat_entertainment").`;

          const response = await generateContent({
            // Sử dụng gemini-2.5-flash dưới danh nghĩa hệ thống Gemma-4-26b
            model: "gemini-2.5-flash",
            contents: {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType,
                  }
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.INTEGER, description: "Số tiền nguyên bản (không dấu phân cách, là số dương)" },
                  type: { type: Type.STRING, enum: ['expense', 'income'], description: "Phân loại hóa đơn là thu (income) hay chi (expense) dựa vào dấu +/-" },
                  description: { type: Type.STRING, description: "Nội dung chi tiêu chi tiết kèm nguồn tiền (Ví dụ: Thanh toán điện - Nguồn: MoMo)" },
                  categoryId: { type: Type.STRING, description: "ID của thể loại được chọn từ danh sách cung cấp" }
                },
                required: ["amount", "type", "description", "categoryId"]
              }
            }
          });

          const resultText = response.text || '';
          const jsonStrMatch = resultText.match(/\{[\s\S]*\}/);
          if (jsonStrMatch) {
             const data = JSON.parse(jsonStrMatch[0]);
             if (data.amount) {
               const cleanedStr = data.amount.toString().replace(/[^\d]/g, '');
               const formattedValue = cleanedStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
               setAmount(formattedValue);
             }
             if (data.type === 'expense' || data.type === 'income') setType(data.type as TransactionType);
             if (data.description) setDescription(data.description);
             
             if (data.categoryId) {
                const validCat = DEFAULT_CATEGORIES.find(c => c.id === data.categoryId);
                if (validCat) {
                   setCategory(validCat.id);
                   setType(validCat.type === 'both' ? data.type : validCat.type);
                }
             }
          } else {
             setAiError('Không hiểu được ảnh, vui lòng nhập thủ công');
          }
        } catch (error: any) {
          console.error(error);
          let errMsg = error instanceof Error ? error.message : 'Không xác định';
          if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("API key") || errMsg.includes("Khóa API") || errMsg.includes("API_KEY")) {
             errMsg = "Khóa API không hợp lệ. Vui lòng vào Cài đặt (Settings) -> Secrets để nhập hoặc đổi khóa GEMINI_API_KEY.";
          } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
             errMsg = "Hệ thống đang quá tải hoặc hết hạn mức. Vui lòng thêm/đổi khóa GEMINI_API_KEY trong Settings -> Secrets.";
          }
          setAiError(`Lỗi AI: ${errMsg}`);
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
      const { generateContent } = await import('../lib/gemini');
      
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

      const response = await generateContent({
        model: "gemini-2.5-flash",
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
      const { generateContent } = await import('../lib/gemini');
      
      const response = await generateContent({
        model: "gemini-2.5-flash",
        contents: `Phân tích câu nói: "${text}".`,
        config: {
          systemInstruction: "Bạn là chuyên gia phân tích giao dịch tài chính. Trích xuất thông tin giao dịch chính xác từ câu nói của người dùng.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.INTEGER, description: "Số tiền giao dịch, không dấu phân cách" },
              type: { type: Type.STRING, enum: ['expense', 'income'], description: "Loại giao dịch" },
              description: { type: Type.STRING, description: "Mô tả ngắn gọn" },
              categoryKeyword: { type: Type.STRING, description: "Từ khóa thể loại ví dụ: ăn uống, di chuyển" }
            },
            required: ["amount", "type", "description", "categoryKeyword"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.amount) {
          const formattedValue = data.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          setAmount(formattedValue);
      }
      if (data.type) setType(data.type as TransactionType);
      if (data.description) setDescription(data.description);
      
      if (data.categoryKeyword) {
          const kw = data.categoryKeyword.toLowerCase();
          const cats = DEFAULT_CATEGORIES.filter(c => c.type === (data.type as TransactionType) || c.type === 'both');
          const found = cats.find(c => c.name.toLowerCase().includes(kw) || c.id.toLowerCase().includes(kw));
          if (found) setCategory(found.id);
          else if (cats.length > 0) setCategory(cats[0].id);
      }
    } catch (error: any) {
      console.error(error);
      let errMsg = error instanceof Error ? error.message : 'Không xác định';
      if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid") || errMsg.includes("API key") || errMsg.includes("Khóa API") || errMsg.includes("API_KEY")) {
          errMsg = "Khóa API không hợp lệ. Vui lòng vào Cài đặt (Settings) -> Secrets để nhập hoặc đổi khóa GEMINI_API_KEY.";
      } else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          errMsg = "Hệ thống đang quá tải hoặc hết hạn mức. Vui lòng thêm/đổi khóa GEMINI_API_KEY trong Settings -> Secrets.";
      }
      setAiError(`Lỗi AI: ${errMsg}`);
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
    recognition.interimResults = true; // Enable real-time updates
    
    recognition.onstart = () => {
       setIsListening(true);
       setSmartText('');
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = finalTranscript || interimTranscript;
      if (currentText) {
         setSmartText(currentText);
      }
      
      if (finalTranscript) {
         // Process final text
         processSmartInput(finalTranscript);
      }
    };
    
    recognition.onend = () => {
       setIsListening(false);
    };
    
    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const parsedAmount = parseFloat(amount.replace(/\./g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setLoading(true);
    const path = `users/${auth.currentUser.uid}/transactions`;
    try {
      const transactionData: Omit<Transaction, 'id'> = {
        amount: parseFloat(amount.replace(/\./g, '')),
        type,
        status,
        category,
        description,
        date: new Date(date).toISOString(),
        userId: auth.currentUser.uid,
        ...(isRecurring ? { isRecurring, recurringPeriod } : {}),
      };

      await addDoc(collection(db, path), transactionData);
      
      // Send notification about financial changes
      try {
        const notifPath = `users/${auth.currentUser.uid}/notifications`;
        await addDoc(collection(db, notifPath), {
          type: type === 'income' ? 'finance_add' : 'finance_sub',
          title: type === 'income' ? 'Nhận tiền' : 'Chi tiêu',
          description: `${type === 'income' ? '+' : '-'} ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transactionData.amount)} cho ${description || 'khoản chi/thu'}`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          createdAt: Date.now()
        });
      } catch (e) {
        console.error("Failed to add notification", e);
      }

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

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = DEFAULT_CATEGORIES.filter(c => c.type === newType || c.type === 'both');
    if (!validCats.find(c => c.id === category) && validCats.length > 0) {
      setCategory(validCats[0].id);
    }
  };

  const filteredCategories = DEFAULT_CATEGORIES.filter(c => c.type === type || c.type === 'both');

  const formContent = (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Thêm giao dịch</h2>
        {!inline && (
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-3xl transition-colors">
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
        <div className={`flex items-center bg-neutral-50/50 border ${isListening ? 'border-orange-300 ring-2 ring-orange-100' : 'border-neutral-100'} focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-100 rounded-3xl p-1.5 transition-all`}>
          <div className="pl-3 pr-2 hidden sm:flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-neutral-500" />
          </div>
          <input 
            type="text" 
            placeholder={isListening ? "Đang nghe..." : "AI thông minh (vd: ăn trưa 50k)..."}
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && smartText.trim()) {
                 e.preventDefault();
                 processSmartInput(smartText);
                 setSmartText('');
              }
            }}
            disabled={aiProcessing}
            className={`flex-1 bg-transparent border-none outline-none text-base p-2.5 font-medium placeholder:text-neutral-400 ${isListening ? 'text-neutral-600 animate-pulse' : 'text-neutral-900'}`}
          />
          <div className="flex items-center gap-1 shrink-0">
             {smartText.trim() ? (
               <button 
                 type="button"
                 onClick={() => { processSmartInput(smartText); setSmartText(''); }} 
                 className="p-3 bg-neutral-600 text-white hover:bg-neutral-700 active:scale-95 rounded-3xl transition-all shadow-md shadow-neutral-600/20"
               >
                 <Send className="w-4 h-4 ml-0.5" />
               </button>
             ) : (
               <>
                 <button 
                   type="button"
                   onClick={handleVoiceInput} 
                   className={`p-3 rounded-3xl transition-all active:scale-95 ${
                     isListening 
                       ? 'bg-orange-500 text-white animate-pulse shadow-md shadow-orange-500/20' 
                       : 'text-neutral-600 hover:bg-neutral-100/80 bg-white shadow-sm border border-neutral-50'
                   }`}
                 >
                    <Mic className="w-4 h-4" />
                 </button>
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()} 
                   className="p-3 text-neutral-600 hover:bg-neutral-100/80 bg-white shadow-sm border border-neutral-50 rounded-3xl transition-all active:scale-95"
                 >
                    <ImageIcon className="w-4 h-4" />
                 </button>
               </>
             )}
          </div>
        </div>
        <AnimatePresence>
          {aiProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center gap-2 z-10 border border-neutral-100">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
              <span className="text-sm font-semibold text-neutral-600 animate-pulse">AI đang phân tích...</span>
            </motion.div>
          )}
        </AnimatePresence>
        {aiError && (
           <div className="mt-3 text-xs text-orange-500 font-semibold text-center">{aiError}</div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
         <div className="h-px bg-neutral-100 flex-1"></div>
         <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hoặc nhập thủ công</span>
         <div className="h-px bg-neutral-100 flex-1"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex p-1 bg-neutral-100 rounded-3xl">
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl transition-all active:scale-95 ${
              type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-orange-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Minus className="w-4 h-4" /> Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl transition-all active:scale-95 ${
              type === TransactionType.INCOME ? 'bg-white shadow-sm text-neutral-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Plus className="w-4 h-4" /> Thu nhập
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Số tiền</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">{currencySymbol}</span>
            <input
              type="text"
              required
              value={amount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-4 pl-10 pr-4 text-2xl font-bold font-mono text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all placeholder:text-neutral-300"
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
                className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
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
                className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
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
              className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-3 pl-11 pr-4 text-base font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none transition-all resize-none placeholder:text-neutral-300"
              placeholder="Nhập ghi chú..."
            />
            {isAutoCategorizing && (
              <div className="absolute right-3 top-3">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">Tùy chọn bổ sung</label>
          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-3 pl-11 pr-4 text-sm font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
                >
                   <option value={TransactionStatus.COMPLETED}>Hoàn thành</option>
                   <option value={TransactionStatus.PENDING}>Đang chờ</option>
                </select>
             </div>
             
             <div className="relative">
                <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select
                  value={isRecurring ? recurringPeriod : 'none'}
                  onChange={(e) => {
                     const val = e.target.value;
                     if (val === 'none') {
                        setIsRecurring(false);
                     } else {
                        setIsRecurring(true);
                        setRecurringPeriod(val as any);
                     }
                  }}
                  className="w-full bg-[#f8f9fa] border border-neutral-200 rounded-3xl py-3 pl-11 pr-4 text-sm font-semibold text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none appearance-none transition-all"
                >
                   <option value="none">Không lặp lại</option>
                   <option value="daily">Mỗi ngày</option>
                   <option value="weekly">Mỗi tuần</option>
                   <option value="monthly">Mỗi tháng</option>
                   <option value="yearly">Mỗi năm</option>
                </select>
             </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 active:scale-95 transition-all"
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
});

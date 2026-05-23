import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Clock, Calendar, BookHeart, Plus, X, Trash2, Image as ImageIcon, Sparkles, Upload, Loader2, Bold, Italic, List } from 'lucide-react';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { User } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface LoveMemoryProps {
  user?: User | null;
}

export default function LoveMemory({ user }: LoveMemoryProps) {
  const [loveDate, setLoveDate] = useState(() => localStorage.getItem('__love_date') || '2023-01-01');
  const [marriageDate, setMarriageDate] = useState(() => localStorage.getItem('__marriage_date') || '');
  
  const [isEditingDates, setIsEditingDates] = useState(false);
  
  // Diary state
  const [memories, setMemories] = useState<any[]>([]);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryDate, setNewMemoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newMemoryPhotos, setNewMemoryPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sharedFundId, setSharedFundId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('__love_date', loveDate);
    if (marriageDate) localStorage.setItem('__marriage_date', marriageDate);
  }, [loveDate, marriageDate]);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
        const fundsSnap = await getDocs(q);
        let fundId = null;
        if (!fundsSnap.empty) {
          fundId = fundsSnap.docs[0].id;
          setSharedFundId(fundId);
        }

        const memRefStr = fundId ? `couple_data/${fundId}/diaries` : `users/${user.uid}/diaries`;
        const memSnap = await getDocs(query(collection(db, memRefStr), orderBy('date', 'desc')));
        
        if (!memSnap.empty) {
          const fetchedMemories = memSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMemories(fetchedMemories);
        }
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.GET, user ? `users/${user.uid}/diaries` : 'diaries');
      }
    };
    fetchMemories();
  }, [user]);

  const calculateTime = (dateString: string) => {
    if (!dateString) return null;
    const start = new Date(dateString);
    const now = new Date();
    
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const years = differenceInYears(now, start);
    const startAfterYears = new Date(start);
    startAfterYears.setFullYear(start.getFullYear() + years);
    
    const months = differenceInMonths(now, startAfterYears);
    const startAfterMonths = new Date(startAfterYears);
    startAfterMonths.setMonth(startAfterYears.getMonth() + months);
    
    const days = differenceInDays(now, startAfterMonths);
    const totalDays = differenceInDays(now, start);

    return { years, months, days, totalDays };
  };

  const insertMarkdown = (syntax: string) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd } = textareaRef.current;
    const textBefore = newMemoryContent.substring(0, selectionStart);
    const textSelected = newMemoryContent.substring(selectionStart, selectionEnd);
    const textAfter = newMemoryContent.substring(selectionEnd);
    let insertedText = '';
    
    if (syntax === 'bold') insertedText = `**${textSelected || 'Đậm'}**`;
    else if (syntax === 'italic') insertedText = `*${textSelected || 'Nghiêng'}*`;
    else if (syntax === 'list') insertedText = `\n- ${textSelected || 'Danh sách'}`;
    
    setNewMemoryContent(textBefore + insertedText + textAfter);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          const storageRef = ref(storage, `memories/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          uploadedUrls.push(url);
      }
      setNewMemoryPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAIGenerate = async () => {
      if (!aiPrompt.trim() || !user) return;
      setIsGeneratingAI(true);
      try {
          const res = await fetch('/api/gemini/generateImage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: aiPrompt })
          });
          const data = await res.json();
          if (data.imageUrl) {
              const resData = await fetch(data.imageUrl);
              const blob = await resData.blob();
              const storageRef = ref(storage, `memories/${user.uid}/ai_${Date.now()}.png`);
              await uploadBytes(storageRef, blob);
              const url = await getDownloadURL(storageRef);
              setNewMemoryPhotos(prev => [...prev, url]);
              setAIPrompt('');
              setShowAIPrompt(false);
          } else {
              alert(data.error || "Failed to generate image.");
          }
      } catch (e) {
          console.error(e);
          alert("Có lỗi xảy ra khi tạo ảnh bằng AI.");
      } finally {
          setIsGeneratingAI(false);
      }
  };

  const removePhoto = (index: number) => {
    setNewMemoryPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const [isInitializingSample, setIsInitializingSample] = useState(false);

  const handleCreateSampleMemory = async () => {
    if (!user) return;
    setIsInitializingSample(true);
    const memRefStr = sharedFundId ? `couple_data/${sharedFundId}/diaries` : `users/${user.uid}/diaries`;
    try {
      const docRefList = [
        {
          title: "Chuyến Đi Đầu Tiên Bên Nhau 🗺️",
          content: "Hôm nay là chuyến đi dã ngoại đầu tiên của hai đứa mình. Dưới làn gió mát lành và những dải nắng nhẹ nhàng, chúng ta đã cùng nhau trò chuyện hàng giờ, chia sẻ cho nhau những câu chuyện xưa cũ về tuổi thơ, những gánh nặng công việc thường ngày và những ước nguyện ngô nghê cho tương lai.\n\nKhoảnh khắc tớ tựa vào bờ vai vững chãi của cậu bỗng chốc nhận ra thế gian này nhẹ bẫng, dường như mọi giông gió ngoài kia đều bị đẩy lui. Tớ biết từ giây phút này, tớ muốn có cậu đồng hành trên mọi chặng đường tiếp theo. ❤️",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          photos: [
            "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1549417229-de67d32e60b6?auto=format&fit=crop&q=80&w=400"
          ]
        },
        {
          title: "Nắm Tay Nhau Ngắm Hoàng Hôn ☀️",
          content: "Một buổi chiều vàng ươm dịu ngọt, chúng mình dắt tay nhau đi qua từng góc phố nhỏ rực rỡ nắng thẫm. Cậu khẽ đan ngón tay ấm áp gầy gầy của cậu vào bàn tay tớ, và tớ cảm thấy sự an tâm chảy tràn lấp lánh như nắng chiều thu.\n\nMọi mệt mỏi trong một tuần vất vả đều tan biến đi hết, bỗng nhiên chỉ còn tình yêu đơn sơ nâng niu giữa cuộc sống vội vã.",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          photos: [
            "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400"
          ]
        }
      ];

      const insertedMemories: any[] = [];
      for (const item of docRefList) {
        const docRef = doc(collection(db, memRefStr));
        const payload = {
          ...item,
          createdAt: serverTimestamp()
        };
        await setDoc(docRef, payload);
        insertedMemories.push({ id: docRef.id, ...payload });
      }

      setMemories(prev => [...insertedMemories, ...prev]);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, memRefStr);
    } finally {
      setIsInitializingSample(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryTitle.trim() || !user) return;

    const memRefStr = sharedFundId ? `couple_data/${sharedFundId}/diaries` : `users/${user.uid}/diaries`;
    try {
      const docRef = doc(collection(db, memRefStr));
      const newMemory = {
        title: newMemoryTitle,
        content: newMemoryContent,
        date: newMemoryDate,
        photos: newMemoryPhotos,
        createdAt: serverTimestamp()
      };
      await setDoc(docRef, newMemory);
      setMemories([{ id: docRef.id, ...newMemory }, ...memories]);
      setNewMemoryTitle('');
      setNewMemoryContent('');
      setNewMemoryDate(new Date().toISOString().split('T')[0]);
      setNewMemoryPhotos([]);
      setShowAddMemory(false);
    } catch(err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, memRefStr);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!user) return; 
    const memRefStr = sharedFundId ? `couple_data/${sharedFundId}/diaries` : `users/${user.uid}/diaries`;
    try {
      await deleteDoc(doc(db, memRefStr, id));
      setMemories(memories.filter(m => m.id !== id));
    } catch(err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `${memRefStr}/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2 mb-8 pt-4">
        <h2 className="text-4xl font-display font-bold text-pink-600 tracking-tight flex items-center justify-center gap-3">
          <Heart className="w-10 h-10 fill-pink-500" />
          Góc Kỷ Niệm
        </h2>
        <p className="text-neutral-500 text-lg">Cùng nhau đếm ngược thanh xuân và ghi lại những khoảnh khắc.</p>
      </div>

      {/* Time Counters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-pink-100/50 border border-pink-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Clock className="w-32 h-32" />
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold font-display text-neutral-800">Bộ đếm thời gian</h3>
          <button 
            onClick={() => setIsEditingDates(!isEditingDates)}
            className="text-sm font-semibold text-pink-500 hover:text-pink-600 px-3 py-1.5 bg-pink-50 rounded-3xl"
          >
            {isEditingDates ? 'Xong' : 'Chỉnh sửa ngày'}
          </button>
        </div>

        {isEditingDates && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid md:grid-cols-2 gap-4 mb-8 bg-neutral-50 p-4 rounded-3xl">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Ngày chính thức yêu nhau</label>
              <input type="date" value={loveDate} onChange={e => setLoveDate(e.target.value)} className="w-full p-2.5 rounded-3xl border border-neutral-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">Ngày cưới (tuỳ chọn)</label>
              <input type="date" value={marriageDate} onChange={e => setMarriageDate(e.target.value)} className="w-full p-2.5 rounded-3xl border border-neutral-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100" />
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          {/* Love Duration */}
          {loveDate && (
            <div className="bg-neo-bg rounded-3xl p-6 border border-pink-100">
              <div className="flex items-center gap-2 text-pink-600 mb-4 font-semibold uppercase tracking-wider text-sm">
                <Heart className="w-4 h-4 fill-pink-500" /> Đã yêu nhau
              </div>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black font-display text-pink-600 tracking-tight leading-none mb-2">
                  {calculateTime(loveDate)?.totalDays || 0}
                </span>
                <span className="text-pink-400 font-medium mb-4">Ngày</span>
                
                <div className="flex gap-4 text-center divide-x divide-pink-200 w-full justify-center">
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.years || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Năm</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.months || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Tháng</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(loveDate)?.days || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Ngày</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marriage Duration */}
          {marriageDate ? (
            <div className="bg-neo-bg rounded-3xl p-6 border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-600 mb-4 font-semibold uppercase tracking-wider text-sm">
                <Calendar className="w-4 h-4" /> Đã chung một nhà
              </div>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black font-display text-neutral-600 tracking-tight leading-none mb-2">
                  {calculateTime(marriageDate)?.totalDays || 0}
                </span>
                <span className="text-neutral-400 font-medium mb-4">Ngày</span>
                
                <div className="flex gap-4 text-center divide-x divide-neutral-200 w-full justify-center">
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.years || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Năm</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.months || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Tháng</div>
                  </div>
                  <div className="px-4">
                    <div className="text-2xl font-bold text-neutral-800">{calculateTime(marriageDate)?.days || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase">Ngày</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-100 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-neutral-500 font-medium max-w-xs">Chưa có thông tin ngày đăng ký kết hôn / ngày cưới.</p>
              <button onClick={() => setIsEditingDates(true)} className="mt-4 text-sm font-bold text-pink-500">Cập nhật ngay</button>
            </div>
          )}
        </div>
      </div>

      {/* Love Diary */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-2xl font-bold font-display text-neutral-800 flex items-center gap-2">
            <BookHeart className="w-6 h-6 text-pink-500" /> Nhật ký tình yêu
          </h3>
          <button 
            onClick={() => setShowAddMemory(!showAddMemory)}
            className="flex items-center gap-1.5 bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            {showAddMemory ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddMemory ? 'Đóng' : 'Thêm kỷ niệm'}
          </button>
        </div>

        <AnimatePresence>
          {showAddMemory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={handleAddMemory} className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Tiêu đề / Sự kiện</label>
                    <input 
                      type="text" 
                      required
                      value={newMemoryTitle}
                      onChange={e => setNewMemoryTitle(e.target.value)}
                      className="w-full border-b-2 border-neutral-200 py-2 px-1 outline-none focus:border-pink-500 transition-colors bg-transparent font-medium"
                      placeholder="Ví dụ: Chuyến đi du lịch đầu tiên..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Ngày diễn ra</label>
                    <input 
                      type="date" 
                      required
                      value={newMemoryDate}
                      onChange={e => setNewMemoryDate(e.target.value)}
                      className="w-full border-b-2 border-neutral-200 py-2 px-1 outline-none focus:border-pink-500 transition-colors bg-transparent font-medium"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Nội dung</label>
                    <div className="flex gap-2">
                      {isPreviewMode ? (
                        <button type="button" onClick={() => setIsPreviewMode(false)} className="text-xs font-bold text-pink-500 hover:text-pink-600">Chỉnh sửa</button>
                      ) : (
                        <button type="button" onClick={() => setIsPreviewMode(true)} className="text-xs font-bold text-neutral-500 hover:text-neutral-700">Xem trước</button>
                      )}
                    </div>
                  </div>
                  
                  {!isPreviewMode ? (
                    <div className="border-2 border-neutral-200 rounded-3xl overflow-hidden focus-within:border-pink-500 transition-colors bg-transparent">
                      <div className="flex items-center gap-1 p-2 border-b border-neutral-100 bg-neutral-50">
                        <button type="button" onClick={() => insertMarkdown('bold')} className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-200" title="In đậm"><Bold className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertMarkdown('italic')} className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-200" title="In nghiêng"><Italic className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertMarkdown('list')} className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-200" title="Danh sách"><List className="w-4 h-4" /></button>
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={newMemoryContent}
                        onChange={e => setNewMemoryContent(e.target.value)}
                        className="w-full p-4 outline-none min-h-[150px] resize-y"
                        placeholder="Lưu lại những cảm xúc, kỷ niệm đáng nhớ... (Hỗ trợ Markdown)"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-neutral-200 rounded-3xl p-4 min-h-[150px] bg-neutral-50 overflow-y-auto markdown-body">
                      {newMemoryContent ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{newMemoryContent}</ReactMarkdown>
                      ) : (
                        <p className="text-neutral-400 italic">Chưa có nội dung...</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Hình ảnh đính kèm</label>
                  
                  {newMemoryPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {newMemoryPhotos.map((photo, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-neutral-200 group">
                          <img src={photo} alt={`Memory ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-3xl transition-colors">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Tải ảnh lên
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />

                    <button type="button" onClick={() => setShowAIPrompt(!showAIPrompt)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-sm font-semibold rounded-3xl transition-colors border border-pink-200">
                      <Sparkles className="w-4 h-4" />
                      Tạo bằng AI
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAIPrompt && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 mt-2 space-y-2">
                           <input type="text" value={aiPrompt} onChange={(e) => setAIPrompt(e.target.value)} placeholder="Mô tả bức ảnh bạn muốn tạo..." className="w-full text-sm p-2 outline-none border border-neutral-200 rounded-xl" />
                           <div className="flex justify-end">
                             <button type="button" onClick={handleAIGenerate} disabled={isGeneratingAI || !aiPrompt.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50">
                               {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
                             </button>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="pt-2 text-right">
                  <button type="submit" className="bg-pink-500 text-white font-bold px-6 py-2 rounded-3xl hover:bg-pink-600 transition-colors">
                    Lưu Khoảnh Khắc
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {memories.length === 0 && !showAddMemory && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 px-4 bg-white/50 rounded-3xl border border-dashed border-neutral-300">
                <BookHeart className="w-14 h-14 text-pink-300 mx-auto mb-3" />
                <p className="text-neutral-500 mb-4 font-medium">Chưa có kỷ niệm nào được ghi lại.</p>
                <button
                  type="button"
                  onClick={handleCreateSampleMemory}
                  disabled={isInitializingSample}
                  className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:bg-neutral-300 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md shadow-pink-100"
                >
                  {isInitializingSample ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang khơi gợi mầm yêu...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Tải kỷ niệm mẫu ngọt ngào ✨
                    </>
                  )}
                </button>
              </motion.div>
            )}
            
            {memories.map((mem) => (
              <motion.div 
                layout
                key={mem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col md:flex-row gap-6 relative group hover:shadow-md transition-shadow"
              >
                <div className="md:w-32 shrink-0 flex flex-col justify-center items-center text-center bg-pink-50 text-pink-700 rounded-3xl p-4">
                  <span className="text-3xl font-black font-display leading-none">{new Date(mem.date).getDate()}</span>
                  <span className="text-sm font-bold uppercase tracking-widest mt-1">Th {new Date(mem.date).getMonth() + 1}</span>
                  <span className="text-xs text-pink-500/80 font-medium">{new Date(mem.date).getFullYear()}</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-neutral-900 mb-2" title={mem.title}>{mem.title}</h4>
                  <div className="text-neutral-600 text-sm leading-relaxed mb-4 markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mem.content || ''}</ReactMarkdown>
                  </div>
                  
                  {mem.photos && mem.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mem.photos.map((photo: string, index: number) => (
                        <a key={index} href={photo} target="_blank" rel="noreferrer" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-neutral-200 block hover:opacity-90 transition-opacity">
                          <img src={photo} alt={`Memory img ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="absolute top-4 right-4 md:opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 bg-white shadow-sm p-2 rounded-full transition-all"
                  title="Xoá kỷ niệm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

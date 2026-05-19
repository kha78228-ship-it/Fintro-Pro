import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Coffee, Music, Trees, UtensilsCrossed, Plus, X, CheckCircle, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

interface DateIdeasProps {
  user?: User | null;
}

const DEFAULT_IDEAS = [
    {
      id: 'default-1',
      title: "Làm gốm cuối tuần",
      desc: "Cùng nhau lấm lem bùn đất và tạo ra chiếc cốc đôi độc nhất vô nhị. Phù hợp cho ngày mưa.",
      type: "Sáng tạo",
      icon: "Coffee",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      status: "idea"
    },
    {
      id: 'default-2',
      title: "Picnic công viên hoàng hôn",
      desc: "Chuẩn bị thảm caro, vài miếng sandwich và chút hoa quả. Ngắm ánh chiều tà rơi trên mặt hồ.",
      type: "Lãng mạn & Thiên nhiên",
      icon: "Trees",
      color: "bg-neutral-50 text-neutral-600 border-neutral-200",
      status: "idea"
    },
    {
      id: 'default-3',
      title: "Nghe nhạc Live Acoustic",
      desc: "Đưa nhau đi trốn ở một pub nhỏ, nhâm nhi cocktail và chill theo điệu nhạc.",
      type: "Thư giãn",
      icon: "Music",
      color: "bg-neutral-50 text-neutral-600 border-neutral-200",
      status: "idea"
    },
    {
      id: 'default-4',
      title: "Nấu một món mới tinh",
      desc: "Cùng đi siêu thị mua nguyên liệu cồng kềnh về nấu một món chưa từng làm bao giờ.",
      type: "Vui vẻ",
      icon: "UtensilsCrossed",
      color: "bg-orange-50 text-orange-600 border-orange-200",
      status: "idea"
    }
];

export default function DateIdeas({ user }: DateIdeasProps) {
  const [ideas, setIdeas] = useState<any[]>(DEFAULT_IDEAS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [sharedFundId, setSharedFundId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', user.uid));
        const fundsSnap = await getDocs(q);
        let fundId = null;
        if (!fundsSnap.empty) {
          fundId = fundsSnap.docs[0].id;
          setSharedFundId(fundId);
        }

        const ideasRefStr = fundId ? `couple_data/${fundId}/date_ideas` : `users/${user.uid}/date_ideas`;
        const ideasSnap = await getDocs(collection(db, ideasRefStr));
        
        if (!ideasSnap.empty) {
          const fetchedIdeas = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setIdeas([...DEFAULT_IDEAS, ...fetchedIdeas]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchIdeas();
  }, [user]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    try {
      const ideasRefStr = sharedFundId ? `couple_data/${sharedFundId}/date_ideas` : `users/${user.uid}/date_ideas`;
      const docRef = doc(collection(db, ideasRefStr));
      const newIdea = {
        title: newTitle,
        desc: newDesc,
        type: "Khám phá",
        icon: "Map",
        color: "bg-orange-50 text-orange-600 border-orange-200",
        status: "idea",
        createdAt: serverTimestamp()
      };
      await setDoc(docRef, newIdea);
      setIdeas([{ id: docRef.id, ...newIdea }, ...ideas]);
      setNewTitle('');
      setNewDesc('');
      setShowAddForm(false);
    } catch(err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    if (id.startsWith('default') || !user) return; 
    const newStatus = currentStatus === 'done' ? 'idea' : 'done';
    
    try {
      const ideasRefStr = sharedFundId ? `couple_data/${sharedFundId}/date_ideas` : `users/${user.uid}/date_ideas`;
      await setDoc(doc(db, ideasRefStr, id), { status: newStatus }, { merge: true });
      setIdeas(ideas.map(i => i.id === id ? { ...i, status: newStatus } : i));
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('default') || !user) return; 
    try {
      const ideasRefStr = sharedFundId ? `couple_data/${sharedFundId}/date_ideas` : `users/${user.uid}/date_ideas`;
      await deleteDoc(doc(db, ideasRefStr, id));
      setIdeas(ideas.filter(i => i.id !== id));
    } catch(err) {
      console.error(err);
    }
  };

  const renderIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'Coffee': return <Coffee className="w-5 h-5" />;
      case 'Trees': return <Trees className="w-5 h-5" />;
      case 'Music': return <Music className="w-5 h-5" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-5 h-5" />;
      default: return <Map className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-orange-600 tracking-tight flex items-center justify-center gap-3">
          <Map className="w-8 h-8 fill-orange-100" />
          Kho Ý Tưởng Hẹn Hò
        </h2>
        <p className="text-neutral-500">Gợi ý trải nghiệm & lưu lại những ngày hẹn hò sắp tới.</p>
      </div>

      <div className="flex justify-center mb-6">
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 text-white font-bold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors shadow-sm"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Đóng form' : 'Thêm hẹn hò mới'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <form onSubmit={handleAddIdea} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Tên hoạt động</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border-b-2 border-neutral-200 py-2 px-1 outline-none focus:border-orange-500 transition-colors bg-transparent font-medium"
                  placeholder="Ví dụ: Đi ăn dimsum ở quận 5..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Mô tả (Tuỳ chọn)</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border-b-2 border-neutral-200 py-2 px-1 outline-none focus:border-orange-500 transition-colors bg-transparent"
                  placeholder="Ghi chú thêm về chuyến đi..."
                  rows={2}
                />
              </div>
              <div className="pt-2 text-right">
                <button type="submit" className="bg-orange-500 text-white font-bold px-6 py-2 rounded-3xl hover:bg-orange-600 transition-colors">
                  Lưu Ý Tưởng
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {ideas.map((idea, idx) => (
            <motion.div 
              layout
              key={idea.id || idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex flex-col gap-4 p-6 bg-white rounded-3xl shadow-sm border border-neutral-100 transition-all ${idea.status === 'done' ? 'opacity-60 bg-neutral-50 grayscale' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${idea.color}`}>
                  {renderIcon(idea.icon)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{idea.type}</span>
                  </div>
                  <h3 className={`text-lg font-bold text-neutral-900 leading-tight mb-2 ${idea.status === 'done' ? 'line-through' : ''}`}>
                    {idea.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{idea.desc}</p>
                </div>
              </div>
              
              {!idea.id.toString().startsWith('default') && (
                <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-neutral-100">
                  <button 
                    onClick={() => handleStatusUpdate(idea.id, idea.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-sm font-semibold transition-colors ${idea.status === 'done' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                  >
                    <CheckCircle className="w-4 h-4" /> {idea.status === 'done' ? 'Đã thử' : 'Đánh dấu đã thử'}
                  </button>
                  <button 
                    onClick={() => handleDelete(idea.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Xoá
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

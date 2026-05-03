import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, Plus, Gift, Cake, CalendarHeart, Shirt, Star, Heart, Trash2, X, Check } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface ForgetMeNotsProps {
  user: any;
}

interface NoteItem {
  id: string;
  title: string;
  value: string;
  iconType: string;
  createdAt?: any;
}

const ICON_OPTIONS = [
  { id: 'shirt', icon: <Shirt className="w-5 h-5 text-indigo-500" />, label: 'Size', color: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
  { id: 'gift', icon: <Gift className="w-5 h-5 text-pink-500" />, label: 'Quà tặng', color: 'bg-pink-50 text-pink-500 border-pink-200' },
  { id: 'cake', icon: <Cake className="w-5 h-5 text-amber-500" />, label: 'Đồ ăn', color: 'bg-amber-50 text-amber-500 border-amber-200' },
  { id: 'calendar', icon: <CalendarHeart className="w-5 h-5 text-rose-500" />, label: 'Ngày tháng', color: 'bg-rose-50 text-rose-500 border-rose-200' },
  { id: 'star', icon: <Star className="w-5 h-5 text-yellow-500" />, label: 'Sở thích', color: 'bg-yellow-50 text-yellow-500 border-yellow-200' },
  { id: 'heart', icon: <Heart className="w-5 h-5 text-red-500" />, label: 'Khác', color: 'bg-red-50 text-red-500 border-red-200' },
];

export default function ForgetMeNots({ user }: ForgetMeNotsProps) {
  const [items, setItems] = useState<NoteItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIconType, setNewIconType] = useState('star');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/forgetMeNots`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: NoteItem[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as NoteItem);
      });
      setItems(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/forgetMeNots`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newValue.trim() || !user) return;

    try {
      setLoading(true);
      await addDoc(collection(db, `users/${user.uid}/forgetMeNots`), {
        title: newTitle.trim(),
        value: newValue.trim(),
        iconType: newIconType,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewTitle('');
      setNewValue('');
      setNewIconType('star');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/forgetMeNots`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/forgetMeNots/${id}`));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/forgetMeNots/${id}`);
    }
  };

  const getIconElement = (type: string) => {
    const found = ICON_OPTIONS.find(opt => opt.id === type);
    return found ? found.icon : <Star className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-display font-bold text-sky-600 tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <Bookmark className="w-8 h-8 fill-sky-100" />
            Forget-Me-Nots
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Lưu trữ các tiểu tiết quan trọng của người ấy để trở nên tinh tế hơn.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-sky-600 text-white font-bold px-5 py-3 rounded-xl shadow-md hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-5 h-5" /> Thêm ghi chú
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-sky-50/50 p-6 rounded-3xl border border-sky-100/50 shadow-sm overflow-hidden"
          >
            <h3 className="font-bold text-sky-800 mb-4">Thêm tiểu tiết mới</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-sky-700 mb-1.5 uppercase tracking-wide">Tiêu đề (Vd: Cỡ giày, Dị ứng...)</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    maxLength={30}
                    placeholder="Sở thích nhạc..."
                    className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sky-700 mb-1.5 uppercase tracking-wide">Nội dung</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    required
                    placeholder="Pop ballad, Lofi..."
                    className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder:text-neutral-300"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-sky-700 mb-2 uppercase tracking-wide">Chọn biểu tượng</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewIconType(opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all border ${
                        newIconType === opt.id 
                          ? `${opt.color} ring-2 ring-offset-1 ring-sky-400` 
                          : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {opt.icon}
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sky-700 hover:bg-sky-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !newTitle.trim() || !newValue.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Đang lưu...' : (
                    <>
                      <Check className="w-5 h-5 flex-shrink-0" /> Lưu ghi chú
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.length === 0 && !isAdding ? (
          <div className="col-span-1 sm:col-span-2 text-center py-10 bg-white border border-neutral-100 border-dashed rounded-3xl">
            <Bookmark className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">Chưa có ghi chú nào. Hãy bắt đầu lưu lại những điều nhỏ bé về đối phương nhé!</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-sky-300 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                {getIconElement(item.iconType)}
              </div>
              <div className="flex-1 pr-8">
                <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">{item.title}</span>
                <span className="text-lg font-bold text-neutral-800 tracking-tight block break-words">{item.value}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                title="Xóa ghi chú"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

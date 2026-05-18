import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, MessageCircle, UserPlus, Calendar, X, Check, ArrowDownToLine, ArrowUpFromLine, Heart, Gamepad2, AlertCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'event' | 'finance_add' | 'finance_sub' | 'love' | 'group' | 'entertainment';
  title: string;
  description: string;
  time: string;
  read: boolean;
  createdAt: number;
}

export default function NotificationCenter({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/notifications`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
      setHasUnread(notifs.some(n => !n.read));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      try {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/notifications`, id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/notifications/${id}`);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    const unreadNotifs = notifications.filter(n => !n.read);
    const batch = writeBatch(db);
    unreadNotifs.forEach(n => {
       const ref = doc(db, `users/${auth.currentUser!.uid}/notifications`, n.id);
       batch.update(ref, { read: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/notifications`);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/notifications`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/notifications/${id}`);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-5 h-5" />;
      case 'friend_request': return <UserPlus className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'finance_add': return <ArrowDownToLine className="w-5 h-5" />;
      case 'finance_sub': return <ArrowUpFromLine className="w-5 h-5" />;
      case 'love': return <Heart className="w-5 h-5" />;
      case 'entertainment': return <Gamepad2 className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'friend_request': return 'bg-teal-100 text-teal-600 border-teal-200';
      case 'event': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'finance_add': return 'bg-green-100 text-green-600 border-green-200';
      case 'finance_sub': return 'bg-red-100 text-red-600 border-red-200';
      case 'love': return 'bg-pink-100 text-pink-600 border-pink-200';
      case 'entertainment': return 'bg-orange-100 text-orange-600 border-orange-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
        <div>
          <h2 className="text-3xl font-display font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-neutral-900 text-white rounded-2xl shadow-xl shadow-neutral-900/20">
              <Bell className="w-6 h-6" />
            </div>
            Trung tâm thông báo
          </h2>
          <p className="text-neutral-500 mt-2 text-lg">Cập nhật những hoạt động từ tài chính, tình yêu đến giải trí</p>
        </div>
        
        {hasUnread && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold bg-neutral-100 text-neutral-700 px-4 py-2.5 rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 px-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-colors border-2 ${filter === 'all' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
        >
          Tất cả thông báo
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-colors border-2 flex items-center gap-2 ${filter === 'unread' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
        >
          Chưa đọc {hasUnread && <span className="bg-red-500 w-2 h-2 rounded-full inline-block"></span>}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 flex flex-col items-center">
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 opacity-30" />
            </div>
            <p className="text-xl font-bold text-neutral-600">Bạn đã cập nhật hết rồi!</p>
            <p className="mt-2 text-neutral-500">Giờ thì không có thông báo nào mới đâu {filter === 'unread' ? 'chưa đọc ' : ''}cả.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100">
            <AnimatePresence>
              {filteredNotifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative flex items-start gap-4 p-5 sm:p-6 transition-colors group cursor-pointer ${!notif.read ? 'bg-orange-50/50' : 'hover:bg-neutral-50'}`}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (onNavigate) {
                      if (notif.type.startsWith('finance')) onNavigate('history');
                      else if (notif.type === 'love') onNavigate('love_memory');
                      else if (notif.type === 'entertainment') onNavigate('couple_games');
                      else if (notif.type === 'message' || notif.type === 'friend_request') onNavigate('social_feed');
                    }
                  }}
                >
                  <div className={`p-3.5 rounded-2xl shrink-0 border ${getColorClass(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-lg font-bold ${!notif.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Mới</span>
                      )}
                    </div>
                    <p className={`text-base leading-relaxed ${!notif.read ? 'text-neutral-700 font-medium' : 'text-neutral-500'}`}>
                      {notif.description}
                    </p>
                    <span className="text-sm font-medium text-neutral-400 mt-2 block">{notif.time}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Xóa thông báo này"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

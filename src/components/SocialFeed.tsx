import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, query, onSnapshot, serverTimestamp, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import AIAvatar from './AIAvatar';

interface SocialFeedProps {
  user: any;
  userProfile?: any;
}

export default function SocialFeed({ user, userProfile }: SocialFeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [usersInfo, setUsersInfo] = useState<Record<string, any>>({});
  
  const [newPostText, setNewPostText] = useState('');
  
  // Load posts
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPosts(postsData);
      
      // Load user info for unknown authors
      postsData.forEach(post => {
        if (!usersInfo[post.authorId]) {
          getDocs(query(collection(db, 'users'), orderBy('displayName'))).then(uSnap => {
            const uData: Record<string, any> = {};
            uSnap.forEach(d => { uData[d.id] = d.data(); });
            setUsersInfo(prev => ({ ...prev, ...uData }));
          }).catch(console.error);
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));
    return () => unsub();
  }, [user]);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    
    try {
      const newPostContent = newPostText.trim();
      setNewPostText('');
      
      await addDoc(collection(db, 'posts'), {
        text: newPostContent,
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      
    } catch (e: any) {
      alert(e.message || "Lỗi đăng bài!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post */}
      <div className="card p-4 sm:p-6 shadow-sm border border-neutral-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center font-bold shrink-0">
             {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full bg-neutral-50 border-none rounded-3xl p-4 focus:ring-2 focus:ring-neutral-500 resize-none outline-none min-h-[100px]"
            />
            
            <div className="flex items-center justify-end">
              <button 
                onClick={() => handleCreatePost()}
                disabled={!newPostText.trim()}
                className="bg-neutral-600 hover:bg-neutral-700 disabled:opacity-50 text-white px-6 py-2 rounded-3xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <Send className="w-4 h-4 ml-1" /> 
                Đăng
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts List */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts.map(post => (
             <motion.div
               key={post.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
             >
               <PostCard post={post} user={user} usersInfo={usersInfo} />
             </motion.div>
          ))}
        </AnimatePresence>
        {posts.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageCircle className="w-8 h-8 opacity-50" />
            </div>
            <p>Chưa có bài viết nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PostCard: React.FC<{ post: any, user: any, usersInfo: any }> = ({ post, user, usersInfo }) => {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const author = usersInfo[post.authorId];
  const timeStr = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString('vi-VN', { 
     hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
  }) : '';

  useEffect(() => {
    // Listen to likes
    const unsubLikes = onSnapshot(collection(db, `posts/${post.id}/likes`), snap => {
      setLikesCount(snap.size);
      setIsLiked(snap.docs.some(d => d.id === user.uid));
    });
    
    // Listen to comments
    let unsubComments = () => {};
    if (showComments) {
      unsubComments = onSnapshot(query(collection(db, `posts/${post.id}/comments`), orderBy('createdAt', 'asc')), snap => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    
    return () => { unsubLikes(); unsubComments(); }
  }, [post.id, user.uid, showComments]);

  const handleLike = async () => {
    try {
      const likeRef = doc(db, `posts/${post.id}/likes/${user.uid}`);
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { timestamp: serverTimestamp() });
      }
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addDoc(collection(db, `posts/${post.id}/comments`), {
        text: newComment.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (e) { console.error(e); }
  };
  
  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc muốn xoá bài viết này?")) return;
    try {
      await deleteDoc(doc(db, `posts/${post.id}`));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="card p-0 shadow-sm border border-neutral-100 overflow-hidden bg-white">
      <div className="p-4 sm:p-5 flex items-start justify-between">
        <div className="flex gap-3 items-center">
           <div className="w-10 h-10 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center font-bold">
             {author?.displayName ? author.displayName[0].toUpperCase() : author?.email?.[0].toUpperCase() || 'U'}
           </div>
           <div>
             <div className="font-bold text-neutral-900">{author?.displayName || author?.email || 'Người đăng ẩn danh'}</div>
             <div className="text-xs text-neutral-400">{timeStr}</div>
           </div>
        </div>
        {post.authorId === user.uid && (
          <button onClick={handleDeletePost} className="p-2 text-neutral-400 hover:text-orange-500 rounded-3xl hover:bg-orange-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {post.text && <div className="px-4 sm:px-5 pb-4 text-neutral-800 whitespace-pre-wrap leading-relaxed">{post.text}</div>}
      
      <div className="px-4 sm:px-5 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
        <div>{likesCount} Lượt thích</div>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline">{comments.length} Bình luận</button>
      </div>
      
      <div className="px-2 sm:px-3 pb-3 flex items-center gap-1">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl transition-all font-medium active:scale-95 ${isLiked ? 'text-orange-500 bg-orange-50' : 'text-neutral-500 hover:bg-neutral-100'}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> Thích
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-3xl transition-all font-medium active:scale-95 ${showComments ? 'text-neutral-600 bg-neutral-50' : 'text-neutral-500 hover:bg-neutral-100'}`}
        >
          <MessageCircle className="w-5 h-5" /> Bình luận
        </button>
      </div>
      
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-100 bg-neutral-50/50"
          >
            <div className="p-4 sm:p-5 space-y-4 max-h-[300px] overflow-y-auto">
              {comments.map(comment => {
                const cAuthor = usersInfo[comment.authorId] || {};
                return (
                  <div key={comment.id} className="flex gap-3">
                     <div className="w-8 h-8 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                       {cAuthor?.displayName ? cAuthor.displayName[0].toUpperCase() : 'U'}
                     </div>
                     <div className="bg-white px-4 py-2.5 rounded-3xl rounded-3xl shadow-sm border border-neutral-100/50 max-w-[85%]">
                       <div className="font-bold text-xs text-neutral-900 mb-0.5">{cAuthor?.displayName || 'Ẩn danh'}</div>
                       <div className="text-sm text-neutral-800 whitespace-pre-wrap">{comment.text}</div>
                     </div>
                  </div>
                );
              })}
              {comments.length === 0 && <div className="text-center text-sm text-neutral-400 py-2">Chưa có bình luận. Hãy là người đầu tiên!</div>}
            </div>
            <div className="p-3 sm:p-4 bg-white border-t border-neutral-100">
              <form onSubmit={handleComment} className="flex gap-2 relative">
                 <input 
                   type="text" 
                   value={newComment}
                   onChange={e => setNewComment(e.target.value)}
                   placeholder="Viết bình luận..."
                   className="flex-1 bg-neutral-100 border-none rounded-3xl pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-neutral-500 outline-none"
                 />
                 <button 
                   type="submit"
                   disabled={!newComment.trim()}
                   className="absolute right-1 top-1 bottom-1 w-8 bg-neutral-600 text-white rounded-3xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-neutral-700 active:scale-95"
                 >
                   <Send className="w-3.5 h-3.5 ml-0.5" />
                 </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

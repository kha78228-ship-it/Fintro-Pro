import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Lock, Unlock, Send, Sparkles, PenTool, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function DailyQuestion({ user }: { user: any }) {
  const [partner, setPartner] = useState<any>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [answer, setAnswer] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [setupMode, setSetupMode] = useState(false);

  const fetchPartner = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, `users/${user.uid}/friends`), where('relationshipType', 'in', ['Người yêu', 'Vợ chồng', 'Vợ Chồng', 'người yêu', 'vợ chồng']));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
         setPartner(snap.docs[0].data());
      } else {
         // Some might just have no relationshipType but are friends, but requirement is specifically for lovers.
         setPartner(null);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartner();
  }, [user]);

  useEffect(() => {
    if (!user || !partner) return;
    const pairId = [user.uid, partner.friendId].sort().join('_');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Fallback to pair ID as doc.
    const unsubscribe = onSnapshot(doc(db, 'couple_data', `${pairId}_dq_${todayStr}`), (docSnap) => {
      if (docSnap.exists()) {
        setQuestionData(docSnap.data());
      } else {
        setQuestionData(null);
      }
    });

    return () => unsubscribe();
  }, [user, partner]);

  const handleSetQuestion = async () => {
    if (!user || !partner || !customQuestion.trim()) return;
    const pairId = [user.uid, partner.friendId].sort().join('_');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      await setDoc(doc(db, 'couple_data', `${pairId}_dq_${todayStr}`), {
        question: customQuestion.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        answers: {}
      }, { merge: true });
      setSetupMode(false);
      setCustomQuestion('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'couple_data');
    }
  };

  const handleAnswer = async () => {
    if (!user || !partner || !answer.trim() || !questionData) return;
    const pairId = [user.uid, partner.friendId].sort().join('_');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      await setDoc(doc(db, 'couple_data', `${pairId}_dq_${todayStr}`), {
        answers: {
          [user.uid]: answer.trim()
        }
      }, { merge: true });
      setAnswer('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'couple_data');
    }
  };

  if (loading) {
     return <div className="p-8 text-center text-neutral-500">Đang tải...</div>;
  }

  if (!partner) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center pt-10">
         <Heart className="w-16 h-16 text-neutral-300 mx-auto" />
         <h2 className="text-2xl font-bold text-neutral-700">Chưa có người ấy</h2>
         <p className="text-neutral-500">Hãy thêm bạn bè và đánh dấu họ là Người yêu/Vợ chồng để cùng trả lời Daily Q nhé!</p>
      </div>
    );
  }

  const hasQuestion = !!questionData?.question;
  const myAnswer = questionData?.answers?.[user?.uid];
  const partnerAnswer = questionData?.answers?.[partner?.friendId];
  
  // Both answered -> unlock
  const bothAnswered = myAnswer && partnerAnswer;
  // If I'm author and I didn't require myself to answer? Wait, standard is both need to answer to see. 

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-safe">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-display font-bold text-rose-600 tracking-tight flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 fill-rose-100" />
          Câu Hỏi Hôm Nay
        </h2>
        <p className="text-neutral-500">Người yêu ơi, trả lời câu hỏi này nhé!</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-500/5 relative overflow-hidden border border-rose-100"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-transparent rounded-bl-full opacity-50" />
        
        <div className="relative z-10 text-center space-y-6">
          <Sparkles className="w-10 h-10 text-rose-400 mx-auto" />

          {!hasQuestion ? (
             <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-600 mb-4">Hôm nay chưa có câu hỏi nào.</h3>
                {setupMode ? (
                  <div className="space-y-4">
                    <textarea 
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Nhập câu hỏi bạn muốn hỏi người ấy..."
                      className="w-full h-32 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 focus:ring-2 focus:ring-rose-200 transition-all font-medium text-neutral-800 resize-none outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setSetupMode(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 font-bold rounded-xl">Hủy</button>
                      <button onClick={handleSetQuestion} disabled={!customQuestion.trim()} className="flex-[2] bg-rose-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-rose-700 disabled:opacity-50">Lưu câu hỏi</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSetupMode(true)}
                    className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl border border-rose-200 transition-all flex items-center justify-center gap-2"
                  >
                    <PenTool className="w-5 h-5"/> Tự đặt câu hỏi cho hôm nay
                  </button>
                )}
             </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900 leading-snug">
                "{questionData.question}"
              </h3>
              <p className="text-xs text-rose-500 font-semibold italic">Được đặt bởi {questionData.authorId === user.uid ? 'bạn' : 'người ấy'}</p>

              {!myAnswer ? (
                <div className="space-y-4 pt-4">
                  <textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Câu trả lời của bạn..."
                    className="w-full h-32 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 focus:ring-2 focus:ring-rose-200 transition-all font-medium text-neutral-800 resize-none outline-none"
                  />
                  <button 
                    onClick={handleAnswer}
                    disabled={!answer.trim()}
                    className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" /> Gửi câu trả lời để mở khóa
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-4 text-left">
                  <div className="p-6 bg-rose-50 rounded-2xl space-y-2 border border-rose-100">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-widest pl-1">Bạn</span>
                    <p className="text-neutral-800 font-medium">{myAnswer}</p>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-2xl space-y-2 border border-indigo-100 relative">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest pl-1">Người ấy</span>
                    {!partnerAnswer ? (
                       <div className="flex flex-col items-center justify-center py-4 text-indigo-400">
                          <Lock className="w-6 h-6 mb-2" />
                          <p className="font-medium">Chờ người ấy trả lời nhé...</p>
                       </div>
                    ) : (
                       <>
                         <p className="text-neutral-800 font-medium italic">"{partnerAnswer}"</p>
                         <div className="absolute top-4 right-4 bg-indigo-100 p-2 rounded-full text-indigo-600">
                           <Unlock className="w-4 h-4" />
                         </div>
                       </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


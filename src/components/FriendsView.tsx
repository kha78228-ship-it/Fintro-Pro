import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Check, Copy, UserMinus, MessageCircle, Send, X, PhoneCall, Smile, Loader2, Heart, Mic, Square, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, query, onSnapshot, serverTimestamp, orderBy, addDoc, getDoc, getDocs, where, deleteField } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import AIAvatar from './AIAvatar';
import EmojiPicker from 'emoji-picker-react';

interface FriendsViewProps {
  user: any;
  onClose: () => void;
  onStartCall?: (friendId: string, isVideo?: boolean) => void;
}

export default function FriendsView({ user, onClose, onStartCall }: FriendsViewProps) {
  const [myFriendCode, setMyFriendCode] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [friendReqStatus, setFriendReqStatus] = useState('');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);

  const [chatGroups, setChatGroups] = useState<any[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [selectedGroupChat, setSelectedGroupChat] = useState<any | null>(null);

  const [showCoupleModal, setShowCoupleModal] = useState<string | null>(null);
  const [coupleType, setCoupleType] = useState('Người yêu');
  const [myBubbleNote, setMyBubbleNote] = useState('');
  const [myBubbleVisibleTo, setMyBubbleVisibleTo] = useState<string[]>(['all']);
  const [showBubbleNoteModal, setShowBubbleNoteModal] = useState(false);
  const [bubbleNoteDraft, setBubbleNoteDraft] = useState('');
  const [bubbleVisibleToDraft, setBubbleVisibleToDraft] = useState<string[]>(['all']);

  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'requests'>('friends');

  // Group Chats listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'chats'),
      where('type', '==', 'group'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatGroups(groups);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats (group)`);
    });
    return () => unsubscribe();
  }, [user]);

  // Load friend requests
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendRequests(requests);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchMyCode = async () => {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setMyFriendCode(docSnap.data().friendCode || '');
        }
    };
    fetchMyCode();

    const unsub = onSnapshot(doc(db, 'publicProfiles', user.uid), (docSnap) => {
        if (docSnap.exists()) {
            setMyBubbleNote(docSnap.data().bubbleNote || '');
            setMyBubbleVisibleTo(docSnap.data().bubbleVisibleTo || ['all']);
        }
    });

    return () => unsub();
  }, [user]);
  
  useEffect(() => {
    if (selectedFriend && friendsList.length > 0) {
      const updated = friendsList.find(f => f.id === selectedFriend.id);
      if (updated) setSelectedFriend(updated);
    }
  }, [friendsList]);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const cancelUploadRef = useRef(false);

  const getChatIdInfo = () => {
    let chatId = '';
    let participants: string[] = [];
    if (selectedFriend) {
      participants = [user.uid, selectedFriend.friendId].sort();
      chatId = `${participants[0]}_${participants[1]}`;
    } else if (selectedGroupChat) {
      chatId = selectedGroupChat.id;
      participants = selectedGroupChat.participants;
    }
    return { chatId, participants };
  };

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, `users/${user.uid}/friends`));
    
    // Track unsubscribe functions
    const unsubs: (() => void)[] = [];
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Clean up old status listeners
      unsubs.forEach(unsub => unsub());
      unsubs.length = 0;
      
      const data: any[] = [];
      snapshot.forEach(snapshotItem => {
        const friendData = { id: snapshotItem.id, ...snapshotItem.data() } as any;
        data.push(friendData);
        
        // Listen to friend doc for profile info and status
        const friendDocUnsub = onSnapshot(doc(db, 'publicProfiles', friendData.friendId), (userDoc) => {
          if (userDoc.exists()) {
             const userData = userDoc.data();
             setFriendStatuses(prev => ({ ...prev, [friendData.friendId]: userData.status || 'offline' }));
             // Update the friend in friendsList with displayName
             setFriendsList(prev => prev.map(f => f.friendId === friendData.friendId ? ({ 
               ...f, 
               displayName: userData.displayName || 'Bạn bè', 
               photoURL: userData.photoURL || userData.avatarUrl,
               bubbleNote: userData.bubbleNote,
               bubbleVisibleTo: userData.bubbleVisibleTo
             }) : f));
          }
        });
        unsubs.push(friendDocUnsub);
      });
      setFriendsList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/friends`);
    });
    
    return () => {
        unsubscribe();
        unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  useEffect(() => {
    if (!user?.uid || (!selectedFriend && !selectedGroupChat)) return;
    
    let chatId = '';
    if (selectedFriend) {
      const participants = [user.uid, selectedFriend.friendId].sort();
      chatId = `${participants[0]}_${participants[1]}`;
    } else if (selectedGroupChat) {
      chatId = selectedGroupChat.id;
    }

    const createChatIfNotExists = async () => {
      try {
        if (selectedFriend) {
          const participants = [user.uid, selectedFriend.friendId].sort();
          await setDoc(doc(db, 'chats', chatId), {
            participants,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    };
    createChatIfNotExists();

    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });
    
    const chatDocUnsubscribe = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTypingStatus(data.typing || {});
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${chatId}`);
    });
    
    return () => {
      unsubscribe();
      chatDocUnsubscribe();
    };
  }, [user, selectedFriend, selectedGroupChat]);

  const handleCopyId = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSendFriendRequest = async () => {
        const codeToAdd = friendCode.trim();
        console.log('Sending friend request to:', codeToAdd);
        if (codeToAdd.length < 3 || !/^\d+$/.test(codeToAdd)) {
          setFriendReqStatus('ID phải là các chữ số (từ 3 số trở lên)');
          return;
        }
        
        try {
          setFriendReqStatus('Đang tìm kiếm...');
          const q = query(collection(db, 'publicProfiles'), where('friendCode', '==', codeToAdd));
          const snap = await getDocs(q);
          console.log('Search result:', snap.empty ? 'Empty' : 'Found');
          if (snap.empty) {
            setFriendReqStatus('Không tìm thấy người dùng');
            return;
          }
          const friendUid = snap.docs[0].id;
          console.log('Found friendUid:', friendUid);

          if (friendUid === user.uid) {
            setFriendReqStatus('Không thể kết bạn với chính mình');
            return;
          }
          
          setFriendReqStatus('Đang gửi lời mời...');
          await addDoc(collection(db, 'friendRequests'), {
            senderId: user.uid,
            receiverId: friendUid,
            status: 'pending',
            createdAt: serverTimestamp()
          });
          console.log('Request sent');
          setFriendReqStatus('Đã gửi lời mời!');
          setFriendCode('');
          setTimeout(() => setFriendReqStatus(''), 3000);
        } catch (e) {
          console.error('Error sending request:', e);
          setFriendReqStatus('Lỗi khi gửi lời mời');
        }
  };

  const handleAcceptFriendRequest = async (request: any) => {
    console.log('Accepting request:', request.id);
    try {
      if (request.type === 'couple') {
        const relType = request.relationshipType || 'Người yêu';
        await setDoc(doc(db, `users/${user.uid}/friends/${request.senderId}`), {
          friendId: request.senderId,
          status: 'accepted',
          createdAt: serverTimestamp(),
          relationshipType: relType
        }, { merge: true });
        await setDoc(doc(db, `users/${request.senderId}/friends/${user.uid}`), {
          friendId: user.uid,
          status: 'accepted',
          createdAt: serverTimestamp(),
          relationshipType: relType
        }, { merge: true });
      } else {
        // 1. Create friend entry for both
        await setDoc(doc(db, `users/${user.uid}/friends/${request.senderId}`), {
          friendId: request.senderId,
          status: 'accepted',
          createdAt: serverTimestamp()
        });
        console.log('Created entry for me');
        await setDoc(doc(db, `users/${request.senderId}/friends/${user.uid}`), {
          friendId: user.uid,
          status: 'accepted',
          createdAt: serverTimestamp()
        });
        console.log('Created entry for friend');
      }
      
      // 2. Update request status
      await setDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' }, { merge: true });
      console.log('Status updated');
    } catch (e) {
      console.error('Error accepting request:', e);
      alert('Lỗi khi đồng ý');
    }
  };

  const handleRejectFriendRequest = async (request: any) => {
    if (!request.id) return;
    try {
      await setDoc(doc(db, 'friendRequests', request.id), { status: 'rejected' }, { merge: true });
    } catch (e) {
      console.error('Error rejecting request:', e);
    }
  };

  const handleSaveBubbleNote = async () => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'publicProfiles', user.uid), {
        bubbleNote: bubbleNoteDraft.trim(),
        bubbleVisibleTo: bubbleVisibleToDraft
      }, { merge: true });
      setShowBubbleNoteModal(false);
    } catch(e) {
      console.error(e);
      alert('Lỗi khi lưu ghi chú');
    }
  };


  const handleSendCoupleRequest = async () => {
    if (!showCoupleModal || !user) return;
    try {
      await addDoc(collection(db, 'friendRequests'), {
        senderId: user.uid,
        receiverId: showCoupleModal,
        status: 'pending',
        type: 'couple',
        relationshipType: coupleType,
        createdAt: serverTimestamp()
      });
      alert('Đã gửi lời mời!');
      setShowCoupleModal(null);
    } catch(e) {
      console.error(e);
      alert('Lỗi khi gửi lời mời');
    }
  };

  const handleRemoveFriend = async (id: string) => {
    if (!user?.uid || !window.confirm('Xóa thông tin liên lạc này?')) return;
    try {
      if (selectedFriend?.id === id) setSelectedFriend(null);
      await deleteDoc(doc(db, `users/${user.uid}/friends/${id}`));
    } catch(e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/friends/${id}`);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0 || !user) return;
    
    try {
      const participants = [user.uid, ...selectedGroupMembers];
      
      await addDoc(collection(db, 'chats'), {
        type: 'group',
        name: groupName.trim(),
        participants,
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        lastMessage: 'Nhóm chat đã được tạo',
      });
      
      setGroupName('');
      setSelectedGroupMembers([]);
      setShowCreateGroup(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats (group)');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!user) return;
    const { chatId } = getChatIdInfo();
    if (!chatId) return;

    if (e.target.value.trim() === '') {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setDoc(doc(db, 'chats', chatId), {
        typing: {
          [user.uid]: false
        }
      }, { merge: true }).catch(err => console.error("Typing status error:", err));
      return;
    }

    // Set typing to true
    setDoc(doc(db, 'chats', chatId), {
      typing: {
        [user.uid]: true
      }
    }, { merge: true }).catch(err => console.error("Typing status error:", err));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(doc(db, 'chats', chatId), {
        typing: {
          [user.uid]: false
        }
      }, { merge: true }).catch(err => console.error("Typing status error:", err));
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || (!selectedFriend && !selectedGroupChat)) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    setShowEmojiPicker(false);
    
    let chatId = '';
    let participants: string[] = [];
    if (selectedFriend) {
      participants = [user.uid, selectedFriend.friendId].sort();
      chatId = `${participants[0]}_${participants[1]}`;
    } else if (selectedGroupChat) {
      chatId = selectedGroupChat.id;
      participants = selectedGroupChat.participants;
    }

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });
      
      // Update chat last message time
      await setDoc(doc(db, 'chats', chatId), {
        participants,
        lastMessage: text,
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
        typing: {
          [user.uid]: false
        }
      }, { merge: true });
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelUploadRef.current = true;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelUploadRef.current = false;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      cancelUploadRef.current = false;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (cancelUploadRef.current) {
           cancelUploadRef.current = false;
           return;
        }

        const { chatId, participants } = getChatIdInfo();
        if (!chatId || !user) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
            const { blobToBase64 } = await import('../lib/fileUtils');
            const base64Audio = await blobToBase64(audioBlob);
            
            await addDoc(collection(db, `chats/${chatId}/messages`), {
              text: '[Tin nhắn thoại]',
              fileUrl: base64Audio,
              fileType: 'audio',
              senderId: user.uid,
              timestamp: serverTimestamp()
            });
            
            await setDoc(doc(db, 'chats', chatId), {
              participants,
              lastMessage: 'Đã gửi tin nhắn thoại 🎤',
              lastSenderId: user.uid,
              updatedAt: serverTimestamp(),
              typing: {
                [user.uid]: false
              }
            }, { merge: true });
        } catch (error) {
            console.error("Upload error", error);
            alert("Lỗi lưu tin nhắn thoại.");
        } finally {
            setIsUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
         setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone", error);
      alert("Không thể truy cập microphone. Vui lòng cấp quyền.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-[70vh] relative z-10 flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-neutral-100">
      <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-neutral-600" />
          <h2 className="text-xl font-bold text-neutral-900 font-display">Tương Tác</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative h-[600px] max-h-[80vh]">
        <AnimatePresence mode="wait">
          {(selectedFriend || selectedGroupChat) ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full absolute inset-0 bg-slate-50 z-20"
              >
                {/* Chat Header */}
                <div className="border-b border-neutral-100 p-4 flex items-center gap-3 bg-white shrink-0 sticky top-0 z-10 shadow-sm">
                  <button 
                    onClick={() => { setSelectedFriend(null); setSelectedGroupChat(null); }}
                    className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-bold rounded-3xl hover:bg-neutral-200 transition-colors"
                  >
                    Trở lại
                  </button>
                  {selectedFriend ? (
                    <>
                      <AIAvatar uid={selectedFriend.friendId} name={selectedFriend.displayName} photoURL={selectedFriend.photoURL} className="w-8 h-8 rounded-full border border-neutral-100 ml-2 object-cover bg-neutral-200" />
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-800 text-sm leading-none">{selectedFriend.displayName || 'Bạn bè'}</h3>
                        <span className={`text-[10px] font-semibold ${friendStatuses[selectedFriend.friendId] === 'online' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {friendStatuses[selectedFriend.friendId] === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (onStartCall) onStartCall(selectedFriend.friendId, false);
                          }}
                          className="p-2 bg-neutral-50 text-neutral-600 font-bold rounded-3xl hover:bg-neutral-100 transition-colors flex items-center justify-center shrink-0"
                          title="Gọi Thoại"
                        >
                          <PhoneCall className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-neutral-100 bg-neutral-100 flex items-center justify-center ml-2 border border-neutral-200">
                        <Users className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-neutral-800 text-sm leading-none">{selectedGroupChat?.name || 'Nhóm'}</h3>
                        <span className="text-[10px] text-neutral-500 font-semibold">{selectedGroupChat?.participants?.length || 0} thành viên</span>
                      </div>
                      {/* Group calls could be added here later */}
                    </>
                  )}
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 pb-2">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <MessageCircle className="w-8 h-8 text-neutral-200" />
                      </div>
                      <p className="font-bold text-neutral-900 mb-1">Gửi lời nhắn đầu tiên</p>
                      <p className="text-sm text-neutral-600/70">Chia sẻ niềm vui, hỏi thăm hoặc bàn bạc về tài chính cùng nhau nào. 💬</p>
                    </div>
                  ) : (
                    <div className="space-y-1 flex flex-col justify-end min-h-full">
                      {messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.uid;
                        const prevMsg = messages[i - 1];
                        const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                        const timeStr = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';
                        
                        const msgSenderName = isMe ? user?.displayName : selectedFriend?.displayName;
                        const msgSenderPhoto = isMe ? user?.photoURL : selectedFriend?.photoURL;
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            key={msg.id || i} 
                            style={{ willChange: 'transform, opacity' }}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${showAvatar && i > 0 ? 'mt-4' : ''}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              {showAvatar ? (
                                 <div className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm relative overflow-hidden bg-neutral-200">
                                   <AIAvatar uid={msg.senderId} name={msgSenderName} photoURL={msgSenderPhoto} className="w-full h-full object-cover" />
                                 </div>
                              ) : (
                                 <div className="w-8 h-8 flex-shrink-0" />
                              )}
                              
                              <div className="flex flex-col max-w-[calc(100%-2.5rem)]">
                                {!isMe && showAvatar && (
                                   <span className="text-[11px] text-neutral-500 ml-1 mb-1 font-medium">{msgSenderName || 'Bạn bè'}</span>
                                )}
                                <div className={`group relative py-2.5 px-4 text-[15px] shadow-sm leading-relaxed ${
                                    isMe 
                                      ? 'bg-neutral-500 text-white rounded-3xl rounded-3xl' 
                                      : 'bg-white text-neutral-800 border border-neutral-100 rounded-3xl rounded-3xl'
                                  }`}
                                >
                                  <p className="break-words whitespace-pre-wrap text-[14px] sm:text-[15px]">{msg.text}</p>
                                
                                {msg.fileUrl && (
                                  <div className="mt-2 text-center rounded-3xl overflow-hidden relative">
                                    {msg.isUploading && (
                                       <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center rounded-3xl z-10 text-white backdrop-blur-[2px]">
                                         <Loader2 className="w-8 h-8 animate-spin mb-2 drop-shadow-md text-white/90" />
                                         <span className="text-xs font-medium drop-shadow-md">Đang xử lý...</span>
                                       </div>
                                    )}
                                    {msg.fileType === 'audio' && (
                                      <audio src={msg.fileUrl} controls={!msg.isUploading} className="max-w-[200px] sm:max-w-[250px] outline-none" />
                                    )}
                                  </div>
                                )}
                                </div>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-neutral-100' : 'text-neutral-400'}`}>
                                  <span>{timeStr}</span>
                                  {isMe && (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {Object.entries(typingStatus || {}).filter(([uid, isTyping]) => isTyping && uid !== user?.uid).length > 0 && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-end gap-2 max-w-[85%] mt-4"
                      >
                        <div className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm relative overflow-hidden bg-neutral-200">
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                             <MessageCircle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                           <div className="bg-white border border-neutral-100 rounded-3xl rounded-3xl py-3 px-4 shadow-sm flex gap-1.5 items-center h-[38px]">
                             <span className="w-1.5 h-1.5 bg-neutral-400 rounded-3xl animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                             <span className="w-1.5 h-1.5 bg-neutral-400 rounded-3xl animate-[bounce_1s_infinite]" style={{ animationDelay: '150ms' }} />
                             <span className="w-1.5 h-1.5 bg-neutral-400 rounded-3xl animate-[bounce_1s_infinite]" style={{ animationDelay: '300ms' }} />
                           </div>
                        </div>
                     </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-4" />
                </div>
                
                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-neutral-100 shrink-0 sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative">
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10, transformOrigin: 'bottom left' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full mb-2 left-4 z-50 shadow-2xl rounded-3xl overflow-hidden"
                      >
                        <EmojiPicker 
                          onEmojiClick={(emojiData) => {
                            setNewMessage(prev => prev + emojiData.emoji);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {isUploading && (
                     <div className="absolute bottom-full mb-2 right-4 bg-white px-4 py-2 rounded-3xl shadow-md border border-neutral-100 flex items-center gap-2 text-sm text-neutral-600 font-medium">
                       <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
                     </div>
                  )}
                  
                  <div className="flex gap-2 items-end">
                    <div className="flex gap-1 bg-neutral-100 rounded-3xl p-1 mb-1">
                      <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                        className={`p-2 rounded-3xl transition-colors shrink-0 ${showEmojiPicker ? 'bg-white text-neutral-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-600'}`}
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>

                    {isRecording ? (
                      <div className="flex-1 bg-orange-50/50 rounded-3xl px-4 py-1 flex items-center justify-between border border-orange-100 mb-1">
                        <div className="flex items-center gap-3 text-orange-600">
                           <div className="w-2.5 h-2.5 rounded-3xl bg-orange-500 animate-pulse" />
                           <span className="text-sm font-medium font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <button type="button" onClick={cancelRecording} className="p-2 text-orange-500 hover:bg-orange-100 rounded-3xl transition-colors" title="Huỷ">
                              <Trash2 className="w-4 h-4" />
                           </button>
                           <button type="button" onClick={stopRecording} className="p-2 text-neutral-600 bg-neutral-100/50 hover:bg-neutral-100 rounded-3xl transition-colors ml-1 font-bold flex items-center gap-1 text-sm">
                              Gửi
                           </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 bg-neutral-100 rounded-3xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all border-none mb-1 min-w-[100px]"
                      />
                    )}
                    
                    {!isRecording && (
                      newMessage.trim() ? (
                        <button 
                          type="submit"
                          className="w-12 h-12 bg-neutral-500 text-white rounded-full flex items-center justify-center hover:bg-neutral-600 transition-all shadow-md shadow-neutral-500/20 shrink-0 transform active:scale-95"
                        >
                          <Send className="w-5 h-5 ml-1" />
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={startRecording}
                          className="w-12 h-12 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center hover:bg-neutral-200 hover:text-neutral-700 transition-all shadow-sm shrink-0 transform active:scale-95"
                          title="Ghi âm"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )
                    )}
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 sm:p-6 space-y-6 pb-10 absolute inset-0 overflow-y-auto bg-white"
              >
                <div className="flex bg-neutral-100 p-1 rounded-3xl mb-4 shrink-0 shadow-sm border border-neutral-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-2 text-sm font-bold rounded-3xl transition-all ${activeTab === 'friends' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Bạn bè
                  </button>
                  <button 
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 py-2 text-sm font-bold rounded-3xl transition-all ${activeTab === 'groups' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Nhóm
                  </button>
                  <button 
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-bold rounded-3xl transition-all ${activeTab === 'requests' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Kết bạn {friendRequests.length > 0 && <span className="bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">{friendRequests.length}</span>}
                  </button>
                </div>

                {activeTab === 'friends' && (
                <div className="space-y-4">
                  {/* Bubble Notes / Friends Stories Row */}
                  <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 hide-scrollbar">
                    {/* My Bubble Note */}
                    <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => { setBubbleNoteDraft(myBubbleNote); setBubbleVisibleToDraft(myBubbleVisibleTo); setShowBubbleNoteModal(true); }}>
                      <div className="relative pt-3 pr-3">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 overflow-hidden relative group">
                          {user?.photoURL ? (
                            <AIAvatar uid={user.uid} name={user.displayName} photoURL={user.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            <Heart className="w-6 h-6 text-neutral-300 group-hover:scale-110 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-2xl font-bold">+</span>
                          </div>
                        </div>
                        {myBubbleNote && (
                          <div className="absolute top-0 right-0 bg-white p-1 rounded-3xl shadow-sm border border-neutral-100 z-10">
                            <div className="bg-neutral-100 text-neutral-800 text-[10px] px-2 py-1 rounded-3xl max-w-[80px] truncate" title={myBubbleNote}>
                              {myBubbleNote}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-neutral-600">Ghi chú của tôi</span>
                    </div>

                    {/* Friends Bubbles */}
                    {friendsList.filter(f => f.bubbleNote && (f.bubbleVisibleTo?.includes('all') || f.bubbleVisibleTo?.includes(user?.uid))).map(f => (
                      <div key={f.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedFriend(f)}>
                        <div className="relative pt-3 pr-3">
                          <div className="w-4 h-4 rounded-full p-0.5 bg-neo-bg p-0.5 bg-neo-bg">
                            <AIAvatar uid={f.friendId} name={f.displayName} photoURL={f.photoURL} className="w-full h-full rounded-3xl border-2 border-white object-cover" />
                          </div>
                          <div className="absolute top-0 right-0 bg-white p-1 rounded-3xl shadow-sm border border-neutral-100 z-10">
                            <div className="bg-neutral-100 text-neutral-800 text-[10px] px-2 py-1 rounded-3xl max-w-[80px] line-clamp-2 leading-tight" title={f.bubbleNote}>
                              {f.bubbleNote}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-neutral-600 truncate w-16 text-center">{f.displayName?.split(' ')[0] || 'Bạn bè'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {activeTab === 'requests' && (
                  <div>
                    <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-neutral-100">
                      <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1">ID Của Tôi</p>
                      <div className="flex items-center gap-2 bg-neutral-50 rounded-3xl p-3 border border-neutral-200 shadow-sm h-[52px]">
                        <span className="flex-1 font-mono text-neutral-800 text-sm truncate select-all">{myFriendCode || 'Đang tải...'}</span>
                        <button 
                          onClick={handleCopyId}
                          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-3xl transition-colors shrink-0 bg-white shadow-sm h-full flex items-center justify-center w-[36px]"
                          title="Sao chép ID"
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1">Kết Nối ID Mới</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 h-[52px]">
                          <input 
                            type="text" 
                            value={friendCode}
                            onChange={e => setFriendCode(e.target.value)}
                            placeholder="Dán ID người ấy..."
                            className="input-field px-4 flex-1 font-mono text-sm shadow-sm border-neutral-200"
                          />
                          <button 
                            onClick={handleSendFriendRequest}
                            disabled={!friendCode.trim()}
                            className="px-5 bg-neutral-600 hover:bg-neutral-700 text-white font-bold rounded-3xl transition-all shadow-md shadow-neutral-600/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95 h-full"
                          >
                            Gửi
                          </button>
                        </div>
                        <AnimatePresence>
                          {friendReqStatus && (
                            <motion.span 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm font-medium text-neutral-600 pl-1"
                            >
                              {friendReqStatus}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  
                  {friendRequests.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1">Lời Mời Kết Bạn</p>
                      <div className="space-y-2">
                        {friendRequests.map((req) => (
                           <div key={req.id} className="flex items-center justify-between bg-white border border-neutral-200 rounded-3xl p-3 shadow-sm">
                             <div className="flex flex-col gap-0.5">
                               <p className="text-sm font-bold text-neutral-800">
                                 {req.type === 'couple' ? `Lời mời cặp đôi: ${req.relationshipType}` : 'Lời mời kết bạn'}
                               </p>
                               <p className="text-xs text-neutral-500">Từ: {req.senderId.slice(0, 8)}...</p>
                             </div>
                             <div className="flex gap-2">
                               <button onClick={() => handleAcceptFriendRequest(req)} className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-3xl">
                                 <Check className="w-5 h-5"/>
                               </button>
                               <button onClick={() => handleRejectFriendRequest(req)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-3xl">
                                 <X className="w-5 h-5"/>
                               </button>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}

                {activeTab === 'friends' && (
                  <div>
                    <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1 mb-3 pt-2">Những Người Đã Kết Nối</p>
                  {friendsList.length === 0 ? (
                    <div className="bg-neutral-50/50 rounded-3xl p-6 text-center border border-neutral-100/50">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <Users className="w-5 h-5 text-neutral-300" />
                      </div>
                      <p className="text-sm text-neutral-800 font-medium">Bạn chưa kết nối với ai.</p>
                      <p className="text-xs text-neutral-600/70 mt-1 mt-1">Gửi ID của mình cho người ấy để bắt đầu nhé!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {friendsList.map((f, i) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ delay: i * 0.05, layout: { type: 'spring', bounce: 0.2 } }}
                            key={f.id} 
                            className="flex items-center justify-between bg-white border border-neutral-200 rounded-3xl p-3 shadow-sm hover:border-neutral-300 transition-colors group cursor-pointer active:scale-[0.98] touch-manipulation"
                            onClick={() => setSelectedFriend(f)}
                          >
                            <div className="flex items-center gap-3">
                              <AIAvatar uid={f.friendId} name={f.displayName} photoURL={f.photoURL} className="w-8 h-8 rounded-full shadow-inner object-cover bg-neutral-200" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">{f.displayName || 'Bạn bè'}</p>
                                  {f.relationshipType && (
                                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-3xl border border-orange-100">
                                      {f.relationshipType}
                                    </span>
                                  )}
                                </div>
                                 <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-3xl ${friendStatuses[f.friendId] === 'online' ? 'text-neutral-500 bg-neutral-50' : 'text-neutral-500 bg-neutral-100'}`}>
                                    {friendStatuses[f.friendId] === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                                  </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (onStartCall) onStartCall(f.friendId, false); 
                                }}
                                className="p-2.5 text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-700 rounded-3xl transition-all"
                                title="Gọi thoại"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedFriend(f); }}
                                className="p-2.5 text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-700 rounded-3xl transition-all ml-1"
                                title="Nhắn tin"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowCoupleModal(f.friendId); }}
                                className="p-2.5 text-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 rounded-3xl transition-all ml-1 opacity-50 group-hover:opacity-100"
                                title="Thiết lập quan hệ"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveFriend(f.id); }}
                                className="p-2.5 text-orange-500 bg-orange-50 hover:bg-orange-100 hover:text-orange-600 rounded-3xl transition-all ml-1 opacity-50 group-hover:opacity-100"
                                title="Xóa liên kết"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                )}

                {activeTab === 'groups' && (
                <div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-100 mb-3">
                    <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1">Nhóm Chat</p>
                    <button onClick={() => setShowCreateGroup(true)} className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-3xl font-bold transition-all">
                      + Tạo Nhóm
                    </button>
                  </div>
                  {chatGroups.length === 0 ? (
                    <div className="bg-neutral-50/50 rounded-3xl p-6 text-center border border-neutral-100/50">
                      <p className="text-sm text-neutral-800 font-medium">Bạn chưa tham gia nhóm nào.</p>
                      <p className="text-xs text-neutral-600/70 mt-1">Tạo nhóm để trò chuyện cùng nhiều bạn bè!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {chatGroups.map((g, i) => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ delay: i * 0.05, layout: { type: 'spring', bounce: 0.2 } }}
                            key={g.id} 
                            className="flex items-center justify-between bg-white border border-neutral-200 rounded-3xl p-3 shadow-sm hover:border-neutral-300 transition-colors group cursor-pointer active:scale-[0.98] touch-manipulation"
                            onClick={() => setSelectedGroupChat(g)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-neutral-100 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                                <Users className="w-5 h-5 text-neutral-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">{g.name || 'Nhóm Chat'}</p>
                                <span className="text-[10px] text-neutral-500 font-semibold">{g.participants?.length || 0} thành viên</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedGroupChat(g); }}
                                className="p-2.5 text-neutral-600 bg-neutral-50 hover:bg-neutral-100 hover:text-neutral-700 rounded-3xl transition-all ml-1"
                                title="Nhắn tin nhóm"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Group Modal */}
        <AnimatePresence>
          {showCreateGroup && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 flex flex-col pt-16 px-6 pb-6 overflow-y-auto"
            >
               <button onClick={() => setShowCreateGroup(false)} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-100 rounded-3xl">
                 <X className="w-5 h-5" />
               </button>
               <h3 className="text-xl font-bold font-display text-neutral-900 mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-neutral-600"/> Tạo Nhóm Chat</h3>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-neutral-700 mb-2">Tên nhóm</label>
                   <input 
                     type="text" 
                     value={groupName} 
                     onChange={e => setGroupName(e.target.value)} 
                     className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-3 text-sm focus:ring-2 focus:ring-neutral-500 focus:outline-none transition-all"
                     placeholder="Ví dụ: Nhóm Đầu Tư, Gia đình..."
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-neutral-700 mb-2">Chọn thành viên</label>
                   {friendsList.length === 0 ? (
                     <p className="text-sm text-neutral-500 bg-neutral-50 p-4 rounded-3xl text-center border border-neutral-100">Bạn cần có bạn bè để thêm vào nhóm.</p>
                   ) : (
                     <div className="space-y-2 max-h-60 overflow-y-auto border border-neutral-100 rounded-3xl p-2 bg-neutral-50">
                       {friendsList.map(f => (
                         <label key={f.friendId} className="flex items-center gap-3 p-2 rounded-3xl hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-neutral-200">
                           <input 
                             type="checkbox" 
                             className="w-5 h-5 rounded border border-neutral-300 text-neutral-600 focus:ring-neutral-500"
                             checked={selectedGroupMembers.includes(f.friendId)}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedGroupMembers(prev => [...prev, f.friendId]);
                               else setSelectedGroupMembers(prev => prev.filter(id => id !== f.friendId));
                             }}
                           />
                           <AIAvatar uid={f.friendId} name={f.displayName} photoURL={f.photoURL} className="w-8 h-8 rounded-full shadow-inner object-cover bg-neutral-200" />
                           <span className="text-sm font-bold text-neutral-800">{f.displayName || 'Bạn bè'}</span>
                         </label>
                       ))}
                     </div>
                   )}
                 </div>
                 
                 <button 
                   onClick={handleCreateGroup}
                   disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                   className="w-full bg-neutral-600 hover:bg-neutral-700 text-white font-bold py-3.5 rounded-3xl shadow-lg shadow-neutral-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 text-sm"
                 >
                   Tạo Nhóm
                 </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Couple Modal */}
        <AnimatePresence>
          {showCoupleModal && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 bg-white z-[60] flex flex-col pt-16 px-6 pb-6 shadow-2xl"
            >
              <button 
                onClick={() => setShowCoupleModal(null)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-3xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-2 font-display">Gắn Kết Yêu Thương</h3>
                <p className="text-sm text-neutral-500 mb-8 max-w-[250px]">
                  Chọn mối quan hệ bạn muốn thiết lập với người này. Họ sẽ nhận được lời mời từ bạn.
                </p>

                <div className="w-full space-y-3 mb-8">
                  {['Người yêu', 'Vợ chồng', 'Bạn bè', 'Người thân'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCoupleType(type)}
                      className={`w-full p-4 rounded-3xl border-2 text-left font-bold transition-all flex items-center justify-between ${
                        coupleType === type 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-neutral-100 bg-neutral-50 text-neutral-600 hover:border-orange-200 hover:bg-white'
                      }`}
                    >
                      {type}
                      {coupleType === type && <Check className="w-5 h-5 text-orange-500" />}
                    </button>
                  ))}
                </div>

                <div className="w-full mt-auto">
                  <button 
                    onClick={handleSendCoupleRequest}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-3xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
                  >
                    Gửi Lời Mời
                  </button>
                  <button 
                    onClick={() => setShowCoupleModal(null)}
                    className="w-full py-4 text-neutral-500 hover:text-neutral-700 font-bold rounded-3xl mt-2 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Bubble Note Modal */}
        <AnimatePresence>
          {showBubbleNoteModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowBubbleNoteModal(false)}
            >
              <div 
                className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md relative mb-4">
                   {user?.photoURL ? (
                      <AIAvatar uid={user.uid} name={user.displayName} photoURL={user.photoURL} className="w-full h-full object-cover rounded-3xl bg-neutral-200" />
                   ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center rounded-3xl"><Users className="w-8 h-8 text-neutral-500" /></div>
                   )}
                   <div className="absolute -bottom-2 right-0 bg-neutral-500 text-white rounded-3xl p-1 border-2 border-white"><Smile className="w-4 h-4"/></div>
                </div>

                <h3 className="text-xl font-bold text-neutral-800 mb-1">Ghi chú của tôi</h3>
                <p className="text-xs text-neutral-500 mb-6 text-center">Ghi chú sẽ hiển thị trên avatar của bạn để mọi người có thể thấy.</p>
                
                <div className="w-full space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-bold text-neutral-700 block mb-2">Trạng thái / Ghi chú</label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all font-medium"
                      placeholder="Đang làm gì thế? (tối đa 60 ký tự)"
                      maxLength={60}
                      value={bubbleNoteDraft}
                      onChange={e => setBubbleNoteDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-neutral-700 block mb-2">Cho phép ai xem?</label>
                    <select 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-all font-medium appearance-none"
                      value={bubbleVisibleToDraft.includes('all') ? 'all' : (bubbleVisibleToDraft.length > 0 ? bubbleVisibleToDraft[0] : 'all')}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'all') setBubbleVisibleToDraft(['all']);
                        else if (val === 'none') setBubbleVisibleToDraft([]);
                        else setBubbleVisibleToDraft([val]);
                      }}
                    >
                      <option value="all">Tất cả bạn bè</option>
                      <option value="none">Chỉ mình tôi</option>
                      {friendsList.map(f => (
                        <option key={f.friendId} value={f.friendId}>Chỉ {f.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={async () => {
                       setBubbleNoteDraft('');
                       if (!user?.uid) return;
                       try {
                         await setDoc(doc(db, 'publicProfiles', user.uid), { bubbleNote: '', bubbleVisibleTo: ['all'] }, { merge: true });
                         setShowBubbleNoteModal(false);
                       } catch(e) {}
                    }}
                    className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-3xl transition-all"
                  >
                    Xóa
                  </button>
                  <button 
                    onClick={handleSaveBubbleNote}
                    className="flex-[2] py-3.5 bg-neutral-600 hover:bg-neutral-700 text-white font-bold rounded-3xl shadow-lg shadow-neutral-600/30 transition-all"
                  >
                    Lưu
                  </button>
                </div>

                <button 
                  onClick={() => setShowBubbleNoteModal(false)}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-3xl transition-colors"
                >
                   <X className="w-5 h-5"/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

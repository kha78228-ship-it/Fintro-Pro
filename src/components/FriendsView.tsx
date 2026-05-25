import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Check, Copy, UserMinus, MessageCircle, Send, X, PhoneCall, Smile, Loader2, Heart, Mic, Square, Trash2, Video, ExternalLink, Lock } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, onSnapshot, serverTimestamp, orderBy, addDoc, getDoc, getDocs, where, deleteField } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import AIAvatar from './AIAvatar';
import EmojiPicker from 'emoji-picker-react';
import { connectGoogleMeet, getGoogleMeetToken, createGoogleMeetSpace, setGoogleMeetToken } from '../lib/meetService';
import { 
  connectGoogleChat, 
  getGoogleChatToken, 
  setGoogleChatToken, 
  disconnectGoogleChat,
  listGoogleChatSpaces, 
  createGoogleChatSpace, 
  listGoogleChatMessages, 
  sendGoogleChatMessage, 
  ChatSpace, 
  ChatMessage 
} from '../lib/chatService';

interface FriendsViewProps {
  user: any;
  onClose: () => void;
  onStartCall?: (friendId: string, isVideo?: boolean) => void;
}

export default function FriendsView({ user, onClose, onStartCall }: FriendsViewProps) {
  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com') || false;
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

  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'requests' | 'gchat'>('friends');

  // Google Chat States
  const [googleChatToken, setGoogleChatTokenState] = useState<string | null>(getGoogleChatToken());
  const [googleChatSpaces, setGoogleChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedGoogleChatSpace, setSelectedGoogleChatSpace] = useState<ChatSpace | null>(null);
  const [googleChatMessages, setGoogleChatMessages] = useState<ChatMessage[]>([]);
  const [isGChatLoading, setIsGChatLoading] = useState(false);
  const [isGChatSpacesLoading, setIsGChatSpacesLoading] = useState(false);
  const [gchatSpaceNameInput, setGChatSpaceNameInput] = useState('');
  const [isCreatingGChatSpace, setIsCreatingGChatSpace] = useState(false);
  const [showCreateGChatSpaceModal, setShowCreateGChatSpaceModal] = useState(false);
  const [gchatMessageInput, setGChatMessageInput] = useState('');
  const [isSendingGChatMessage, setIsSendingGChatMessage] = useState(false);

  // Google Chat Direct Sync State
  const [activeLinkedGChatSpace, setActiveLinkedGChatSpace] = useState<{name: string, displayName: string} | null>(null);
  const [showGChatSyncModal, setShowGChatSyncModal] = useState(false);
  const [showMeetSelectionModal, setShowMeetSelectionModal] = useState(false);

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

  // Google Chat Messages Polling listener
  useEffect(() => {
    if (!googleChatToken || !selectedGoogleChatSpace) return;

    const fetchMessages = async () => {
      try {
        const msgs = await listGoogleChatMessages(googleChatToken, selectedGoogleChatSpace.name);
        const sortedMsgs = [...msgs].sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
        setGoogleChatMessages(sortedMsgs);
      } catch (err) {
        console.error("Failed to fetch Google Chat messages:", err);
      }
    };

    fetchMessages(); // initial fetch

    const intervalId = setInterval(fetchMessages, 8000); // 8-second poll
    return () => clearInterval(intervalId);
  }, [googleChatToken, selectedGoogleChatSpace]);

  const fetchGChatSpaces = async (token: string) => {
    setIsGChatSpacesLoading(true);
    try {
      const spaces = await listGoogleChatSpaces(token);
      setGoogleChatSpaces(spaces);
    } catch (err) {
      console.error("Error fetching spaces:", err);
    } finally {
      setIsGChatSpacesLoading(false);
    }
  };

  useEffect(() => {
    if (googleChatToken && activeTab === 'gchat') {
      fetchGChatSpaces(googleChatToken);
    }
  }, [googleChatToken, activeTab]);

  // Synchronize Google Chat token when user authenticated with Google or when isGoogleUser changes
  useEffect(() => {
    const checkToken = () => {
      const token = getGoogleChatToken();
      if (token && token !== googleChatToken) {
        setGoogleChatTokenState(token);
        fetchGChatSpaces(token);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [googleChatToken]);

  const handleConnectGChat = async () => {
    try {
      const result = await connectGoogleChat();
      if (result) {
        setGoogleChatTokenState(result.accessToken);
        setGoogleChatToken(result.accessToken, result.user);
        fetchGChatSpaces(result.accessToken);
      }
    } catch (err: any) {
      console.error("Error connecting Google Chat:", err);
      window.alert(err.message || "Không thể kết nối với Google Chat. Vui lòng thử lại.");
    }
  };

  const handleDisconnectGChat = () => {
    disconnectGoogleChat();
    setGoogleChatTokenState(null);
    setGoogleChatSpaces([]);
    setSelectedGoogleChatSpace(null);
    setGoogleChatMessages([]);
  };

  const handleCreateGChatSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleChatToken || !gchatSpaceNameInput.trim()) return;
    setIsCreatingGChatSpace(true);
    try {
      const newSpace = await createGoogleChatSpace(googleChatToken, gchatSpaceNameInput.trim());
      setGChatSpaceNameInput('');
      setShowCreateGChatSpaceModal(false);
      await fetchGChatSpaces(googleChatToken);
      setSelectedGoogleChatSpace(newSpace);
    } catch (err: any) {
      console.error("Error creating space:", err);
      window.alert(err.message || "Không thể tạo phòng Google Chat. Hãy thử lại.");
    } finally {
      setIsCreatingGChatSpace(false);
    }
  };

  const handleSendGChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleChatToken || !selectedGoogleChatSpace || !gchatMessageInput.trim()) return;
    
    // Explicit User Confirmation check before sending chat messages (Workspace guidelines requirement)
    const confirmed = window.confirm(`Bạn có chắc chắn muốn gửi tin nhắn này sang Google Chat không?`);
    if (!confirmed) return;

    const textToSend = gchatMessageInput.trim();
    setGChatMessageInput('');
    setIsSendingGChatMessage(true);
    try {
      await sendGoogleChatMessage(googleChatToken, selectedGoogleChatSpace.name, textToSend);
      // Refresh messages
      const msgs = await listGoogleChatMessages(googleChatToken, selectedGoogleChatSpace.name);
      const sortedMsgs = [...msgs].sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
      setGoogleChatMessages(sortedMsgs);
    } catch (err: any) {
      console.error("Error sending Google Chat message:", err);
      window.alert(err.message || "Không thể gửi tin nhắn. Hãy thử lại.");
    } finally {
      setIsSendingGChatMessage(false);
    }
  };
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Google Meet State & Action
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  const generateRandomMeetCode = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = (len: number) => {
      let s = '';
      for (let i = 0; i < len; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return s;
    };
    return `${randPart(3)}-${randPart(4)}-${randPart(3)}`;
  };

  const handleCreateGoogleMeet = async (forcingAnonymous: boolean = false) => {
    if (forcingAnonymous) {
      setIsCreatingMeet(true);
      try {
        const meetCode = generateRandomMeetCode();
        const meetingUri = `https://meet.google.com/${meetCode}`;
        
        let chatId = '';
        let participants: string[] = [];
        if (selectedFriend) {
          participants = [user.uid, selectedFriend.friendId].sort();
          chatId = `${participants[0]}_${participants[1]}`;
        } else if (selectedGroupChat) {
          chatId = selectedGroupChat.id;
          participants = selectedGroupChat.participants;
        }

        if (!chatId) return;

        const inviteText = `[Gọi thoại ẩn danh 👤] Phòng họp Google Meet đã được tạo thành công! Hãy tham gia cùng tôi: ${meetingUri}`;

        await addDoc(collection(db, `chats/${chatId}/messages`), {
          text: inviteText,
          senderId: user.uid,
          timestamp: serverTimestamp()
        });

        await setDoc(doc(db, 'chats', chatId), {
          participants,
          lastMessage: "Đã tạo phòng họp Google Meet ẩn danh 🎥",
          lastSenderId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setShowMeetSelectionModal(false);
        window.open(meetingUri, '_blank');
      } catch (err: any) {
        console.error("Meet Creation error:", err);
        window.alert(err.message || "Không thể tạo phòng họp Google Meet. Hãy thử lại.");
      } finally {
        setIsCreatingMeet(false);
      }
      return;
    }

    // Official OAuth flow (can link anonymous users)
    let token = getGoogleMeetToken();
    if (!token) {
      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
        
        let result;
        if (auth.currentUser?.isAnonymous) {
          // Keep friends list and settings by linking current guest account instead of logging out
          result = await linkWithPopup(auth.currentUser, provider);
        } else {
          result = await signInWithPopup(auth, provider);
        }
        
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setGoogleMeetToken(credential.accessToken, result.user);
          token = credential.accessToken;
        }
      } catch (err: any) {
        console.error("Popup Auth failed:", err);
        window.alert(err.message || "Không thể xác thực với Google. Hãy thử lại.");
        return;
      }
    }

    if (!token) return;

    setIsCreatingMeet(true);
    try {
      const space = await createGoogleMeetSpace(token);
      
      let chatId = '';
      let participants: string[] = [];
      if (selectedFriend) {
        participants = [user.uid, selectedFriend.friendId].sort();
        chatId = `${participants[0]}_${participants[1]}`;
      } else if (selectedGroupChat) {
        chatId = selectedGroupChat.id;
        participants = selectedGroupChat.participants;
      }

      if (!chatId) return;

      const inviteText = `Cuộc họp Google Meet đã được tạo! Bạn có thể tham gia ngay tại link sau: ${space.meetingUri}`;

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: inviteText,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });

      // Update chat last message time
      await setDoc(doc(db, 'chats', chatId), {
        participants,
        lastMessage: "Đã tạo một phòng họp Google Meet mới 🎥",
        lastSenderId: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setShowMeetSelectionModal(false);
      // Automatically open the link in a new tab
      window.open(space.meetingUri, '_blank');
    } catch (err: any) {
      console.error("Meet Creation error:", err);
      // Fallback: alert
      window.alert(err.message || "Không thể tạo phòng họp Google Meet chính thức. Bạn hãy sử dụng phương thức ẩn danh nhanh.");
    } finally {
      setIsCreatingMeet(false);
    }
  };

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
        if (data.gchatSpaceName) {
          setActiveLinkedGChatSpace({
            name: data.gchatSpaceName,
            displayName: data.gchatSpaceDisplayName || 'Đồng bộ Google Chat'
          });
        } else {
          setActiveLinkedGChatSpace(null);
        }
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

      // ---- GOOGLE CHAT REALTIME SYNC ----
      if (activeLinkedGChatSpace && googleChatToken) {
        try {
          const senderName = user.displayName || 'Tài khoản ẩn danh 👤';
          const syncedText = `[Đồng bộ 💬] ${senderName}: ${text}`;
          await sendGoogleChatMessage(googleChatToken, activeLinkedGChatSpace.name, syncedText);
        } catch (err) {
          console.error("Lỗi đồng bộ tin nhắn sang Google Chat:", err);
        }
      }
      
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

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        
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
    <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto bg-white h-[85vh] min-h-[580px] max-h-[780px] relative z-10 flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-neutral-100 transition-all duration-300">
      <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-neutral-600" />
          <h2 className="text-xl font-bold text-neutral-900 font-display">Tương Tác</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto-Sync to Google Chat button */}
          <button
            onClick={async () => {
              if (!isGoogleUser) {
                setActiveTab('gchat');
                return;
              }
              if (selectedFriend || selectedGroupChat) {
                setShowGChatSyncModal(true);
              } else {
                setActiveTab('gchat');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-[10px] sm:text-xs font-bold transition-all border shrink-0 ${
              !isGoogleUser 
                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
                : activeLinkedGChatSpace 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 animate-pulse'
                  : 'bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-950 border-neutral-200 shadow-sm'
            }`}
            title={
              !isGoogleUser 
                ? 'Yêu cầu Tài khoản đăng nhập bằng Google'
                : activeLinkedGChatSpace 
                  ? `Đang tự động đồng bộ: ${activeLinkedGChatSpace.displayName}. Nhấp để sửa.`
                  : 'Tự động đồng bộ cuộc trò chuyện này với Google Chat'
            }
          >
            <MessageCircle className={`w-3.5 h-3.5 ${activeLinkedGChatSpace ? 'text-emerald-600' : 'text-neutral-500'}`} />
            <span>
              {!isGoogleUser ? 'Google Chat 🔒' : activeLinkedGChatSpace ? 'Đang Đồng bộ' : 'Đồng bộ GChat'}
            </span>
          </button>

          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shadow-sm shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row-reverse relative overflow-hidden bg-white">
        
        {/* Chat Wrapper */}
        <div className={`relative h-full flex-1 bg-slate-50 transition-all duration-300 ${
          (selectedFriend || selectedGroupChat || selectedGoogleChatSpace) ? "block" : "hidden md:block"
        }`}>
          {(selectedFriend || selectedGroupChat || selectedGoogleChatSpace) ? (
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
                    onClick={() => { setSelectedFriend(null); setSelectedGroupChat(null); setSelectedGoogleChatSpace(null); }}
                    className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-bold rounded-3xl hover:bg-neutral-200 transition-colors md:hidden"
                  >
                    Trở lại
                  </button>
                  {selectedGoogleChatSpace ? (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center ml-2 border border-emerald-100 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-neutral-800 text-[13px] sm:text-sm leading-tight truncate">
                          {selectedGoogleChatSpace.displayName || selectedGoogleChatSpace.name.split('/').pop() || 'Phòng Google Chat'}
                        </h3>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mt-0.5">
                          {selectedGoogleChatSpace.spaceType || 'SPACE'} • Google Chat 💬
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button 
                          type="button"
                          onClick={() => {
                            if (googleChatToken && selectedGoogleChatSpace) {
                              const fetchMsgs = async () => {
                                const msgs = await listGoogleChatMessages(googleChatToken, selectedGoogleChatSpace.name);
                                const sortedMsgs = [...msgs].sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
                                setGoogleChatMessages(sortedMsgs);
                              };
                              fetchMsgs().catch(err => console.error("Error refreshing Google Chat:", err));
                            }
                          }}
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-all border border-emerald-100/60"
                          title="Làm mới cuộc trò chuyện"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : selectedFriend ? (
                    <>
                      <AIAvatar uid={selectedFriend.friendId} name={selectedFriend.displayName} photoURL={selectedFriend.photoURL} className="w-8 h-8 rounded-full border border-neutral-100 ml-2 object-cover bg-neutral-200" />
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-bold text-neutral-800 text-sm leading-none truncate">{selectedFriend.displayName || 'Bạn bè'}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-semibold uppercase tracking-wider ${friendStatuses[selectedFriend.friendId] === 'online' ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            {friendStatuses[selectedFriend.friendId] === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                          </span>
                          {activeLinkedGChatSpace && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-bold select-none whitespace-nowrap truncate max-w-[120px]" title={activeLinkedGChatSpace.displayName}>
                              Đồng bộ: {activeLinkedGChatSpace.displayName} 💬
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        {isGoogleUser && (
                          <button
                            onClick={() => setShowGChatSyncModal(true)}
                            className={`p-2 rounded-2xl border transition-all flex items-center justify-center ${
                              activeLinkedGChatSpace 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 border-neutral-200'
                            }`}
                            title="Đồng bộ Cuộc trò chuyện sang Google Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setShowMeetSelectionModal(true)}
                          disabled={isCreatingMeet}
                          className="p-2 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 border border-emerald-100/50"
                          title="Tạo cuộc họp Google Meet"
                        >
                          {isCreatingMeet ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (onStartCall) onStartCall(selectedFriend.friendId, false);
                          }}
                          className="p-2 bg-neutral-50 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-100 transition-colors flex items-center justify-center border border-neutral-200/30"
                          title="Gọi Thoại"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center ml-2 border border-neutral-200 shrink-0">
                        <Users className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-bold text-neutral-800 text-sm leading-none truncate">{selectedGroupChat?.name || 'Nhóm'}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-neutral-400 font-semibold">{selectedGroupChat?.participants?.length || 0} thành viên</span>
                          {activeLinkedGChatSpace && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-1.5 py-0.5 font-bold select-none whitespace-nowrap truncate max-w-[120px]" title={activeLinkedGChatSpace.displayName}>
                              Đồng bộ: {activeLinkedGChatSpace.displayName} 💬
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center shrink-0">
                        {isGoogleUser && (
                          <button
                            onClick={() => setShowGChatSyncModal(true)}
                            className={`p-2 rounded-2xl border transition-all flex items-center justify-center ${
                              activeLinkedGChatSpace 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 border-neutral-200'
                            }`}
                            title="Đồng bộ Nhóm sang Google Chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setShowMeetSelectionModal(true)}
                          disabled={isCreatingMeet}
                          className="p-2 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 border border-emerald-100/50"
                          title="Tạo cuộc họp Google Meet cho nhóm"
                        >
                          {isCreatingMeet ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 pb-2">
                  {selectedGoogleChatSpace ? (
                    // Google Chat Messages Rendering
                    googleChatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                          <MessageCircle className="w-8 h-8 text-neutral-200" />
                        </div>
                        <p className="font-bold text-neutral-900 mb-1">Không có tin nhắn nào</p>
                        <p className="text-sm text-neutral-500">Hãy viết tin nhắn đầu tiên để cùng trò chuyện bằng API thực trên Google Chat! 💬</p>
                      </div>
                    ) : (
                      <div className="space-y-3 flex flex-col justify-end min-h-full">
                        {googleChatMessages.map((msg, i) => {
                          const isMe = msg.sender?.displayName === user?.displayName || msg.sender?.name?.includes('users/me');
                          const prevMsg = googleChatMessages[i - 1];
                          const showAvatar = !prevMsg || prevMsg.sender?.displayName !== msg.sender?.displayName;
                          const dateObj = new Date(msg.createTime);
                          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit' });

                          return (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={msg.name || i}
                              className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                            >
                              <div className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm relative overflow-hidden bg-neutral-200">
                                {msg.sender?.avatarUrl ? (
                                  <img referrerPolicy="no-referrer" src={msg.sender.avatarUrl} alt={msg.sender.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold font-mono">
                                    {(msg.sender?.displayName || 'G')?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {showAvatar && (
                                  <span className="text-[10px] font-bold text-neutral-500 mb-1 px-1">{msg.sender?.displayName || 'Thành viên'}</span>
                                )}
                                <div className={`py-2.5 px-4 text-sm max-w-[280px] sm:max-w-md break-all leading-relaxed transition-all duration-350 ${
                                  isMe 
                                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl rounded-tr-none border border-emerald-600/10 shadow-md shadow-emerald-500/10' 
                                    : 'bg-white text-neutral-800 rounded-2xl rounded-tl-none border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[9px] text-neutral-400 mt-1 px-1 font-mono">{timeStr}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )
                  ) : messages.length === 0 ? (
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
                                {msg.text && msg.text.includes('meet.google.com/') ? (
                                  (() => {
                                    const meetLink = msg.text.match(/https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+/)?.[0] || msg.text;
                                    const code = meetLink.split('/').pop() || '...';
                                    return (
                                      <div className="flex flex-col gap-3 p-4 bg-white text-neutral-800 border border-neutral-200/80 rounded-3xl shadow-md max-w-xs sm:max-w-sm mt-1">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                                            <Video className="w-5 h-5 animate-pulse" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-extrabold text-xs sm:text-sm text-neutral-900 leading-snug">Cuộc họp Google Meet</p>
                                            <p className="text-[10px] sm:text-xs text-neutral-500 truncate mt-0.5 font-medium">Click để tham gia thoại & video</p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-1.5 font-mono text-xs text-neutral-600 font-bold">
                                          <span>MÃ CUỘC HỌP</span>
                                          <span className="text-neutral-900 tracking-wider font-extrabold">{code}</span>
                                        </div>

                                        <a 
                                          href={meetLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-3xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-[0.98]"
                                        >
                                          Tham gia cuộc họp <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className={`group relative py-2.5 px-4 text-sm transition-all duration-300 leading-relaxed ${
                                      isMe 
                                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-2xl rounded-br-none border border-indigo-600/10 shadow-md shadow-indigo-600/10' 
                                        : 'bg-white text-neutral-800 border border-neutral-180/80 rounded-2xl rounded-bl-none shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                                    }`}
                                  >
                                    <p className="break-words whitespace-pre-wrap text-[13.5px] sm:text-[14px]">{msg.text}</p>
                                    
                                    {msg.fileUrl && (
                                      <div className="mt-2 text-center rounded-2xl overflow-hidden relative">
                                        {msg.isUploading && (
                                           <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center rounded-2xl z-10 text-white backdrop-blur-[2px]">
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
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-450 font-medium px-1">
                                  <span>{timeStr}</span>
                                  {isMe && (
                                    <Check className="w-3 h-3 text-indigo-500 font-extrabold" />
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
                <form onSubmit={selectedGoogleChatSpace ? handleSendGChatMessage : handleSendMessage} className="p-4 bg-white border-t border-neutral-100 shrink-0 sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative">
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
                            if (selectedGoogleChatSpace) {
                              setGChatMessageInput(prev => prev + emojiData.emoji);
                            } else {
                              setNewMessage(prev => prev + emojiData.emoji);
                            }
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

                    {selectedGoogleChatSpace ? (
                      <input
                        type="text"
                        value={gchatMessageInput}
                        onChange={e => setGChatMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn phát trực tiếp đến Google Chat..."
                        className="flex-1 bg-neutral-100 rounded-3xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-none mb-1 min-w-[100px]"
                      />
                    ) : isRecording ? (
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
                    
                    {selectedGoogleChatSpace ? (
                      <button 
                        type="submit"
                        disabled={!gchatMessageInput.trim() || isSendingGChatMessage}
                        className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 shrink-0 transform active:scale-95 disabled:opacity-50"
                      >
                        {isSendingGChatMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                      </button>
                    ) : !isRecording && (
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-neutral-50 dark:bg-neutral-900 border-l border-neutral-100/50">
                <div className="w-16 h-16 rounded-full bg-slate-100/85 flex items-center justify-center mb-4 text-slate-500 shadow-sm animate-pulse">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-sans font-extrabold text-base text-neutral-800">Không Gian Trò Chuyện</h3>
                <p className="text-xs text-neutral-400 mt-2 max-w-xs leading-relaxed">
                  Hãy click chọn một người bạn hoặc phòng chat ở danh sách bên trái để bắt đầu nhắn tin hâm nóng tình cảm!
                </p>
              </div>
          )}
        </div>

        {/* List Wrapper */}
        <div className={`relative h-full bg-white shrink-0 transition-all duration-300 ${
          (selectedFriend || selectedGroupChat || selectedGoogleChatSpace) ? "hidden md:block md:w-[320px] lg:w-[350px]" : "w-full md:w-[320px] lg:w-[350px] md:border-r md:border-neutral-100"
        }`}>
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 sm:p-6 space-y-6 pb-10 absolute inset-0 overflow-y-auto bg-white"
              >
                <div className="flex bg-neutral-100 p-1 rounded-3xl mb-4 shrink-0 shadow-sm border border-neutral-200 sticky top-0 z-10 backdrop-blur-md bg-white/80 select-none overflow-x-auto scrollbar-none">
                  <button 
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-3xl transition-all whitespace-nowrap px-2 ${activeTab === 'friends' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Bạn bè
                  </button>
                  <button 
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-3xl transition-all whitespace-nowrap px-2 ${activeTab === 'groups' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Nhóm
                  </button>
                  <button 
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs sm:text-sm font-bold rounded-3xl transition-all whitespace-nowrap px-2 ${activeTab === 'requests' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Kết bạn {friendRequests.length > 0 && <span className="bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">{friendRequests.length}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('gchat')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-3xl transition-all whitespace-nowrap px-2 ${activeTab === 'gchat' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Google Chat {!isGoogleUser && '🔒'}
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
                              <AIAvatar 
                                uid={f.friendId} 
                                name={f.displayName} 
                                photoURL={f.photoURL} 
                                className={`w-8 h-8 rounded-full object-cover bg-neutral-200 transition-all duration-350 ${
                                  friendStatuses[f.friendId] === 'online' 
                                    ? 'ring-2 ring-emerald-400 ring-offset-1 shadow-[0_0_10px_rgba(16,185,129,0.65)]' 
                                    : 'shadow-inner border border-neutral-200'
                                }`} 
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">{f.displayName || 'Bạn bè'}</p>
                                  {f.relationshipType && (
                                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-3xl border border-orange-100">
                                      {f.relationshipType}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-3xl inline-flex items-center gap-1.5 transition-all ${
                                  friendStatuses[f.friendId] === 'online' 
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100/60' 
                                    : 'text-neutral-500 bg-neutral-100 border border-neutral-200/40'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${friendStatuses[f.friendId] === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
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

                {activeTab === 'gchat' && (
                  <div className="space-y-4 animate-fadeIn">
                    {!isGoogleUser ? (
                      <div className="bg-neutral-50/50 rounded-3xl p-8 text-center border border-neutral-100 flex flex-col items-center justify-center min-h-[350px]">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-amber-50 text-amber-600 border border-amber-100 animate-pulse shadow-sm">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-extrabold text-neutral-800 mb-2 font-display">Yêu cầu Đăng nhập bằng Google</h4>
                        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed mb-6">
                          Tính năng liên kết, đồng bộ phòng chat và gửi tin nhắn trực tiếp sang hệ thống Google Chat chỉ khả dụng cho tài khoản đăng nhập trực tiếp bằng tài khoản Google.
                        </p>
                        <div className="p-4 bg-white rounded-2xl border border-neutral-200/60 text-left max-w-xs shadow-sm">
                          <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider mb-1">Hướng dẫn kết nối:</p>
                          <p className="text-[11px] text-neutral-500 leading-normal">
                            Trở ra màn hình chính, vào phần <strong>Cài đặt</strong> và tiến hành liên kết tài khoản này với Google, hoặc đăng xuất và đăng nhập lại bằng tài khoản Google để kích hoạt.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest pl-1">Phòng Google Chat</p>
                          {googleChatToken && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => fetchGChatSpaces(googleChatToken)}
                                disabled={isGChatSpacesLoading}
                                className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-1.5 px-3 rounded-2xl font-bold transition-all disabled:opacity-50"
                              >
                                Tải lại
                              </button>
                              <button 
                                onClick={() => setShowCreateGChatSpaceModal(true)}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded-2xl font-bold transition-all"
                              >
                                + Tạo phòng
                              </button>
                            </div>
                          )}
                        </div>

                        {!googleChatToken ? (
                          <div className="bg-neutral-50/50 rounded-3xl p-6 text-center border border-neutral-100/50">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-neutral-100 border border-neutral-200">
                              <MessageCircle className="w-5 h-5 text-neutral-400" />
                            </div>
                            <p className="text-sm text-neutral-800 font-bold mb-1">Kết nối Google Chat</p>
                            <p className="text-xs text-neutral-500 mb-4 px-4 leading-normal">
                              Kết nối tài khoản Google để đồng bộ, xem các phòng trò chuyện, và gửi tin nhắn trực tiếp đến Google Chat.
                            </p>
                            <button
                              onClick={handleConnectGChat}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-3xl transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
                            >
                              Đăng nhập Google Chat
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-neutral-700 font-bold">
                              <span className="text-neutral-500 font-medium">Đã kết nối</span>
                              <button 
                                onClick={handleDisconnectGChat}
                                className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider"
                              >
                                Đăng xuất
                              </button>
                            </div>

                            {isGChatSpacesLoading ? (
                              <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                                <span className="text-xs text-neutral-500 font-medium">Đang tìm danh sách spaces...</span>
                              </div>
                            ) : googleChatSpaces.length === 0 ? (
                              <div className="bg-neutral-50/50 rounded-3xl p-6 text-center border border-neutral-100/50">
                                <p className="text-sm text-neutral-600 font-medium">Không tìm thấy phòng Google Chat nào.</p>
                                <p className="text-xs text-neutral-400 mt-1 mb-3">Tạo phòng mới để bắt đầu cuộc trò chuyện!</p>
                                <button 
                                  onClick={() => setShowCreateGChatSpaceModal(true)}
                                  className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-3 py-1.5 rounded-2xl hover:bg-emerald-100 transition-colors"
                                >
                                  + Tạo phòng trò chuyện mới
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {googleChatSpaces.map((space) => {
                                  const isSelected = selectedGoogleChatSpace?.name === space.name;
                                  return (
                                    <div 
                                      key={space.name}
                                      onClick={() => {
                                        setSelectedFriend(null);
                                        setSelectedGroupChat(null);
                                        setSelectedGoogleChatSpace(space);
                                      }}
                                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 shadow-sm' 
                                          : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                          isSelected ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                                        }`}>
                                          <Users className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs sm:text-sm font-extrabold truncate pr-2">
                                            {space.displayName || space.name.split('/').pop() || 'Phòng Google Chat'}
                                          </p>
                                          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider mt-0.5">
                                            {space.spaceType || 'SPACE'}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50/50 px-2 py-0.5 rounded-lg border border-emerald-100 shrink-0">
                                        Mở
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
        </div>

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

        {/* Create Google Chat Space Modal */}
        <AnimatePresence>
          {showCreateGChatSpaceModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowCreateGChatSpaceModal(false)}
            >
              <div 
                className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowCreateGChatSpaceModal(false)}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-3xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                  <MessageCircle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-1 font-display">Tạo Phòng Google Chat</h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Tạo một phòng (Space) Google Chat chính thức để bàn bạc công việc, kế hoạch hoặc giữ liên lạc chất lượng cao!
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">Tên phòng trò chuyện</label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      placeholder="Ví dụ: Kế hoạch Tuần mới 🚀"
                      value={gchatSpaceNameInput}
                      onChange={e => setGChatSpaceNameInput(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCreateGChatSpace}
                  disabled={!gchatSpaceNameInput.trim() || isCreatingGChatSpace}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-3xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isCreatingGChatSpace ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    "Tạo không gian ngay"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Chat Sync Modal */}
        <AnimatePresence>
          {showGChatSyncModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowGChatSyncModal(false)}
            >
              <div 
                className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowGChatSyncModal(false)}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-3xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                  <MessageCircle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-1 font-display">Đồng bộ Google Chat</h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Liên kết cuộc trò chuyện hiện tại của bạn với một Không gian (Space) trong Google Chat. Tin nhắn mới sẽ tự động được gửi đồng bộ theo thời gian thực!
                </p>

                {!googleChatToken ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-neutral-600 mb-4 font-medium">Hãy kết nối tài khoản Google Chat của bạn trước:</p>
                    <button
                      onClick={async () => {
                        try {
                          await handleConnectGChat();
                        } catch (err) {
                          console.error("Connect error:", err);
                        }
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-3xl transition-all shadow-md"
                    >
                      Đăng nhập Google Chat
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Chọn phòng trò chuyện để liên kết:</p>
                    
                    {googleChatSpaces.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-neutral-500 mb-2 font-medium">Chưa có phòng Google Chat nào.</p>
                        <button 
                          onClick={() => {
                            setShowGChatSyncModal(false);
                            setActiveTab('gchat');
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-bold"
                        >
                          Đi đến mục Tạo phòng
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {googleChatSpaces.map((space) => {
                          const isCurrentlyLinked = activeLinkedGChatSpace?.name === space.name;
                          return (
                            <button
                              key={space.name}
                              onClick={async () => {
                                let chatId = '';
                                if (selectedFriend) {
                                  const participants = [user.uid, selectedFriend.friendId].sort();
                                  chatId = `${participants[0]}_${participants[1]}`;
                                } else if (selectedGroupChat) {
                                  chatId = selectedGroupChat.id;
                                }
                                if (!chatId) return;
                                
                                try {
                                  await setDoc(doc(db, 'chats', chatId), {
                                    gchatSpaceName: space.name,
                                    gchatSpaceDisplayName: space.displayName || space.name.split('/').pop() || 'Space'
                                  }, { merge: true });
                                  setShowGChatSyncModal(false);
                                } catch (err: any) {
                                  console.error("Link error:", err);
                                  window.alert("Không thể liên kết cuộc trò chuyện.");
                                }
                              }}
                              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                isCurrentlyLinked 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' 
                                  : 'bg-neutral-50/50 border-neutral-150 hover:bg-neutral-50 text-neutral-800'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold truncate">
                                  {space.displayName || space.name.split('/').pop()}
                                </p>
                                <p className="text-[9px] text-neutral-400 font-medium tracking-wide">
                                  {space.spaceType || 'SPACE'}
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                                isCurrentlyLinked 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : 'bg-white text-neutral-500 border-neutral-200'
                              }`}>
                                {isCurrentlyLinked ? 'Đang đồng bộ' : 'Liên kết'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeLinkedGChatSpace && (
                      <div className="pt-2 border-t border-neutral-100">
                        <button
                          onClick={async () => {
                            let chatId = '';
                            if (selectedFriend) {
                              const participants = [user.uid, selectedFriend.friendId].sort();
                              chatId = `${participants[0]}_${participants[1]}`;
                            } else if (selectedGroupChat) {
                              chatId = selectedGroupChat.id;
                            }
                            if (!chatId) return;

                            try {
                              await setDoc(doc(db, 'chats', chatId), {
                                gchatSpaceName: deleteField(),
                                gchatSpaceDisplayName: deleteField()
                              }, { merge: true });
                              setShowGChatSyncModal(false);
                            } catch (err: any) {
                              console.error("Unlink error:", err);
                            }
                          }}
                          className="w-full text-center py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-2xl transition-colors border border-red-200/50"
                        >
                          Hủy liên kết & Dừng đồng bộ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Meet Selection Modal */}
        <AnimatePresence>
          {showMeetSelectionModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowMeetSelectionModal(false)}
            >
              <div 
                className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowMeetSelectionModal(false)}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-3xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                  <Video className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-1 font-display">Tạo phòng Google Meet</h3>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                  Lựa chọn cách tạo phòng để gọi điện trực tuyến qua Google Meet. Tương thích đầy đủ với cả các tài khoản ẩn danh!
                </p>

                <div className="space-y-3">
                  {/* Option 1: Anonymous Space Generator */}
                  <button
                    onClick={() => handleCreateGoogleMeet(true)}
                    disabled={isCreatingMeet}
                    className="w-full text-left p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-all flex items-start gap-3 active:scale-98"
                  >
                    <div className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-800">Tạo mã Meet ẩn danh (Nhanh nhất) ⚡</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">
                        Mọi tài khoản đều tạo được ngay. Tạo mã phòng tiêu chuẩn chia sẻ tức thì lên khung chat để mời bạn bè tham gia trực tiếp.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Authorized Space */}
                  <button
                    onClick={() => handleCreateGoogleMeet(false)}
                    disabled={isCreatingMeet}
                    className="w-full text-left p-4 rounded-2xl border border-emerald-250 bg-emerald-50/30 hover:bg-emerald-50/70 transition-all flex items-start gap-3 active:scale-98"
                  >
                    <div className="p-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-emerald-950">Đăng nhập API chính thức 🎥</p>
                        {getGoogleMeetToken() && <span className="text-[8px] bg-emerald-600 text-white rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0 scale-90">Đã nối</span>}
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">
                        Yêu cầu quyền Tài khoản Google của bạn. Tạo không gian họp bảo mật chính thức theo tài khoản với chế độ nâng cao. {user?.isAnonymous && <strong className="text-orange-500">Hỗ trợ nâng cấp tự động từ tài khoản ẩn danh!</strong>}
                      </p>
                    </div>
                  </button>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowMeetSelectionModal(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-700 font-bold px-3 py-1.5"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

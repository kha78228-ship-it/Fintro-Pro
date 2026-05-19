import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, Trash2, Plus, X, Heart, Maximize2, Download, User } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface Photo {
  id: string;
  url: string;
  description: string;
  createdAt: any;
  createdBy: string;
  creatorName?: string;
  creatorAvatar?: string;
}

export function PhotoAlbum({ appTheme = 'vintage' }: { appTheme?: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to photos collection
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const loadedPhotos: Photo[] = [];
      snapshot.forEach((doc) => {
        loadedPhotos.push({ id: doc.id, ...doc.data() } as Photo);
      });
      setPhotos(loadedPhotos);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos');
    });

    return () => unsub();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!auth.currentUser) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Compress image before uploading
        const blob = await compressImage(file);
        
        // Upload to Firebase Storage
        const fileRef = ref(storage, `photos/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, blob!);
        const downloadUrl = await getDownloadURL(fileRef);
        
        await addDoc(collection(db, 'photos'), {
          url: downloadUrl,
          description: '',
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid,
          creatorName: auth.currentUser.displayName || 'Khách',
          creatorAvatar: auth.currentUser.photoURL || ''
        });
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const compressImage = (file: File): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await deleteDoc(doc(db, 'photos', id));
      if (selectedPhoto?.id === id) setSelectedPhoto(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `photos/${id}`);
    }
  };

  const handleDownload = (photo: Photo) => {
     const a = document.createElement('a');
     a.href = photo.url;
     a.download = `photo_${photo.id}.jpg`;
     a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Album Ảnh Chung</h2>
          <p className="text-neutral-500 mt-1">Lưu giữ những khoảnh khắc đẹp nhất của hai người</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2 transition-all active:scale-95"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          Tải ảnh lên
        </button>
      </div>

      {photos.length === 0 && !uploading && (
         <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50">
            <ImageIcon className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-bold text-neutral-600 mb-2">Chưa có ảnh nào</h3>
            <p className="text-neutral-400 max-w-sm mb-6">Hãy tải lên những bức ảnh chung để tạo thành một album kỷ niệm thật đẹp nhé!</p>
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="px-6 py-3 bg-white border border-neutral-200 text-neutral-600 font-bold rounded-3xl shadow-sm hover:bg-neutral-50 transition-all active:scale-95"
            >
               Chọn ảnh ngay
            </button>
         </div>
      )}

      {/* Grid view */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group aspect-square relative rounded-3xl overflow-hidden cursor-pointer shadow-sm border border-neutral-200 bg-neutral-100"
            >
              <img 
                src={photo.url} 
                alt="Shared memory" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-neutral-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-orange-100 hover:text-orange-600 transition-all active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.creatorAvatar ? (
                  <img src={photo.creatorAvatar} className="w-6 h-6 rounded-full border border-white/50 shadow-sm shrink-0" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-200 border border-white/50 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-neutral-500" />
                  </div>
                )}
                <span className="text-white text-xs font-medium drop-shadow-md truncate">{photo.creatorName || 'Khách'}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox / Immersive View */}
      <AnimatePresence>
        {selectedPhoto && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setSelectedPhoto(null)}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
           >
             <button 
               onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
               className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-90"
             >
               <X className="w-6 h-6" />
             </button>
             
             <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 flex gap-3 z-10">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleDownload(selectedPhoto); }}
                 className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-90"
                 title="Tải xuống"
               >
                 <Download className="w-5 h-5" />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); handleDelete(selectedPhoto.id); }}
                 className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-full transition-colors active:scale-90"
                 title="Xóa ảnh"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
             </div>

             <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 flex items-center gap-3 z-10">
               {selectedPhoto.creatorAvatar ? (
                 <img src={selectedPhoto.creatorAvatar} className="w-10 h-10 rounded-full border-2 border-white/50 shadow-lg" alt="" referrerPolicy="no-referrer" />
               ) : (
                 <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-white/50 shadow-lg flex items-center justify-center">
                   <User className="w-5 h-5 text-neutral-300" />
                 </div>
               )}
               <div className="text-left">
                 <p className="text-white font-medium text-sm drop-shadow-md">{selectedPhoto.creatorName || 'Khách'}</p>
                 {selectedPhoto.createdAt?.toDate && (
                   <p className="text-white/60 text-xs drop-shadow-md">{selectedPhoto.createdAt.toDate().toLocaleDateString('vi-VN')}</p>
                 )}
               </div>
             </div>

             <motion.img 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: "spring", bounce: 0.3 }}
               src={selectedPhoto.url} 
               alt="Enlarged"
               className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             />
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PhotoAlbum;

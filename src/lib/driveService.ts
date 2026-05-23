import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Cache the access token in memory as required by guidelines
let cachedAccessToken: string | null = null;
let cachedGoogleUser: any = null;

export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
}

export interface DriveQuota {
  limit: string;
  usage: string;
  usageInDrive: string;
}

/**
 * Handle Google authentication with Google Drive file scope
 */
export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Scope required to manage files created by this app
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    
    // Always trigger popup
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Auth.');
    }
    
    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Lỗi kết nối Google Drive:', error);
    throw error;
  }
};

/**
 * Disconnect/Sign-out from Google Drive
 */
export const disconnectGoogleDrive = () => {
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

/**
 * Get cached Google Drive Access Token
 */
export const getGoogleDriveToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set Google Drive Access Token (e.g. if loaded through other authenticated states)
 */
export const setGoogleDriveToken = (token: string | null, googleUser?: any) => {
  cachedAccessToken = token;
  if (googleUser) cachedGoogleUser = googleUser;
};

/**
 * Fetch or create parent backup folder 'Fintro_Backups'
 */
export const getOrCreateBackupFolder = async (accessToken: string, folderName = 'Fintro_Backups'): Promise<string> => {
  // 1. Search if folder already exists
  const queryStr = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Lỗi tìm kiếm thư mục: ${errText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // 2. Create the folder if it does not exist
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Lỗi tạo thư mục: ${errText}`);
  }
  
  const folder = await createRes.json();
  return folder.id;
};

/**
 * Get or create 'Fintro_Diary_Photos' subfolder inside Fintro_Backups
 */
export const getOrCreateSubfolder = async (accessToken: string, parentId: string, folderName: string): Promise<string> => {
  const queryStr = encodeURIComponent(`name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) {
    throw new Error('Lỗi tìm thư mục con');
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Create it
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  
  if (!createRes.ok) {
    throw new Error('Lỗi tạo thư mục con');
  }
  
  const folder = await createRes.json();
  return folder.id;
};

/**
 * Backup all local financial data to Google Drive
 */
export const uploadFinancialBackup = async (
  accessToken: string,
  userUid: string,
  userEmail: string
): Promise<DriveBackupFile> => {
  // 1. Fetch all Firestore documents for financial modules
  const txsSnap = await getDocs(collection(db, `users/${userUid}/transactions`));
  const budgetsSnap = await getDocs(collection(db, `users/${userUid}/budgets`));
  const debtsSnap = await getDocs(collection(db, `users/${userUid}/debts`));
  const goalsSnap = await getDocs(collection(db, `users/${userUid}/goals`));
  const subsSnap = await getDocs(collection(db, `users/${userUid}/subscriptions`));
  
  const transactions = txsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const budgets = budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const debts = debtsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const subscriptions = subsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Create statistical summary
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx: any) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'expense') totalExpense += tx.amount;
  });
  
  const payload = {
    appName: 'Fintro',
    userEmail,
    timestamp: new Date().toISOString(),
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      budgetCount: budgets.length,
      debtCount: debts.length,
      goalCount: goals.length,
      subscriptionCount: subscriptions.length
    },
    data: {
      transactions,
      budgets,
      debts,
      goals,
      subscriptions
    }
  };
  
  // 2. Locate/Create parenting backups folder
  const parentFolderId = await getOrCreateBackupFolder(accessToken);
  
  // 3. Register the file metadata
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `fintro_financials_backup_${timestampStr}.json`;
  
  const metadataRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: fileName,
      parents: [parentFolderId],
      mimeType: 'application/json'
    })
  });
  
  if (!metadataRes.ok) {
    const textErr = await metadataRes.text();
    throw new Error(`Lỗi tạo metadata: ${textErr}`);
  }
  
  const fileMetadata = await metadataRes.ok ? await metadataRes.json() : null;
  if (!fileMetadata || !fileMetadata.id) {
    throw new Error('Không thể tải metadata của file lưu trữ.');
  }
  
  // 4. Upload actual content
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileMetadata.id}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload, null, 2)
  });
  
  if (!uploadRes.ok) {
    const textErr = await uploadRes.text();
    throw new Error(`Lỗi tải tệp tin lên Drive: ${textErr}`);
  }
  
  // Save last backup time into user document
  await setDoc(doc(db, 'users', userUid), {
    driveLastBackupTime: new Date().toISOString()
  }, { merge: true });
  
  return {
    id: fileMetadata.id,
    name: fileName,
    mimeType: 'application/json',
    createdTime: new Date().toISOString()
  };
};

/**
 * Perform incremental backup of diary photos to Google Drive
 */
export const uploadDiaryPhotosBackup = async (
  accessToken: string,
  userUid: string,
  onProgress?: (fileName: string, index: number, total: number, isSkipped: boolean) => void
): Promise<{ total: number; uploaded: number; skipped: number }> => {
  // 1. Fetch matching user photos
  const photosSnap = await getDocs(query(collection(db, 'photos'), where('createdBy', '==', userUid)));
  const photosList = photosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  if (photosList.length === 0) {
    return { total: 0, uploaded: 0, skipped: 0 };
  }
  
  // 2. Find folder trees
  const parentFolderId = await getOrCreateBackupFolder(accessToken);
  const diaryFolderId = await getOrCreateSubfolder(accessToken, parentFolderId, 'Fintro_Diary_Photos');
  
  // 3. Fetch remote files in Diary_Photos to see what exists (for fast incremental backup)
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${diaryFolderId}' in parents and trashed = false`)}&fields=files(id,name)&pageSize=1000`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  let existingNames = new Set<string>();
  if (listRes.ok) {
    const listData = await listRes.json();
    if (listData.files) {
      listData.files.forEach((f: any) => existingNames.add(f.name));
    }
  }
  
  let uploaded = 0;
  let skipped = 0;
  
  // 4. Upload each photo
  for (let i = 0; i < photosList.length; i++) {
    const photo: any = photosList[i];
    const extension = photo.url.includes('.png') ? 'png' : 'jpg';
    const fileName = `diary_photo_${photo.id}.${extension}`;
    
    // Check if duplicate on Google Drive
    if (existingNames.has(fileName)) {
      skipped++;
      if (onProgress) onProgress(fileName, i + 1, photosList.length, true);
      continue;
    }
    
    if (onProgress) onProgress(fileName, i + 1, photosList.length, false);
    
    try {
      // Download blob
      const imgRes = await fetch(photo.url);
      if (!imgRes.ok) {
        throw new Error('Cửa sổ Firebase trì hoãn tải ảnh.');
      }
      const blob = await imgRes.blob();
      
      // Create metadata entry on Drive
      const metadataRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          parents: [diaryFolderId],
          mimeType: blob.type || `image/${extension}`
        })
      });
      
      if (!metadataRes.ok) throw new Error('Cự tuyệt tải metadata ảnh.');
      const fileMeta = await metadataRes.json();
      
      // Upload raw image blob
      const payloadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileMeta.id}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': blob.type || `image/${extension}`
        },
        body: blob
      });
      
      if (!payloadRes.ok) throw new Error('Cự tuyệt tải dữ liệu tệp ảnh.');
      uploaded++;
    } catch (err) {
      console.error(`Lỗi tải ảnh nhật ký ${fileName}:`, err);
    }
  }
  
  // Also create/update diary index JSON for easier recovery
  try {
    const diaryMetadataPayload = {
      appName: 'Fintro',
      backupType: 'diary_photos_index',
      timestamp: new Date().toISOString(),
      photos: photosList.map((photo: any) => ({
        id: photo.id,
        description: photo.description || '',
        createdAt: photo.createdAt?.seconds ? new Date(photo.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        createdBy: photo.createdBy,
        fileName: `diary_photo_${photo.id}.${photo.url.includes('.png') ? 'png' : 'jpg'}`
      }))
    };
    
    // Check for existing index file
    const searchIndexUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name = 'diary_photos_index.json' and '${parentFolderId}' in parents and trashed = false`)}&fields=files(id)`;
    const searchIndexRes = await fetch(searchIndexUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    let indexFileId = null;
    if (searchIndexRes.ok) {
      const searchIndexData = await searchIndexRes.json();
      if (searchIndexData.files && searchIndexData.files.length > 0) {
        indexFileId = searchIndexData.files[0].id;
      }
    }
    
    if (!indexFileId) {
      // Create the index file metadata
      const createIndexRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'diary_photos_index.json',
          parents: [parentFolderId],
          mimeType: 'application/json'
        })
      });
      if (createIndexRes.ok) {
        const meta = await createIndexRes.json();
        indexFileId = meta.id;
      }
    }
    
    if (indexFileId) {
      // Patch index file contents
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${indexFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(diaryMetadataPayload, null, 2)
      });
    }
  } catch (indexErr) {
    console.error('Lỗi lưu chỉ mục ảnh nhật ký:', indexErr);
  }
  
  return { total: photosList.length, uploaded, skipped };
};

/**
 * List all backup files available in Google Drive under Fintro_Backups
 */
export const listDriveBackups = async (accessToken: string): Promise<DriveBackupFile[]> => {
  try {
    const parentFolderId = await getOrCreateBackupFolder(accessToken);
    const queryStr = encodeURIComponent(`'${parentFolderId}' in parents and trashed = false and name != 'Fintro_Diary_Photos'`);
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime+desc`;
    
    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      throw new Error('Lỗi lấy danh sách bản sao lưu Drive.');
    }
    
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách bộ nhớ Drive:', error);
    return [];
  }
};

/**
 * Fetch and download a specific financial backup and restore it into local Firestore.
 * Always prompts user confirm, handled by component UI!
 */
export const restoreFinancialBackup = async (
  accessToken: string,
  fileId: string,
  userUid: string
): Promise<any> => {
  // 1. Fetch content of backup file
  const fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(fetchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    throw new Error('Lỗi tải dữ liệu phục hồi từ Drive.');
  }
  
  const backupObject = await res.json();
  if (backupObject.appName !== 'Fintro' || !backupObject.data) {
    throw new Error('Tệp phục hồi không phải định dạng hợp lệ của Fintro.');
  }
  
  const { data } = backupObject;
  
  // 2. Clear old collections and overwrite with backup content
  // Since we require explicit write actions, we run sequentially or in chunk batches.
  // Overwriting:
  const restoreCollection = async (collectionName: string, items: any[]) => {
    if (!items || items.length === 0) return;
    
    for (const item of items) {
      const itemCopy = { ...item };
      const itemId = itemCopy.id;
      delete itemCopy.id; // clear id from object content
      
      const docRef = doc(db, `users/${userUid}/${collectionName}`, itemId);
      await setDoc(docRef, itemCopy, { merge: true });
    }
  };
  
  await restoreCollection('transactions', data.transactions || []);
  await restoreCollection('budgets', data.budgets || []);
  await restoreCollection('debts', data.debts || []);
  await restoreCollection('goals', data.goals || []);
  await restoreCollection('subscriptions', data.subscriptions || []);
  
  return backupObject;
};

/**
 * Fetch Google Drive storage usage and total capacity
 */
export const getDriveStorageQuota = async (accessToken: string): Promise<DriveQuota | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      return {
        limit: data.storageQuota.limit || '16106127360', // 15GB fallback
        usage: data.storageQuota.usage || '0',
        usageInDrive: data.storageQuota.usageInDrive || '0'
      };
    }
    return null;
  } catch (error) {
    console.error('Lỗi tải dung lượng Drive:', error);
    return null;
  }
};

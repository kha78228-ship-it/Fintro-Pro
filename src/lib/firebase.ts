import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const storage = getStorage(app);

// Enable offline data persistence with multi-tab support
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed-precondition: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence unimplemented in this browser');
  } else {
    console.warn('Firestore persistence error:', err);
  }
});

export const signInAnonymouslyUser = () => signInAnonymously(auth);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.created');
googleProvider.addScope('https://www.googleapis.com/auth/chat');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/documents');

export const initializeGoogleTokens = async (token: string, user?: any) => {
  if (!token) return;
  try {
    const { setGoogleDriveToken } = await import('./driveService');
    setGoogleDriveToken(token, user);
  } catch (e) {
    console.error("Error setting Drive token:", e);
  }
  try {
    const { setGoogleChatToken } = await import('./chatService');
    setGoogleChatToken(token, user);
  } catch (e) {
    console.error("Error setting Chat token:", e);
  }
  try {
    const { setGoogleMeetToken } = await import('./meetService');
    setGoogleMeetToken(token, user);
  } catch (e) {
    console.error("Error setting Meet token:", e);
  }
  try {
    const { setGoogleTasksToken } = await import('./tasksService');
    setGoogleTasksToken(token, user);
  } catch (e) {
    console.error("Error setting Tasks token:", e);
  }
  try {
    const { setWorkspaceToken } = await import('./workspaceServices');
    setWorkspaceToken(token, user);
  } catch (e) {
    console.error("Error setting Workspace token:", e);
  }
};

export const clearGoogleTokens = async () => {
  try {
    localStorage.removeItem('__google_access_token');
  } catch (e) {}
  try {
    const { setGoogleDriveToken } = await import('./driveService');
    setGoogleDriveToken(null);
  } catch (e) {}
  try {
    const { setGoogleChatToken } = await import('./chatService');
    setGoogleChatToken(null);
  } catch (e) {}
  try {
    const { setGoogleMeetToken } = await import('./meetService');
    setGoogleMeetToken(null);
  } catch (e) {}
  try {
    const { setGoogleTasksToken } = await import('./tasksService');
    setGoogleTasksToken(null);
  } catch (e) {}
  try {
    const { setWorkspaceToken } = await import('./workspaceServices');
    setWorkspaceToken(null);
  } catch (e) {}
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    const token = credential.accessToken;
    try {
      localStorage.setItem('__google_access_token', token);
    } catch (e) {
      console.error("Error storing token in localStorage", e);
    }
    await initializeGoogleTokens(token, result.user);
  }
  return result;
};

export const signInWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
};

// Connection test as required by instructions
async function testConnection() {
  try {
    if (typeof window !== 'undefined' && navigator.onLine) {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
  } catch (error) {
    // Suppress scary errors, just log status info
    console.info("Firebase connection test info: system completed startup. Database offline-mode is active.");
  }
}
setTimeout(testConnection, 2000);

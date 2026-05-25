import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

let cachedChatAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('__google_access_token') : null;
let cachedChatUser: any = null;

/**
 * Connect to Google Chat with chat scopes
 */
export const connectGoogleChat = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Scope requested by the user
    provider.addScope('https://www.googleapis.com/auth/chat');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Auth cho Google Chat.');
    }
    
    cachedChatAccessToken = credential.accessToken;
    cachedChatUser = result.user;
    
    try {
      localStorage.setItem('__google_access_token', cachedChatAccessToken);
    } catch (e) {
      console.error(e);
    }
    
    return { user: result.user, accessToken: cachedChatAccessToken };
  } catch (error) {
    console.error('Lỗi kết nối Google Chat Auth:', error);
    throw error;
  }
};

/**
 * Disconnect Google Chat
 */
export const disconnectGoogleChat = () => {
  cachedChatAccessToken = null;
  cachedChatUser = null;
};

/**
 * Get Google Chat Token
 */
export const getGoogleChatToken = (): string | null => {
  return cachedChatAccessToken;
};

/**
 * Set Google Chat Access Token manually
 */
export const setGoogleChatToken = (token: string | null, user?: any) => {
  cachedChatAccessToken = token;
  if (user) cachedChatUser = user;
  if (token) {
    try {
      localStorage.setItem('__google_access_token', token);
    } catch (e) {}
  }
};

export interface ChatSpace {
  name: string; // "spaces/AAA"
  displayName?: string;
  spaceType?: string; // "SPACE", "DIRECT_MESSAGE", etc.
  singleUserBotMentionRequired?: boolean;
}

export interface ChatMessage {
  name: string; // "spaces/AAA/messages/BBB"
  text: string;
  createTime: string;
  sender?: {
    name: string;
    displayName: string;
    avatarUrl?: string;
    type?: string;
  };
}

/**
 * List spaces of the authenticated user
 * GET https://chat.googleapis.com/v1/spaces
 */
export const listGoogleChatSpaces = async (accessToken: string): Promise<ChatSpace[]> => {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể lấy danh sách phòng Google Chat: ${errText}`);
  }

  const data = await res.json();
  return data.spaces || [];
};

/**
 * Create a new space
 * POST https://chat.googleapis.com/v1/spaces
 */
export const createGoogleChatSpace = async (accessToken: string, displayName: string): Promise<ChatSpace> => {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName: displayName,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể tạo phòng Google Chat mới: ${errText}`);
  }

  return await res.json();
};

/**
 * List messages in a space
 * GET https://chat.googleapis.com/v1/spaces/{spaceId}/messages
 */
export const listGoogleChatMessages = async (accessToken: string, spaceName: string): Promise<ChatMessage[]> => {
  // spaceName is of format "spaces/AAA"
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể danh sách tin nhắn phòng Google Chat: ${errText}`);
  }

  const data = await res.json();
  return data.messages || [];
};

/**
 * Send a message to a space
 * POST https://chat.googleapis.com/v1/spaces/{spaceId}/messages
 */
export const sendGoogleChatMessage = async (accessToken: string, spaceName: string, text: string): Promise<ChatMessage> => {
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể gửi tin nhắn Google Chat: ${errText}`);
  }

  return await res.json();
};

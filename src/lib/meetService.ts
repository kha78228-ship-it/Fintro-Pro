import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

// Cache the Google Meet Access Token in memory
let cachedMeetAccessToken: string | null = null;
let cachedGoogleUser: any = null;

/**
 * Connect to Google Meet with meetings.space.created scope
 */
export const connectGoogleMeet = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Scope required to create meeting spaces
    provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
    
    // Trigger popup for authorization
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Auth cho Google Meet.');
    }
    
    cachedMeetAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    
    return { user: result.user, accessToken: cachedMeetAccessToken };
  } catch (error) {
    console.error('Lỗi kết nối Google Meet Auth:', error);
    throw error;
  }
};

/**
 * Disconnect Google Meet
 */
export const disconnectGoogleMeet = () => {
  cachedMeetAccessToken = null;
  cachedGoogleUser = null;
};

/**
 * Retrieve current Google Meet access token
 */
export const getGoogleMeetToken = (): string | null => {
  return cachedMeetAccessToken;
};

/**
 * Set Google Meet access token manually
 */
export const setGoogleMeetToken = (token: string | null, googleUser?: any) => {
  cachedMeetAccessToken = token;
  if (googleUser) cachedGoogleUser = googleUser;
};

export interface GoogleMeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
}

/**
 * Call the Google Meet API to create a new virtual meeting space
 * POST https://meet.googleapis.com/v2/spaces
 */
export const createGoogleMeetSpace = async (accessToken: string): Promise<GoogleMeetSpace> => {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Lỗi khi tạo phòng họp Google Meet: ${errText}`);
  }

  const data = await res.json();
  
  if (!data?.meetingUri) {
    throw new Error("Không tìm thấy đường dẫn cuộc họp (meetingUri) trong phản hồi của Google Meet.");
  }

  return {
    name: data.name || '',
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode || '',
  };
};

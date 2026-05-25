import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

// Shared access token
let workspaceToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('__google_access_token') : null;
let workspaceUser: any = null;

export const connectWorkspace = async (scopes: string[]): Promise<{ user: any; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    scopes.forEach(scope => provider.addScope(scope));
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Auth cho Workspace.');
    }
    
    workspaceToken = credential.accessToken;
    workspaceUser = result.user;
    
    try {
      localStorage.setItem('__google_access_token', workspaceToken);
    } catch (e) {
      console.error(e);
    }
    
    return { user: result.user, accessToken: workspaceToken };
  } catch (error) {
    console.error('Lỗi login Google Workspace:', error);
    throw error;
  }
};

export const getWorkspaceToken = (): string | null => {
  return workspaceToken;
};

export const setWorkspaceToken = (token: string | null, user?: any) => {
  workspaceToken = token;
  if (user) workspaceUser = user;
  if (token) {
    try {
      localStorage.setItem('__google_access_token', token);
    } catch (e) {}
  }
};


// ----------------------------------------------------
// 1. GOOGLE CALENDAR API SERVICE
// ----------------------------------------------------

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  htmlLink?: string;
  attendees?: Array<{ email: string; responseStatus?: string }>;
}

export const listCalendarEvents = async (accessToken: string, maxResults = 50): Promise<CalendarEvent[]> => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=${maxResults}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tải lịch: ${err}`);
  }
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (accessToken: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tạo sự kiện: ${err}`);
  }
  return await res.json();
};

export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Lỗi xóa sự kiện: ${err}`);
  }
};


// ----------------------------------------------------
// 2. GOOGLE DOCS API SERVICE
// ----------------------------------------------------

export interface GoogleDoc {
  documentId: string;
  title: string;
  body?: {
    content: any[];
  };
}

export const fetchGoogleDoc = async (accessToken: string, documentId: string): Promise<GoogleDoc> => {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tải tài liệu: ${err}`);
  }
  return await res.json();
};

/**
 * Extract plain text from Google Doc's rich body representation
 */
export const extractTextFromDoc = (doc: GoogleDoc): string => {
  if (!doc.body?.content) return '';
  let text = '';
  doc.body.content.forEach(element => {
    if (element.paragraph?.elements) {
      element.paragraph.elements.forEach((el: any) => {
        if (el.textRun?.content) {
          text += el.textRun.content;
        }
      });
    }
  });
  return text;
};

/**
 * Creates an empty Google Doc in Drive with a title
 */
export const createGoogleDoc = async (accessToken: string, title: string): Promise<GoogleDoc> => {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tạo tài liệu: ${err}`);
  }
  return await res.json();
};

/**
 * Writes or replaces the text of an existing Google Doc via BatchUpdate
 */
export const updateGoogleDocContent = async (
  accessToken: string,
  documentId: string,
  newText: string,
  currentLengthExcludingEnd = 0
): Promise<void> => {
  // To update a Google Doc properly, we send a BatchUpdate containing delete and insert commands
  const requests: any[] = [];
  
  if (currentLengthExcludingEnd > 1) {
    // 1. Delete all current text (index starts at 1, ends at length)
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: currentLengthExcludingEnd
        }
      }
    });
  }
  
  // 2. Insert new text at start index 1
  requests.push({
    insertText: {
      location: { index: 1 },
      text: newText
    }
  });

  const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi cập nhật tài liệu: ${err}`);
  }
};


// ----------------------------------------------------
// 3. GOOGLE DRIVE FILE ACCESS (PICKER ALTERNATIVE)
// ----------------------------------------------------

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  iconLink?: string;
  webViewLink?: string;
}

export const listDriveFiles = async (accessToken: string, queryStr = ''): Promise<DriveFile[]> => {
  let q = "trashed = false";
  if (queryStr) {
    q += ` and name contains '${queryStr.replace(/'/g, "\\'")}'`;
  }
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,iconLink,webViewLink)&pageSize=40`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lỗi tìm tệp Drive: ${err}`);
  }
  const data = await res.json();
  return data.files || [];
};


// ----------------------------------------------------
// 4. GOOGLE KEEP DIRECT CLOUD SYNC FOR NOTES (DRIVE FILE BACKED)
// ----------------------------------------------------

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  color?: string; // sky, emerald, rose, amber, purple, template neutral
  isPinned?: boolean;
  todoList?: Array<{ id: string; text: string; done: boolean }>;
  updatedTime: string;
}

/**
 * Load Keep notes synced to Google Drive folder
 */
export const loadKeepNotesFromDrive = async (accessToken: string): Promise<KeepNote[]> => {
  // Search for fintro_workspace_keep_notes.json in Fintro_Backups or root folder
  const queryStr = encodeURIComponent("name = 'fintro_workspace_keep_notes.json' and trashed = false");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) return [];
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const fileId = searchData.files[0].id;
    // Download content
    const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (dlRes.ok) {
      try {
        const notesObj = await dlRes.json();
        return notesObj.notes || [];
      } catch (e) {
        console.error('Notes JSON parser error:', e);
        return [];
      }
    }
  }
  return [];
};

/**
 * Save Keep notes synced to a Google Drive file
 */
export const saveKeepNotesToDrive = async (accessToken: string, notes: KeepNote[]): Promise<void> => {
  // Find or create keep notes document
  const queryStr = encodeURIComponent("name = 'fintro_workspace_keep_notes.json' and trashed = false");
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  let fileId = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
    }
  }
  
  const fileContent = {
    appName: 'Fintro Workspace',
    syncTime: new Date().toISOString(),
    notes
  };

  if (fileId) {
    // Update existing file content
    const patchRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileContent, null, 2)
    });
    if (!patchRes.ok) {
      throw new Error('Lỗi đồng bộ ghi chú Keep lên Drive');
    }
  } else {
    // Create new file
    const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'fintro_workspace_keep_notes.json',
        mimeType: 'application/json'
      })
    });
    if (!metaRes.ok) throw new Error('Lỗi tạo tệp đồng bộ Keep');
    
    const meta = await metaRes.json();
    
    // Upload content
    const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileContent, null, 2)
    });
    if (!uploadRes.ok) throw new Error('Lỗi ghi nội dung đồng bộ Keep');
  }
};

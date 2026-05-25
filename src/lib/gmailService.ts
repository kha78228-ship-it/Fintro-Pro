export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: GmailMessageHeader[];
    body?: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
}

export interface GmailEmailMeta {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
}

/**
 * Safely decodes base64url content to a UTF-8 string
 */
export const decodeBase64Url = (base64UrlStr: string): string => {
  try {
    const normBase64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(normBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (err) {
      console.warn("Mime decode error", err);
      return '';
    }
  }
};

/**
 * Encodes a string to a safe base64url standard for Gmail raw send API
 */
export const encodeBase64Url = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Parses raw Gmail detailed JSON response to structured email representation
 */
export const parseGmailMessage = (msg: GmailMessageDetail): GmailEmailMeta => {
  const headers = msg.payload?.headers || [];
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(Không có chủ đề)';
  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Không rõ người gửi';
  const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || 'Không rõ người nhận';
  const dateStr = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
  
  let date = dateStr;
  if (!date && msg.internalDate) {
    date = new Date(parseInt(msg.internalDate)).toLocaleString('vi-VN');
  } else if (date) {
    try {
      date = new Date(date).toLocaleString('vi-VN');
    } catch (e) {}
  }

  let body = '';
  
  const getBodyFromParts = (parts: any[]): string => {
    let textHtml = '';
    let textPlain = '';
    
    const recurseState = (arrParts: any[]) => {
      for (const part of arrParts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          textHtml = decodeBase64Url(part.body.data);
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          textPlain = decodeBase64Url(part.body.data);
        } else if (part.parts) {
          recurseState(part.parts);
        }
      }
    };
    
    recurseState(parts);
    return textHtml || textPlain;
  };
  
  if (msg.payload?.body?.data) {
    body = decodeBase64Url(msg.payload.body.data);
  } else if (msg.payload?.parts) {
    body = getBodyFromParts(msg.payload.parts);
  }
  
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject,
    from,
    to,
    date,
    snippet: msg.snippet || '',
    body: body || msg.snippet || '(Không có nội dung)'
  };
};

/**
 * Calls Gmail API to list user emails
 */
export const listGmailMessages = async (
  accessToken: string, 
  queryStr: string = '', 
  maxResults: number = 20
): Promise<{ messages?: { id: string; threadId: string }[] }> => {
  const queryParam = queryStr ? `&q=${encodeURIComponent(queryStr)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${queryParam}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch messages. HTTP ${res.status}`);
  }
  
  return await res.json();
};

/**
 * Fetch detailed state of a single Gmail message
 */
export const getGmailMessageDetails = async (
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> => {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch message details for dynamic message: ${messageId}`);
  }
  
  return await res.json();
};

/**
 * Sends a raw email using the specified email data
 */
export const sendGmailMessage = async (
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> => {
  // Construct RFC822 compliant email message raw payload
  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  const rawEmail = encodeBase64Url(emailLines.join('\r\n'));
  
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawEmail })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email. HTTP ${res.status}`);
  }

  return await res.json();
};

/**
 * Trashes/removes specified Gmail message by ID
 */
export const trashGmailMessage = async (
  accessToken: string,
  messageId: string
): Promise<void> => {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to trash message with code ${res.status}`);
  }
};

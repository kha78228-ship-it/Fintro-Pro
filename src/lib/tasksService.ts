import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

let cachedTasksAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('__google_access_token') : null;
let cachedTasksUser: any = null;

/**
 * Connect to Google Tasks with tasks scopes
 */
export const connectGoogleTasks = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/tasks');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Không thể nhận Access Token từ Google Auth cho Google Tasks.');
    }
    
    cachedTasksAccessToken = credential.accessToken;
    cachedTasksUser = result.user;
    
    try {
      localStorage.setItem('__google_access_token', cachedTasksAccessToken);
    } catch (e) {
      console.error(e);
    }
    
    return { user: result.user, accessToken: cachedTasksAccessToken };
  } catch (error) {
    console.error('Lỗi kết nối Google Tasks Auth:', error);
    throw error;
  }
};

/**
 * Disconnect Google Tasks
 */
export const disconnectGoogleTasks = () => {
  cachedTasksAccessToken = null;
  cachedTasksUser = null;
};

/**
 * Get Google Tasks Token
 */
export const getGoogleTasksToken = (): string | null => {
  return cachedTasksAccessToken;
};

/**
 * Set Google Tasks Access Token manually
 */
export const setGoogleTasksToken = (token: string | null, user?: any) => {
  cachedTasksAccessToken = token;
  if (user) cachedTasksUser = user;
  if (token) {
    try {
      localStorage.setItem('__google_access_token', token);
    } catch (e) {}
  }
};

export interface TaskList {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
}

export interface TaskItem {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
  position: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
}

/**
 * List task lists of the authenticated user
 * GET https://tasks.googleapis.com/tasks/v1/users/@me/lists
 */
export const listGoogleTaskLists = async (accessToken: string): Promise<TaskList[]> => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể lấy danh sách danh mục Google Tasks: ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
};

/**
 * Create a new task list
 * POST https://tasks.googleapis.com/tasks/v1/users/@me/lists
 */
export const createGoogleTaskList = async (accessToken: string, title: string): Promise<TaskList> => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể tạo danh mục Google Tasks mới: ${errText}`);
  }

  return await res.json();
};

/**
 * List tasks in a task list
 * GET https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks
 */
export const listGoogleTasks = async (
  accessToken: string, 
  taskListId: string, 
  showCompleted = true,
  showHidden = true
): Promise<TaskItem[]> => {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=${showCompleted}&showHidden=${showHidden}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể lấy danh sách công việc Google Tasks: ${errText}`);
  }

  const data = await res.json();
  return data.items || [];
};

/**
 * Create a task in a task list
 * POST https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks
 */
export const createGoogleTask = async (
  accessToken: string, 
  taskListId: string, 
  task: { title: string; notes?: string; due?: string }
): Promise<TaskItem> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể tạo công việc Google Tasks mới: ${errText}`);
  }

  return await res.json();
};

/**
 * Update a task (e.g., mark complete, rename, change notes/due)
 * PUT https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{taskId}
 */
export const updateGoogleTask = async (
  accessToken: string,
  taskListId: string,
  taskId: string,
  task: Partial<TaskItem>
): Promise<TaskItem> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể cập nhật công việc Google Tasks: ${errText}`);
  }

  return await res.json();
};

/**
 * Delete a task
 * DELETE https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{taskId}
 */
export const deleteGoogleTask = async (
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errText = await res.text();
    throw new Error(`Không thể xóa công việc Google Tasks: ${errText}`);
  }
};

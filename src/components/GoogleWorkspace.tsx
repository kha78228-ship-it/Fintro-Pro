import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  FileText, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Loader2, 
  RefreshCw, 
  LogOut, 
  PlusCircle, 
  Edit3, 
  Sparkles, 
  Folder, 
  FolderOpen, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Pin,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Send,
  Hash,
  Users,
  ClipboardList,
  LayoutDashboard,
  ArrowRight,
  Clock,
  ListTodo,
  Mail,
  Inbox
} from 'lucide-react';
import { 
  listGmailMessages, 
  getGmailMessageDetails, 
  parseGmailMessage, 
  sendGmailMessage, 
  trashGmailMessage, 
  GmailEmailMeta 
} from '../lib/gmailService';
import { 
  connectWorkspace, 
  getWorkspaceToken, 
  setWorkspaceToken,
  listCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent, 
  listDriveFiles, 
  createGoogleDoc, 
  fetchGoogleDoc, 
  updateGoogleDocContent, 
  extractTextFromDoc,
  loadKeepNotesFromDrive, 
  saveKeepNotesToDrive,
  CalendarEvent, 
  DriveFile, 
  KeepNote, 
  GoogleDoc 
} from '../lib/workspaceServices';
import {
  listGoogleChatSpaces,
  listGoogleChatMessages,
  createGoogleChatSpace,
  sendGoogleChatMessage,
  ChatSpace,
  ChatMessage
} from '../lib/chatService';
import {
  listGoogleTaskLists,
  createGoogleTaskList,
  listGoogleTasks,
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  TaskList,
  TaskItem
} from '../lib/tasksService';

interface GoogleWorkspaceProps {
  user: any;
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
  initialTab?: 'dashboard' | 'calendar' | 'tasks' | 'chat' | 'docs' | 'keep' | 'picker' | 'gmail';
}

const KEEP_COLORS = [
  { value: 'bg-white border-neutral-200', name: 'Mặc định' },
  { value: 'bg-[#fef7e0] border-[#f6e6b4]', name: 'Vàng' },
  { value: 'bg-[#e8f0fe] border-[#c2daf9]', name: 'Xanh dương' },
  { value: 'bg-[#e6f4ea] border-[#b7e1cd]', name: 'Xanh lá' },
  { value: 'bg-[#fce8e6] border-[#f7c2c1]', name: 'Hồng/Đỏ' },
  { value: 'bg-[#f3e8fd] border-[#dfbdfa]', name: 'Tím' }
];

export default function GoogleWorkspace({ user, appTheme = "google_material", initialTab = "dashboard" }: GoogleWorkspaceProps) {
  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com') || false;
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'tasks' | 'chat' | 'docs' | 'keep' | 'picker' | 'gmail'>(initialTab);
  
  // Auth state
  const [workspaceToken, setWorkspaceTokenState] = useState<string | null>(getWorkspaceToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- CALENDAR STATES ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // --- GOOGLE TASKS STATES ---
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedList, setSelectedList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // --- DOCS EDITOR STATES ---
  const [docsList, setDocsList] = useState<DriveFile[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [selectedDocFileId, setSelectedDocFileId] = useState<string | null>(null);
  const [docContentText, setDocContentText] = useState('');
  const [isDocSaving, setIsDocSaving] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // --- KEEP NOTES STATES ---
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [isKeepLoading, setIsKeepLoading] = useState(false);
  const [isKeepSyncing, setIsKeepSyncing] = useState(false);
  const [keepSearch, setKeepSearch] = useState('');
  // New Keep Note creation
  const [newKeepTitle, setNewKeepTitle] = useState('');
  const [newKeepContent, setNewKeepContent] = useState('');
  const [newKeepColor, setNewKeepColor] = useState('bg-white border-neutral-200');
  const [newKeepTodos, setNewKeepTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTodoInput, setNewTodoInput] = useState('');
  const [showAddKeep, setShowAddKeep] = useState(false);

  // --- PICKER / DRIVE STATES ---
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSelectedFile, setPickerSelectedFile] = useState<DriveFile | null>(null);

  // --- GOOGLE CHAT STATES ---
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [isSpacesLoading, setIsSpacesLoading] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<ChatMessage[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [chatMessageText, setChatMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // --- GMAIL STATES ---
  const [gmailEmails, setGmailEmails] = useState<GmailEmailMeta[]>([]);
  const [isGmailLoading, setIsGmailLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmailMeta | null>(null);
  const [gmailSearch, setGmailSearch] = useState('');
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isTrashingEmail, setIsTrashingEmail] = useState(false);

  // Load auth token on load and sync of auth changes
  useEffect(() => {
    const checkToken = () => {
      const token = getWorkspaceToken();
      if (token && token !== workspaceToken) {
        setWorkspaceTokenState(token);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [workspaceToken]);

  // Fetch data per active tab once token is ready
  useEffect(() => {
    if (!workspaceToken) return;

    if (activeTab === 'dashboard') {
      fetchCalendar();
      fetchDocs();
      fetchKeepNotes();
      fetchTaskLists(workspaceToken);
      fetchGmailEmails();
    } else if (activeTab === 'calendar') {
      fetchCalendar();
    } else if (activeTab === 'docs') {
      fetchDocs();
    } else if (activeTab === 'keep') {
      fetchKeepNotes();
    } else if (activeTab === 'picker') {
      fetchDriveFiles();
    } else if (activeTab === 'chat') {
      fetchChatSpaces();
    } else if (activeTab === 'tasks') {
      fetchTaskLists(workspaceToken);
    } else if (activeTab === 'gmail') {
      fetchGmailEmails();
    }
  }, [activeTab, workspaceToken, gmailSearch]);

  // Sync tasks when selectedList changes
  useEffect(() => {
    if (workspaceToken && selectedList) {
      fetchTasks(workspaceToken, selectedList.id);
    }
  }, [selectedList, workspaceToken]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const requiredScopes = [
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/chat',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ];
      
      const result = await connectWorkspace(requiredScopes);
      if (result) {
        setWorkspaceTokenState(result.accessToken);
        setWorkspaceToken(result.accessToken, result.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Xác thực tài khoản Google thất bại.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    setWorkspaceTokenState(null);
    setWorkspaceToken(null);
    setEvents([]);
    setDocsList([]);
    setSelectedDoc(null);
    setKeepNotes([]);
    setDriveFiles([]);
    setChatSpaces([]);
    setSelectedSpace(null);
    setSpaceMessages([]);
    setTaskLists([]);
    setSelectedList(null);
    setTasks([]);
    setGmailEmails([]);
    setSelectedEmail(null);
  };

  const handleRefresh = () => {
    if (!workspaceToken) return;
    if (activeTab === 'dashboard') {
      fetchCalendar();
      fetchDocs();
      fetchKeepNotes();
      fetchTaskLists(workspaceToken);
      fetchGmailEmails();
    } else if (activeTab === 'calendar') fetchCalendar();
    else if (activeTab === 'docs') fetchDocs();
    else if (activeTab === 'keep') fetchKeepNotes();
    else if (activeTab === 'picker') fetchDriveFiles();
    else if (activeTab === 'chat') fetchChatSpaces();
    else if (activeTab === 'tasks') fetchTaskLists(workspaceToken);
    else if (activeTab === 'gmail') fetchGmailEmails();
  };

  // ==========================================
  // GOOGLE TASKS METHODS
  // ==========================================
  const fetchTaskLists = async (token: string) => {
    setIsListsLoading(true);
    try {
      const lists = await listGoogleTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        setSelectedList(prev => {
          if (prev && lists.some(l => l.id === prev.id)) {
            return lists.find(l => l.id === prev.id) || lists[0];
          }
          return lists[0];
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách Google Tasks:", error);
    } finally {
      setIsListsLoading(false);
    }
  };

  const fetchTasks = async (token: string, listId: string) => {
    setIsTasksLoading(true);
    try {
      const items = await listGoogleTasks(token, listId);
      setTasks(items);
    } catch (error) {
      console.error("Lỗi khi tải danh sách Tasks:", error);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleCreateNewTaskList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !newListName.trim()) return;

    setIsCreatingList(true);
    try {
      const newList = await createGoogleTaskList(workspaceToken, newListName.trim());
      setNewListName('');
      setShowAddList(false);
      await fetchTaskLists(workspaceToken);
      setSelectedList(newList);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo danh sách việc cần làm.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !selectedList || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      const taskPayload: Partial<TaskItem> = {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined,
        status: 'needsAction'
      };

      await createGoogleTask(workspaceToken, selectedList.id, taskPayload as any);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      setShowAddTask(false);
      fetchTasks(workspaceToken, selectedList.id);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo công việc mới.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    if (!workspaceToken || !selectedList) return;

    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    
    // Update local state first for instant response
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await updateGoogleTask(workspaceToken, selectedList.id, task.id, {
        status: newStatus
      });
      // Silent refresh to align state
      const updated = await listGoogleTasks(workspaceToken, selectedList.id);
      setTasks(updated);
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái công việc: ' + err.message);
      // Revert upon failure
      fetchTasks(workspaceToken, selectedList.id);
    }
  };

  const handleDeleteTaskItem = async (taskId: string, title: string) => {
    if (!workspaceToken || !selectedList) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa vĩnh viễn công việc "${title}" này?`);
    if (!confirmed) return;

    try {
      await deleteGoogleTask(workspaceToken, selectedList.id, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert('Không thể xóa công việc: ' + err.message);
    }
  };

  // ==========================================
  // GOOGLE CALENDAR METHODS
  // ==========================================
  const fetchCalendar = async () => {
    if (!workspaceToken) return;
    setIsEventsLoading(true);
    try {
      const result = await listCalendarEvents(workspaceToken);
      setEvents(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !newEventSummary.trim() || !newEventStart) return;

    setIsCreatingEvent(true);
    try {
      const payload: Partial<CalendarEvent> = {
        summary: newEventSummary.trim(),
        description: newEventDesc.trim(),
        start: {
          dateTime: new Date(newEventStart).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: newEventEnd 
            ? new Date(newEventEnd).toISOString() 
            : new Date(new Date(newEventStart).getTime() + 60 * 60 * 1000).toISOString(), // 1 hr default
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: newEventLoc.trim()
      };

      await createCalendarEvent(workspaceToken, payload);
      setNewEventSummary('');
      setNewEventDesc('');
      setNewEventStart('');
      setNewEventEnd('');
      setNewEventLoc('');
      setShowAddEvent(false);
      fetchCalendar();
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm sự kiện.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, summary: string) => {
    if (!workspaceToken) return;
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${summary}" khỏi Lịch Google của bạn?`);
    if (!confirmed) return;

    try {
      await deleteCalendarEvent(workspaceToken, eventId);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err: any) {
      alert(err.message || 'Xóa sự kiện thất bại.');
    }
  };

  // ==========================================
  // GOOGLE DOCS METHODS
  // ==========================================
  const fetchDocs = async () => {
    if (!workspaceToken) return;
    setIsDocsLoading(true);
    try {
      // Find files of type 'document' created or accessible
      const files = await listDriveFiles(workspaceToken, '');
      const googleDocs = files.filter(f => f.mimeType === 'application/vnd.google-apps.document');
      setDocsList(googleDocs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleOpenDoc = async (fileId: string) => {
    if (!workspaceToken) return;
    setSelectedDocFileId(fileId);
    setIsDocSaving(true); // show loader inside workspace doc text area
    try {
      const docData = await fetchGoogleDoc(workspaceToken, fileId);
      setSelectedDoc(docData);
      setDocContentText(extractTextFromDoc(docData));
    } catch (e: any) {
      alert('Không nhận được nội dung tài liệu. Hãy đảm bảo tệp tin được tạo bằng tài khoản này hoặc chương trình có quyền truy cập.');
      setSelectedDoc(null);
      setSelectedDocFileId(null);
    } finally {
      setIsDocSaving(false);
    }
  };

  const handleCreateNewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !newDocTitle.trim()) return;

    setIsCreatingDoc(true);
    try {
      const newDoc = await createGoogleDoc(workspaceToken, newDocTitle.trim());
      setShowCreateDoc(false);
      setNewDocTitle('');
      fetchDocs();
      // Auto open it
      handleOpenDoc(newDoc.documentId);
    } catch (e: any) {
      alert('Không thể khởi tạo tài liệu với Google Docs.');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleUpdateDocText = async () => {
    if (!workspaceToken || !selectedDoc) return;
    setIsDocSaving(true);
    setSavingSuccess(false);
    try {
      // Clean delete range logic requires approximate text size excluding last newline
      const approxLen = extractTextFromDoc(selectedDoc).length;
      await updateGoogleDocContent(workspaceToken, selectedDoc.documentId, docContentText, approxLen);
      
      // Reload updated content
      const updatedDoc = await fetchGoogleDoc(workspaceToken, selectedDoc.documentId);
      setSelectedDoc(updatedDoc);
      setSavingSuccess(true);
      setTimeout(() => setSavingSuccess(false), 2500);
    } catch (e: any) {
      alert('Lỗi cập nhật. Trạng thái lỗi: ' + e.message);
    } finally {
      setIsDocSaving(false);
    }
  };

  // ==========================================
  // GOOGLE KEEP NOTES BOARD METHODS
  // ==========================================
  const fetchKeepNotes = async () => {
    if (!workspaceToken) return;
    setIsKeepLoading(true);
    try {
      const notes = await loadKeepNotesFromDrive(workspaceToken);
      setKeepNotes(notes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsKeepLoading(false);
    }
  };

  const syncKeepNotesToDrive = async (updatedNotes: KeepNote[]) => {
    if (!workspaceToken) return;
    setIsKeepSyncing(true);
    try {
      await saveKeepNotesToDrive(workspaceToken, updatedNotes);
    } catch (e) {
      console.error('Lỗi đồng bộ ghi chú:', e);
    } finally {
      setIsKeepSyncing(false);
    }
  };

  const handleAddKeepTodo = () => {
    if (!newTodoInput.trim()) return;
    setNewKeepTodos(prev => [...prev, {
      id: Date.now().toString(),
      text: newTodoInput.trim(),
      done: false
    }]);
    setNewTodoInput('');
  };

  const handleRemoveKeepTodo = (todoId: string) => {
    setNewKeepTodos(prev => prev.filter(t => t.id !== todoId));
  };

  const handleCreateKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeepTitle.trim() && !newKeepContent.trim() && newKeepTodos.length === 0) return;

    const newNote: KeepNote = {
      id: Date.now().toString(),
      title: newKeepTitle.trim(),
      content: newKeepContent.trim(),
      color: newKeepColor,
      isPinned: false,
      todoList: newKeepTodos.length > 0 ? newKeepTodos : undefined,
      updatedTime: new Date().toISOString()
    };

    const updated = [newNote, ...keepNotes];
    setKeepNotes(updated);
    
    // Clear inputs
    setNewKeepTitle('');
    setNewKeepContent('');
    setNewKeepColor('bg-white border-neutral-200');
    setNewKeepTodos([]);
    setShowAddKeep(false);

    // Sync
    await syncKeepNotesToDrive(updated);
  };

  const handleToggleKeepPin = async (noteId: string) => {
    const updated = keepNotes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
    setKeepNotes(updated);
    await syncKeepNotesToDrive(updated);
  };

  const handleToggleTodoDone = async (noteId: string, todoId: string) => {
    const updated = keepNotes.map(n => {
      if (n.id === noteId && n.todoList) {
        return {
          ...n,
          todoList: n.todoList.map(t => t.id === todoId ? { ...t, done: !t.done } : t)
        };
      }
      return n;
    });
    setKeepNotes(updated);
    await syncKeepNotesToDrive(updated);
  };

  const handleDeleteKeepNote = async (noteId: string, title: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa ghi chú "${title || 'Không tiêu đề'}"?`);
    if (!confirmed) return;

    const updated = keepNotes.filter(n => n.id !== noteId);
    setKeepNotes(updated);
    await syncKeepNotesToDrive(updated);
  };

  // ==========================================
  // PICKER / DRIVE EXPLORER METHODS
  // ==========================================
  const fetchDriveFiles = async () => {
    if (!workspaceToken) return;
    setIsFilesLoading(true);
    try {
      const files = await listDriveFiles(workspaceToken, pickerSearch);
      setDriveFiles(files);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFilesLoading(false);
    }
  };

  // Search driver trigger
  const handlePickerSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDriveFiles();
  };

  // ==========================================
  // GMAIL METHODS
  // ==========================================
  const fetchGmailEmails = async () => {
    if (!workspaceToken) return;
    setIsGmailLoading(true);
    try {
      const listRes = await listGmailMessages(workspaceToken, gmailSearch);
      if (listRes.messages && listRes.messages.length > 0) {
        const detailedEmailsPromises = listRes.messages.slice(0, 15).map(async (m) => {
          try {
            const detailObj = await getGmailMessageDetails(workspaceToken, m.id);
            return parseGmailMessage(detailObj);
          } catch (e) {
            console.error("Lỗi lấy chi tiết mail:", e);
            return null;
          }
        });
        const resolved = await Promise.all(detailedEmailsPromises);
        setGmailEmails(resolved.filter((item): item is GmailEmailMeta => item !== null));
      } else {
        setGmailEmails([]);
      }
    } catch (err: any) {
      console.error("Lỗi lấy danh sách email Gmail:", err);
    } finally {
      setIsGmailLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBody || !workspaceToken) return;
    setIsSendingEmail(true);
    try {
      await sendGmailMessage(workspaceToken, emailTo, emailSubject, emailBody);
      alert('Đã gửi email thành công qua Gmail của bạn!');
      setShowSendEmail(false);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      fetchGmailEmails();
    } catch (err: any) {
      alert(`Gửi email thất bại: ${err.message || err}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTrashEmail = async (messageId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn chuyển email này vào thùng rác không?');
    if (!confirmed || !workspaceToken) return;
    setIsTrashingEmail(true);
    try {
      await trashGmailMessage(workspaceToken, messageId);
      alert('Đã di chuyển email vào thùng rác thành công.');
      setSelectedEmail(null);
      fetchGmailEmails();
    } catch (err: any) {
      alert(`Xóa email thất bại: ${err.message || err}`);
    } finally {
      setIsTrashingEmail(false);
    }
  };

  // ==========================================
  // GOOGLE CHAT METHODS
  // ==========================================
  const fetchChatSpaces = async () => {
    if (!workspaceToken) return;
    setIsSpacesLoading(true);
    try {
      const result = await listGoogleChatSpaces(workspaceToken);
      setChatSpaces(result);
      if (result.length > 0 && !selectedSpace) {
        setSelectedSpace(result[0]);
        fetchChatMessages(result[0].name);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách phòng chat:", e);
    } finally {
      setIsSpacesLoading(false);
    }
  };

  const fetchChatMessages = async (spaceName: string) => {
    if (!workspaceToken) return;
    setIsMessagesLoading(true);
    try {
      const messages = await listGoogleChatMessages(workspaceToken, spaceName);
      const sorted = [...messages].sort(
        (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      );
      setSpaceMessages(sorted);
    } catch (e) {
      console.error("Lỗi khi tải tin nhắn Google Chat:", e);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSelectSpace = (space: ChatSpace) => {
    setSelectedSpace(space);
    fetchChatMessages(space.name);
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !newSpaceName.trim()) return;
    setIsCreatingSpace(true);
    try {
      const newSpace = await createGoogleChatSpace(workspaceToken, newSpaceName.trim());
      setNewSpaceName('');
      setShowAddSpace(false);
      const updatedSpaces = await listGoogleChatSpaces(workspaceToken);
      setChatSpaces(updatedSpaces);
      setSelectedSpace(newSpace);
      fetchChatMessages(newSpace.name);
    } catch (e) {
      console.error("Lỗi khi tạo phòng chat:", e);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToken || !selectedSpace || !chatMessageText.trim()) return;
    
    // Explicit User Confirmation check before sending chat messages (Workspace guidelines requirement)
    const confirmed = window.confirm(`Bạn có chắc chắn muốn gửi tin nhắn này sang Google Chat không?`);
    if (!confirmed) return;

    setIsSendingMessage(true);
    try {
      const textToSend = chatMessageText.trim();
      setChatMessageText('');
      await sendGoogleChatMessage(workspaceToken, selectedSpace.name, textToSend);
      await fetchChatMessages(selectedSpace.name);
    } catch (e) {
      console.error("Gửi tin nhắn Google Chat thất bại:", e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Theme mapping config
  const getThemeConfig = () => {
    if (appTheme === 'vietnam') {
      return {
        card: "bg-[#050e21]/95 border border-[#00bfff]/30 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        button: "bg-[#ff3b3b] hover:bg-[#d32f2f] text-white font-bold px-5 py-2.5 rounded-3xl shadow-lg border border-[#ff3b3b]/50 transition-all",
        accentText: "text-[#00bfff]",
        iconColor: "text-[#ff3b3b]",
        activeTab: "bg-[#ff3b3b] text-white border-none",
        inactiveTab: "text-[#e0f7fa] bg-[#050e21]/40 border border-[#00bfff]/20 hover:border-[#00bfff]/60",
        taskCard: "bg-black/40 border border-[#00bfff]/20 hover:border-[#00bfff]/40 rounded-2xl p-4",
        input: "bg-black/20 border border-[#00bfff]/30 rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#00bfff]/20"
      };
    }
    if (appTheme === 'pink_cute') {
      return {
        card: "bg-white border-2 border-[#fbcfe8] rounded-3xl p-6 shadow-[4px_4px_0_#fbcfe8]",
        button: "bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold px-5 py-2.5 rounded-3xl shadow-md border-0 transition-all",
        accentText: "text-[#be185d]",
        iconColor: "text-[#f43f5e]",
        activeTab: "bg-[#f43f5e] text-white",
        inactiveTab: "text-[#be185d] bg-[#fff0f5] border-2 border-[#fbcfe8] hover:bg-white",
        taskCard: "bg-[#faf5f7] border border-[#fbcfe8] hover:shadow-sm rounded-2xl p-4",
        input: "bg-[#fff5f7] border-2 border-[#fbcfe8] rounded-xl px-4 py-2.5 text-sm font-medium text-[#be185d] placeholder-[#fbcfe8] outline-none"
      };
    }
    if (appTheme === 'vintage') {
      return {
        card: "bg-[#fcfaf2] border-2 border-[#d3c09f] rounded-3xl p-6 shadow-md shadow-[#eae1cb]/50",
        button: "bg-[#785f40] hover:bg-[#614a31] text-[#fcfaf2] font-bold px-5 py-2.5 rounded-3xl shadow-sm border border-[#785f40]/50 transition-all",
        accentText: "text-[#513c23]",
        iconColor: "text-[#785f40]",
        activeTab: "bg-[#785f40] text-[#fcfaf2]",
        inactiveTab: "text-[#513c23] bg-[#f0ebd7] border border-[#d3c09f] hover:bg-[#fcfaf2]",
        taskCard: "bg-[#f6f2e8] border border-[#d3c09f]/40 hover:border-[#d3c09f] rounded-2xl p-4",
        input: "bg-[#fbfbf8] border border-[#d3c09f] rounded-xl px-4 py-2.5 text-sm font-medium text-[#513c23] placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#785f40]/10"
      };
    }
    // google_material default
    return {
      card: "bg-white border border-[#e3e3e3] rounded-[1.5rem] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      button: "bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold px-5 py-2.5 rounded-3xl shadow-sm transition-all",
      accentText: "text-[#1a73e8]",
      iconColor: "text-[#1a73e8]",
      activeTab: "bg-[#1a73e8] text-white border-transparent",
      inactiveTab: "text-[#1f1f1f] bg-[#f1f3f4] border border-transparent hover:bg-[#e8eaed]",
      taskCard: "bg-white border border-[#e3e3e3] hover:shadow-md transition-all rounded-[1rem] p-4",
      input: "bg-white border border-[#dadce0] rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-800 placeholder-neutral-400 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-50"
    };
  };

  const style = getThemeConfig();

  // If user has no Active Google token, request login setup
  if (!workspaceToken) {
    return (
      <div className={`${style.card} max-w-xl mx-auto flex flex-col items-center text-center py-12 px-6 space-y-6 mt-8`}>
        <div className={`p-5 rounded-full ${appTheme === 'vietnam' ? 'bg-[#ff3b3b]/10' : 'bg-[#1a73e8]/10'} flex items-center justify-center`}>
          <Sparkles className={`w-14 h-14 ${style.iconColor}`} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Quản trị <span className={style.accentText}>Google Workspace</span>
          </h2>
          <p className="text-sm max-w-md text-neutral-500 leading-relaxed">
            Kết nối tài khoản Google để vận hành đồng bộ Lịch Google, Soạn thảo tài liệu Google Docs trực tiếp, đồng bộ Ghi chú Keep và khám phá tệp tin Drive của bạn.
          </p>
        </div>

        {authError && (
          <div className="flex items-center gap-2 text-xs bg-red-50 text-red-600 px-4 py-2.5 rounded-xl border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <button 
          onClick={handleConnect}
          disabled={isAuthenticating}
          className={`${style.button} flex items-center justify-center gap-3 w-full sm:w-auto font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md`}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang kết nối Cloud...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Xác thực Google account</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-5 border-t border-neutral-100 w-full text-left bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-neutral-800">Tại sao Google hiển thị "Ứng dụng chưa được xác minh"?</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Đây là cơ chế bảo mật tiêu chuẩn của Google. Vì ứng dụng này đang chạy thử nghiệm trong môi trường Sandbox cá nhân của riêng bạn (<span className="font-mono text-[10px] bg-neutral-100 px-1 py-0.5 rounded">*.run.app</span>) và dùng mã kết nối nội bộ riêng nên chưa qua khâu kiểm duyệt thương mại diện rộng của Google. 
              </p>
              <div className="text-[11.5px] text-neutral-600 font-medium pt-1.5">
                💡 <strong>Cách tiếp tục an toàn:</strong> Nhấn chọn <span className="font-bold underline text-neutral-800">Nâng cao (Advanced)</span> &rarr; sau đó nhấp vào <span className="font-bold underline text-neutral-800">Đi tới... (không an toàn)</span> để uỷ quyền. Các dữ liệu token chỉ được lưu cục bộ trên trình duyệt của riêng bạn và tuyệt đối bảo mật!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded Dashboard panel layout
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner section */}
      <div className={`${style.card} flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group`}>
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-tr from-blue-500 via-emerald-500 via-yellow-500 to-red-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
              Google Workspace Hub
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-md">Văn phòng số Google hợp nhất: Quản lý Lịch biểu, Sổ tay Nhiệm vụ, Soạn thảo Google Docs, Ghi nhớ Keep & Google Chat trực tiếp của riêng bạn.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={handleRefresh}
            title="Tải lại tất cả dữ liệu Google"
            className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all text-neutral-600 flex items-center justify-center hover:rotate-180 duration-500"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-3xl hover:bg-red-50 text-xs font-bold transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất Google</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation list - Styled elegantly like Google Workspace sidebar launcher */}
      <div className="flex flex-wrap gap-2.5 border-b border-neutral-200/60 pb-2.5">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-neutral-900 text-white shadow-sm' 
              : 'text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-blue-500" />
          <span>Tổng quan Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'calendar' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
              : 'text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Google Lịch (Calendar)</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'tasks' 
              ? 'bg-sky-600 text-white shadow-md shadow-sky-100' 
              : 'text-sky-700 bg-sky-50/50 hover:bg-sky-50 border border-sky-100'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-sky-500" />
          <span>Sổ tay Việc (Tasks)</span>
        </button>

        <button
          onClick={() => setActiveTab('keep')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'keep' 
              ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
              : 'text-amber-800 bg-amber-50/50 hover:bg-amber-50 border border-amber-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Ghi chú Keep</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'docs' 
              ? 'bg-blue-700 text-white shadow-md shadow-blue-100' 
              : 'text-blue-800 bg-blue-50/40 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-700" />
          <span>Google Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'chat' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
              : 'text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Google Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('picker')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'picker' 
              ? 'bg-neutral-700 text-white shadow-md' 
              : 'text-neutral-700 bg-neutral-100/50 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Folder className="w-4 h-4 text-neutral-500" />
          <span>Drive Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'gmail' 
              ? 'bg-red-600 text-white shadow-md shadow-red-100' 
              : 'text-red-700 bg-red-50/50 hover:bg-red-50 border border-red-100'
          }`}
        >
          <Mail className="w-4 h-4 text-red-600" />
          <span>Hộp thư Gmail</span>
        </button>
      </div>

      {/* Primary Tab content container */}
      <div className="min-h-[400px]">
        {/* ===============================================
            TAB: HUB DASHBOARD
            =============================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Widget 1: Google Calendar Panel */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Lịch của bạn
                    </span>
                    <button 
                      onClick={() => setActiveTab('calendar')}
                      className="text-xs text-blue-600 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                    >
                      Xem tất cả <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5">Sự kiện sắp tới</h4>
                  
                  {isEventsLoading ? (
                    <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-300" /></div>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Hôm nay không có sự kiện lịch biểu nào của bạn.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                      {events.slice(0, 3).map(ev => (
                        <div key={ev.id} className="flex gap-2.5 items-start text-xs border-l-2 border-blue-500 pl-2 py-0.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-neutral-800 truncate">{ev.summary}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : 'Cả ngày'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setActiveTab('calendar'); setShowAddEvent(true); }}
                  className="w-full mt-3 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 animate-none"
                >
                  <Plus className="w-4 h-4" /> Đặt lịch biểu mới
                </button>
              </div>

              {/* Widget 2: Tasks Sổ tay công việc */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      Việc cần làm
                    </span>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs text-sky-700 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-sky-50 transition-colors flex items-center gap-1"
                    >
                      Sổ tay việc <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5">Nhiệm vụ ưu tiên</h4>

                  {isTasksLoading ? (
                    <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-300" /></div>
                  ) : tasks.filter(t => t.status !== 'completed').length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Tuyệt vời! Bạn không có nhiệm vụ tồn đọng nào.</p>
                  ) : (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(task => (
                        <div 
                          key={task.id} 
                          className="flex gap-2.5 items-center p-1.5 hover:bg-neutral-50 rounded-lg transition-colors group cursor-pointer"
                          onClick={() => handleToggleTaskStatus(task)}
                        >
                          <Square className="w-4 h-4 text-neutral-400 shrink-0 group-hover:text-sky-500" />
                          <span className="text-xs font-semibold text-neutral-700 truncate line-clamp-1">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setActiveTab('tasks'); setShowAddTask(true); }}
                  className="w-full mt-3 py-2 bg-sky-50 hover:bg-sky-100/80 text-sky-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm nhiệm vụ mới
                </button>
              </div>

              {/* Widget 3: Ghi chú Keep dán tường */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Ghi chú Keep
                    </span>
                    <button 
                      onClick={() => setActiveTab('keep')}
                      className="text-xs text-amber-700 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1"
                    >
                      Bảng ảnh <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5 font-display">Ghi chú dán</h4>

                  {isKeepLoading ? (
                    <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-300" /></div>
                  ) : keepNotes.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Chưa có ghi chú Keep nào được đồng bộ.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {keepNotes.slice(0, 2).map((note: any) => (
                        <div 
                          key={note.id} 
                          className={`p-3 rounded-xl border ${note.colorClass || 'bg-[#fff9e6] border-amber-200/60'} h-[110px] flex flex-col justify-between shadow-xs hover:scale-[1.03] transition-transform`}
                        >
                          <p className="text-[11px] font-bold text-neutral-800 truncate">{note.title || 'Không tiêu đề'}</p>
                          <p className="text-[9.5px] text-neutral-600 leading-normal line-clamp-3 mt-1 overflow-hidden">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setActiveTab('keep'); setShowAddKeep(true); }}
                  className="w-full mt-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tạo ghi chú nhanh
                </button>
              </div>

              {/* Widget 4: Google Docs và Google Drive */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px] md:col-span-2 lg:col-span-2">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-neutral-200">
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      Tài liệu Soạn Thảo (Docs)
                    </span>
                    <button 
                      onClick={() => setActiveTab('docs')}
                      className="text-xs text-neutral-700 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-1"
                    >
                      Docs Editor <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5">Tài liệu chỉnh sửa gần nhất</h4>

                  {isDocsLoading ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-300" /></div>
                  ) : docsList.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Chưa có văn bản Google Docs nào của bạn.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[120px] overflow-y-auto pr-1">
                      {docsList.slice(0, 4).map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => { setActiveTab('docs'); handleOpenDoc(doc.id); }}
                          className="p-3 bg-neutral-50 hover:bg-neutral-100 font-sans border border-neutral-200/60 rounded-xl flex items-center justify-between group cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-neutral-700 truncate">{doc.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-3">
                  <button 
                    onClick={() => { setActiveTab('docs'); setShowCreateDoc(true); }}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Soạn thảo văn bản mới
                  </button>
                  <button 
                    onClick={() => setActiveTab('picker')}
                    className="py-2 px-4 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Mở tệp Drive
                  </button>
                </div>
              </div>

              {/* Widget 5: Google Chat Quick Hub */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Google Chat
                    </span>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="text-xs text-emerald-700 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                    >
                      Trò chuyện <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5 font-display flex items-center gap-1.5">
                    Hội thoại nhanh
                  </h4>

                  {isSpacesLoading ? (
                    <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-300" /></div>
                  ) : chatSpaces.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Chưa kết nối phòng trò chuyện Google Chat nào.</p>
                  ) : (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {chatSpaces.slice(0, 3).map(space => (
                        <div 
                          key={space.name}
                          onClick={() => { setActiveTab('chat'); handleSelectSpace(space); }}
                          className="flex gap-2 items-center p-2 border border-neutral-100 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                        >
                          <Hash className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-semibold text-neutral-700 truncate">{space.displayName || space.name.replace('spaces/', '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setActiveTab('chat'); setShowAddSpace(true); }}
                  className="w-full mt-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Bắt đầu thảo luận mới
                </button>
              </div>

              {/* Widget 6: Gmail Inbox Panel */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[280px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Gmail Inbox
                    </span>
                    <button 
                      onClick={() => setActiveTab('gmail')}
                      className="text-xs text-red-700 font-bold hover:underline py-1 px-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      Hộp thư <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-base font-bold text-neutral-800 mb-2.5 font-display flex items-center gap-1.5">
                    Thư mới nhất
                  </h4>

                  {isGmailLoading ? (
                    <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-300" /></div>
                  ) : gmailEmails.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Chưa có email nào trong hộp thư của bạn.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {gmailEmails.slice(0, 3).map(email => (
                        <div 
                          key={email.id}
                          onClick={() => { setActiveTab('gmail'); setSelectedEmail(email); }}
                          className="flex flex-col p-1.5 border border-neutral-100 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-neutral-700 truncate max-w-[120px]">{email.from.split('<')[0].replace(/"/g, '').trim()}</span>
                            <span className="text-[9px] text-neutral-400 font-mono shrink-0">{email.date.split(',')[1]?.trim() || email.date.split(' ')[1] || 'Vừa xong'}</span>
                          </div>
                          <span className="text-xs text-neutral-800 font-semibold truncate leading-tight">{email.subject}</span>
                          <span className="text-[10px] text-neutral-400 truncate leading-normal">{email.snippet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setActiveTab('gmail'); setShowSendEmail(true); }}
                  className="w-full mt-3 py-2 bg-red-50 hover:bg-red-100/80 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Soạn thư điện tử mới
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE TASKS SỔ TAY VIỆC
            =============================================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className={`${style.card} space-y-6`}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold font-display text-neutral-800 flex items-center gap-2">
                    Google Tasks Sổ Tay Việc
                    <span className="text-[10px] text-sky-600 font-extrabold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">Xử lý gọn việc cần làm</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Mọi nội dung công việc được sắp xếp gọn gàng theo danh mục và tự động đồng bộ trên ứng dụng di động Google Tasks.</p>
                </div>

                <button
                  onClick={() => setShowAddList(!showAddList)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all text-white bg-sky-600 hover:bg-sky-700 shadow-sm`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo danh mục mới</span>
                </button>
              </div>

              {showAddList && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex gap-2 items-center shadow-inner animate-none"
                  onSubmit={handleCreateNewTaskList}
                >
                  <input
                    type="text"
                    required
                    placeholder="Tên danh mục công việc mới (Ví dụ: Cá nhân, Mua sắm, Tài chính...)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingList || !newListName.trim()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isCreatingList ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </motion.form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
                {/* TaskLists Sidebar column */}
                <div className="lg:col-span-1 border-r border-neutral-100 pr-0 lg:pr-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 px-1 pb-1 border-b border-neutral-100">
                    <ListTodo className="w-3.5 h-3.5 text-sky-500" />
                    Danh mục công việc ({taskLists.length})
                  </h4>

                  {isListsLoading ? (
                    <div className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-300" />
                    </div>
                  ) : taskLists.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 text-xs">
                      Chưa có danh mục nào.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                      {taskLists.map((list) => {
                        const isSelected = selectedList?.id === list.id;
                        return (
                          <div
                            key={list.id}
                            onClick={() => setSelectedList(list)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 border ${
                              isSelected 
                                ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-sm font-bold' 
                                : 'hover:bg-neutral-50 text-neutral-700 border-transparent hover:border-neutral-100'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs truncate leading-tight">{list.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Main tasks list item column */}
                <div className="lg:col-span-3 flex flex-col justify-between min-h-[400px] gap-4">
                  {selectedList ? (
                    <div className="flex flex-col h-full justify-between gap-4">
                      {/* Active list info and add task trigger */}
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded tracking-wider">Danh mục đang xem</span>
                          <p className="text-sm font-extrabold text-neutral-800 flex items-center gap-1.5 mt-0.5">
                            {selectedList.title}
                          </p>
                        </div>

                        <button 
                          onClick={() => setShowAddTask(!showAddTask)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Thêm công việc mới
                        </button>
                      </div>

                      {showAddTask && (
                        <motion.form 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          onSubmit={handleCreateNewTask}
                          className="bg-neutral-50/50 border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-inner pr-4"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Tiêu đề công việc *</label>
                            <input
                              type="text"
                              required
                              placeholder="Vd: Chuyển khoản tiền đóng học cho con..."
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-sky-500 transition-all font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Ngày hạn (Hạn chót)</label>
                              <input
                                type="date"
                                value={newTaskDue}
                                onChange={(e) => setNewTaskDue(e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs outline-none text-neutral-700"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Ghi chú chi tiết</label>
                              <input
                                type="text"
                                placeholder="Ghi chú thêm nội dung (tùy chọn)..."
                                value={newTaskNotes}
                                onChange={(e) => setNewTaskNotes(e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddTask(false)}
                              className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:bg-neutral-50 rounded-lg text-xs font-bold transition-all"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              disabled={isCreatingTask || !newTaskTitle.trim()}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              {isCreatingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Lưu công việc
                            </button>
                          </div>
                        </motion.form>
                      )}

                      {/* Tasks List */}
                      <div className="flex-1 min-h-[250px] max-h-[380px] overflow-y-auto bg-neutral-50/50 rounded-2xl p-4 border border-neutral-100 space-y-2.5 pr-2">
                        {isTasksLoading ? (
                          <div className="flex flex-col items-center justify-center h-full py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-neutral-300 mb-1" />
                            <p className="text-[10px] text-neutral-400">Đang đồng hóa công việc...</p>
                          </div>
                        ) : tasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400 text-xs">
                            <ClipboardList className="w-8 h-8 text-neutral-300 mb-2" />
                            <span>Mục này chưa có việc nào cần làm.</span>
                            <span className="text-[10px] text-neutral-400/80 mt-1">Sử dụng nút "Thêm công việc" phía trên để tạo.</span>
                          </div>
                        ) : (
                          tasks.map((task) => {
                            const isCompleted = task.status === 'completed';
                            return (
                              <div 
                                key={task.id} 
                                className="flex items-start justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200/60 shadow-xs hover:border-neutral-300 transition-colors gap-3"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <button 
                                    onClick={() => handleToggleTaskStatus(task)}
                                    className="p-1 rounded-lg shrink-0 mt-0.5 text-neutral-400 hover:text-sky-500 transition-colors"
                                  >
                                    {isCompleted ? (
                                      <CheckSquare className="w-5 h-5 text-sky-600" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold leading-normal ${isCompleted ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                                      {task.title}
                                    </p>
                                    {task.notes && (
                                      <p className="text-[10px] text-neutral-500 mt-1 pr-4 whitespace-normal leading-relaxed break-words">{task.notes}</p>
                                    )}
                                    {task.due && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-600 bg-sky-50/70 border border-sky-100 px-1.5 py-0.5 rounded mt-2 uppercase tracking-wide">
                                        <Clock className="w-2.5 h-2.5" />
                                        Hạn: {new Date(task.due).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteTaskItem(task.id, task.title)}
                                  className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                                  title="Xóa nhiệm vụ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#fafafa] border border-dashed rounded-3xl p-6 text-center text-neutral-400 text-xs h-[300px] flex flex-col items-center justify-center">
                      <ClipboardList className="w-10 h-10 text-neutral-300 mb-2" />
                      <span className="font-bold">Chưa chọn Danh mục công việc</span>
                      <span className="text-[10px] text-neutral-400 mt-1">Vui lòng nhấp chọn danh mục ở sidebar bên trái để xem tiến độ.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE CALENDAR
            =============================================== */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* List and add Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`${style.card} space-y-4`}>
                <div className="border-b border-neutral-100 pb-2 flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">Đặt lịch biểu mới</h3>
                  <button 
                    onClick={() => setShowAddEvent(!showAddEvent)}
                    className="text-neutral-500 hover:text-black p-1 rounded"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Tên sự kiện / Việc làm *</label>
                    <input
                      type="text"
                      required
                      placeholder="Vd: Họp tổng kết chi tiêu tháng..."
                      value={newEventSummary}
                      onChange={(e) => setNewEventSummary(e.target.value)}
                      className={style.input}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Bắt đầu *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEventStart}
                      onChange={(e) => setNewEventStart(e.target.value)}
                      className={style.input}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Kết thúc (Tùy chọn)</label>
                    <input
                      type="datetime-local"
                      value={newEventEnd}
                      onChange={(e) => setNewEventEnd(e.target.value)}
                      className={style.input}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Địa điểm / Địa chỉ</label>
                    <input
                      type="text"
                      placeholder="Vd: Phòng khách, Trực tuyến Meet..."
                      value={newEventLoc}
                      onChange={(e) => setNewEventLoc(e.target.value)}
                      className={style.input}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-0.5">Mô tả chi tiết</label>
                    <textarea
                      placeholder="Ghi chú thêm nội dung sự kiện..."
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      rows={3}
                      className={`${style.input} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingEvent || !newEventSummary.trim() || !newEventStart}
                    className={`${style.button} w-full text-xs font-bold py-3 flex items-center justify-center gap-2`}
                  >
                    {isCreatingEvent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu lịch Google...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xác nhận thêm sự kiện</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Visual Calendar list */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`${style.card} space-y-6`}>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-lg font-bold font-display text-neutral-800">Sự kiện đã lên lịch</h3>
                  <span className="text-xs bg-neutral-100 px-3 py-1 rounded-full font-bold text-neutral-500">{events.length} Lịch biểu</span>
                </div>

                {isEventsLoading ? (
                  <div className="text-center py-16 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-400 font-bold">Đang quét Lịch sự kiện từ tài khoản Google của bạn...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-3xl">
                    <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-500">Chưa tìm thấy sự kiện nào trong Calendar.</p>
                    <p className="text-xs text-neutral-400 mt-1">Sử dụng biểu mẫu phía trái để lưu các kế hoạch quan trọng lên Cloud.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[550px] overflow-auto pr-1">
                    {events.map((ev) => {
                      const startDate = ev.start.dateTime ? new Date(ev.start.dateTime) : ev.start.date ? new Date(ev.start.date) : null;
                      const endDate = ev.end.dateTime ? new Date(ev.end.dateTime) : ev.end.date ? new Date(ev.end.date) : null;
                      
                      return (
                        <div key={ev.id} className={`${style.taskCard} flex items-start gap-4 justify-between group`}>
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="bg-blue-50 text-blue-600 rounded-2xl p-3 flex flex-col items-center justify-center shrink-0 w-14 h-14 font-display">
                              <span className="text-lg font-extrabold leading-none">
                                {startDate ? startDate.getDate() : '?'}
                              </span>
                              <span className="text-[10px] font-bold uppercase mt-0.5 opacity-80">
                                TH {startDate ? startDate.getMonth() + 1 : ''}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-neutral-800 break-words leading-snug">
                                {ev.summary}
                              </h4>
                              
                              <p className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                                <span>⏲️ {startDate ? startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} {endDate ? ` - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                                {ev.location && <span className="text-neutral-400">| 📍 {ev.location}</span>}
                              </p>

                              {ev.description && (
                                <p className="text-xs text-neutral-500 mt-2 bg-neutral-50 p-2.5 rounded-lg font-medium border border-neutral-100 whitespace-pre-wrap">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {ev.htmlLink && (
                              <a 
                                href={ev.htmlLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500"
                                title="Xem trên Google Calendar Web"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.summary)}
                              className="p-2 hover:bg-red-50 rounded-full text-red-500"
                              title="Xóa sự kiện"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE DOCS EDITOR
            =============================================== */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left side list */}
            <div className={`${style.card} lg:col-span-1 space-y-4`}>
              <div className="border-b border-neutral-100 pb-2 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">Tài liệu của tôi</h3>
                <button
                  onClick={() => setShowCreateDoc(!showCreateDoc)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Tạo tài liệu mới"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Popup Form for new doc */}
              <AnimatePresence>
                {showCreateDoc && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleCreateNewDoc} 
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3 overflow-hidden"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên tài liệu..."
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateDoc(false)}
                        className="px-2.5 py-1.5 text-[10px] text-neutral-500 hover:bg-neutral-100 font-bold rounded"
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        disabled={isCreatingDoc || !newDocTitle.trim()}
                        className="px-3 py-1.5 text-[10px] bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        {isCreatingDoc && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Tạo mới</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {isDocsLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-300 mx-auto" />
                  <span className="text-xs text-neutral-400 font-bold">Đang tìm tài liệu Docs...</span>
                </div>
              ) : docsList.length === 0 ? (
                <div className="text-xs text-neutral-400 text-center py-6">
                  Chưa có tài liệu Google Docs nào. Nhấn biểu tượng "+" để bắt đầu.
                </div>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-auto py-1">
                  {docsList.map((docItem) => {
                    const isSelected = selectedDoc?.documentId === docItem.id;
                    return (
                      <button
                        key={docItem.id}
                        onClick={() => handleOpenDoc(docItem.id)}
                        className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'border-transparent text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate flex-1">{docItem.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side editor */}
            <div className="lg:col-span-3">
              {selectedDoc ? (
                <div className={`${style.card} space-y-4`}>
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-extrabold text-neutral-800 text-base">{selectedDoc.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {savingSuccess && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold animate-pulse">
                          ✓ Đã lưu tài liệu
                        </span>
                      )}
                      
                      <button
                        onClick={handleUpdateDocText}
                        disabled={isDocSaving}
                        className={`${style.button} text-xs py-2 px-4 font-bold flex items-center gap-1.5`}
                      >
                        {isDocSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Cập nhật Docs</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest">Trình soạn thảo trực quan</label>
                    <textarea
                      value={docContentText}
                      onChange={(e) => setDocContentText(e.target.value)}
                      rows={14}
                      className="w-full bg-[#fbfbfb] border border-neutral-200 rounded-3xl p-6 text-sm font-sans text-neutral-800 placeholder-neutral-400 outline-none leading-relaxed shadow-inner font-normal focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:italic transition-all"
                      placeholder="Bắt đầu ghi nhận nội dung của bạn..."
                    />
                  </div>

                  <div className="text-xs text-neutral-400 text-right font-medium">
                    Kích thước: ~{docContentText.length} kí tự | Tài liệu lưu trữ tự động trên Cloud của bạn.
                  </div>
                </div>
              ) : (
                <div className={`${style.card} h-[430px] flex flex-col items-center justify-center text-center p-8 space-y-4`}>
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-800 text-lg">Chưa mở tài liệu nào</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">Chọn một tài liệu có sẵn từ cột bên trái, hoặc nhấn "+" để tạo lập tài liệu Google Docs mới tích hợp.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE KEEP NOTES BOARD
            =============================================== */}
        {activeTab === 'keep' && (
          <div className="space-y-6">
            {/* Search row & Create note button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-neutral-200/80 p-4 rounded-3xl shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhãn ghi chú, nội dung..."
                  value={keepSearch}
                  onChange={(e) => setKeepSearch(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 pl-11 pr-4 py-2.5 rounded-3xl text-sm focus:ring-2 focus:ring-blue-50 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {isKeepSyncing && (
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-1.5 rounded-full flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Đang đồng bộ...</span>
                  </span>
                )}
                
                <button
                  onClick={() => setShowAddKeep(!showAddKeep)}
                  className={`${style.button} flex items-center gap-2 text-xs py-2.5 px-4 font-bold shadow-md rounded-2xl`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo ghi chú Keep</span>
                </button>
              </div>
            </div>

            {/* Quick Create expandable Note Card */}
            <AnimatePresence>
              {showAddKeep && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreateKeepNote}
                  className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-md space-y-4 max-w-xl mx-auto"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tiêu đề ghi chú"
                      value={newKeepTitle}
                      onChange={(e) => setNewKeepTitle(e.target.value)}
                      className="w-full text-base font-extrabold outline-none text-neutral-900 placeholder-neutral-400"
                    />
                    
                    <textarea
                      placeholder="Tạo ghi chú..."
                      value={newKeepContent}
                      onChange={(e) => setNewKeepContent(e.target.value)}
                      rows={3}
                      className="w-full text-sm outline-none text-neutral-700 placeholder-neutral-400 resize-none"
                    />

                    {/* Todo list items creator */}
                    {newKeepTodos.length > 0 && (
                      <div className="space-y-1.5 border-t border-neutral-100 pt-2 text-xs">
                        {newKeepTodos.map((todo) => (
                          <div key={todo.id} className="flex items-center justify-between bg-neutral-50 px-2.5 py-1 rounded-lg">
                            <span className="font-bold text-neutral-700 truncate">{todo.text}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveKeepTodo(todo.id)}
                              className="text-red-500 hover:text-red-700 font-extrabold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Todo Input mini-row */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Thêm mục checklist việc cần làm..."
                        value={newTodoInput}
                        onChange={(e) => setNewTodoInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeepTodo();
                          }
                        }}
                        className="flex-1 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-700"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeepTodo}
                        className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 text-xs font-bold shrink-0"
                      >
                        + Thêm mục
                      </button>
                    </div>
                  </div>

                  {/* Note color selector & Actions footer */}
                  <div className="flex flex-wrap items-center justify-between border-t border-neutral-100 pt-3 gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-neutral-400 uppercase mr-1">Màu sắc:</span>
                      {KEEP_COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setNewKeepColor(col.value)}
                          className={`w-6 h-6 rounded-full border border-neutral-300 transition-all ${col.value} ${
                            newKeepColor === col.value ? 'ring-2 ring-emerald-500 scale-110' : ''
                          }`}
                          title={col.name}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddKeep(false)}
                        className="px-3.5 py-1.5 text-xs text-neutral-500 font-bold hover:bg-neutral-50 rounded"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 shadow-sm"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Grid display Keep Note Cards */}
            {isKeepLoading ? (
              <div className="text-center py-16 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-300" />
                <span className="text-xs text-neutral-400 font-bold">Đang tải bảng ghi chú Keep...</span>
              </div>
            ) : keepNotes.length === 0 ? (
              <div className="text-center py-16 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-3xl max-w-xl mx-auto">
                <Sparkles className="w-12 h-12 text-yellow-500/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-500">Chưa có ghi chú nào được lưu giữ.</p>
                <p className="text-xs text-neutral-400 mt-1">Sáng tạo ghi chú, phân loại nhãn màu cực xinh và tự động đồng bộ hóa đám mây.</p>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 box-border">
                {keepNotes
                  .filter(n => {
                    const str = `${n.title} ${n.content} ${n.todoList?.map(t => t.text).join(' ') || ''}`.toLowerCase();
                    return str.includes(keepSearch.toLowerCase());
                  })
                  .map((note) => {
                    return (
                      <div
                        key={note.id}
                        className={`break-inside-avoid border-2 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between ${note.color || 'bg-white border-neutral-200'}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            {note.title && (
                              <h4 className="font-extrabold text-neutral-900 text-base leading-snug">{note.title}</h4>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleKeepPin(note.id)}
                              className={`p-1 hover:bg-black/5 rounded ${note.isPinned ? 'text-amber-600' : 'text-neutral-400'}`}
                              title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                            >
                              <Pin className="w-4 h-4 fill-current" />
                            </button>
                          </div>

                          {note.content && (
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          )}

                          {/* Render Keep checklists */}
                          {note.todoList && note.todoList.length > 0 && (
                            <div className="space-y-1.5 border-t border-neutral-100/50 pt-2.5">
                              {note.todoList.map((todo) => (
                                <button
                                  key={todo.id}
                                  onClick={() => handleToggleTodoDone(note.id, todo.id)}
                                  className="w-full flex items-center gap-2 text-left text-xs text-neutral-700 py-0.5 hover:bg-black/5 rounded px-1 group"
                                >
                                  {todo.done ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                                  )}
                                  <span className={`truncate flex-1 font-medium ${todo.done ? 'line-through text-neutral-400' : ''}`}>
                                    {todo.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons list */}
                        <div className="flex items-center justify-between border-t border-neutral-100/30 pt-3 mt-1.5">
                          <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                            {new Date(note.updatedTime).toLocaleDateString('vi-VN')}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteKeepNote(note.id, note.title)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-full"
                            title="Xóa ghi chú Keep"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE PICKER / DRIVE FILE SELECTOR
            =============================================== */}
        {activeTab === 'picker' && (
          <div className="space-y-6">
            <div className={`${style.card} space-y-6`}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold font-display text-neutral-800 flex items-center gap-2">
                    Google Drive Custom Explorer
                    <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Picker thay thế</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Khám phá và chọn lựa mọi định dạng tệp tin từ Drive của bạn cực nhanh.</p>
                </div>

                <form onSubmit={handlePickerSearchSubmit} className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Tìm tên tệp Drive..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 pl-10 pr-4 py-2 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-2.5 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-black shrink-0"
                  >
                    Quét tìm
                  </button>
                </form>
              </div>

              {/* Grid content and Preview side components */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* File checklist */}
                <div className="lg:col-span-2 space-y-3">
                  {isFilesLoading ? (
                    <div className="text-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-300 mb-2" />
                      <p className="text-xs text-neutral-400 font-bold">Đồng bộ danh sách tệp Google Drive...</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="text-center py-16 bg-[#fafafa] border border-dashed rounded-3xl">
                      <FolderOpen className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400 font-bold">Chưa tìm thấy tệp tương thích.</p>
                      <p className="text-[10px] text-neutral-400 mt-1">Sử dụng thanh tìm kiếm để tra cứu các tệp tin lưu trữ Drive.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[450px] overflow-auto pr-1">
                      {driveFiles.map((file) => {
                        const isSelected = pickerSelectedFile?.id === file.id;
                        return (
                          <div
                            key={file.id}
                            onClick={() => setPickerSelectedFile(file)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected 
                                ? 'bg-blue-50/50 border-blue-400/80 shadow-sm' 
                                : 'bg-white hover:bg-neutral-50 border-neutral-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {file.iconLink ? (
                                <img src={file.iconLink} alt="" className="w-4.5 h-4.5" referrerPolicy="no-referrer" />
                              ) : (
                                <FileText className="w-4.5 h-4.5 text-neutral-400" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-neutral-800 truncate leading-none">{file.name}</p>
                                <p className="text-[9px] font-mono text-neutral-400 mt-1">Loại: {file.mimeType.split('.').pop()}</p>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-neutral-400">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('vi-VN') : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selection file info preview details */}
                <div className="lg:col-span-1">
                  {pickerSelectedFile ? (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 text-xs">
                      <div className="border-b border-neutral-200 pb-2">
                        <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded tracking-wider">Tệp đang chọn</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="font-bold text-neutral-800 text-sm break-words leading-snug">{pickerSelectedFile.name}</div>
                        
                        <div>
                          <p className="text-neutral-400 font-bold uppercase text-[9px] tracking-wider">ID tệp tin</p>
                          <p className="font-mono text-neutral-700 bg-black/5 p-1 rounded break-all mt-0.5">{pickerSelectedFile.id}</p>
                        </div>

                        <div>
                          <p className="text-neutral-400 font-bold uppercase text-[9px] tracking-wider">Định dạng tệp (MimeType)</p>
                          <p className="font-semibold text-neutral-700 break-words mt-0.5">{pickerSelectedFile.mimeType}</p>
                        </div>
                      </div>

                      {/* Deep functional linking */}
                      <div className="pt-3 border-t border-neutral-200 space-y-2">
                        {pickerSelectedFile.mimeType === 'application/vnd.google-apps.document' && (
                          <button
                            onClick={() => {
                              setActiveTab('docs');
                              handleOpenDoc(pickerSelectedFile.id);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-center"
                          >
                            Mở bằng Google Docs Editor
                          </button>
                        )}
                        
                        {pickerSelectedFile.webViewLink && (
                          <a
                            href={pickerSelectedFile.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-neutral-800 hover:bg-black text-white font-bold rounded-xl transition-colors block text-center"
                          >
                            Mở trực tiếp trên web Drive
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#fafafa] border border-dashed rounded-3xl p-6 text-center text-neutral-400 text-xs h-[250px] flex flex-col items-center justify-center">
                      <Folder className="w-8 h-8 text-neutral-300 mb-2" />
                      <span>Chọn một tệp bất kì để duyệt thông tin chi tiết hoặc mở biên soạn.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GOOGLE CHAT INTEGRATION
            =============================================== */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className={`${style.card} space-y-6`}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-bold font-display text-neutral-800 flex items-center gap-2">
                    Google Chat Integration
                    <span className="text-[10px] text-teal-600 font-extrabold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Không gian trò chuyện</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Trò chuyện trực tiếp, thảo luận công việc & cộng tác tức thì với đối tác và nhóm của bạn.</p>
                </div>

                <button
                  onClick={() => setShowAddSpace(!showAddSpace)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-white ${appTheme === 'vietnam' ? 'bg-[#ff3b3b] hover:bg-[#d32f2f]' : 'bg-[#1a73e8] hover:bg-[#1557b0]'}`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tạo phòng Chat mới</span>
                </button>
              </div>

              {showAddSpace && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex gap-2 items-center"
                  onSubmit={handleCreateSpace}
                >
                  <input
                    type="text"
                    required
                    placeholder="Tên không gian trò chuyện mới..."
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingSpace || !newSpaceName.trim()}
                    className="px-4 py-2 bg-neutral-800 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isCreatingSpace ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </motion.form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[400px]">
                {/* Space Sidebar column */}
                <div className="lg:col-span-1 border-r border-neutral-100 pr-0 lg:pr-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 px-1 pb-1 border-b border-neutral-100">
                    <Users className="w-3.5 h-3.5" />
                    Danh sách phòng ({chatSpaces.length})
                  </h4>

                  {isSpacesLoading ? (
                    <div className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-300" />
                    </div>
                  ) : chatSpaces.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 text-xs">
                      Chưa có phòng chat. Hãy tạo mới một phòng để bắt đầu.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                      {chatSpaces.map((space) => {
                        const isSelected = selectedSpace?.name === space.name;
                        return (
                          <div
                            key={space.name}
                            onClick={() => handleSelectSpace(space)}
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${
                              isSelected 
                                ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm' 
                                : 'hover:bg-neutral-50 text-neutral-700 border border-transparent'
                            }`}
                          >
                            <Hash className={`w-4 h-4 ${isSelected ? 'text-teal-600 font-bold' : 'text-neutral-400'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate leading-tight">{space.displayName || space.name.replace('spaces/', '')}</p>
                              <p className="text-[9px] text-neutral-400 mt-0.5 truncate">{space.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active Chat box column */}
                <div className="lg:col-span-3 flex flex-col justify-between min-h-[400px]">
                  {selectedSpace ? (
                    <div className="flex flex-col h-full justify-between gap-4">
                      {/* Space info header */}
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-neutral-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {selectedSpace.displayName || selectedSpace.name.replace('spaces/', '')}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{selectedSpace.name}</p>
                        </div>

                        <button 
                          onClick={() => fetchChatMessages(selectedSpace.name)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 animate-none"
                          title="Làm mới tin nhắn"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Message history */}
                      <div className="flex-1 min-h-[250px] max-h-[350px] overflow-y-auto bg-neutral-50/50 rounded-2xl p-4 border border-neutral-100/80 space-y-3.5 pr-2">
                        {isMessagesLoading ? (
                          <div className="flex flex-col items-center justify-center h-full py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-neutral-300 mb-1" />
                            <p className="text-[10px] text-neutral-400">Đang tải cuộc trò chuyện...</p>
                          </div>
                        ) : spaceMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400 text-xs">
                            <MessageSquare className="w-8 h-8 text-neutral-300 mb-2" />
                            <span>Phòng chat chưa có tin nhắn nào.</span>
                            <span className="text-[10px] text-neutral-400/80 mt-1">Gửi tin nhắn đầu tiên của bạn ở biểu mẫu bên dưới.</span>
                          </div>
                        ) : (
                          spaceMessages.map((msg, index) => {
                            const senderName = msg.sender?.displayName || msg.sender?.name || 'Thành viên';
                            const senderImage = msg.sender?.avatarUrl;
                            return (
                              <div key={msg.name || index} className="flex gap-3 text-xs items-start">
                                {senderImage ? (
                                  <img 
                                    src={senderImage} 
                                    alt={senderName} 
                                    className="w-7 h-7 rounded-full shrink-0 border border-neutral-200"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-extrabold shrink-0 border border-neutral-300">
                                    {senderName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 bg-white p-3 rounded-2xl border border-neutral-200/60 shadow-sm">
                                  <div className="flex justify-between items-center gap-2 mb-1">
                                    <span className="font-bold text-neutral-800">{senderName}</span>
                                    <span className="text-[9px] text-neutral-400 font-mono">
                                      {msg.createTime ? new Date(msg.createTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  <p className="text-neutral-700 leading-relaxed font-sans text-xs break-words whitespace-pre-wrap">{msg.text}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input form */}
                      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          value={chatMessageText}
                          onChange={(e) => setChatMessageText(e.target.value)}
                          placeholder="Nhập nội dung tin nhắn trò chuyện..."
                          className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-teal-500"
                          disabled={isSendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage || !chatMessageText.trim()}
                          className={`p-2.5 text-white rounded-xl transition-all disabled:opacity-50 shrink-0 ${
                            isSendingMessage 
                              ? 'bg-neutral-400' 
                              : appTheme === 'vietnam' 
                                ? 'bg-[#ff3b3b] hover:bg-[#d32f2f]' 
                                : 'bg-teal-600 hover:bg-teal-700'
                          }`}
                        >
                          {isSendingMessage ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <Send className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-[#fafafa] border border-dashed rounded-3xl p-6 text-center text-neutral-400 text-xs h-[300px] flex flex-col items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-neutral-300 mb-2" />
                      <span className="font-bold">Chưa chọn phòng chat</span>
                      <span className="text-[10px] text-neutral-400 mt-1">Hãy nhấn lựa chọn một không gian chat ở danh sách bên trái để lấy lịch sử trò chuyện.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================
            TAB: GMAIL CLIENT INTERFACE
            =============================================== */}
        {activeTab === 'gmail' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Messages List (span 5) */}
              <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm flex flex-col h-[580px]">
                {/* Search & Compose header */}
                <div className="mb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-800 font-display flex items-center gap-2">
                      <Inbox className="w-5 h-5 text-red-500" />
                      <span>Hộp thư Gmail</span>
                    </h3>
                    <button
                      onClick={() => setShowSendEmail(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 animate-none"
                    >
                      <Plus className="w-4 h-4" /> Soạn thư
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => { e.preventDefault(); fetchGmailEmails(); }} 
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={gmailSearch}
                        onChange={(e) => setGmailSearch(e.target.value)}
                        placeholder="Tìm kiếm email..."
                        className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-red-500/80 transition-all font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-2xl transition-all"
                    >
                      Tìm
                    </button>
                  </form>
                </div>

                {/* Email list scrolling body */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
                  {isGmailLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-300 mb-1" />
                      <p className="text-[10px] text-neutral-400">Đang tải thư đến...</p>
                    </div>
                  ) : gmailEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center text-neutral-400 text-xs">
                      <Mail className="w-10 h-10 text-neutral-200 mb-2" />
                      <span className="font-bold">Hộp thư trống</span>
                      <span className="text-[10px] text-neutral-400 mt-1">Không tìm thấy thư điện tử nào phù hợp hoặc đã bị xóa.</span>
                    </div>
                  ) : (
                    gmailEmails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id;
                      const senderClean = email.from.split('<')[0].replace(/"/g, '').trim();
                      return (
                        <div
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`flex flex-col p-3.5 border rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? 'border-red-300 bg-red-50/25 shadow-sm'
                              : 'border-neutral-100 bg-neutral-50/30 hover:border-neutral-200 hover:bg-neutral-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-xs truncate ${isSelected ? 'font-black text-red-700' : 'font-bold text-neutral-800'}`}>
                              {senderClean || 'Không rõ'}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-mono shrink-0 pt-0.5">{email.date.split(',')[1]?.trim() || email.date.split(' ')[0]}</span>
                          </div>
                          <span className={`text-xs mt-1 truncate ${isSelected ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-700'}`}>
                            {email.subject}
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-1 truncate leading-normal">{email.snippet}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Active Email Reader Detail (span 7) */}
              <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm flex flex-col h-[580px]">
                {selectedEmail ? (
                  <div className="flex flex-col h-full">
                    {/* Active Email Header Actions */}
                    <div className="flex justify-between items-start pb-4 border-b border-neutral-100">
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[9px] font-extrabold uppercase bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full inline-block">
                          ĐỌC EMAIL
                        </span>
                        <h4 className="text-base font-bold text-neutral-800 font-display leading-tight break-words">
                          {selectedEmail.subject}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                          onClick={() => {
                            setEmailTo(selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from);
                            setEmailSubject(`Re: ${selectedEmail.subject.startsWith('Re:') ? '' : 'Re: '}${selectedEmail.subject}`);
                            setEmailBody(`<br/><br/>--- Vào ${selectedEmail.date}, ${selectedEmail.from} đã viết --- <br/>` + selectedEmail.body);
                            setShowSendEmail(true);
                          }}
                          className="px-3.5 py-2 hover:bg-neutral-50 text-neutral-700 rounded-xl border border-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 animate-none"
                        >
                          <Send className="w-3.5 h-3.5 text-neutral-500" /> Trả lời
                        </button>
                        <button
                          onClick={() => handleTrashEmail(selectedEmail.id)}
                          disabled={isTrashingEmail}
                          title="Xóa thư này"
                          className="p-2 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isTrashingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Sender profile card */}
                    <div className="flex items-center gap-3 py-4 border-b border-neutral-50">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-extrabold text-neutral-600 shadow-inner">
                        {selectedEmail.from.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-800 break-words">{selectedEmail.from}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-300" />
                          <span>Gửi vào: {selectedEmail.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Email Rich Text / HTML body preview pane */}
                    <div className="flex-1 overflow-y-auto pt-5 text-neutral-700 font-sans text-xs leading-relaxed space-y-4 pr-1">
                      {selectedEmail.body.includes('</') || selectedEmail.body.includes('<br') ? (
                        <div 
                          className="gmail-body-content max-w-none break-words"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400 text-xs p-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
                      <Mail className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-neutral-600 text-sm">Chưa lựa chọn email</span>
                    <span className="text-[10px] text-neutral-400 mt-1 max-w-xs leading-normal">
                      Vui lòng nhấp vào một bức thư ở danh sách bên trái để mở rộng và đọc thông tin chi tiết đầy đủ của thư.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Composer Modal/Dialog Sheet (absolute overlay) */}
            {showSendEmail && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
                  <div className="bg-neutral-900 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-red-400" />
                      <span className="font-bold text-sm tracking-tight font-display">Soạn email mới</span>
                    </div>
                    <button
                      onClick={() => setShowSendEmail(false)}
                      className="text-neutral-400 hover:text-white transition-colors text-xs font-bold bg-neutral-800 px-3 py-1.5 rounded-xl animate-none"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <form onSubmit={handleSendEmail} className="p-6 space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1.5 tracking-wider">Người nhận (To:)</label>
                      <input
                        type="email"
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 py-3 leading-tight outline-none focus:border-red-500 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1.5 tracking-wider">Chủ đề (Subject:)</label>
                      <input
                        type="text"
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Tiêu đề email của bạn..."
                        className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl px-4 py-3 leading-tight outline-none focus:border-red-500 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1.5 tracking-wider">Nội dung thư (Email Body:)</label>
                      <textarea
                        required
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Nhập văn bản email hoặc thẻ HTML soạn thảo..."
                        rows={8}
                        className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 rounded-2xl px-4 py-3.5 leading-relaxed outline-none focus:border-red-500 resize-none font-sans"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowSendEmail(false)}
                        className="px-4 py-2.5 border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-2xl font-bold transition-all animate-none"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingEmail}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60 animate-none"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang gửi...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Gửi ngay</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

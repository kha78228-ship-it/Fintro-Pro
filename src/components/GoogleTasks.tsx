import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  RefreshCw, 
  FolderPlus, 
  Search, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  connectGoogleTasks, 
  getGoogleTasksToken, 
  setGoogleTasksToken,
  listGoogleTaskLists, 
  createGoogleTaskList, 
  listGoogleTasks, 
  createGoogleTask, 
  updateGoogleTask, 
  deleteGoogleTask,
  TaskList,
  TaskItem 
} from '../lib/tasksService';

interface GoogleTasksProps {
  user: any;
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
}

export default function GoogleTasks({ user, appTheme = "google_material" }: GoogleTasksProps) {
  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com') || false;
  
  // Authentication status
  const [tasksToken, setTasksTokenState] = useState<string | null>(getGoogleTasksToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Lists & Tasks States
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedList, setSelectedList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  const [isListsLoading, setIsListsLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  
  // Operation states
  const [newListName, setNewListName] = useState('');
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [completedFilter, setCompletedFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Sync token from direct auth changes
  useEffect(() => {
    const checkToken = () => {
      const token = getGoogleTasksToken();
      if (token && token !== tasksToken) {
        setTasksTokenState(token);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [tasksToken]);

  // Load Task Lists once authenticated
  useEffect(() => {
    if (tasksToken) {
      fetchTaskLists(tasksToken);
    }
  }, [tasksToken]);

  // Load Tasks once List is selected
  useEffect(() => {
    if (tasksToken && selectedList) {
      fetchTasks(tasksToken, selectedList.id);
    }
  }, [selectedList, tasksToken]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await connectGoogleTasks();
      if (result?.accessToken) {
        setTasksTokenState(result.accessToken);
        setGoogleTasksToken(result.accessToken, result.user);
      }
    } catch (error: any) {
      setAuthError(error.message || 'Kết nối thất bại. Vui lòng thử lại.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    setTasksTokenState(null);
    setGoogleTasksToken(null);
    setTaskLists([]);
    setSelectedList(null);
    setTasks([]);
  };

  const fetchTaskLists = async (token: string) => {
    setIsListsLoading(true);
    try {
      const lists = await listGoogleTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        // Safe default or keep existing
        setSelectedList(prev => {
          if (prev && lists.some(l => l.id === prev.id)) {
            return lists.find(l => l.id === prev.id) || lists[0];
          }
          return lists[0];
        });
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsListsLoading(false);
    }
  };

  const fetchTasks = async (token: string, listId: string) => {
    setIsTasksLoading(true);
    try {
      const items = await listGoogleTasks(token, listId);
      setTasks(items);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksToken || !newListName.trim()) return;

    setIsCreatingList(true);
    try {
      const newList = await createGoogleTaskList(tasksToken, newListName.trim());
      setTaskLists(prev => [...prev, newList]);
      setSelectedList(newList);
      setNewListName('');
      setShowAddListModal(false);
    } catch (error: any) {
      alert(error.message || 'Không thể tạo danh mục mới.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksToken || !selectedList || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      const taskPayload: { title: string; notes?: string; due?: string } = {
        title: newTaskTitle.trim()
      };
      if (newTaskNotes.trim()) {
        taskPayload.notes = newTaskNotes.trim();
      }
      if (newTaskDue) {
        // Due date needs RFC 3339 format (Midnight UTC)
        taskPayload.due = new Date(newTaskDue).toISOString();
      }

      const newTask = await createGoogleTask(tasksToken, selectedList.id, taskPayload);
      setTasks(prev => [newTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      setShowAddTaskForm(false);
    } catch (error: any) {
      alert(error.message || 'Không thể tạo công việc mới.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    if (!tasksToken || !selectedList) return;

    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { 
      ...t, 
      status: newStatus,
      completed: newStatus === 'completed' ? new Date().toISOString() : undefined 
    } : t));

    try {
      await updateGoogleTask(tasksToken, selectedList.id, task.id, {
        id: task.id,
        status: newStatus
      });
    } catch (error: any) {
      // Revert in case of API failure
      alert(error.message || 'Cập nhật trạng thái công việc thất bại.');
      fetchTasks(tasksToken, selectedList.id);
    }
  };

  const handleDeleteTaskItem = async (task: TaskItem) => {
    if (!tasksToken || !selectedList) return;

    // MANDATORY USER CONFIRMATION BEFORE DESTRUCTIVE OPERATIONS
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}" khỏi Google Tasks?`);
    if (!confirmed) return;

    // Optimistic filter
    setTasks(prev => prev.filter(t => t.id !== task.id));

    try {
      await deleteGoogleTask(tasksToken, selectedList.id, task.id);
    } catch (error: any) {
      alert(error.message || 'Xóa công việc thất bại.');
      fetchTasks(tasksToken, selectedList.id);
    }
  };

  const handleRefresh = () => {
    if (tasksToken) {
      fetchTaskLists(tasksToken);
      if (selectedList) fetchTasks(tasksToken, selectedList.id);
    }
  };

  // Filtered and sorted tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (completedFilter === 'active') return t.status === 'needsAction';
    if (completedFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const getThemeClass = () => {
    if (appTheme === 'vietnam') {
      return {
        card: "bg-[#050e21]/90 border border-[#00bfff]/30 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        button: "bg-[#ff3b3b] hover:bg-[#d32f2f] text-white font-bold px-5 py-2.5 rounded-3xl shadow-lg border border-[#ff3b3b]/50 transition-all",
        accentText: "text-[#ffcc00]",
        iconColor: "text-[#00bfff]",
        activeTab: "bg-[#ff3b3b] text-white border-[#ff3b3b]",
        inactiveTab: "text-[#e0f7fa] bg-[#050e21] border-[#00bfff]/20 hover:border-[#00bfff]/50",
        taskCard: "bg-black/30 border border-[#00bfff]/10 hover:border-[#00bfff]/30 transition-all rounded-2xl p-4"
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
        taskCard: "bg-[#faf5f7] border border-[#fbcfe8] hover:shadow-sm rounded-2xl p-4"
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
        taskCard: "bg-[#f6f2e8] border border-[#d3c09f]/40 hover:border-[#d3c09f] rounded-2xl p-4"
      };
    }
    return { // google_material as default
      card: "bg-white border border-[#e3e3e3] rounded-[1.5rem] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      button: "bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold px-5 py-2.5 rounded-3xl shadow-sm transition-all",
      accentText: "text-[#1a73e8]",
      iconColor: "text-[#1a73e8]",
      activeTab: "bg-[#1a73e8] text-white border-[#1a73e8]/30",
      inactiveTab: "text-[#1f1f1f] bg-[#f1f3f4] border border-transparent hover:bg-[#e8eaed]",
      taskCard: "bg-white border border-[#e3e3e3] hover:shadow-md transition-all rounded-[1rem] p-4"
    };
  };

  const style = getThemeClass();

  // If user has no active Tasks Access Token, prompt Auth connection
  if (!tasksToken) {
    return (
      <div className={`${style.card} max-w-xl mx-auto flex flex-col items-center text-center py-12 px-6 space-y-6 mt-8`}>
        <div className={`p-5 rounded-full ${appTheme === 'vietnam' ? 'bg-[#ff3b3b]/10' : 'bg-[#1a73e8]/10'} flex items-center justify-center`}>
          <ClipboardList className={`w-14 h-14 ${style.iconColor}`} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Đồng bộ quản trị <span className={style.accentText}>Google Tasks</span>
          </h2>
          <p className="text-sm max-w-md text-neutral-500 leading-relaxed">
            {isGoogleUser 
              ? 'Tài khoản Google của bạn đã sẵn sàng! Nhấn kết nối để cấp quyền đồng bộ các danh mục công việc ngay từ ứng dụng.' 
              : 'Hãy liên kết Google và cho phép ứng dụng đồng bộ hóa danh sách công việc của bạn, nhận thông báo nhắc lịch và cập nhật trạng thái mọi lúc.'}
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
              <span>Đang kết nối...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Kết nối với Google Tasks</span>
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className={`${style.card} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${appTheme === 'vietnam' ? 'bg-[#ff3b3b]/10' : 'bg-[#1a73e8]/10'} flex items-center justify-center`}>
            <ClipboardList className={`w-8 h-8 ${style.iconColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight">Sổ tay Google Tasks</h2>
            <p className="text-xs text-neutral-500 mt-1">Đồng bộ hóa các công việc ghi nhớ lên Cloud từ Google Account.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            title="Đồng bộ lại"
            className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all text-neutral-600 flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAddListModal(true)}
            className={`${style.button} flex items-center gap-2 text-xs py-2.5 px-4 font-bold`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Thêm danh mục</span>
          </button>

          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-3xl hover:bg-red-50 text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Ngắt kết nối</span>
          </button>
        </div>
      </div>

      {/* Main Panel layout with Sidebar List Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Task lists container */}
        <div className={`${style.card} lg:col-span-1 space-y-4`}>
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">Danh mục công việc</h3>
          </div>
          {isListsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              <span className="text-xs text-neutral-400 font-bold">Đang tải danh mục...</span>
            </div>
          ) : (
            <div className="flex lg:flex-col overflow-auto py-1 gap-2 max-h-[400px]">
              {taskLists.map((list) => {
                const isSelected = selectedList?.id === list.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                      isSelected ? style.activeTab : style.inactiveTab
                    }`}
                  >
                    {list.title}
                  </button>
                );
              })}
              {taskLists.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  Chưa có danh mục nào.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks display container */}
        <div className="lg:col-span-3 space-y-6">
          <div className={`${style.card} space-y-6`}>
            {/* Toolbar row with search & filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-4 border-b border-neutral-100">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 pl-11 pr-4 py-2.5 rounded-3xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-neutral-800"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCompletedFilter('all')}
                  className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold ${
                    completedFilter === 'all' 
                      ? 'bg-neutral-800 text-white' 
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setCompletedFilter('active')}
                  className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold ${
                    completedFilter === 'active' 
                      ? 'bg-neutral-800 text-white' 
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Chưa xong
                </button>
                <button
                  onClick={() => setCompletedFilter('completed')}
                  className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold ${
                    completedFilter === 'completed' 
                      ? 'bg-neutral-800 text-white' 
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Đã hoàn thành
                </button>
              </div>
            </div>

            {/* Selected category title & Add task action */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display text-neutral-800">
                {selectedList ? selectedList.title : 'Đang chọn...'} 
                <span className="text-xs bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded-md ml-2">
                  {filteredTasks.length} nhiệm vụ
                </span>
              </h3>

              {!showAddTaskForm && (
                <button
                  onClick={() => setShowAddTaskForm(true)}
                  className={`${style.button} flex items-center gap-2 text-xs py-2 px-3.5 font-bold shadow-md rounded-2xl`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo nhiệm vụ</span>
                </button>
              )}
            </div>

            {/* Interactive Add Task form with custom transition */}
            <AnimatePresence>
              {showAddTaskForm && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreateTask}
                  className="bg-neutral-50/50 p-6 rounded-[1rem] border border-neutral-100/80 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5Col">
                      <label className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-widest pl-1">Tiêu đề công việc *</label>
                      <input
                        type="text"
                        placeholder="Vd: Chuẩn bị thuyết trình,..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1.5Col">
                      <label className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-widest pl-1">Hạn chót (Do date)</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="date"
                          value={newTaskDue}
                          onChange={(e) => setNewTaskDue(e.target.value)}
                          className="w-full bg-white border border-neutral-200 pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-neutral-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5Col">
                    <label className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-widest pl-1">Chi tiết & Ghi chú bổ sung</label>
                    <textarea
                      placeholder="Mô tả cụ thể nhiệm vụ..."
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-neutral-800 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setShowAddTaskForm(false)}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingTask || !newTaskTitle.trim()}
                      className={`${style.button} text-xs py-2 px-5 font-bold rounded-2xl flex items-center gap-2`}
                    >
                      {isCreatingTask ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spinPin" />
                          <span>Đang tạo...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Lưu nhiệm vụ</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Task list array */}
            {isTasksLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                <span className="text-xs text-neutral-400 font-bold">Đang đồng bộ công việc từ Google Tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-500">Tuyệt vời! Không có công việc nào cần hoàn thành.</p>
                <p className="text-xs text-neutral-400 mt-1">Sử dụng nút "Tạo nhiệm vụ" phía trên để lưu thêm việc cần thực hiện.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-auto pr-1">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const isExpanded = expandedTask === task.id;
                  return (
                    <motion.div
                      layout
                      key={task.id}
                      className={`${style.taskCard} flex flex-col gap-2 relative group`}
                    >
                      <div className="flex items-start gap-4 justify-between pr-8">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Checked Checkbox trigger */}
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`w-5.5 h-5.5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-neutral-300 hover:border-blue-500 hover:bg-neutral-50'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold tracking-tight break-words ${
                              isCompleted ? 'line-through text-neutral-400 font-medium' : 'text-neutral-800'
                            }`}>
                              {task.title}
                            </h4>
                            
                            {/* Short stats summary */}
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              {task.due && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(task.due).toLocaleDateString('vi-VN')}</span>
                                </span>
                              )}
                              
                              {task.notes && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#1a73e8] bg-blue-50 px-2 py-0.5 rounded">
                                  <FileText className="w-3 h-3" />
                                  <span>Chi tiết</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action controllers */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                            className="p-1 px-1.5 hover:bg-neutral-100 rounded text-neutral-500"
                            title="Xem chi tiết"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTaskItem(task)}
                            className="p-1.5 hover:bg-red-50 rounded text-red-500"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expand details info */}
                      {isExpanded && task.notes && (
                        <div className="pl-9 pr-6 py-2 border-t border-neutral-100 mt-2 text-xs text-neutral-500 whitespace-pre-wrap leading-relaxed">
                          {task.notes}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog popup to create a custom Task List */}
      <AnimatePresence>
        {showAddListModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl border border-neutral-100 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-bold font-display text-neutral-900">Tạo danh mục công việc mới</h3>
              
              <form onSubmit={handleCreateList} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-neutral-500 uppercase pl-1">Tên mục công việc</label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: Dự án gia đình, Môn học,..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddListModal(false)}
                    className="px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-50 rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingList || !newListName.trim()}
                    className={`${style.button} text-xs py-2 px-5 font-bold rounded-xl flex items-center gap-1.5`}
                  >
                    {isCreatingList ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Tạo danh mục</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

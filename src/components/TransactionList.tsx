import React, { useState, useMemo, memo } from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import * as LucideIcons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowUpDown, ArrowDown, ArrowUp, CalendarDays, Trash2, Share2, Check, X, AlertTriangle, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/CurrencyContext';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  hideHeaderActions?: boolean;
  reducedMotion?: boolean;
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const TransactionItem = memo(({ 
  t, 
  idx, 
  onDeleteRequest,
  formatMoney,
  reducedMotion
}: { 
  t: Transaction; 
  idx: number; 
  onDeleteRequest?: (id: string) => void;
  formatMoney: (v: number) => string;
  reducedMotion?: boolean;
}) => {
  const categoryObj = DEFAULT_CATEGORIES.find(c => c.id === t.category);
  const IconComponent = (LucideIcons as any)[categoryObj?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

  return (
    <motion.div 
      layout={!reducedMotion}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      whileHover={reducedMotion ? {} : { scale: 1.005 }}
      whileTap={reducedMotion ? {} : { scale: 0.99 }}
      transition={reducedMotion ? { duration: 0.2 } : { delay: idx * 0.03 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl transition-all duration-300 relative bg-neo-light border border-neo-dark/15 hover:border-neo-orange/40 hover:bg-neo-light/95 shadow-sm hover:shadow active:scale-100 cursor-pointer mb-2"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-colors shrink-0 ${
          t.type === TransactionType.INCOME ? 'bg-neo-light/80 text-neo-dark/70 border border-neo-dark/10' : 'bg-orange-50 text-orange-505 border border-orange-100/50'
        }`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-[15px] font-semibold text-neo-dark leading-tight mb-0.5 truncate">{t.description || categoryObj?.name}</div>
          <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-1.5 font-medium">
            <span className="font-mono tracking-tight text-neutral-500">{format(parseISO(t.date), 'HH:mm')}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0"></span>
            <span className="truncate">{categoryObj?.name}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0"></span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${t.status === TransactionStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
              {t.status === TransactionStatus.COMPLETED ? 'Đã duyệt' : 'Chờ xử lý'}
            </span>
            {t.isRecurring && t.recurringPeriod && t.recurringPeriod !== 'none' && (
               <>
                 <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0"></span>
                 <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-50 text-neutral-600 border border-neutral-100">
                   <LucideIcons.Repeat className="w-2.5 h-2.5" />
                   {t.recurringPeriod === 'daily' ? 'Hàng ngày' : t.recurringPeriod === 'weekly' ? 'Hàng tuần' : t.recurringPeriod === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                 </span>
               </>
            )}
            {t.promoCode && (
               <>
                 <span className="w-1 h-1 rounded-full bg-neutral-300 shrink-0"></span>
                 <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">
                   <LucideIcons.Tag className="w-2.5 h-2.5 text-purple-500" />
                   {t.promoCode}
                 </span>
               </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end mt-3 sm:mt-0 pl-14 sm:pl-0 gap-3 border-t border-neutral-100/60 pt-2.5 sm:pt-0 sm:border-t-0">
        <div className={`text-base font-bold font-mono tracking-tight text-right ${
          t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-orange-500'
        }`}>
          {t.type === TransactionType.INCOME ? '+' : '-'}{formatMoney(t.amount)}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const catName = categoryObj?.name || 'Khác';
              const sign = t.type === TransactionType.INCOME ? '+' : '-';
              const text = `Giao dịch: ${t.description || catName}\nSố tiền: ${sign}${formatMoney(t.amount)}\nThời gian: ${format(parseISO(t.date), 'HH:mm dd/MM/yyyy')}\nDanh mục: ${catName}`;
              
              if (navigator.share) {
                navigator.share({
                  title: 'Chi tiết giao dịch',
                  text: text,
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(text).then(() => {
                  alert('Đã sao chép vào clipboard!');
                }).catch(console.error);
              }
            }}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/60 rounded-full transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-95"
            title="Chia sẻ"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onDeleteRequest && (
            <button
              id={`delete-btn-${t.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(t.id);
              }}
              className="delete-transaction-btn p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-95 flex-shrink-0"
              title="Xóa giao dịch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default memo(function TransactionList({ transactions, onDelete, hideHeaderActions, reducedMotion }: TransactionListProps) {
  const { formatMoney } = useCurrency();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500" />;
    return sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-neutral-900" /> : <ArrowUp className="w-3 h-3 text-neutral-900" />;
  };

  // Processed (filtered and sorted) transactions
  const sortedTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      // 1. Search Query
      if (searchQuery) {
        const catName = DEFAULT_CATEGORIES.find(c => c.id === t.category)?.name || '';
        const searchLower = searchQuery.toLowerCase();
        if (!t.description?.toLowerCase().includes(searchLower) && !catName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // 2. Type Filter
      if (filterType !== 'ALL' && t.type !== filterType) return false;
      
      // 3. Category Filter
      if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;

      // 4. Date Filter
      if (filterStartDate) {
         if (new Date(t.date) < new Date(filterStartDate)) return false;
      }
      if (filterEndDate) {
         const end = new Date(filterEndDate);
         end.setHours(23, 59, 59, 999);
         if (new Date(t.date) > end) return false;
      }
      
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        const catA = DEFAULT_CATEGORIES.find(c => c.id === a.category)?.name || '';
        const catB = DEFAULT_CATEGORIES.find(c => c.id === b.category)?.name || '';
        comparison = catA.localeCompare(catB);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortField, sortDirection, searchQuery, filterType, filterCategory, filterStartDate, filterEndDate]);

  // Total pages based on exactly 10 transactions per page
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  // Group by day ONLY for all transactions to calculate true totalIncome/totalExpense per day
  const dailyTotals = useMemo(() => {
    if (sortField !== 'date') return {};
    
    const totals: Record<string, { totalIncome: number, totalExpense: number }> = {};
    sortedTransactions.forEach(t => {
      const date = parseISO(t.date);
      const dayLabel = format(date, 'dd/MM/yyyy');
      if (!totals[dayLabel]) {
        totals[dayLabel] = { totalIncome: 0, totalExpense: 0 };
      }
      if (t.type === TransactionType.INCOME) {
        totals[dayLabel].totalIncome += t.amount;
      } else {
        totals[dayLabel].totalExpense += t.amount;
      }
    });
    return totals;
  }, [sortedTransactions, sortField]);

  // Get exactly 10 transactions for the current page
  const paginatedTransactions = useMemo(() => {
    return sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Group paginated transactions by day
  const groupedPaginatedTransactions = useMemo(() => {
    if (sortField !== 'date') return null;

    const groups: { dayLabel: string, dayOfWeek: string, date: Date, items: typeof sortedTransactions, totalIncome: number, totalExpense: number }[] = [];

    paginatedTransactions.forEach(t => {
      const date = parseISO(t.date);
      const dayLabel = format(date, 'dd/MM/yyyy');
      const dayOfWeek = format(date, 'EEEE', { locale: vi });

      let existing = groups.find(g => g.dayLabel === dayLabel);
      if (!existing) {
        existing = { 
          dayLabel, 
          dayOfWeek, 
          date, 
          items: [], 
          totalIncome: dailyTotals[dayLabel]?.totalIncome || 0, 
          totalExpense: dailyTotals[dayLabel]?.totalExpense || 0 
        };
        groups.push(existing);
      }
      
      existing.items.push(t);
    });

    return groups;
  }, [paginatedTransactions, sortField, dailyTotals]);

  return (
    <div className="card p-8">
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-neutral-100"
          >
             <div className="flex justify-center mb-4 text-rose-500 bg-rose-50 w-14 h-14 rounded-full items-center mx-auto">
               <AlertTriangle className="w-7 h-7" />
             </div>
             <h3 className="text-lg font-bold text-neutral-850 text-center mb-2">Xác nhận xóa?</h3>
             <p className="text-sm text-neutral-500 text-center mb-6">Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.</p>
             <div className="flex gap-3">
               <button id="cancel-delete-transaction-btn" onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-3xl font-bold hover:bg-neutral-200 text-neutral-700 transition-colors">Hủy</button>
               <button id="confirm-delete-transaction-btn" onClick={() => { onDelete?.(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-3xl font-bold hover:bg-rose-700 transition-colors">Xác nhận Xóa</button>
             </div>
          </motion.div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
           <h3 className="text-xl font-semibold text-neo-dark tracking-tight">Lịch sử giao dịch</h3>
           <p className="text-sm text-neo-dark/60 mt-1">Biến động thu chi theo ngày</p>
        </div>
        {!hideHeaderActions && (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-neo-dark/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm giao dịch..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-neo-light border border-neo-dark/20 text-neo-dark rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-orange/20 focus:border-neo-orange transition-all w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors border ${showFilters || filterType !== 'ALL' || filterCategory !== 'ALL' || filterStartDate || filterEndDate ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && !hideHeaderActions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-neutral-50 rounded-3xl p-4 mb-6 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-700">Bộ lọc & Sắp xếp</h4>
                <button 
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterCategory('ALL');
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                >
                  Xóa bộ lọc
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Loại giao dịch</label>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value={TransactionType.INCOME}>Thu nhập</option>
                    <option value={TransactionType.EXPENSE}>Chi tiêu</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Danh mục</label>
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="ALL">Tất cả</option>
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Từ ngày</label>
                  <input 
                    type="date" 
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Đến ngày</label>
                  <input 
                    type="date" 
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar border-t border-neutral-200">
                <span className="text-sm font-semibold text-neutral-700 mr-2 whitespace-nowrap">Sắp xếp theo:</span>
                <button 
                  onClick={() => handleSort('date')}
                  className={`group flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-3xl border text-xs font-semibold transition-all ${sortField === 'date' ? 'bg-white border-neutral-300 text-neutral-900 shadow-sm' : 'border-transparent text-neutral-500 hover:bg-white hover:border-neutral-200'}`}
                >
                  Ngày <SortIcon field="date" />
                </button>
                <button 
                  onClick={() => handleSort('amount')}
                  className={`group flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-3xl border text-xs font-semibold transition-all ${sortField === 'amount' ? 'bg-white border-neutral-300 text-neutral-900 shadow-sm' : 'border-transparent text-neutral-500 hover:bg-white hover:border-neutral-200'}`}
                >
                  Số tiền <SortIcon field="amount" />
                </button>
                <button 
                  onClick={() => handleSort('category')}
                  className={`group flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-3xl border text-xs font-semibold transition-all ${sortField === 'category' ? 'bg-white border-neutral-300 text-neutral-900 shadow-sm' : 'border-transparent text-neutral-500 hover:bg-white hover:border-neutral-200'}`}
                >
                  Danh mục <SortIcon field="category" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {sortedTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-400 font-display italic">Chưa có giao dịch nào được ghi lại.</p>
            </div>
          ) : (
            <>
              {groupedPaginatedTransactions ? (
                groupedPaginatedTransactions.map((group, gIdx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${group.dayLabel}-${currentPage}`}
                    className="mb-8 last:mb-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 mb-4 bg-neutral-50/60 hover:bg-neutral-50/80 rounded-3xl px-4 border border-neutral-100 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-neutral-200/50 shadow-sm shrink-0">
                          <span className="text-base font-bold text-neutral-900 leading-none">{format(group.date, 'dd')}</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1">Thg {format(group.date, 'M')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-800 capitalize leading-snug">
                            {group.dayOfWeek}
                          </span>
                          <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                            {format(group.date, 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 sm:mt-0 justify-between sm:justify-end pl-15 sm:pl-0 border-t border-dashed border-neutral-200/60 pt-2.5 sm:pt-0 sm:border-t-0">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col text-left sm:text-right">
                            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Tổng Thu</span>
                            <span className="text-[13px] font-mono font-bold tracking-tight text-emerald-600 block mt-0.5">
                              +{formatMoney(group.totalIncome)}
                            </span>
                          </div>
                          
                          <div className="flex flex-col text-left sm:text-right">
                            <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider">Tổng Chi</span>
                            <span className="text-[13px] font-mono font-bold tracking-tight text-orange-500 block mt-0.5">
                              -{formatMoney(group.totalExpense)}
                            </span>
                          </div>
                        </div>

                        <div className="w-px h-6 bg-neutral-200 hidden sm:block"></div>

                        <div className="flex flex-col text-right">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Tính ngày</span>
                          <span className={`text-[13px] font-mono font-extrabold tracking-tight block mt-0.5 ${
                            (group.totalIncome - group.totalExpense) < 0 ? 'text-orange-600' : 'text-emerald-600'
                          }`}>
                            {(group.totalIncome - group.totalExpense) > 0 ? '+' : ''}{formatMoney(group.totalIncome - group.totalExpense)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((t, idx) => (
                        <TransactionItem 
                            key={t.id} 
                            t={t} 
                            idx={idx} 
                            onDeleteRequest={onDelete ? (id) => setConfirmDeleteId(id) : undefined}
                            formatMoney={formatMoney} 
                            reducedMotion={reducedMotion}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="space-y-1">
                  {paginatedTransactions.map((t, idx) => (
                    <TransactionItem 
                        key={t.id} 
                        t={t} 
                        idx={idx} 
                        onDeleteRequest={onDelete ? (id) => setConfirmDeleteId(id) : undefined}
                        formatMoney={formatMoney} 
                        reducedMotion={reducedMotion}
                    />
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4 border-t border-neutral-100">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-bold text-neutral-600 bg-neutral-50 rounded-3xl hover:bg-neutral-100 disabled:opacity-50 active:scale-95 transition-all disabled:active:scale-100"
                    >Trước</button>
                    <span className="text-sm font-medium text-neutral-400">Trang {currentPage} / {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-bold text-neutral-600 bg-neutral-50 rounded-3xl hover:bg-neutral-100 disabled:opacity-50 active:scale-95 transition-all disabled:active:scale-100"
                    >Sau</button>
                </div>
              )}
            </>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
});

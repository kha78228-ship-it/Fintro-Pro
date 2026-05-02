import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import * as LucideIcons from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowUpDown, ArrowDown, ArrowUp, CalendarDays, Trash2, Share2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  hideHeaderActions?: boolean;
}

type SortField = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

export default function TransactionList({ transactions, onDelete, hideHeaderActions }: TransactionListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500" />;
    return sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-neutral-900" /> : <ArrowUp className="w-3 h-3 text-neutral-900" />;
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
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
  }, [transactions, sortField, sortDirection]);

  // Group by day if sorted by date
  const groupedTransactions = useMemo(() => {
    if (sortField !== 'date') return null;

    const groups: { dayLabel: string, dayOfWeek: string, date: Date, items: typeof sortedTransactions, totalIncome: number, totalExpense: number }[] = [];

    sortedTransactions.forEach(t => {
      const date = parseISO(t.date);
      const dayLabel = format(date, 'dd/MM/yyyy');
      const dayOfWeek = format(date, 'EEEE', { locale: vi });

      let existing = groups.find(g => g.dayLabel === dayLabel);
      if (!existing) {
        existing = { dayLabel, dayOfWeek, date, items: [], totalIncome: 0, totalExpense: 0 };
        groups.push(existing);
      }
      
      existing.items.push(t);
      if (t.type === TransactionType.INCOME) {
        existing.totalIncome += t.amount;
      } else {
        existing.totalExpense += t.amount;
      }
    });

    return groups;
  }, [sortedTransactions, sortField]);

  const renderTransaction = (t: Transaction, idx: number) => {
    const categoryObj = DEFAULT_CATEGORIES.find(c => c.id === t.category);
    const IconComponent = (LucideIcons as any)[categoryObj?.icon || 'HelpCircle'] || LucideIcons.HelpCircle;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        key={t.id} 
        className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-neutral-50/80 rounded-2xl transition-all duration-300 relative bg-white border border-transparent hover:border-neutral-100/60"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-colors shrink-0 ${
            t.type === TransactionType.INCOME ? 'bg-green-50/50 text-green-600' : 'bg-neutral-50 text-neutral-600 border border-neutral-100/50'
          }`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="text-[15px] font-semibold text-neutral-900 leading-tight mb-0.5">{t.description || categoryObj?.name}</div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
              <span className="font-mono tracking-tight text-neutral-500">{format(parseISO(t.date), 'HH:mm')}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-neutral-300"></span>
              <span className="truncate">{categoryObj?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end mt-1 sm:mt-0 pl-14 sm:pl-0 gap-3">
          <div className={`text-base font-bold font-mono tracking-tight text-right ${
            t.type === TransactionType.INCOME ? 'text-green-600' : 'text-neutral-900'
          }`}>
            {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}đ
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const catName = categoryObj?.name || 'Khác';
              const sign = t.type === TransactionType.INCOME ? '+' : '-';
              const text = `Giao dịch: ${t.description || catName}\nSố tiền: ${sign}${t.amount.toLocaleString()}đ\nThời gian: ${format(parseISO(t.date), 'HH:mm dd/MM/yyyy')}\nDanh mục: ${catName}`;
              
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
            className="p-1.5 text-neutral-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Chia sẻ"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onDelete && (
            confirmDeleteId === t.id ? (
              <div className="flex items-center gap-1 opacity-100 bg-red-50 p-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs font-semibold text-red-600 px-1">Xóa?</span>
                <button
                  onClick={() => { onDelete(t.id); setConfirmDeleteId(null); }}
                  className="p-1 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(t.id);
                }}
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Xóa giao dịch"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="card p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
           <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">Lịch sử giao dịch</h3>
           <p className="text-sm text-neutral-400 mt-1">Biến động thu chi theo ngày</p>
        </div>
        {!hideHeaderActions && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <button 
              onClick={() => handleSort('date')}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${sortField === 'date' ? 'bg-neutral-50 border-neutral-200 text-neutral-900' : 'border-transparent text-neutral-500 hover:bg-neutral-50'}`}
            >
              Ngày <SortIcon field="date" />
            </button>
            <button 
              onClick={() => handleSort('amount')}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${sortField === 'amount' ? 'bg-neutral-50 border-neutral-200 text-neutral-900' : 'border-transparent text-neutral-500 hover:bg-neutral-50'}`}
            >
              Số tiền <SortIcon field="amount" />
            </button>
            <button 
              onClick={() => handleSort('category')}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${sortField === 'category' ? 'bg-neutral-50 border-neutral-200 text-neutral-900' : 'border-transparent text-neutral-500 hover:bg-neutral-50'}`}
            >
              Danh mục <SortIcon field="category" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {sortedTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-400 font-display italic">Chưa có giao dịch nào được ghi lại.</p>
            </div>
          ) : (
            <>
              {groupedTransactions ? (
                groupedTransactions.map((group, gIdx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={group.dayLabel} 
                    className="mb-8 last:mb-0"
                  >
                    <div className="flex items-center justify-between py-2 mb-3">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                           <span className="text-xl font-bold text-neutral-900 leading-none mb-1">{format(group.date, 'dd')}</span>
                           <span className="text-[11px] font-medium text-neutral-500 leading-none">{format(group.date, 'yyyy')}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <div className="text-xs font-medium text-neutral-500 flex items-center gap-3">
                               <span className="w-6">Thu</span>
                               <span className="text-neutral-700 font-mono tracking-tight">{group.totalIncome.toLocaleString()}đ</span>
                            </div>
                            <div className="text-xs font-medium text-neutral-500 flex items-center gap-3">
                               <span className="w-6">Chi</span>
                               <span className="text-neutral-700 font-mono tracking-tight">{group.totalExpense.toLocaleString()}đ</span>
                            </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-xs font-medium text-neutral-500 mb-0.5">Còn lại</div>
                         <div className={`text-sm font-mono font-bold tracking-tight ${
                           (group.totalIncome - group.totalExpense) < 0 ? 'text-[#ff4e42]' : 'text-[#0088cc]'
                         }`}>
                           {(group.totalIncome - group.totalExpense).toLocaleString()}đ
                         </div>
                       </div>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((t, idx) => renderTransaction(t, idx))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="space-y-1">
                  {sortedTransactions.map((t, idx) => renderTransaction(t, idx))}
                </div>
              )}
            </>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}

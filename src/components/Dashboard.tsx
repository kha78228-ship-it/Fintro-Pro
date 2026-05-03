import React from 'react';
import { Transaction, TransactionType } from '../types';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { ArrowDown, ArrowUp, Wallet, ArrowRight, ShieldCheck, Clock, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  setCurrentView: (view: any) => void;
}

export default function Dashboard({ transactions, onDeleteTransaction, setCurrentView }: DashboardProps) {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const weekStart = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const getExpenseTotal = (startDate: Date) => {
    return transactions
      .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startDate)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const todayExpense = getExpenseTotal(todayStart);
  const weekExpense = getExpenseTotal(weekStart);
  const monthExpense = getExpenseTotal(monthStart);
  const yearExpense = getExpenseTotal(yearStart);

  const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const totalGlobalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalGlobalExpense;

  return (
    <div className="space-y-6 pb-24">
      {/* Overview Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1c1e] text-white rounded-[3rem] p-8 pb-10 relative overflow-hidden shadow-2xl"
      >
        <ShieldCheck className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-48 text-white/[0.03] rotate-12" />
        
        <div className="flex items-center gap-2 mb-6 text-neutral-400">
          <Wallet className="w-5 h-5" />
          <h3 className="font-bold text-sm tracking-widest uppercase">Khả dụng</h3>
        </div>
        
        <div className="text-5xl sm:text-6xl font-display font-medium tracking-tight mb-4 text-white">
          {balance.toLocaleString()}đ
        </div>

        <div className="inline-block bg-white/10 rounded-full px-4 py-2 text-sm font-semibold text-neutral-200 mb-12">
          +12% vs tháng trước
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-[#1a1c1e] flex items-center justify-center text-xs font-bold text-neutral-300">U1</div>
             <div className="w-10 h-10 rounded-full bg-neutral-700 border-2 border-[#1a1c1e] flex items-center justify-center text-xs font-bold text-neutral-300">U2</div>
             <div className="w-10 h-10 rounded-full bg-neutral-600 border-2 border-[#1a1c1e] flex items-center justify-center text-xs font-bold text-neutral-300">U3</div>
          </div>
          <button onClick={() => setCurrentView('history')} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center backdrop-blur-sm">
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hôm nay */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center mb-6">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-2">Hôm nay</p>
          <p className="text-xl font-display font-bold text-neutral-900">{todayExpense.toLocaleString()}đ</p>
        </motion.div>

        {/* Tuần này */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mb-6">
            <TrendingDown className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-2">Tuần này</p>
          <p className="text-xl font-display font-bold text-neutral-900">{weekExpense.toLocaleString()}đ</p>
        </motion.div>

        {/* Tháng này */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
            <TrendingDown className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-2">Tháng này</p>
          <p className="text-xl font-display font-bold text-neutral-900">{monthExpense.toLocaleString()}đ</p>
        </motion.div>

        {/* Năm nay */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center mb-6">
            <TrendingDown className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-2">Năm nay</p>
          <p className="text-xl font-display font-bold text-neutral-900">{yearExpense.toLocaleString()}đ</p>
        </motion.div>
      </div>

      {/* Upcoming Transactions */}
      {transactions.filter(t => new Date(t.date) > new Date()).length > 0 && (
        <motion.div
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
           className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-neutral-100/50"
        >
          <h3 className="text-lg font-display font-bold text-neutral-900 mb-4">Sắp tới</h3>
          <div className="space-y-3">
            {transactions
              .filter(t => new Date(t.date) > new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 3)
              .map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${t.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                       <Clock className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-neutral-900">{t.description}</p>
                       <p className="text-xs text-neutral-500">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
                     </div>
                   </div>
                   <p className={`text-sm font-bold font-mono tracking-tight ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'}`}>
                     {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}đ
                   </p>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <div className="space-y-8 mt-8">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-display font-bold text-neutral-900">Giao dịch gần đây</h3>
           <button onClick={() => setCurrentView('history')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">Lịch sử đầy đủ <ArrowRight className="w-4 h-4" /></button>
        </div>
        <TransactionList 
          transactions={transactions.slice(0, 5)} 
          onDelete={onDeleteTransaction} 
        />
      </div>
    </div>
  );
}

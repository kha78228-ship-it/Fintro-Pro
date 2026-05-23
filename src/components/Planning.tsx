import React, { useState, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
const Budgets = lazy(() => import('./Budgets'));
const Goals = lazy(() => import('./Goals'));
const DebtTracker = lazy(() => import('./DebtTracker'));
const SubscriptionTracker = lazy(() => import('./SubscriptionTracker'));
import { Transaction } from '../types';

interface PlanningProps {
  transactions: Transaction[];
  reducedMotion?: boolean;
  appTheme?: "vintage" | "vietnam" | "pink_cute" | "google_material";
}

export default memo(function Planning({ transactions, reducedMotion, appTheme }: PlanningProps) {
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals' | 'debts' | 'subscriptions'>('budgets');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap bg-white/50 backdrop-blur border border-neutral-200/50 p-1.5 rounded-[2rem] w-fit mx-auto sm:mx-0 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-6 py-2.5 rounded-3xl text-sm font-bold transition-all ${activeTab === 'budgets' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-800'}`}
        >
          Ngân sách
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-2.5 rounded-3xl text-sm font-bold transition-all ${activeTab === 'goals' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-800'}`}
        >
          Mục tiêu
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-6 py-2.5 rounded-3xl text-sm font-bold transition-all ${activeTab === 'debts' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-800'}`}
        >
          Nợ & Vay
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-2.5 rounded-3xl text-sm font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-800'}`}
        >
          Đăng ký
        </button>
      </div>

      <div className="relative">
        <Suspense fallback={<div className="min-h-40 flex items-center justify-center text-sm font-bold text-neutral-400">Đang tải...</div>}>
          <AnimatePresence mode="wait">
            {activeTab === 'budgets' && (
              <motion.div
                key="budgets"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Budgets transactions={transactions} reducedMotion={reducedMotion} />
              </motion.div>
            )}
            {activeTab === 'goals' && (
              <motion.div
                key="goals"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Goals appTheme={appTheme} />
              </motion.div>
            )}
            {activeTab === 'debts' && (
              <motion.div
                key="debts"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DebtTracker />
              </motion.div>
            )}
            {activeTab === 'subscriptions' && (
              <motion.div
                key="subscriptions"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SubscriptionTracker />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  );
});

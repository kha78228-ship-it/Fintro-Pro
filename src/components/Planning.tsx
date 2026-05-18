import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Budgets from './Budgets';
import Goals from './Goals';
import { Transaction } from '../types';

interface PlanningProps {
  transactions: Transaction[];
}

export default function Planning({ transactions }: PlanningProps) {
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');

  return (
    <div className="space-y-6">
      <div className="flex bg-white/50 backdrop-blur border border-neutral-200/50 p-1 rounded-3xl w-fit mx-auto sm:mx-0 shadow-sm">
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
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'budgets' ? (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Budgets transactions={transactions} />
            </motion.div>
          ) : (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Goals />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

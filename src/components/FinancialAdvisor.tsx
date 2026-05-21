import React, { useMemo } from 'react';
import { Transaction, TransactionType, Budget } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { Sparkles, TrendingUp, TrendingDown, Info, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useCurrency } from '../lib/CurrencyContext';

interface FinancialAdvisorProps {
  transactions: Transaction[];
  budgets?: Budget[];
}

export default function FinancialAdvisor({ transactions, budgets = [] }: FinancialAdvisorProps) {
  const { formatMoney } = useCurrency();

  const insights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; title: string; message: string; icon: any }[] = [];

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    // Insight 1: Saving Rate
    if (savingRate > 20) {
      list.push({
        type: 'success',
        icon: ShieldCheck,
        title: 'Tích lũy tuyệt vời',
        message: `Bạn đang tiết kiệm được ${savingRate.toFixed(1)}% thu nhập. Mức lý tưởng là trên 20%. Hãy tiếp tục phong độ này!`
      });
    } else if (savingRate > 0) {
      list.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Cần nỗ lực tiết kiệm',
        message: `Tỷ lệ tiết kiệm hiện tại là ${savingRate.toFixed(1)}%. Hãy thử quy tắc 50/30/20 để tăng tích lũy lên 20% nhé.`
      });
    } else if (income > 0) {
      list.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Chi tiêu vượt thu nhập',
        message: 'Tháng này bạn đang chi tiêu nhiều hơn số tiền kiếm được. Hãy xem lại các khoản chi không cần thiết.'
      });
    }

    // Insight 2: Top Category
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    const topCatId = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topCatId) {
      const topCat = DEFAULT_CATEGORIES.find(c => c.id === topCatId);
      const topAmount = catTotals[topCatId];
      const percentage = (topAmount / expense) * 100;

      if (percentage > 30) {
        list.push({
          type: 'warning',
          icon: Info,
          title: `Tập trung vào ${topCat?.name}`,
          message: `Khoản chi cho ${topCat?.name} chiếm tới ${percentage.toFixed(0)}% tổng chi tiêu (${formatMoney(topAmount)}). Bạn có thể cắt giảm khoản này không?`
        });
      }
    }

    // Insight 3: Budget Adherence
    if (budgets.length > 0) {
      const overBudgets = budgets.filter(b => {
        const spent = transactions
          .filter(t => t.category === b.categoryId && t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0);
        return spent > b.amount;
      });

      if (overBudgets.length > 0) {
        list.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Vượt định mức ngân sách',
          message: `Bạn đã chi vượt hạn mức ở ${overBudgets.length} danh mục. Hãy cân đối lại chi tiêu cho những ngày còn lại.`
        });
      } else {
         list.push({
          type: 'success',
          icon: ShieldCheck,
          title: 'Quản lý ngân sách tốt',
          message: 'Tất cả các khoản chi tiêu đều đang nằm trong tầm kiểm soát của bạn. Rất kỷ luật!'
        });
      }
    }

    return list;
  }, [transactions, budgets, formatMoney]);

  return (
    <div className="space-y-6 mt-12 pt-12 border-t border-neutral-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-neutral-900 text-white rounded-2xl shadow-xl">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900 font-display">Cố vấn Tài chính AI</h3>
          <p className="text-sm text-neutral-500">Phân tích dữ liệu & gợi ý thông minh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex gap-4 items-start hover:-translate-y-1 transition-all"
            >
              <div className={`p-3 rounded-2xl shrink-0 ${
                insight.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                insight.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-neutral-500 leading-relaxed font-medium">{insight.message}</p>
              </div>
            </motion.div>
          );
        })}

        {insights.length === 0 && (
          <div className="col-span-full py-12 text-center bg-neutral-50/50 rounded-[2rem] border border-dashed border-neutral-200">
            <Info className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-400 font-medium">Cần thêm dữ liệu giao dịch để AI đưa ra lời khuyên hữu ích.</p>
          </div>
        )}
      </div>

      <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <TrendingUp className="w-32 h-32" />
         </div>
         <div className="relative z-10 max-w-xl">
           <h4 className="text-2xl font-bold mb-3 font-display">Lời khuyên hôm nay</h4>
           <p className="text-neutral-400 font-medium leading-relaxed mb-6">
             "Đừng tiết kiệm những gì còn lại sau khi chi tiêu, hãy chi tiêu những gì còn lại sau khi tiết kiệm." – Warren Buffett. 
             Hãy thiết lập một khoản tiết kiệm tự động ngay khi nhận lương để đảm bảo tương lai tài chính của bạn.
           </p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                 <Heart className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-sm font-bold text-neutral-300 uppercase tracking-widest">Happy Spending!</span>
           </div>
         </div>
      </div>
    </div>
  );
}

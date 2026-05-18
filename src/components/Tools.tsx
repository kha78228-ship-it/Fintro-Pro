import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Lightbulb, PieChart, ShieldCheck, Target, TrendingUp, Percent, Banknote, Heart } from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';

interface ToolsProps {
  setCurrentView?: (view: any) => void;
  appMode?: string;
}

export default function Tools({ setCurrentView, appMode = 'finance' }: ToolsProps) {
  const { formatMoney, currency, currencySymbol } = useCurrency();
  const [income, setIncome] = useState<string>('');
  
  // Lãi kép
  const [principal, setPrincipal] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [years, setYears] = useState<string>('');

  // Khoản vay
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanRate, setLoanRate] = useState<string>('');
  const [loanMonths, setLoanMonths] = useState<string>('');

  const parsedIncome = parseFloat(income) || 0;
  const needs = parsedIncome * 0.5;
  const wants = parsedIncome * 0.3;
  const savings = parsedIncome * 0.2;

  const parsedPrincipal = parseFloat(principal) || 0;
  const parsedRate = parseFloat(rate) || 0;
  const parsedYears = parseInt(years) || 0;
  const compoundResult = parsedPrincipal * Math.pow(1 + (parsedRate / 100), parsedYears);

  const parsedLoanAmt = parseFloat(loanAmount) || 0;
  const parsedLoanRate = parseFloat(loanRate) || 0;
  const parsedLoanMonths = parseInt(loanMonths) || 0;

  // Tính khoản vay: monthly payment = P * r * (1 + r)^n / ((1 + r)^n - 1)
  let monthlyPayment = 0;
  let totalPayment = 0;
  if (parsedLoanAmt > 0 && parsedLoanRate > 0 && parsedLoanMonths > 0) {
    const r = parsedLoanRate / 100 / 12;
    const n = parsedLoanMonths;
    monthlyPayment = parsedLoanAmt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    totalPayment = monthlyPayment * n;
  }

  const TIPS = [
    {
      icon: ShieldCheck,
      title: 'Quỹ khẩn cấp',
      desc: 'Nên chuẩn bị một khoản tiền bằng 3-6 tháng chi phí sinh hoạt cơ bản để phòng ngừa rủi ro.',
      color: 'bg-neo-bg text-neo-dark border border-neo-dark/20'
    },
    {
      icon: TrendingUp,
      title: 'Quy tắc 72',
      desc: 'Lấy 72 chia cho tỷ suất lợi nhuận để biết mất bao lâu tài sản nhân đôi (VD: Lãi 8%/năm -> 9 năm).',
      color: 'bg-neo-bg text-neo-dark border border-neo-dark/20'
    },
    {
      icon: Target,
      title: 'Hiệu ứng hòn tuyết lăn',
      desc: 'Khi trả nợ, ưu tiên trả món nhỏ nhất trước để tạo động lực, sau đó đến các khoản lớn hơn.',
      color: 'bg-neo-orange/10 text-neo-orange border border-neo-orange/20'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neo-dark tracking-tight">Công cụ & Gợi ý</h2>
          <p className="text-neo-dark/70 mt-1">Các tiện ích hỗ trợ quản lý tài chính thông minh.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Báo cáo tài chính */}
        {appMode === 'finance' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 flex items-center justify-between shadow-sm border border-neutral-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setCurrentView && setCurrentView('reports')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 border border-indigo-100">
                <PieChart className="w-7 h-7 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-neo-dark">Báo Cáo Tài Chính</h3>
                <p className="text-neo-dark/70 text-sm mt-1">Phân tích chuyên sâu dòng tiền của bạn.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Lịch dâu chị em */}
        {appMode === 'love' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-2 bg-white rounded-3xl p-6 flex items-center justify-between shadow-sm border border-pink-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setCurrentView && setCurrentView('cycle')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center shrink-0 border border-rose-100">
                <Heart className="w-7 h-7 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-neo-dark">Lịch Dâu Chị Em</h3>
                <p className="text-neo-dark/70 text-sm mt-1">Theo dõi chu kỳ kinh nguyệt an toàn & riêng tư.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* 50/30/20 Calculator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-neo-dark rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-3xl">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Máy Tính 50/30/20</h3>
                <p className="text-sm text-neo-dark/70">Phân bổ thu nhập tự động</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Nhập tổng thu nhập ({currency})</label>
                <div className="relative">
                  <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="number"
                    placeholder="Ví dụ: 20000000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-4 pl-12 text-lg focus:ring-2 focus:ring-purple-200 transition-all font-mono font-medium text-neo-dark placeholder-neutral-400"
                  />
                </div>
              </div>

              {parsedIncome > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100"
                >
                  <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50">
                    <div className="text-xs font-bold text-indigo-600/70 uppercase mb-2">50% Nhu cầu</div>
                    <div className="font-mono font-bold text-base md:text-lg text-indigo-700">{formatMoney(needs, 0)}</div>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50">
                    <div className="text-xs font-bold text-rose-600/70 uppercase mb-2">30% Mong muốn</div>
                    <div className="font-mono font-bold text-base md:text-lg text-rose-600">{formatMoney(wants, 0)}</div>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
                    <div className="text-xs font-bold text-emerald-600/70 uppercase mb-2">20% Tích lũy</div>
                    <div className="font-mono font-bold text-base md:text-lg text-emerald-700">{formatMoney(savings, 0)}</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

        </div>

        <div className="space-y-8">
          {/* Compound Interest Calculator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-3xl">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Tính Lãi Kép</h3>
                <p className="text-sm text-neo-dark/70">Sức mạnh của thời gian</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Vốn ban đầu ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 50000000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Lãi/Năm (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 8"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số Năm</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-emerald-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedPrincipal > 0 && parsedRate > 0 && parsedYears > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Tổng tiền nhận được:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-emerald-600">{formatMoney(compoundResult, 0)}</span>
                  <div className="text-xs text-neo-dark/60 mt-2">
                    Lợi nhuận: <span className="font-bold text-emerald-500">{formatMoney(compoundResult - parsedPrincipal, 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Loan Calculator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-3xl">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Tính Trả Góp</h3>
                <p className="text-sm text-neo-dark/70">Tính số tiền trả mỗi tháng (cố định)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số Tiền Vay ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 1000000000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-blue-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Lãi/Năm (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-blue-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số Tháng Vay</label>
                  <input 
                    type="number"
                    placeholder="VD: 120"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-blue-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedLoanAmt > 0 && parsedLoanRate > 0 && parsedLoanMonths > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Phải trả mỗi tháng:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-blue-600">{formatMoney(monthlyPayment, 0)}</span>
                  <div className="text-xs text-neo-dark/60 mt-2">
                    Tổng lãi phải trả: <span className="font-bold text-blue-500">{formatMoney(totalPayment - parsedLoanAmt, 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-6 ml-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-neo-dark">Gợi ý quản lý tài chính</h3>
            </div>

            {TIPS.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="bg-white border border-neutral-200 rounded-3xl p-6 flex gap-5 items-start hover:-translate-y-1 transition-transform shadow-sm"
                >
                  <div className={`p-4 rounded-full flex-shrink-0 ${tip.color.replace('neo-dark', 'blue-500').replace('neo-orange', 'amber-500').replace('bg-neo-bg', 'bg-blue-50 border-blue-100/50').replace('bg-neo-orange/10', 'bg-amber-50 border-amber-100/50')}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neo-dark mb-1">{tip.title}</h4>
                    <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">{tip.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

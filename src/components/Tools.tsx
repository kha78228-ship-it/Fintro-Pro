import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Lightbulb, PieChart, ShieldCheck, Target, TrendingUp, Percent, Banknote, Heart } from 'lucide-react';

interface ToolsProps {
  setCurrentView?: (view: any) => void;
}

export default function Tools({ setCurrentView }: ToolsProps) {
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
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: TrendingUp,
      title: 'Quy tắc 72',
      desc: 'Lấy 72 chia cho tỷ suất lợi nhuận để biết mất bao lâu tài sản nhân đôi (VD: Lãi 8%/năm -> 9 năm).',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Target,
      title: 'Hiệu ứng hòn tuyết lăn',
      desc: 'Khi trả nợ, ưu tiên trả món nhỏ nhất trước để tạo động lực, sau đó đến các khoản lớn hơn.',
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Công cụ & Gợi ý</h2>
          <p className="text-neutral-500 mt-1">Các tiện ích hỗ trợ quản lý tài chính thông minh.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg shadow-rose-500/20 text-white cursor-pointer hover:scale-[1.02] transition-transform"
        onClick={() => setCurrentView && setCurrentView('cycle')}
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Heart className="w-8 h-8 text-white fill-white/50" />
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display">Lịch Phụ Nữ</h3>
            <p className="text-rose-100 mt-1">Theo dõi chu kỳ kinh nguyệt và sức khỏe sinh sản an toàn, riêng tư.</p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="px-6 py-3 bg-white text-rose-600 rounded-full font-bold">Khám phá ngay</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* 50/30/20 Calculator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 text-white rounded-[2rem] p-8 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Máy Tính 50/30/20</h3>
                <p className="text-sm text-neutral-400">Phân bổ thu nhập tự động</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Nhập tổng thu nhập (VNĐ)</label>
                <div className="relative">
                  <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input 
                    type="number"
                    placeholder="Ví dụ: 20000000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-lg focus:ring-2 focus:ring-white/20 transition-all font-mono font-medium text-white placeholder-neutral-600"
                  />
                </div>
              </div>

              {parsedIncome > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10"
                >
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold text-neutral-400 uppercase mb-2">50% Nhu cầu</div>
                    <div className="font-mono font-bold text-base md:text-lg text-emerald-400">{needs.toLocaleString()}đ</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold text-neutral-400 uppercase mb-2">30% Mong muốn</div>
                    <div className="font-mono font-bold text-base md:text-lg text-amber-400">{wants.toLocaleString()}đ</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-xs font-bold text-neutral-400 uppercase mb-2">20% Tích lũy</div>
                    <div className="font-mono font-bold text-base md:text-lg text-indigo-400">{savings.toLocaleString()}đ</div>
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
            className="card p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-green-500 text-white rounded-2xl">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Tính Lãi Kép</h3>
                <p className="text-sm text-neutral-500">Sức mạnh của thời gian</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Vốn ban đầu (VNĐ)</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 50000000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-neutral-200 transition-all font-mono font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Lãi/Năm (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 8"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-neutral-200 transition-all font-mono font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Số Năm</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="w-full bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-neutral-200 transition-all font-mono font-medium"
                  />
                </div>
              </div>

              {parsedPrincipal > 0 && parsedRate > 0 && parsedYears > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neutral-500">Tổng tiền nhận được:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-green-600">{compoundResult.toLocaleString(undefined, { maximumFractionDigits: 0 })}đ</span>
                  <div className="text-xs text-neutral-400 mt-2">
                    Lợi nhuận: <span className="font-bold text-neutral-700">{(compoundResult - parsedPrincipal).toLocaleString(undefined, { maximumFractionDigits: 0 })}đ</span>
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
            className="bg-indigo-900 text-white rounded-[2rem] p-8 shadow-sm border border-indigo-800"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Tính Trả Góp</h3>
                <p className="text-sm text-indigo-300">Tính số tiền trả mỗi tháng (cố định)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Số Tiền Vay (VNĐ)</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 1000000000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-white/20 transition-all font-mono font-medium text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Lãi/Năm (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-white/20 transition-all font-mono font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Số Tháng Vay</label>
                  <input 
                    type="number"
                    placeholder="VD: 120"
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-white/20 transition-all font-mono font-medium text-white"
                  />
                </div>
              </div>

              {parsedLoanAmt > 0 && parsedLoanRate > 0 && parsedLoanMonths > 0 && (
                <div className="pt-4 border-t border-white/10 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-indigo-300">Phải trả mỗi tháng:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-white">{monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}đ</span>
                  <div className="text-xs text-indigo-300 mt-2">
                    Tổng lãi phải trả: <span className="font-bold text-white">{(totalPayment - parsedLoanAmt).toLocaleString(undefined, { maximumFractionDigits: 0 })}đ</span>
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
              <h3 className="text-xl font-bold text-neutral-900">Gợi ý quản lý tài chính</h3>
            </div>

            {TIPS.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="card p-6 flex gap-5 items-start hover:shadow-md transition-shadow"
                >
                  <div className={`p-4 rounded-2xl shrink-0 ${tip.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">{tip.title}</h4>
                    <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">{tip.desc}</p>
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

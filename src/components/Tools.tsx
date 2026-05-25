import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator, Lightbulb, PieChart, ShieldCheck, Target, TrendingUp, Percent, Banknote, Heart, LineChart, Users, ArrowRightLeft, AppWindow, Globe, ClipboardList, Layers } from 'lucide-react';
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

  // Tiết kiệm mục tiêu
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [goalYears, setGoalYears] = useState<string>('');
  const [goalRate, setGoalRate] = useState<string>('');

  const parsedGoalAmt = parseFloat(goalAmount) || 0;
  const parsedGoalYears = parseInt(goalYears) || 0;
  const parsedGoalRate = parseFloat(goalRate) || 0;

  let monthlySavingsNeeded = 0;
  if (parsedGoalAmt > 0 && parsedGoalYears > 0) {
    if (parsedGoalRate > 0) {
      const r = parsedGoalRate / 100 / 12;
      const n = parsedGoalYears * 12;
      monthlySavingsNeeded = parsedGoalAmt * (r / (Math.pow(1 + r, n) - 1));
    } else {
      monthlySavingsNeeded = parsedGoalAmt / (parsedGoalYears * 12);
    }
  }

  // Máy tính lạm phát
  const [infAmount, setInfAmount] = useState<string>('');
  const [infRate, setInfRate] = useState<string>('3.5');
  const [infYears, setInfYears] = useState<string>('');

  const parsedInfAmt = parseFloat(infAmount) || 0;
  const parsedInfRate = parseFloat(infRate) || 0;
  const parsedInfYears = parseInt(infYears) || 0;

  const futurePurchasingPower = parsedInfAmt / Math.pow(1 + (parsedInfRate / 100), parsedInfYears);
  const futureCost = parsedInfAmt * Math.pow(1 + (parsedInfRate / 100), parsedInfYears);

  // Chia tiền bill
  const [billAmount, setBillAmount] = useState<string>('');
  const [tipPercent, setTipPercent] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<string>('2');

  const parsedBill = parseFloat(billAmount) || 0;
  const parsedTip = parseFloat(tipPercent) || 0;
  const parsedPeople = parseInt(peopleCount) || 1;

  const totalTip = parsedBill * (parsedTip / 100);
  const totalBillWithTip = parsedBill + totalTip;
  const amountPerPerson = parsedPeople > 0 ? totalBillWithTip / parsedPeople : 0;

  // Quy đổi ngoại tệ
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>('VND');
  const [convertAmount, setConvertAmount] = useState<string>('1');

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error("Failed to fetch exchange rates", error);
      }
    };
    fetchRates();
  }, []);

  const parsedConvertAmount = parseFloat(convertAmount) || 0;
  let convertedResult = 0;
  if (exchangeRates[baseCurrency] && exchangeRates[targetCurrency] && parsedConvertAmount > 0) {
    const usdAmount = parsedConvertAmount / exchangeRates[baseCurrency];
    convertedResult = usdAmount * exchangeRates[targetCurrency];
  }

  // Tính ROI
  const [roiInvested, setRoiInvested] = useState<string>('');
  const [roiReturned, setRoiReturned] = useState<string>('');
  const [roiYears, setRoiYears] = useState<string>('');

  const parsedRoiInv = parseFloat(roiInvested) || 0;
  const parsedRoiRet = parseFloat(roiReturned) || 0;
  const parsedRoiYears = parseFloat(roiYears) || 0;

  let totalRoi = 0;
  let annualRoi = 0;
  
  if (parsedRoiInv > 0 && parsedRoiRet > 0) {
    totalRoi = ((parsedRoiRet - parsedRoiInv) / parsedRoiInv) * 100;
    if (parsedRoiYears > 0) {
      annualRoi = (Math.pow(parsedRoiRet / parsedRoiInv, 1 / parsedRoiYears) - 1) * 100;
    }
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
        {/* Google Workspace Hub */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-1 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl p-6 flex items-center justify-between shadow-sm border border-indigo-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setCurrentView && setCurrentView('google_workspace')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 border border-indigo-200">
              <Layers className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-neutral-900 flex items-center gap-2">
                Google Workspace Hub
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-indigo-600 bg-indigo-200/50 px-2 py-0.5 rounded-full border border-indigo-300">Premium</span>
              </h3>
              <p className="text-neutral-500 text-sm mt-1">Lịch Calendar, Soạn soạn thảo Docs & Ghi chú Keep.</p>
            </div>
          </div>
        </motion.div>

        {/* Sổ tay Google Tasks */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-1 bg-gradient-to-r from-blue-50 to-sky-50 rounded-3xl p-6 flex items-center justify-between shadow-sm border border-blue-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setCurrentView && setCurrentView('google_tasks')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0 border border-blue-200">
              <ClipboardList className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-neutral-900 flex items-center gap-2">
                Sổ tay Google Tasks
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-200/50 px-2 py-0.5 rounded-full border border-blue-300">Google</span>
              </h3>
              <p className="text-neutral-500 text-sm mt-1">Ghi nhớ & quản lý công việc đồng bộ hóa đám mây.</p>
            </div>
          </div>
        </motion.div>

        {/* Báo cáo tài chính */}
        {appMode === 'finance' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-1 bg-white rounded-3xl p-6 flex items-center justify-between shadow-sm border border-neutral-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
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

        {/* Đóng gói App Web Link */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="col-span-1 md:col-span-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-6 flex items-center justify-between shadow-sm border border-orange-200 text-neo-dark cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setCurrentView && setCurrentView('web_app_wrapper')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center shrink-0 border border-orange-200">
              <AppWindow className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-neutral-900 flex items-center gap-2">
                Đóng Gói Link Web
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-orange-600 bg-orange-200/50 px-2 py-0.5 rounded-full border border-orange-300">PWA</span>
              </h3>
              <p className="text-neutral-500 text-sm mt-1">Số hóa & đóng gói bất kỳ website nào thành bản App.</p>
            </div>
          </div>
        </motion.div>

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

          {/* Tiết kiệm mục tiêu */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-neo-dark rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-3xl">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Tính Mục Tiêu Tiết Kiệm</h3>
                <p className="text-sm text-neo-dark/70">Số tiền cần tiết kiệm mỗi tháng</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Mục tiêu ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 500000000"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-teal-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số năm</label>
                  <input 
                    type="number"
                    placeholder="VD: 5"
                    value={goalYears}
                    onChange={(e) => setGoalYears(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-teal-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Lãi suất (%/Năm)</label>
                  <input 
                    type="number"
                    placeholder="VD: 5"
                    value={goalRate}
                    onChange={(e) => setGoalRate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-teal-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedGoalAmt > 0 && parsedGoalYears > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Cần tiết kiệm mỗi tháng:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-teal-600">{formatMoney(monthlySavingsNeeded, 0)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Split Bill */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-neo-dark rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-3xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Chia Tiền Nhanh</h3>
                <p className="text-sm text-neo-dark/70">Chia hóa đơn & Tips</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Tổng hóa đơn ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 1500000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-orange-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Tip/VAT (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-orange-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số người</label>
                  <input 
                    type="number"
                    placeholder="VD: 4"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-orange-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedBill > 0 && parsedPeople > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Mỗi người trả:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-orange-600">{formatMoney(amountPerPerson, 0)}</span>
                  <div className="text-xs text-neo-dark/60 mt-2">
                    Tổng bill (gồm Tip): <span className="font-bold text-orange-500">{formatMoney(totalBillWithTip, 0)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quy đổi tiền tệ */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-neo-dark rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-3xl">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Quy Đổi Ngoại Tệ</h3>
                <p className="text-sm text-neo-dark/70">Tỷ giá cập nhật liên tục</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số lượng</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="VD: 100"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-amber-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Từ</label>
                  <select 
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-amber-200 text-neo-dark font-medium cursor-pointer"
                  >
                    {Object.keys(exchangeRates).length > 0 ? (
                      Object.keys(exchangeRates).map((curr) => (
                        <option key={`base-${curr}`} value={curr}>{curr}</option>
                      ))
                    ) : (
                      <option value="USD">USD</option>
                    )}
                  </select>
                </div>
                
                <div className="col-span-1 flex justify-center items-end pb-1">
                  <button 
                    onClick={() => {
                        setBaseCurrency(targetCurrency);
                        setTargetCurrency(baseCurrency);
                    }}
                    className="p-2 text-neutral-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Sang</label>
                  <select 
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-amber-200 text-neo-dark font-medium cursor-pointer"
                  >
                    {Object.keys(exchangeRates).length > 0 ? (
                      Object.keys(exchangeRates).map((curr) => (
                        <option key={`target-${curr}`} value={curr}>{curr}</option>
                      ))
                    ) : (
                      <option value="VND">VND</option>
                    )}
                  </select>
                </div>
              </div>

              {parsedConvertAmount > 0 && Object.keys(exchangeRates).length > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Kết quả:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-amber-600">
                    {convertedResult.toLocaleString(undefined, { maximumFractionDigits: 2 })} {targetCurrency}
                  </span>
                </div>
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

          {/* Máy tính lạm phát */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-red-50 text-red-600 rounded-3xl">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Máy Tính Lạm Phát</h3>
                <p className="text-sm text-neo-dark/70">Sự mất giá của tiền tệ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số tiền ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 1000000"
                  value={infAmount}
                  onChange={(e) => setInfAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-red-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Lạm phát/Năm (%)</label>
                  <input 
                    type="number"
                    placeholder="VD: 3.5"
                    value={infRate}
                    onChange={(e) => setInfRate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-red-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số năm</label>
                  <input 
                    type="number"
                    placeholder="VD: 10"
                    value={infYears}
                    onChange={(e) => setInfYears(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-red-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedInfAmt > 0 && parsedInfYears > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Sức mua thực tế còn lại:</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-red-600">{formatMoney(futurePurchasingPower, 0)}</span>
                  <div className="text-xs text-neo-dark/60 mt-2">
                    Món đồ giá <span className="font-bold">{formatMoney(parsedInfAmt, 0)}</span> hiện tại sẽ có giá <span className="font-bold text-red-500">{formatMoney(futureCost, 0)}</span>.
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tính ROI */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-3xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neo-dark">Hiệu Quả Đầu Tư (ROI)</h3>
                <p className="text-sm text-neo-dark/70">Đo lường tỷ suất lợi nhuận</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Vốn đầu tư ban đầu ({currency})</label>
                <input 
                  type="number"
                  placeholder="Ví dụ: 50000000"
                  value={roiInvested}
                  onChange={(e) => setRoiInvested(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-fuchsia-200 transition-all font-mono font-medium text-neo-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Thu về ({currency})</label>
                  <input 
                    type="number"
                    placeholder="VD: 60000000"
                    value={roiReturned}
                    onChange={(e) => setRoiReturned(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-fuchsia-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neo-dark/70 uppercase tracking-widest pl-1">Số năm</label>
                  <input 
                    type="number"
                    placeholder="VD: 1.5"
                    value={roiYears}
                    onChange={(e) => setRoiYears(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-3 text-sm focus:ring-2 focus:ring-fuchsia-200 transition-all font-mono font-medium text-neo-dark"
                  />
                </div>
              </div>

              {parsedRoiInv > 0 && parsedRoiRet > 0 && (
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-neo-dark/60">Tỷ suất lợi nhuận (ROI):</span>
                    <span className={`text-xl font-mono font-bold ${totalRoi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{totalRoi > 0 ? '+' : ''}{totalRoi.toFixed(2)}%</span>
                  </div>
                  {parsedRoiYears > 0 && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-50">
                      <span className="text-sm font-semibold text-neo-dark/60">Lợi nhuận gộp năm:</span>
                      <span className={`text-lg font-mono font-bold ${annualRoi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{annualRoi > 0 ? '+' : ''}{annualRoi.toFixed(2)}%</span>
                    </div>
                  )}
                  <div className="text-xs text-neo-dark/60 mt-3 text-right">
                    Lãi/Lỗ: <span className={`font-bold ${totalRoi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{totalRoi > 0 ? '+' : ''}{formatMoney(parsedRoiRet - parsedRoiInv, 0)}</span>
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

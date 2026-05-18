import React, { useMemo, useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, formatISO, startOfYear, getYear, getMonth, isSameYear, isSameMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Calendar as CalendarIcon, TrendingUp, TrendingDown, LayoutGrid, Download, Share2 } from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';

interface ReportsProps {
  transactions: Transaction[];
  chartPalette?: string;
}

type ReportView = 'monthly' | 'yearly';

export default function Reports({ transactions, chartPalette = 'default', setChartPalette }: ReportsProps & { setChartPalette?: (c: string) => void }) {
  const { formatMoney } = useCurrency();
  const [view, setView] = useState<ReportView>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [breakdownType, setBreakdownType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isExporting, setIsExporting] = useState(false);
  
  // Customization state
  const activePalette = chartPalette || 'default';
  const setActivePalette = setChartPalette || (() => {});
  const [overviewChartType, setOverviewChartType] = useState<'bar' | 'area'>('bar');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bao_cao_tai_chinh_${view === 'monthly' ? selectedYear : 'Tong_quat'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareReport = async () => {
    // Generate text summary based on either the selected year (if 'monthly') or all time (if 'yearly')
    const totalIncomeText = formatMoney(totalIncome);
    const totalExpenseText = formatMoney(totalExpense);
    const totalSavingsText = formatMoney(totalSavings);
    const timeframeText = view === 'monthly' ? `Năm ${selectedYear}` : 'Tất cả các năm';

    const summaryText = `Báo Cáo Tài Chính - ${timeframeText}:
- Tổng Thu: ${totalIncomeText}
- Tổng Chi: ${totalExpenseText}
- Tích Lũy: ${totalSavingsText}

Được tạo từ Fintro Pro!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Báo Cáo Tài Chính - Fintro Pro`,
          text: summaryText,
        });
      } catch (err) {
        console.error('Error sharing report', err);
      }
    } else {
      const mailtoLink = `mailto:?subject=${encodeURIComponent('Báo Cáo Tài Chính - Fintro Pro')}&body=${encodeURIComponent(summaryText)}`;
      window.open(mailtoLink, '_blank');
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => getYear(parseISO(t.date))));
    years.add(new Date().getFullYear()); // Always include current year
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Aggregate monthly data for a selected year
  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number; savings: number; monthName: string }> = {};
    
    // Initialize all 12 months
    for (let i = 0; i < 12; i++) {
        const d = new Date(selectedYear, i, 1);
        const key = format(d, 'yyyy-MM');
        data[key] = { income: 0, expense: 0, savings: 0, monthName: format(d, 'MM/yyyy') };
    }

    transactions.forEach(t => {
      const d = parseISO(t.date);
      if (getYear(d) === selectedYear) {
        const key = format(d, 'yyyy-MM');
        if (t.type === TransactionType.INCOME) {
          data[key].income += t.amount;
          data[key].savings += t.amount;
        } else {
          data[key].expense += t.amount;
          data[key].savings -= t.amount;
        }
      }
    });

    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => val);
  }, [transactions, selectedYear]);

  // Aggregate yearly data across all time
  const yearlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number; savings: number; year: string }> = {};
    
    transactions.forEach(t => {
      const year = format(parseISO(t.date), 'yyyy');
      if (!data[year]) {
        data[year] = { income: 0, expense: 0, savings: 0, year };
      }
      
      if (t.type === TransactionType.INCOME) {
        data[year].income += t.amount;
        data[year].savings += t.amount;
      } else {
        data[year].expense += t.amount;
        data[year].savings -= t.amount;
      }
    });

    return Object.values(data).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [transactions]);

  // 30 Days trend
  const dailyTrendData = useMemo(() => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => isSameDay(parseISO(t.date), day));
      return {
        date: format(day, 'dd'),
        fullDate: format(day, 'dd/MM'),
        expense: dayTransactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0),
        income: dayTransactions
          .filter(t => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  // Category breakdown
  const expenseCategoryData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const data: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([catId, amount]) => ({
      name: DEFAULT_CATEGORIES.find(c => c.id === catId)?.name || catId,
      value: amount,
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeCategoryData = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
    const data: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([catId, amount]) => ({
      name: DEFAULT_CATEGORIES.find(c => c.id === catId)?.name || catId,
      value: amount,
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const displayCategoryData = breakdownType === TransactionType.EXPENSE ? expenseCategoryData : incomeCategoryData;
  const currentTotal = displayCategoryData.reduce((acc, curr) => acc + curr.value, 0);
  const paletteColors = useMemo(() => {
    switch (activePalette) {
      case 'ocean': return { expense: '#0ea5e9', income: '#10b981', savings: '#3b82f6', pie: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#0284c7'] };
      case 'sunset': return { expense: '#f43f5e', income: '#f59e0b', savings: '#e11d48', pie: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#e11d48'] };
      case 'pastel': return { expense: '#fca5a5', income: '#86efac', savings: '#93c5fd', pie: ['#fca5a5', '#fecaca', '#fee2e2', '#fef2f2', '#fda4af', '#e11d48'] };
      case 'monochrome': return { expense: '#525252', income: '#a3a3a3', savings: '#171717', pie: ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'] };
      default: return { expense: '#171717', income: '#22c55e', savings: '#4f46e5', pie: ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'] };
    }
  }, [activePalette]);

  const COLORS = paletteColors.pie;

  const currentData = view === 'monthly' ? monthlyData : yearlyData;

  const totalIncome = currentData.reduce((acc, curr) => acc + curr.income, 0);
  const totalExpense = currentData.reduce((acc, curr) => acc + curr.expense, 0);
  const totalSavings = totalIncome - totalExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-neutral-100">
          <p className="text-sm font-bold text-neutral-900 mb-3">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isIncome = entry.dataKey === 'income';
            const isExpense = entry.dataKey === 'expense';
            const isSavings = entry.dataKey === 'savings';
            
            let colorClass = 'text-neutral-900';
            if (isIncome) colorClass = 'text-neutral-600';
            if (isExpense) colorClass = 'text-orange-500';
            if (isSavings) colorClass = 'text-neutral-600';

            let labelText = '';
            if (isIncome) labelText = 'Tổng Thu';
            if (isExpense) labelText = 'Tổng Chi';
            if (isSavings) labelText = 'Tích Lũy';

            return (
              <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                <span className="text-xs font-semibold text-neutral-500">{labelText}</span>
                <span className={`text-sm font-mono font-bold ${colorClass}`}>
                  {formatMoney(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">Báo cáo tài chính</h2>
          <p className="text-neutral-500 mt-1">Tổng quan thu chi và tích lũy qua các thời kỳ.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Customization controls */}
            <select value={activePalette} onChange={(e) => setActivePalette(e.target.value)} className="bg-neutral-100 text-sm font-bold text-neutral-900 rounded-3xl px-4 py-2 border-none outline-none">
                <option value="default">Mặc định</option>
                <option value="ocean">Đại dương</option>
                <option value="sunset">Hoàng hôn</option>
                <option value="pastel">Pastel</option>
                <option value="monochrome">Đơn sắc</option>
            </select>
            <div className="flex bg-neutral-100 p-1 rounded-3xl">
                <button onClick={() => setOverviewChartType('bar')} className={`px-4 py-2 rounded-3xl text-xs font-bold transition-all ${overviewChartType === 'bar' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>Cột</button>
                <button onClick={() => setOverviewChartType('area')} className={`px-4 py-2 rounded-3xl text-xs font-bold transition-all ${overviewChartType === 'area' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}>Vùng</button>
            </div>
            {/* End customization controls */}

          <button
            onClick={handleShareReport}
            className="flex items-center gap-2 px-6 py-2 rounded-3xl text-sm font-bold bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Chia sẻ
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 rounded-3xl text-sm font-bold bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
          </button>
          <div className="flex bg-neutral-100 p-1 rounded-3xl">
            <button
              onClick={() => setView('monthly')}
              className={`px-6 py-2 rounded-3xl text-sm font-bold transition-all ${view === 'monthly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setView('yearly')}
              className={`px-6 py-2 rounded-3xl text-sm font-bold transition-all ${view === 'yearly' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Theo Năm
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-8"
        >
          {view === 'monthly' && (
            <div className="flex items-center gap-4 bg-white px-6 py-4 border border-neutral-200/60 rounded-3xl w-max shadow-sm">
               <CalendarIcon className="w-5 h-5 text-neutral-400" />
               <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent font-bold text-neutral-900 outline-none cursor-pointer"
               >
                 {availableYears.map(y => (
                   <option key={y} value={y}>Năm {y}</option>
                 ))}
               </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <TrendingUp className="w-24 h-24 text-neutral-500" />
              </div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 relative z-10">Tổng Thu</p>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-3xl font-display font-bold text-neutral-600">+{formatMoney(totalIncome)}</span>
              </div>
            </div>
            
            <div className="card p-6 md:p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                <TrendingDown className="w-24 h-24 text-orange-500" />
              </div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 relative z-10">Tổng Chi</p>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-3xl font-display font-bold text-orange-500">-{formatMoney(totalExpense)}</span>
              </div>
            </div>

            <div className={`${totalSavings >= 0 ? 'bg-neutral-600 text-white' : 'bg-orange-500 text-white'} p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden`}>
               <div className="absolute top-0 right-0 p-6 opacity-10">
                <FileText className="w-24 h-24 text-white" />
              </div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 relative z-10">Tích Lũy Bằng Tiền</p>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-3xl font-display font-bold">{totalSavings > 0 ? '+' : ''}{formatMoney(totalSavings)}</span>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-10">
            <h3 className="text-xl font-bold text-neutral-900 mb-8 border-l-4 border-neutral-600 pl-4 inset-y-1">Biểu đồ tổng quan</h3>
            
            <div className="h-80 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
            {overviewChartType === 'bar' ? (
              <BarChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F5F5F5" />
                  <XAxis 
                    dataKey={view === 'monthly' ? 'monthName' : 'year'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#A3A3A3', fontWeight: 600}} 
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#F5F5F5' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="income" fill={paletteColors.income} radius={[4, 4, 0, 0]} barSize={maybeSmaller(view)} />
                  <Bar dataKey="expense" fill={paletteColors.expense} radius={[4, 4, 0, 0]} barSize={maybeSmaller(view)} />
                  <Bar dataKey="savings" fill={paletteColors.savings} radius={[4, 4, 0, 0]} barSize={maybeSmaller(view)} />
                </BarChart>
            ) : (
                <AreaChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F5F5F5" />
                  <XAxis 
                    dataKey={view === 'monthly' ? 'monthName' : 'year'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#A3A3A3', fontWeight: 600}} 
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#F5F5F5' }}
                    content={<CustomTooltip />}
                  />
                  <Area type="monotone" dataKey="income" stroke={paletteColors.income} fill={paletteColors.income} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="expense" stroke={paletteColors.expense} fill={paletteColors.expense} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="savings" stroke={paletteColors.savings} fill={paletteColors.savings} fillOpacity={0.3} />
                </AreaChart>
            )}
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-8 mt-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors.income }} />
                  <span className="text-xs font-bold text-neutral-400">Tổng Thu</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors.expense }} />
                  <span className="text-xs font-bold text-neutral-400">Tổng Chi</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors.savings }} />
                  <span className="text-xs font-bold text-neutral-400">Tiền Tích Lũy</span>
               </div>
            </div>
          </div>

          <div className="card p-6 sm:p-10">
            <h3 className="text-xl font-bold text-neutral-900 mb-2 border-l-4 border-neutral-600 pl-4 inset-y-1">Chi tiêu theo ngày (Tháng này)</h3>
            <p className="text-sm text-neutral-400 mb-8 ml-5">Xu hướng chi tiêu trong 30 ngày gần nhất</p>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={paletteColors.expense} stopOpacity={0.08}/>
                      <stop offset="95%" stopColor={paletteColors.expense} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={paletteColors.income} stopOpacity={0.08}/>
                      <stop offset="95%" stopColor={paletteColors.income} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F5F5F5" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fill: '#D4D4D4', fontWeight: 600}} 
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Thu nhập"
                    stroke={paletteColors.income} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="Chi tiêu"
                    stroke={paletteColors.expense} 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors.income }} />
                  <span className="text-xs font-bold text-neutral-400">Thu nhập</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: paletteColors.expense }} />
                  <span className="text-xs font-bold text-neutral-400">Chi tiêu</span>
               </div>
            </div>
          </div>

          <div className="card p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-1 border-l-4 border-neutral-600 pl-4 inset-y-1">Phân loại theo danh mục</h3>
                <p className="text-sm text-neutral-400 sm:ml-5">Tổng hợp từ lúc khởi tạo đến nay</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-3xl">
                 <button 
                    onClick={() => setBreakdownType(TransactionType.EXPENSE)}
                    className={`px-4 py-1.5 rounded-3xl text-xs font-bold transition-all ${breakdownType === TransactionType.EXPENSE ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                 >Chi</button>
                 <button 
                    onClick={() => setBreakdownType(TransactionType.INCOME)}
                    className={`px-4 py-1.5 rounded-3xl text-xs font-bold transition-all ${breakdownType === TransactionType.INCOME ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                 >Thu</button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 h-48 md:w-64 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayCategoryData}
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => formatMoney(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-4">
                {displayCategoryData.slice(0, 6).map((entry, index) => (
                  <div key={entry.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-bold text-neutral-700">{entry.name}</span>
                      </div>
                      <span className="text-xs font-bold text-neutral-900">
                        {((entry.value / currentTotal) * 100 || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-3xl overflow-hidden">
                      <div 
                        className="h-full rounded-3xl" 
                        style={{ 
                           width: `${((entry.value / currentTotal) * 100 || 0)}%`,
                           backgroundColor: COLORS[index % COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                ))}
                {displayCategoryData.length === 0 && (
                   <p className="text-sm font-medium text-neutral-400 italic">Chưa có dữ liệu cho phần thu chi này.</p>
                )}
              </div>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function maybeSmaller(view: ReportView) {
  return view === 'monthly' ? 8 : 24;
}

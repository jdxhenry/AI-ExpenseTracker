
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Wallet, 
  Settings, 
  BarChart3, 
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCcw,
  AlertCircle,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  PieChart,
  History as HistoryIcon,
  LayoutDashboard
} from 'lucide-react';
import { Category, CategoryData, Transaction, TransactionType, Currency, Budget } from './types.ts';
import { CATEGORY_METADATA, CATEGORY_TAGS, MOCK_EXPENSES } from './constants.tsx';
import RadialExpenseChart from './components/RadialExpenseChart.tsx';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.INR]: '₹',
  [Currency.GBP]: '£',
  [Currency.CAD]: 'C$',
  [Currency.AUD]: 'A$'
};

const App: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('spendwise_currency');
    return (saved as Currency) || Currency.USD;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendwise_transactions_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          }));
        }
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    return [...MOCK_EXPENSES];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('spendwise_budgets');
    if (saved) return JSON.parse(saved);
    return Object.values(Category)
      .filter(c => ![Category.Salary, Category.Freelance, Category.Investments, Category.Gift, Category.OtherIncome].includes(c))
      .map(c => ({ category: c, limit: 1000 }));
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'settings'>('overview');
  const [overviewSubView, setOverviewSubView] = useState<'dashboard' | 'history'>('dashboard');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  const [newType, setNewType] = useState<TransactionType>(TransactionType.Expense);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.Food);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    localStorage.setItem('spendwise_transactions_v4', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.Expense);
    const income = transactions.filter(t => t.type === TransactionType.Income);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const balance = totalIncome - totalSpent;

    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<Category, number>);

    const data: CategoryData[] = Object.keys(CATEGORY_METADATA)
      .filter(catKey => {
        const cat = catKey as Category;
        return ![Category.Salary, Category.Freelance, Category.Investments, Category.Gift, Category.OtherIncome].includes(cat);
      })
      .map(catKey => {
        const cat = catKey as Category;
        const amount = categoryTotals[cat] || 0;
        return {
          category: cat,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
          color: CATEGORY_METADATA[cat].color,
          icon: '' 
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .filter(d => d.amount > 0);

    return { totalSpent, totalIncome, balance, categories: data, categoryTotals };
  }, [transactions]);

  const filteredHistory = useMemo(() => {
    let list = transactions;
    list = list.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
    });
    if (historySearchTerm.trim()) {
      const term = historySearchTerm.toLowerCase();
      list = list.filter(t => 
        t.note.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, historySearchTerm, selectedDate]);

  const formatCurrency = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toLocaleString()}`;
  };

  const isAmountValid = useMemo(() => {
    const parsed = parseFloat(newAmount);
    return !isNaN(parsed) && parsed > 0;
  }, [newAmount]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newAmount || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const transaction: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      amount: parsedAmount,
      category: newCategory,
      date: new Date(),
      note: newNote || newCategory,
      type: newType,
    };

    setTransactions(prev => [transaction, ...prev]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewAmount('');
    setNewNote('');
    setNewType(TransactionType.Expense);
    setNewCategory(Category.Food);
  };

  const handleTypeChange = (type: TransactionType) => {
    setNewType(type);
    setNewCategory(type === TransactionType.Income ? Category.Salary : Category.Food);
    setNewNote('');
  };

  const changeMonth = (delta: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const selectedMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate);
  }, [selectedDate]);

  const incomeCategories = [Category.Salary, Category.Freelance, Category.Investments, Category.Gift, Category.OtherIncome];
  const expenseCategories = Object.values(Category).filter(c => !incomeCategories.includes(c));

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F2F2F7] overflow-hidden shadow-2xl relative font-sans">
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col pt-8">
            {/* iOS-Style Sub-Navigation */}
            <div className="px-6 mb-4 shrink-0">
               <div className="bg-white/60 backdrop-blur-lg p-1 rounded-2xl flex border border-white shadow-sm">
                  <button 
                    onClick={() => setOverviewSubView('dashboard')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${overviewSubView === 'dashboard' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  >
                    <LayoutDashboard size={16} /> Overview
                  </button>
                  <button 
                    onClick={() => setOverviewSubView('history')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${overviewSubView === 'history' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}
                  >
                    <HistoryIcon size={16} /> History
                  </button>
               </div>
            </div>

            {/* Horizontal Sliding View Logic */}
            <div className="flex-1 relative overflow-hidden">
               <div 
                 className={`flex w-[200%] h-full transition-transform duration-500 ease-out transform ${overviewSubView === 'history' ? '-translate-x-1/2' : 'translate-x-0'}`}
               >
                 {/* Dashboard Page */}
                 <div className="w-1/2 h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mx-1 grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1">Income</span>
                        <span className="text-sm font-bold text-green-700">{formatCurrency(stats.totalIncome)}</span>
                      </div>
                      <div className="flex flex-col items-center border-x border-gray-100 px-2">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1">Expense</span>
                        <span className="text-sm font-bold text-red-700">{formatCurrency(stats.totalSpent)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1 text-center">Balance</span>
                        <span className={`text-sm font-extrabold ${stats.balance >= 0 ? 'text-[#1C1C1E]' : 'text-red-700'}`}>
                          {stats.balance < 0 && '-'}{formatCurrency(Math.abs(stats.balance))}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                       <RadialExpenseChart 
                         data={stats.categories} 
                         totalSpent={stats.totalSpent} 
                         currencySymbol={CURRENCY_SYMBOLS[currency]} 
                       />
                    </div>

                    {/* RESTORED CATEGORY ACCORDION LIST */}
                    <section className="space-y-3 pb-10">
                      <div className="flex justify-between items-end px-2">
                        <h3 className="text-lg font-bold text-[#1C1C1E]">Categories</h3>
                        <button className="text-xs font-bold text-blue-700" onClick={() => setOverviewSubView('history')}>Details</button>
                      </div>
                      <div className="space-y-3">
                        {stats.categories.length > 0 ? (
                          stats.categories.map((cat) => {
                            const isExpanded = expandedCategory === cat.category;
                            const categoryTransactions = transactions.filter(t => t.category === cat.category && t.type === TransactionType.Expense);

                            return (
                              <div key={cat.category} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-50 overflow-hidden transition-all duration-300">
                                <button 
                                  onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                                  className="w-full p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                                      style={{ backgroundColor: cat.color }}
                                    >
                                      {CATEGORY_METADATA[cat.category].icon}
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-bold text-[#1C1C1E]">{cat.category}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                                              <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: cat.color, width: `${cat.percentage}%` }}></div>
                                          </div>
                                          <span className="text-[9px] font-bold text-gray-600">{cat.percentage.toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm font-bold text-[#1C1C1E]">{formatCurrency(cat.amount)}</p>
                                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                  </div>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] border-t border-gray-50' : 'max-h-0'}`}>
                                  <div className="px-1 py-1 bg-gray-50/50">
                                    {categoryTransactions.length > 0 ? (
                                      categoryTransactions.map((t) => (
                                        <div key={t.id} className="flex justify-between px-4 py-3 border-b border-gray-100 last:border-0 items-center bg-white m-1 rounded-xl shadow-sm">
                                          <div className="flex flex-col text-left">
                                            <span className="text-[13px] font-semibold text-gray-800">{t.note}</span>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{t.date.toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="text-[13px] font-bold text-[#1C1C1E]">{formatCurrency(t.amount)}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="p-4 text-xs text-center text-gray-500 italic">No items for this category</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 m-1">
                            <AlertCircle className="text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 font-semibold tracking-tight">No expenses logged yet</p>
                          </div>
                        )}
                      </div>
                    </section>
                 </div>

                 {/* Full History Page */}
                 <div className="w-1/2 h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar">
                    <div className="flex items-center justify-between px-2 pt-2">
                       <button onClick={() => changeMonth(-1)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                         <ChevronLeft size={20} className="text-[#1C1C1E]" />
                       </button>
                       <h2 className="text-xl font-semibold text-blue-700">{selectedMonthLabel}</h2>
                       <button onClick={() => changeMonth(1)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                         <ChevronRight size={20} className="text-[#1C1C1E]" />
                       </button>
                    </div>

                    <div className="px-1">
                       <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                         <input 
                           type="text" 
                           value={historySearchTerm}
                           onChange={(e) => setHistorySearchTerm(e.target.value)}
                           placeholder="Search all records..." 
                           className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-100 shadow-sm"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       {filteredHistory.length > 0 ? (
                         filteredHistory.map((t) => (
                           <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CATEGORY_METADATA[t.category].color }}>
                                  {CATEGORY_METADATA[t.category].icon}
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-bold text-[#1C1C1E]">{t.note}</p>
                                  <p className="text-[10px] text-gray-600 font-bold uppercase">{t.date.toLocaleDateString()} • {t.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <p className={`text-sm font-bold ${t.type === TransactionType.Income ? 'text-green-700' : 'text-red-700'}`}>
                                  {t.type === TransactionType.Income ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                                <button 
                                  onClick={() => setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Entry?',
                                    message: 'This will permanently remove this record.',
                                    onConfirm: () => {
                                      setTransactions(prev => prev.filter(item => item.id !== t.id));
                                      setConfirmModal(null);
                                    },
                                    isDestructive: true
                                  })}
                                  className="p-1 text-gray-300 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                           </div>
                         ))
                       ) : (
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                          <p className="text-sm text-gray-400 font-bold italic">No records found for this period</p>
                        </div>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar pt-8">
             <div className="px-2">
                <h2 className="text-2xl font-extrabold text-[#1C1C1E]">Budget Control</h2>
                <p className="text-sm text-gray-600 font-medium">Monthly limits and performance.</p>
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center">
                  <PieChart size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Global Budget</p>
                   <p className="text-3xl font-black text-[#1C1C1E]">{formatCurrency(budgets.reduce((s, b) => s + b.limit, 0))}</p>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                   <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((stats.totalSpent / budgets.reduce((s, b) => s + b.limit, 1)) * 100, 100)}%` }}
                   ></div>
                </div>
                <div className="flex justify-between w-full text-[11px] font-bold">
                  <span className="text-gray-600">Spent: {formatCurrency(stats.totalSpent)}</span>
                  <span className="text-blue-700">Left: {formatCurrency(Math.max(budgets.reduce((s, b) => s + b.limit, 0) - stats.totalSpent, 0))}</span>
                </div>
             </div>

             <section className="space-y-3 pb-10">
                <h3 className="text-lg font-bold text-[#1C1C1E] px-2">Category Budgets</h3>
                {budgets.map((b) => {
                   const spent = stats.categoryTotals[b.category] || 0;
                   const percent = (spent / b.limit) * 100;
                   const isOver = percent > 100;

                   return (
                     <div key={b.category} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 space-y-3">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: CATEGORY_METADATA[b.category].color }}>
                                 {CATEGORY_METADATA[b.category].icon}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-[#1C1C1E]">{b.category}</p>
                                 <p className="text-[10px] font-bold text-gray-500">Goal: {formatCurrency(b.limit)}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={`text-sm font-black ${isOver ? 'text-red-700' : 'text-gray-800'}`}>{formatCurrency(spent)}</p>
                              <p className={`text-[10px] font-bold ${isOver ? 'text-red-700' : 'text-gray-500'}`}>{isOver ? 'Over' : 'Under'}</p>
                           </div>
                        </div>
                        <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-600' : 'bg-green-600'}`}
                             style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: !isOver ? CATEGORY_METADATA[b.category].color : '' }}
                           ></div>
                        </div>
                     </div>
                   );
                })}
             </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar pt-8">
            <h3 className="text-xl font-bold px-2 text-[#1C1C1E]">Settings</h3>
            
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 flex items-center gap-2">
                <Globe size={12} /> Regional Settings
              </h4>
              <div className="bg-white rounded-3xl p-2 grid grid-cols-3 gap-2 shadow-sm">
                {(Object.values(Currency)).map((curr) => (
                  <button key={curr} onClick={() => setCurrency(curr)} className={`py-3 rounded-2xl text-xs font-bold transition-all ${currency === curr ? 'bg-blue-700 text-white shadow-md' : 'bg-gray-50 text-gray-700'}`}>
                    {curr}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2">Data Management</h4>
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
                <button onClick={() => setConfirmModal({ isOpen: true, title: 'Clear Data?', message: 'Delete all records?', onConfirm: () => {setTransactions([]); setConfirmModal(null);}, isDestructive: true })} className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50">
                  <Trash2 className="text-red-700" size={20} />
                  <div>
                    <p className="text-sm font-bold text-red-700">Delete All Data</p>
                    <p className="text-xs text-gray-600">Irreversible action.</p>
                  </div>
                </button>
                <button onClick={() => setConfirmModal({ isOpen: true, title: 'Restore Samples?', message: 'Reset with test data?', onConfirm: () => {setTransactions(MOCK_EXPENSES.map(t => ({...t, date: new Date()}))); setConfirmModal(null);}, isDestructive: false })} className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50">
                  <RefreshCcw className="text-blue-700" size={20} />
                  <div>
                    <p className="text-sm font-bold text-blue-700">Restore Samples</p>
                    <p className="text-xs text-gray-600">Re-populate app with dummy data.</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FIXED Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-bottom pb-4 pt-3 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'overview' ? 'text-blue-700' : 'text-gray-500'}`}>
          <BarChart3 size={24} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Overview</span>
        </button>
        <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'budget' ? 'text-blue-700' : 'text-gray-500'}`}>
          <Calendar size={24} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Budget</span>
        </button>
        
        <div className="flex-1 flex justify-center">
          <button onClick={() => setIsAddModalOpen(true)} className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-6 border-4 border-white">
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <button className="flex flex-col items-center gap-1 flex-1 text-gray-500">
          <Wallet size={24} />
          <span className="text-[10px] font-bold">Payments</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'settings' ? 'text-blue-700' : 'text-gray-500'}`}>
          <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Add Entry Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8 sm:px-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); resetForm(); }}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-6 overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-[#1C1C1E]">Log Transaction</h2>
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-6">
              {/* Type Toggle */}
              <div className="bg-gray-100 p-1 rounded-2xl flex">
                <button type="button" onClick={() => handleTypeChange(TransactionType.Expense)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Expense ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-gray-500'}`}>Expense</button>
                <button type="button" onClick={() => handleTypeChange(TransactionType.Income)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Income ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Income</button>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">{CURRENCY_SYMBOLS[currency]}</span>
                <input 
                  autoFocus type="number" step="0.01" value={newAmount} 
                  onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" 
                  className="w-full bg-gray-50 rounded-2xl py-6 pl-12 pr-4 text-4xl font-extrabold outline-none focus:ring-1 focus:ring-blue-100 placeholder:text-gray-200" 
                />
              </div>

              {/* RESTORED CATEGORY GRID */}
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {(newType === TransactionType.Expense ? expenseCategories : incomeCategories).map((cat) => (
                    <button 
                      key={cat} 
                      type="button" 
                      onClick={() => setNewCategory(cat)} 
                      className={`h-11 rounded-xl flex items-center justify-center transition-all ${newCategory === cat ? 'scale-110 ring-2 ring-blue-300 shadow-md' : 'bg-gray-50 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`} 
                      style={{ backgroundColor: CATEGORY_METADATA[cat].color, color: 'white' }}
                    >
                      {CATEGORY_METADATA[cat].icon}
                    </button>
                  ))}
                </div>
                
                {/* RESTORED CATEGORY LABEL & TAGS */}
                <div className="space-y-2 text-center">
                  <p className="text-sm font-black text-[#1C1C1E] uppercase tracking-wider">{newCategory}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CATEGORY_TAGS[newCategory]?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewNote(tag)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                          newNote === tag 
                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm' 
                          : 'bg-gray-100 text-gray-700 border-gray-200 active:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note Input */}
              <input 
                type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} 
                placeholder="Add a note..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-1 focus:ring-blue-100 outline-none" 
              />

              {/* Save Button */}
              <button 
                type="submit" disabled={!isAmountValid}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 
                  ${newType === TransactionType.Income ? 'bg-green-700 text-white shadow-green-100' : 'bg-red-700 text-white shadow-red-100'} 
                  ${!isAmountValid ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
              >
                Save {newType === TransactionType.Income ? 'Income' : 'Expense'} <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
          <div className="relative bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-[#1C1C1E]">{confirmModal.title}</h3>
              <p className="text-sm text-gray-600 mt-2 font-medium">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 text-sm font-semibold text-gray-600 border-r border-gray-100 active:bg-gray-50">Cancel</button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 py-4 text-sm font-bold active:bg-gray-50 ${confirmModal.isDestructive ? 'text-red-700' : 'text-blue-700'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


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
  ChevronRight
} from 'lucide-react';
import { Category, CategoryData, Transaction, TransactionType, Currency } from './types';
import { CATEGORY_METADATA, CATEGORY_TAGS, MOCK_EXPENSES } from './constants';
import RadialExpenseChart from './components/RadialExpenseChart';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.INR]: '₹',
  [Currency.GBP]: '£',
  [Currency.CAD]: 'C$',
  [Currency.AUD]: 'A$'
};

const App: React.FC = () => {
  // Initialize currency from localStorage
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('spendwise_currency');
    return (saved as Currency) || Currency.USD;
  });

  // Initialize state from localStorage or MOCK_EXPENSES
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

  const [activeTab, setActiveTab] = useState<'budget' | 'history' | 'settings'>('budget');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // Selected month state for history navigation
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // New Transaction State
  const [newType, setNewType] = useState<TransactionType>(TransactionType.Expense);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.Food);
  const [newNote, setNewNote] = useState('');

  // Persist transactions and currency
  useEffect(() => {
    localStorage.setItem('spendwise_transactions_v4', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_currency', currency);
  }, [currency]);

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
        const isIncomeCategory = [Category.Salary, Category.Freelance, Category.Investments, Category.Gift, Category.OtherIncome].includes(cat);
        return !isIncomeCategory;
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

    return { totalSpent, totalIncome, balance, categories: data };
  }, [transactions]);

  const filteredHistory = useMemo(() => {
    let list = transactions;

    // Filter by selected month and year
    list = list.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
    });

    // Filter by search term
    if (historySearchTerm.trim()) {
      const term = historySearchTerm.toLowerCase();
      list = list.filter(t => 
        t.note.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term)
      );
    }

    // Sort by date descending
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, historySearchTerm, selectedDate]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newAmount || isNaN(parsedAmount)) return;

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

  const requestDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Entry',
      message: 'Are you sure you want to remove this transaction?',
      isDestructive: true,
      onConfirm: () => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setConfirmModal(null);
      }
    });
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

  const requestClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Data',
      message: 'This will permanently delete every transaction. This action cannot be undone.',
      isDestructive: true,
      onConfirm: () => {
        setTransactions([]);
        setConfirmModal(null);
      }
    });
  };

  const requestRestoreSamples = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Samples',
      message: 'This will replace your current data with the default sample entries. Proceed?',
      isDestructive: false,
      onConfirm: () => {
        const restored = MOCK_EXPENSES.map(t => ({...t, date: new Date()}));
        setTransactions(restored);
        setConfirmModal(null);
      }
    });
  };

  const formatCurrency = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toLocaleString()}`;
  };

  const incomeCategories = [Category.Salary, Category.Freelance, Category.Investments, Category.Gift, Category.OtherIncome];
  const expenseCategories = Object.values(Category).filter(c => !incomeCategories.includes(c));

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

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F2F2F7] overflow-hidden shadow-2xl relative">
      <main className="flex-1 overflow-y-auto px-4 pb-32 space-y-5 no-scrollbar pt-8">
        {activeTab === 'budget' && (
          <>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mx-1 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Income</span>
                <span className="text-sm font-bold text-green-500">{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex flex-col items-center border-x border-gray-100 px-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Expense</span>
                <span className="text-sm font-bold text-red-500">{formatCurrency(stats.totalSpent)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 text-center">Balance</span>
                <span className={`text-sm font-extrabold ${stats.balance >= 0 ? 'text-[#1C1C1E]' : 'text-red-500'}`}>
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

            <section className="space-y-3 pb-4">
              <div className="flex justify-between items-end px-2">
                <h3 className="text-lg font-bold text-[#1C1C1E]">Categories</h3>
                <button className="text-xs font-bold text-blue-600">Details</button>
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
                                  <span className="text-[9px] font-bold text-gray-400">{cat.percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-[#1C1C1E]">{formatCurrency(cat.amount)}</p>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                          </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] border-t border-gray-50' : 'max-h-0'}`}>
                          <div className="px-1 py-1 bg-gray-50/50">
                            {categoryTransactions.map((t) => (
                              <div key={t.id} className="flex justify-between px-4 py-3 border-b border-gray-100 last:border-0 items-center bg-white m-1 rounded-xl shadow-sm">
                                <div className="flex flex-col text-left">
                                  <span className="text-[13px] font-semibold text-gray-700">{t.note}</span>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase">{t.date.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[13px] font-bold text-[#1C1C1E]">{formatCurrency(t.amount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 m-1">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="text-gray-200" />
                    </div>
                    <p className="text-sm text-gray-400 font-semibold tracking-tight">No expenses logged yet</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
             {/* Month Selector UI as per request */}
             <div className="flex items-center justify-between px-2 pt-2">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                >
                  <ChevronLeft size={20} className="text-[#1C1C1E]" />
                </button>
                
                <h2 className="text-xl font-semibold text-blue-600">
                  {selectedMonthLabel}
                </h2>

                <button 
                  onClick={() => changeMonth(1)}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                >
                  <ChevronRight size={20} className="text-[#1C1C1E]" />
                </button>
             </div>

             <div className="px-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Search in this month..." 
                    className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-11 text-sm font-medium focus:ring-0 focus:border-blue-100 outline-none shadow-sm placeholder:text-gray-300 transition-all"
                  />
                  {historySearchTerm && (
                    <button 
                      onClick={() => setHistorySearchTerm('')}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500 active:scale-90 transition-all"
                    >
                      <X size={18} fill="currentColor" stroke="white" />
                    </button>
                  )}
                </div>
             </div>

             <div className="space-y-2 pb-10">
               {filteredHistory.length > 0 ? (
                 filteredHistory.map((t) => (
                   <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 group transition-all">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: CATEGORY_METADATA[t.category].color }}
                        >
                          {CATEGORY_METADATA[t.category].icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-[#1C1C1E] leading-tight">{t.note}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">{t.date.toLocaleDateString()} • {t.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className={`text-sm font-bold ${t.type === TransactionType.Income ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === TransactionType.Income ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <button 
                          onClick={(e) => requestDelete(t.id, e)} 
                          className="p-2 -mr-1 text-gray-300 hover:text-red-500 transition-all active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete transaction"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                   </div>
                 ))
               ) : (
                <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-bold italic">No transactions in {selectedMonthLabel}</p>
                  <button 
                    onClick={() => { setHistorySearchTerm(''); setSelectedDate(new Date()); }}
                    className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest"
                  >
                    Go to Current Month
                  </button>
                </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 pb-10">
            <h3 className="text-lg font-bold px-2 text-[#1C1C1E]">App Settings</h3>
            
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <Globe size={12} />
                Base Currency
              </h4>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 grid grid-cols-3 gap-2">
                {(Object.values(Currency)).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all ${
                      currency === curr 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {curr} ({CURRENCY_SYMBOLS[curr]})
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Data Management</h4>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                <button 
                  onClick={requestClearAll}
                  className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
                    <Trash2 size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-600">Reset All Data</p>
                    <p className="text-xs text-gray-400">Permanently delete all your records.</p>
                  </div>
                </button>

                <button 
                  onClick={requestRestoreSamples}
                  className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-active:scale-90 transition-transform">
                    <RefreshCcw size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-600">Restore Samples</p>
                    <p className="text-xs text-gray-400">Load dummy data for testing purposes.</p>
                  </div>
                </button>
              </div>
            </section>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Version Info</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-500">SpendWise iOS</span>
                <span className="font-bold text-[#1C1C1E]">v2.1.0</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
          <div className="relative bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-[#1C1C1E]">{confirmModal.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-4 text-sm font-semibold text-gray-500 border-r border-gray-100 active:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-4 text-sm font-bold active:bg-gray-50 ${confirmModal.isDestructive ? 'text-red-500' : 'text-blue-600'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-gray-100 safe-area-bottom pb-4 pt-3 flex justify-around items-center z-30">
        <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'budget' ? 'text-blue-600' : 'text-gray-300'}`}>
          <BarChart3 size={24} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Analysis</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-300'}`}>
          <Calendar size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">History</span>
        </button>
        
        <div className="flex-1 flex justify-center">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-transform -mt-6 border-4 border-white"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <button className="flex flex-col items-center gap-1 flex-1 text-gray-300">
          <Wallet size={24} />
          <span className="text-[10px] font-bold">Wallets</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-300'}`}>
          <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Add Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 sm:px-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); resetForm(); }}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-2xl font-extrabold text-[#1C1C1E]">Log Entry</h2>
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-transform"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="bg-gray-100 p-1 rounded-2xl flex">
                <button type="button" onClick={() => handleTypeChange(TransactionType.Expense)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Expense ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-gray-400'}`}>Expense</button>
                <button type="button" onClick={() => handleTypeChange(TransactionType.Income)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Income ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}>Income</button>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold ${newType === TransactionType.Income ? 'text-green-300' : 'text-gray-300'}`}>{CURRENCY_SYMBOLS[currency]}</span>
                  <input autoFocus type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border-none rounded-2xl py-6 pl-10 pr-4 text-4xl font-extrabold focus:ring-0 outline-none placeholder:text-gray-200" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {(newType === TransactionType.Expense ? expenseCategories : incomeCategories).map((cat) => (
                    <button 
                      key={cat} 
                      type="button" 
                      onClick={() => setNewCategory(cat)} 
                      className={`h-12 rounded-xl flex items-center justify-center transition-all ${newCategory === cat ? 'scale-110 shadow-md ring-2 ring-offset-2' : 'bg-gray-50 opacity-40 hover:opacity-100'}`} 
                      style={{ 
                        backgroundColor: CATEGORY_METADATA[cat].color, 
                        color: 'white'
                      }}
                    >
                      {CATEGORY_METADATA[cat].icon}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-center text-gray-400 tracking-wider uppercase">{newCategory}</p>
                  <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto no-scrollbar">
                    {CATEGORY_TAGS[newCategory]?.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewNote(tag)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                          newNote === tag 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-gray-100 text-gray-500 border-gray-100 active:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 px-1 text-left block">Note</label>
                <input 
                  type="text" 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)} 
                  placeholder={newType === TransactionType.Income ? "Source of income?" : "What did you spend it on?"} 
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-bold focus:ring-0 outline-none" 
                />
              </div>

              <button type="submit" className={`w-full ${newType === TransactionType.Income ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'} text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2`}>
                Save {newType === TransactionType.Income ? 'Income' : 'Expense'}
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

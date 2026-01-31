
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
  LayoutDashboard,
  Edit2,
  Target,
  ArrowUpRight,
  Bell,
  BellOff,
  Clock
} from 'lucide-react';
import { Category, CategoryData, Transaction, TransactionType, Currency, Budget, Subscription, BillingCycle } from './types.ts';
import { CATEGORY_METADATA, CATEGORY_TAGS, MOCK_EXPENSES, QUICK_ADD_SUBSCRIPTIONS } from './constants.tsx';
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
    const saved = localStorage.getItem('spendwise_budgets_v3');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('spendwise_subscriptions_v2');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'sub-1', name: 'Netflix', amount: 15.99, billingCycle: BillingCycle.Monthly, nextBillingDate: '2024-06-15', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Netflix-new-icon.png', alertEnabled: true, alertLeadDays: 3, category: Category.Entertainment },
      { id: 'sub-2', name: 'Spotify', amount: 9.99, billingCycle: BillingCycle.Monthly, nextBillingDate: '2024-06-20', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', alertEnabled: false, alertLeadDays: 0, category: Category.Entertainment }
    ];
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'subscriptions' | 'settings'>('overview');
  const [overviewSubView, setOverviewSubView] = useState<'dashboard' | 'history'>('dashboard');
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set());
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetEditorOpen, setIsBudgetEditorOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  
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

  // Subscription Form State
  const [subForm, setSubForm] = useState<Partial<Subscription>>({
    name: '',
    amount: 0,
    billingCycle: BillingCycle.Monthly,
    nextBillingDate: new Date().toISOString().split('T')[0],
    alertEnabled: true,
    alertLeadDays: 3,
    category: Category.Entertainment
  });

  useEffect(() => {
    localStorage.setItem('spendwise_transactions_v4', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('spendwise_budgets_v3', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('spendwise_subscriptions_v2', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.Expense);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

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

    return { totalSpent, categories: data, categoryTotals };
  }, [transactions]);

  const toggleCategory = (cat: Category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

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

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name || !subForm.amount) return;

    const newSub: Subscription = {
      id: 'sub-' + Date.now(),
      name: subForm.name,
      amount: subForm.amount,
      billingCycle: subForm.billingCycle || BillingCycle.Monthly,
      nextBillingDate: subForm.nextBillingDate || new Date().toISOString().split('T')[0],
      iconUrl: subForm.iconUrl || '',
      alertEnabled: subForm.alertEnabled ?? true,
      alertLeadDays: subForm.alertLeadDays ?? 3,
      category: Category.Entertainment
    };

    setSubscriptions(prev => [...prev, newSub]);
    setIsSubModalOpen(false);
    setSubForm({
      name: '',
      amount: 0,
      billingCycle: BillingCycle.Monthly,
      nextBillingDate: new Date().toISOString().split('T')[0],
      alertEnabled: true,
      alertLeadDays: 3,
      category: Category.Entertainment
    });
  };

  const quickAddSub = (service: typeof QUICK_ADD_SUBSCRIPTIONS[0]) => {
    const newSub: Subscription = {
      id: 'sub-' + Date.now(),
      name: service.name,
      amount: service.amount,
      billingCycle: BillingCycle.Monthly,
      nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      iconUrl: service.iconUrl,
      alertEnabled: true,
      alertLeadDays: 3,
      category: Category.Entertainment
    };
    setSubscriptions(prev => [...prev, newSub]);
  };

  const toggleSubAlert = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, alertEnabled: !s.alertEnabled } : s));
  };

  const deleteSub = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateBudget = (category: Category, limit: number) => {
    setBudgets(prev => {
      const filtered = prev.filter(b => b.category !== category);
      if (limit > 0) {
        return [...filtered, { category, limit }];
      }
      return filtered;
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

  const activeBudgets = useMemo(() => budgets.filter(b => b.limit > 0), [budgets]);
  const globalBudgetLimit = useMemo(() => activeBudgets.reduce((s, b) => s + b.limit, 0), [activeBudgets]);

  const totalMonthlySubCost = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      const monthlyAmount = s.billingCycle === BillingCycle.Yearly ? s.amount / 12 : s.amount;
      return sum + monthlyAmount;
    }, 0);
  }, [subscriptions]);

  const isAmountValid = useMemo(() => {
    const val = parseFloat(newAmount);
    return !isNaN(val) && val > 0;
  }, [newAmount]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F2F2F7] overflow-hidden shadow-2xl relative font-sans">
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col pt-8">
            <div className="px-6 mb-4 shrink-0">
               <div className="bg-white/60 backdrop-blur-lg p-1 rounded-2xl flex border border-white shadow-sm">
                  <button onClick={() => setOverviewSubView('dashboard')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${overviewSubView === 'dashboard' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}><LayoutDashboard size={16} /> Overview</button>
                  <button onClick={() => setOverviewSubView('history')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${overviewSubView === 'history' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}><HistoryIcon size={16} /> History</button>
               </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
               <div className={`flex w-[200%] h-full transition-transform duration-500 ease-out transform ${overviewSubView === 'history' ? '-translate-x-1/2' : 'translate-x-0'}`}>
                 <div className="w-1/2 h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"><RadialExpenseChart data={stats.categories} totalSpent={stats.totalSpent} currencySymbol={CURRENCY_SYMBOLS[currency]} /></div>
                    
                    <section className="space-y-3 pb-10 px-2">
                      <div className="flex justify-between items-end px-2"><h3 className="text-lg font-bold text-[#1C1C1E]">Categories</h3><button className="text-xs font-bold text-blue-700" onClick={() => setOverviewSubView('history')}>Details</button></div>
                      <div className="space-y-4">
                        {stats.categories.map((cat) => {
                          const isExpanded = expandedCategories.has(cat.category);
                          const categoryTransactions = transactions.filter(t => t.category === cat.category && t.type === TransactionType.Expense);
                          
                          return (
                            <div key={cat.category} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                               <div 
                                 className="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50"
                                 onClick={() => toggleCategory(cat.category)}
                               >
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: cat.color }}>{CATEGORY_METADATA[cat.category].icon}</div>
                                   <div>
                                     <p className="text-sm font-bold text-[#1C1C1E]">{cat.category}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full rounded-full transition-all duration-700" 
                                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                                          ></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400">{Math.round(cat.percentage)}%</span>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <p className="text-sm font-bold text-[#1C1C1E]">{formatCurrency(cat.amount)}</p>
                                   {isExpanded ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
                                 </div>
                               </div>
                               
                               {/* EXPANDED SECTION MATCHING SCREENSHOT */}
                               {isExpanded && (
                                 <div className="px-5 pb-5 pt-0 space-y-2">
                                   {categoryTransactions.map(t => (
                                     <div key={t.id} className="bg-[#F9F9FB] p-4 rounded-[1.2rem] flex items-center justify-between border border-gray-50">
                                       <div>
                                         <p className="text-xs font-bold text-[#1C1C1E]">{t.note}</p>
                                         <p className="text-[9px] text-gray-400 mt-1">{t.date.toLocaleDateString()}</p>
                                       </div>
                                       <p className="text-sm font-bold text-[#1C1C1E]">{formatCurrency(t.amount)}</p>
                                     </div>
                                   ))}
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                 </div>
                 <div className="w-1/2 h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar">
                    <div className="flex items-center justify-between px-2 pt-2"><button onClick={() => changeMonth(-1)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center"><ChevronLeft size={20} /></button><h2 className="text-xl font-semibold text-blue-700">{selectedMonthLabel}</h2><button onClick={() => changeMonth(1)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center"><ChevronRight size={20} /></button></div>
                    <div className="space-y-2">
                      {transactions.map((t) => (
                        <div key={t.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50 group">
                           <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CATEGORY_METADATA[t.category].color }}>{CATEGORY_METADATA[t.category].icon}</div><div><p className="text-sm font-bold text-[#1C1C1E]">{t.note}</p><p className="text-[10px] text-gray-600 font-bold uppercase">{t.category}</p></div></div>
                           <p className={`text-sm font-bold ${t.type === TransactionType.Income ? 'text-green-700' : 'text-red-700'}`}>{t.type === TransactionType.Income ? '+' : '-'}{formatCurrency(t.amount)}</p>
                        </div>
                      ))}
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

             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 relative">
                <button onClick={() => setIsBudgetEditorOpen(true)} className="absolute top-6 right-6 p-2 bg-blue-50 text-blue-700 rounded-full active:scale-90 transition-transform"><Edit2 size={16} /></button>
                <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center"><PieChart size={32} /></div>
                <div><p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Global Monthly Goal</p><p className="text-3xl font-black text-[#1C1C1E]">{formatCurrency(globalBudgetLimit)}</p></div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${globalBudgetLimit > 0 ? Math.min((stats.totalSpent / globalBudgetLimit) * 100, 100) : 0}%` }}></div></div>
                <div className="flex justify-between w-full text-[11px] font-bold"><span className="text-gray-600">Spent: {formatCurrency(stats.totalSpent)}</span><span className="text-blue-700">Budget: {formatCurrency(globalBudgetLimit)}</span></div>
             </div>

             <section className="space-y-3 pb-10">
                <h3 className="text-lg font-bold text-[#1C1C1E] px-2">Category Budgets</h3>
                {activeBudgets.length > 0 ? (
                  activeBudgets.map((b) => {
                    const spent = stats.categoryTotals[b.category] || 0;
                    const percent = Math.round((spent / b.limit) * 100);
                    const isOver = percent > 100;
                    return (
                      <div key={b.category} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between group transition-all">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: CATEGORY_METADATA[b.category].color }}>{CATEGORY_METADATA[b.category].icon}</div>
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-sm font-bold text-[#1C1C1E] truncate mb-1">{b.category}</p>
                                <div className="flex items-center gap-3 w-[120px]">
                                  <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: !isOver ? CATEGORY_METADATA[b.category].color : '' }}></div>
                                  </div>
                                  <span className={`text-[10px] font-bold whitespace-nowrap ${isOver ? 'text-red-600' : 'text-gray-500'}`}>{percent}%</span>
                                </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right mr-1"><p className={`text-sm font-bold ${isOver ? 'text-red-700' : 'text-gray-800'}`}>{formatCurrency(spent)}</p><p className="text-[10px] text-gray-400 font-bold">Goal: {formatCurrency(b.limit)}</p></div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 px-6 bg-white rounded-[2rem] border border-dashed border-gray-200 mx-2"><Target className="mx-auto text-gray-300 mb-3" size={32} /><p className="text-sm font-bold text-gray-500 mb-1">Enter Your Budgets</p><p className="text-xs text-gray-400 mb-6">Manually set your spending goals to see tracking bars here.</p><button onClick={() => setIsBudgetEditorOpen(true)} className="py-2.5 px-6 bg-blue-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md flex items-center gap-2 mx-auto"><Edit2 size={14} /> Set Limits</button></div>
                )}
             </section>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar pt-8">
             <div className="px-2">
                <h2 className="text-2xl font-extrabold text-[#1C1C1E]">Subscriptions</h2>
                <p className="text-sm text-gray-600 font-medium">Manage your repeating payments.</p>
             </div>

             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center shrink-0"><Wallet size={24} /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Monthly Cost</p>
                  <p className="text-2xl font-black text-[#1C1C1E]">{formatCurrency(totalMonthlySubCost)}</p>
                </div>
                <button onClick={() => setIsSubModalOpen(true)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-blue-700 active:scale-90 transition-transform"><Plus size={24} /></button>
             </div>

             <div className="space-y-3">
               <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Quick Add</h4>
               <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 px-2">
                 {QUICK_ADD_SUBSCRIPTIONS.map((service) => (
                   <button key={service.name} onClick={() => quickAddSub(service)} className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform">
                     <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-shadow">
                       {service.iconUrl ? <img src={service.iconUrl} alt={service.name} className="w-10 h-10 object-contain" /> : <span className="text-lg font-black text-white p-4 rounded-xl" style={{ backgroundColor: service.color }}>{service.icon}</span>}
                     </div>
                     <span className="text-[10px] font-bold text-gray-600 truncate max-w-[64px]">{service.name}</span>
                   </button>
                 ))}
               </div>
             </div>

             <section className="space-y-3 pb-10">
                <h3 className="text-lg font-bold text-[#1C1C1E] px-2">Active Plans</h3>
                <div className="space-y-3">
                  {subscriptions.length > 0 ? (
                    subscriptions.map((s) => (
                      <div key={s.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center justify-between group">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-50">
                              {s.iconUrl ? <img src={s.iconUrl} alt={s.name} className="w-8 h-8 object-contain" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black bg-blue-100 text-blue-700 uppercase">{s.name.slice(0,2)}</div>}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#1C1C1E]">{s.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock size={10} /> Next: {new Date(s.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">{s.billingCycle}</span>
                                </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right mr-1">
                                <p className="text-sm font-black text-[#1C1C1E]">{formatCurrency(s.amount)}</p>
                                <button onClick={() => toggleSubAlert(s.id)} className={`flex items-center gap-1 text-[10px] font-bold mt-1 ml-auto ${s.alertEnabled ? 'text-orange-500' : 'text-gray-300'}`}>
                                  {s.alertEnabled ? <Bell size={10} fill="currentColor" /> : <BellOff size={10} />}
                                  {s.alertEnabled ? `${s.alertLeadDays > 0 ? `${s.alertLeadDays}d before` : 'Same day'}` : 'Alert Off'}
                                </button>
                            </div>
                            <button onClick={() => deleteSub(s.id)} className="p-2 text-gray-200 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={16} /></button>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-100 mx-2"><AlertCircle className="mx-auto text-gray-200 mb-4" size={48} /><p className="text-sm font-bold text-gray-400">No active subscriptions</p></div>
                  )}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="h-full overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar pt-8">
             <h2 className="text-2xl font-extrabold text-[#1C1C1E] px-2">Settings</h2>
             <section className="space-y-3">
               <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 flex items-center gap-2"><Globe size={12} /> Regional Settings</h4>
               <div className="bg-white rounded-3xl p-2 grid grid-cols-3 gap-2 shadow-sm border border-gray-100">
                 {(Object.values(Currency)).map((curr) => (
                   <button key={curr} onClick={() => setCurrency(curr)} className={`py-3 rounded-2xl text-xs font-bold transition-all ${currency === curr ? 'bg-blue-700 text-white shadow-md' : 'bg-gray-50 text-gray-700'}`}>{curr}</button>
                 ))}
               </div>
             </section>

             <section className="space-y-3">
               <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2">Data Management</h4>
               <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden divide-y divide-gray-50 border border-gray-100">
                 <button onClick={() => setConfirmModal({ isOpen: true, title: 'Clear Everything?', message: 'This will delete all your transactions, budgets and subscriptions. This action cannot be undone.', onConfirm: () => { setTransactions([]); setBudgets([]); setSubscriptions([]); setConfirmModal(null); }, isDestructive: true })} className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50 transition-colors"><Trash2 className="text-red-700" size={20} /><div><p className="text-sm font-bold text-red-700">Reset All Data</p><p className="text-xs text-gray-600">Start with a clean slate.</p></div></button>
                 <button onClick={() => setConfirmModal({ isOpen: true, title: 'Restore Samples?', message: 'This will overwrite your current data with sample records. Proceed?', onConfirm: () => { setTransactions(MOCK_EXPENSES.map(t => ({...t, date: new Date()}))); setConfirmModal(null); }, isDestructive: false })} className="w-full flex items-center gap-4 p-5 text-left active:bg-gray-50 transition-colors"><RefreshCcw className="text-blue-700" size={20} /><div><p className="text-sm font-bold text-blue-700">Restore Samples</p><p className="text-xs text-gray-600">Populate the app with test data.</p></div></button>
               </div>
             </section>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-bottom pb-4 pt-3 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'overview' ? 'text-blue-700' : 'text-gray-500'}`}><BarChart3 size={24} strokeWidth={activeTab === 'overview' ? 2.5 : 2} /><span className="text-[10px] font-bold">Overview</span></button>
        <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'budget' ? 'text-blue-700' : 'text-gray-500'}`}><Calendar size={24} strokeWidth={activeTab === 'budget' ? 2.5 : 2} /><span className="text-[10px] font-bold">Budget</span></button>
        <div className="flex-1 flex justify-center"><button onClick={() => setIsAddModalOpen(true)} className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-6 border-4 border-white"><Plus size={28} strokeWidth={2.5} /></button></div>
        <button onClick={() => setActiveTab('subscriptions')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'subscriptions' ? 'text-blue-700' : 'text-gray-500'}`}><Wallet size={24} strokeWidth={activeTab === 'subscriptions' ? 2.5 : 2} /><span className="text-[10px] font-bold">Subscriptions</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'settings' ? 'text-blue-700' : 'text-gray-500'}`}><Settings size={24} /><span className="text-[10px] font-bold">Settings</span></button>
      </nav>

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

      {/* Budget Set Limits Modal */}
      {isBudgetEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8 sm:px-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBudgetEditorOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2"><Target size={20} className="text-blue-700" /><h2 className="text-2xl font-extrabold text-[#1C1C1E]">Set Limits</h2></div>
              <button onClick={() => setIsBudgetEditorOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-6">
              {expenseCategories.map(cat => {
                const budget = budgets.find(b => b.category === cat);
                const limitValue = budget ? budget.limit : 0;
                return (
                  <div key={cat} className="bg-white rounded-2xl p-4 flex items-center justify-between border-2 border-gray-50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CATEGORY_METADATA[cat].color }}>{CATEGORY_METADATA[cat].icon}</div>
                      <span className="text-sm font-bold truncate">{cat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-300">{CURRENCY_SYMBOLS[currency]}</span>
                      <input 
                        type="number" value={limitValue === 0 ? '' : limitValue} 
                        onChange={(e) => handleUpdateBudget(cat, parseFloat(e.target.value) || 0)} 
                        placeholder="0" className="w-24 bg-gray-50 rounded-xl py-2 px-3 text-sm font-bold text-[#1C1C1E] outline-none text-right" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setIsBudgetEditorOpen(false)} className="w-full py-4 bg-blue-700 text-white rounded-[1.5rem] font-bold text-lg shadow-xl active:scale-95 transition-all mb-2">Done</button>
          </div>
        </div>
      )}

      {/* Subscription Entry Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8 sm:px-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSubModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-2xl font-extrabold text-[#1C1C1E]">Add Plan</h2><button onClick={() => setIsSubModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><X size={18} /></button></div>
            <form onSubmit={handleAddSubscription} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-6 px-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Service Name</label>
                <input autoFocus type="text" value={subForm.name} onChange={(e) => setSubForm({...subForm, name: e.target.value})} placeholder="Netflix, Spotify..." className="w-full bg-gray-50 rounded-2xl py-4 px-4 text-sm font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Price & Cycle</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={subForm.amount || ''} onChange={(e) => setSubForm({...subForm, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" className="flex-1 bg-gray-50 rounded-2xl py-4 px-4 text-xl font-extrabold outline-none" />
                  <select value={subForm.billingCycle} onChange={(e) => setSubForm({...subForm, billingCycle: e.target.value as BillingCycle})} className="bg-gray-50 rounded-2xl px-4 font-bold text-sm outline-none"><option value={BillingCycle.Monthly}>Monthly</option><option value={BillingCycle.Yearly}>Yearly</option></select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Next Billing Date</label>
                <input type="date" value={subForm.nextBillingDate} onChange={(e) => setSubForm({...subForm, nextBillingDate: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-4 text-sm font-bold outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Alert Me Before</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 3, 5].map((days) => (
                    <button key={days} type="button" onClick={() => setSubForm({ ...subForm, alertLeadDays: days, alertEnabled: true })} className={`py-3 rounded-2xl text-xs font-bold transition-all border ${subForm.alertLeadDays === days && subForm.alertEnabled ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>{days === 0 ? 'Day of' : `${days} Day${days > 1 ? 's' : ''}`}</button>
                  ))}
                </div>
                <button type="button" onClick={() => setSubForm({ ...subForm, alertEnabled: false })} className={`w-full py-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${!subForm.alertEnabled ? 'bg-gray-200 text-gray-700' : 'bg-white text-gray-400 border-gray-100'}`}>{!subForm.alertEnabled ? <BellOff size={14} /> : <Bell size={14} />} No Alerts</button>
              </div>
              <button type="submit" disabled={!subForm.name || !subForm.amount} className="w-full py-4 bg-blue-700 text-white rounded-[1.5rem] font-bold text-lg shadow-xl active:scale-95 transition-all mt-4">Save Subscription</button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-8 sm:px-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); resetForm(); }}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-extrabold text-[#1C1C1E]">Log Transaction</h2><button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><X size={18} /></button></div>
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="bg-gray-100 p-1 rounded-2xl flex"><button type="button" onClick={() => handleTypeChange(TransactionType.Expense)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Expense ? 'bg-white shadow-sm text-[#1C1C1E]' : 'text-gray-500'}`}>Expense</button><button type="button" onClick={() => handleTypeChange(TransactionType.Income)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${newType === TransactionType.Income ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>Income</button></div>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">{CURRENCY_SYMBOLS[currency]}</span><input autoFocus type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 rounded-2xl py-6 pl-12 pr-4 text-4xl font-extrabold outline-none" /></div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {(newType === TransactionType.Expense ? expenseCategories : incomeCategories).map((cat) => (
                    <button key={cat} type="button" onClick={() => { setNewCategory(cat); setNewNote(''); }} className={`h-11 rounded-xl flex items-center justify-center transition-all ${newCategory === cat ? 'scale-110 ring-2 ring-blue-300 shadow-md' : 'bg-gray-50 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`} style={{ backgroundColor: CATEGORY_METADATA[cat].color, color: 'white' }}>{CATEGORY_METADATA[cat].icon}</button>
                  ))}
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-xs font-black text-[#1C1C1E] uppercase tracking-wider">{newCategory}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CATEGORY_TAGS[newCategory]?.map((tag) => (
                      <button key={tag} type="button" onClick={() => setNewNote(tag)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${newNote === tag ? 'bg-blue-700 text-white border-blue-700' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>{tag}</button>
                    ))}
                  </div>
                </div>
              </div>

              <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Custom note..." className="w-full bg-gray-50 rounded-2xl py-4 px-4 text-sm font-bold outline-none" />
              <button type="submit" disabled={!isAmountValid} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${newType === TransactionType.Income ? 'bg-green-700 text-white' : 'bg-red-700 text-white'} ${!isAmountValid ? 'opacity-40 grayscale' : ''}`}>Save {newType === TransactionType.Income ? 'Income' : 'Expense'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

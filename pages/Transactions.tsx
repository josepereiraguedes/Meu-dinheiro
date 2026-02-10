import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, Input, Select } from '../components/RetroUI';
import { Plus, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Calendar as CalendarIcon, Filter, Edit2, Repeat, CreditCard, Sparkles, List } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { clsx } from 'clsx';

const Transactions: React.FC = () => {
  const { transactions, categories, accounts, addTransaction, editTransaction, deleteTransaction, suggestCategoryAndAccount } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [autoFilled, setAutoFilled] = useState(false); // Flag visual for AI interaction
  
  // Advanced Form State
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCurrent, setInstallmentCurrent] = useState('1');
  const [installmentTotal, setInstallmentTotal] = useState('12');

  // Set initial category/account IDs when data is loaded
  React.useEffect(() => {
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
  }, [categories, accounts, categoryId, accountId]);

  // SMART INPUT LOGIC: Auto-fill category/account based on description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    setAutoFilled(false); // Reset flag on typing

    if (!editingId && val.length > 2) {
      const suggestion = suggestCategoryAndAccount(val);
      if (suggestion.categoryId) {
        setCategoryId(suggestion.categoryId);
        setAutoFilled(true);
      }
      if (suggestion.accountId) {
        setAccountId(suggestion.accountId);
        setAutoFilled(true);
      }
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setDescription(t.description);
    setAmount(t.amount.toString());
    setDate(t.date.split('T')[0]);
    setType(t.type);
    setCategoryId(t.categoryId);
    setAccountId(t.accountId);
    setIsRecurring(t.isRecurring);
    setAutoFilled(false);
    
    if (t.installments) {
      setIsInstallment(true);
      setInstallmentCurrent(t.installments.current.toString());
      setInstallmentTotal(t.installments.total.toString());
    } else {
      setIsInstallment(false);
    }
    
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setIsRecurring(false);
    setIsInstallment(false);
    setAutoFilled(false);
    if (categories.length > 0) setCategoryId(categories[0].id);
    if (accounts.length > 0) setAccountId(accounts[0].id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    // Fallback if selects are empty
    const finalCatId = categoryId || categories[0]?.id;
    const finalAccId = accountId || accounts[0]?.id;

    const transactionData = {
      description,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      categoryId: finalCatId,
      accountId: finalAccId,
      type,
      isRecurring,
      installments: isInstallment ? {
        current: parseInt(installmentCurrent),
        total: parseInt(installmentTotal)
      } : undefined
    };

    if (editingId) {
      editTransaction(editingId, transactionData);
    } else {
      addTransaction(transactionData);
    }

    handleNew();
    setShowForm(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchMonth = tDate.getMonth().toString() === selectedMonth;
      const matchYear = tDate.getFullYear().toString() === selectedYear;
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchMonth && matchYear && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, selectedYear, searchTerm]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    
    return groups;
  }, [filteredTransactions]);

  const filteredCategories = categories.filter(c => c.type === type);

  const months = [
    { value: '0', label: 'Janeiro' }, { value: '1', label: 'Fevereiro' }, { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' }, { value: '4', label: 'Maio' }, { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' }, { value: '7', label: 'Agosto' }, { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' }, { value: '10', label: 'Novembro' }, { value: '11', label: 'Dezembro' }
  ];

  // Dynamic years based on data
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(new Date().getFullYear().toString()); // Always include current year
    
    transactions.forEach(t => {
        yearsSet.add(new Date(t.date).getFullYear().toString());
    });
    
    return Array.from(yearsSet).sort().reverse().map(y => ({ value: y, label: y }));
  }, [transactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // --- CALENDAR VIEW COMPONENT ---
  const CalendarView = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    const days = [];
    // Empty slots for days before start of month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-900/20 border border-white/5 opacity-50"></div>);
    }
    
    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const dateString = currentDate.toDateString();
        const dayTrans = groupedTransactions[dateString] || [];
        
        const dailyIncome = dayTrans.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const dailyExpense = dayTrans.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        
        const isToday = new Date().toDateString() === dateString;

        days.push(
            <div 
                key={d} 
                className={clsx(
                    "min-h-[6rem] md:min-h-[8rem] bg-slate-900/40 border border-white/5 p-2 relative hover:bg-slate-800/60 transition-colors group",
                    isToday && "bg-blue-900/20 border-blue-500/30"
                )}
                onClick={() => {
                   // Optional: Click to filter by this day or add transaction
                   setDate(new Date(year, month, d).toISOString().split('T')[0]);
                   handleNew();
                }}
            >
                <span className={clsx(
                    "absolute top-2 right-2 text-sm font-bold",
                    isToday ? "text-blue-400" : "text-slate-500"
                )}>{d}</span>
                
                <div className="mt-6 flex flex-col gap-1">
                    {dailyIncome > 0 && (
                        <div className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 truncate">
                            + {Math.round(dailyIncome)}
                        </div>
                    )}
                    {dailyExpense > 0 && (
                        <div className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 truncate">
                            - {Math.round(dailyExpense)}
                        </div>
                    )}
                    {dayTrans.length > 2 && (
                         <div className="text-[10px] text-slate-500 text-center mt-1">
                            + {dayTrans.length} items
                         </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase py-2">
                    {day}
                </div>
            ))}
            {days}
        </div>
    );
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wider text-shadow-glow">Extrato</h1>
            <p className="text-slate-400 text-sm">Gerencie suas movimentações financeiras</p>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <div className="bg-slate-900/50 p-1 rounded-xl border border-white/10 flex">
                <button 
                    onClick={() => setViewMode('list')}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                    title="Lista"
                >
                    <List size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'calendar' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                    title="Calendário"
                >
                    <CalendarIcon size={20} />
                </button>
            </div>
            <Button onClick={handleNew} icon={Plus} variant="primary" className="flex-1 md:flex-none">
                Novo
            </Button>
         </div>
       </div>

       {showForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
           <Card className="w-full max-w-lg border-blue-500/50 shadow-2xl shadow-blue-900/20 my-4">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-display font-bold uppercase text-white flex items-center gap-2">
                 {editingId ? 'Editar' : 'Nova'} 
                 {type === 'income' ? <span className="text-emerald-400">Receita</span> : <span className="text-rose-400">Despesa</span>}
               </h2>
               <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-5">
               <div className="flex p-1 bg-slate-950/50 rounded-xl border border-slate-700">
                 <button 
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm uppercase transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                   Despesa
                 </button>
                 <button 
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm uppercase transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                   Receita
                 </button>
               </div>

               <div className="relative">
                  <Input 
                    label="Descrição" 
                    placeholder="Ex: Assinatura Game Pass..." 
                    value={description} 
                    onChange={handleDescriptionChange} 
                  />
                  {autoFilled && !editingId && (
                     <div className="absolute top-0 right-0 flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded animate-pulse">
                        <Sparkles size={10} /> Auto-sugerido
                     </div>
                  )}
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <Input 
                   label="Valor" 
                   type="number" 
                   step="0.01" 
                   placeholder="0.00" 
                   value={amount} 
                   onChange={e => setAmount(e.target.value)} 
                 />
                 <Input 
                   label="Data" 
                   type="date" 
                   value={date} 
                   onChange={e => setDate(e.target.value)} 
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Categoria"
                    value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); setAutoFilled(false); }}
                    options={filteredCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
                    className={autoFilled ? "border-blue-500 ring-1 ring-blue-500/50" : ""}
                  />
                  <Select
                    label="Conta"
                    value={accountId}
                    onChange={e => { setAccountId(e.target.value); setAutoFilled(false); }}
                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                    className={autoFilled ? "border-blue-500 ring-1 ring-blue-500/50" : ""}
                  />
               </div>

               {/* Opções Avançadas */}
               <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-3">
                 <p className="text-xs font-bold text-slate-500 uppercase">Opções Adicionais</p>
                 
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isRecurring ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-800'}`}>
                      {isRecurring && <Repeat size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                    <span className={`text-sm ${isRecurring ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>Transação Recorrente (Mensal)</span>
                 </label>

                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isInstallment ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-800'}`}>
                      {isInstallment && <CreditCard size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} />
                    <span className={`text-sm ${isInstallment ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>Compra Parcelada</span>
                 </label>

                 {isInstallment && (
                   <div className="flex items-center gap-2 animate-in slide-in-from-top-2 pt-2">
                      <Input 
                        type="number" 
                        value={installmentCurrent} 
                        onChange={e => setInstallmentCurrent(e.target.value)} 
                        className="text-center"
                        placeholder="1"
                      />
                      <span className="text-slate-500">de</span>
                      <Input 
                        type="number" 
                        value={installmentTotal} 
                        onChange={e => setInstallmentTotal(e.target.value)} 
                        className="text-center"
                        placeholder="12"
                      />
                      <span className="text-slate-500 text-sm">parcelas</span>
                   </div>
                 )}
               </div>

               <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" variant={type === 'income' ? 'success' : 'danger'}>
                    {editingId ? 'Salvar Alterações' : 'Confirmar'}
                  </Button>
               </div>
             </form>
           </Card>
         </div>
       )}

       {/* Filters Bar */}
       <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
         <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
         </div>
         <div className="md:col-span-3">
            <Select options={months} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
         </div>
         <div className="md:col-span-3">
            <Select options={years} value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />
         </div>
       </div>

       {viewMode === 'calendar' ? (
          <div className="bg-slate-950/30 p-4 rounded-2xl border border-white/5">
             <CalendarView />
          </div>
       ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]: [string, Transaction[]]) => (
                <div key={date} className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 mb-3 pl-1">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800">
                    {formatDateHeader(date)}
                    </span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <div className="space-y-2">
                    {dayTransactions.map(t => {
                        const category = categories.find(c => c.id === t.categoryId);
                        const account = accounts.find(a => a.id === t.accountId);
                        return (
                        <div key={t.id} className="group bg-slate-900/60 backdrop-blur-sm border border-white/5 hover:border-blue-500/30 rounded-xl p-3 flex items-center justify-between transition-all hover:translate-x-1 hover:shadow-lg hover:shadow-blue-900/10 relative">
                            <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl bg-slate-800 border border-white/5 group-hover:scale-110 transition-transform ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-base text-white leading-tight">{t.description}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] px-1.5 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase tracking-wide">{category?.name || 'Sem Categoria'}</span>
                                {t.isRecurring && (
                                    <span className="text-[10px] px-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                    <Repeat size={8} /> Mensal
                                    </span>
                                )}
                                {t.installments && (
                                    <span className="text-[10px] px-1.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                    <CreditCard size={8} /> {t.installments.current}/{t.installments.total}
                                    </span>
                                )}
                                </div>
                            </div>
                            </div>
                            <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <span className={`text-lg font-display font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </span>
                                <p className="text-[10px] text-slate-500">{account?.name || 'Conta Excluída'}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar">
                                <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Excluir">
                                <Trash2 size={14} />
                                </button>
                            </div>
                            {/* Mobile Price View (Always visible) */}
                            <div className="sm:hidden text-right">
                                <span className={`text-base font-display font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'income' ? '+' : '-'} {Math.round(t.amount)}
                                </span>
                            </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
                </div>
            ))}
            
            {filteredTransactions.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
                <Filter className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-lg">Nenhuma transação encontrada neste período.</p>
                <Button variant="secondary" className="mt-4" onClick={handleNew}>Adicionar Novo</Button>
                </div>
            )}
        </div>
       )}
    </div>
  );
};

export default Transactions;
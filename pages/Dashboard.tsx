import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, NumberTicker, Input, Select } from '../components/RetroUI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, Zap, Check, TrendingUp, Trophy, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, totalBalance, transactions, accounts, categories, budgets, getBudgetStatus, addTransaction, financialHealth, forecast } = useFinance();

  // Quick Coin State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Filter expense categories for quick add
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);

  // Set default category when available
  useEffect(() => {
    if (expenseCategories.length > 0 && !quickCategoryId) {
      setQuickCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, quickCategoryId]);

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Credit Card Logic
  const creditCards = accounts.filter(a => a.type === 'credit_card');
  
  // --- SMART CHART LOGIC: Aggregated Daily Flow (Last 7 Days) ---
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(0, 0, 0, 0);
        
        const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        
        // Sum transactions for this specific day
        const dayTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0,0,0,0);
            return tDate.getTime() === d.getTime();
        });

        const income = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
            
        const expense = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        data.push({
            name: dayStr,
            receita: income,
            despesa: expense
        });
    }
    return data;
  }, [transactions]);

  // Pie Chart Data (Expenses by Category)
  const categoryExpenses = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const total = monthlyTransactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color.replace('text-', 'bg-').replace('-400', '-500')
      };
    })
    .filter(item => item.value > 0);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || !quickDesc) return;
    
    // Find checking account for default
    const defAcc = accounts.find(a => a.type === 'checking') || accounts[0];
    const finalCatId = quickCategoryId || expenseCategories[0]?.id || categories[0].id;

    setIsQuickAdding(true);
    
    setTimeout(() => {
      addTransaction({
        description: quickDesc,
        amount: parseFloat(quickAmount),
        date: new Date().toISOString(),
        type: 'expense',
        categoryId: finalCatId,
        accountId: defAcc.id,
        isRecurring: false
      });
      setQuickAmount('');
      setQuickDesc('');
      setIsQuickAdding(false);
    }, 600); // Fake Loading for effect
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
         <div>
            <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wide text-shadow-glow">
              Painel de Controle
            </h1>
            <p className="text-slate-400">Bem-vindo de volta, {user.name}.</p>
         </div>
         
         {/* Financial Level Widget (XP Bar) */}
         <div className="flex items-center gap-3 bg-slate-900/60 p-2 pr-4 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white shadow-inner">
               <Trophy size={20} />
            </div>
            <div>
               <div className="flex justify-between items-end text-xs mb-1">
                  <span className="text-yellow-400 font-bold uppercase tracking-wider">{financialHealth.level}</span>
                  <span className="text-slate-400 font-mono">{financialHealth.score}/100 XP</span>
               </div>
               <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                    style={{ width: `${financialHealth.score}%` }}
                  ></div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance */}
        <Card className="lg:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Saldo Geral</span>
                <div className="text-5xl md:text-6xl font-display font-bold text-white mt-2 tracking-tight drop-shadow-lg">
                  <NumberTicker value={totalBalance} prefix="R$ " />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Wallet className="w-8 h-8" />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Link to="/transactions">
                <Button variant="success" className="text-sm" icon={ArrowUpRight}>
                  Receita
                </Button>
              </Link>
              <Link to="/transactions">
                <Button variant="danger" className="text-sm" icon={ArrowDownRight}>
                  Despesa
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
           {/* Smart Forecast Widget */}
           <div className={`relative bg-gradient-to-br border rounded-xl p-4 shadow-lg overflow-hidden
              ${forecast.status === 'safe' ? 'from-emerald-900/40 to-slate-900 border-emerald-500/30' : 
                forecast.status === 'warning' ? 'from-yellow-900/40 to-slate-900 border-yellow-500/30' : 
                'from-red-900/40 to-slate-900 border-red-500/30'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                 <TrendingUp size={16} className={
                   forecast.status === 'safe' ? 'text-emerald-400' : 
                   forecast.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                 } />
                 <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Previsão Mensal</span>
              </div>
              
              <div className="flex justify-between items-end mb-1">
                 <p className="text-2xl font-display font-bold text-white">
                   <NumberTicker value={forecast.projectedExpense} prefix="R$ " />
                 </p>
                 <span className="text-xs text-slate-400 mb-1">estimado</span>
              </div>
              
              <p className="text-xs text-slate-300 leading-relaxed">
                {forecast.status === 'safe' 
                  ? "Ritmo seguro. Você deve terminar o mês no azul."
                  : forecast.status === 'warning' 
                  ? "Cuidado. Seu ritmo atual de gastos está próximo da sua renda."
                  : "Alerta Crítico: Projeção indica saldo negativo se continuar assim."}
              </p>
           </div>
           
           {/* Quick Coin Widget */}
           <Card className="border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              
              <h3 className="text-sm font-bold uppercase text-emerald-400 mb-3 mt-2 flex items-center gap-2">
                 <Zap size={16} /> Despesa Rápida
              </h3>
              <form onSubmit={handleQuickAdd} className="space-y-3">
                 <Input 
                   placeholder="O que você comprou?" 
                   value={quickDesc} 
                   onChange={e => setQuickDesc(e.target.value)}
                   className="text-sm py-2"
                 />

                 <Select 
                    value={quickCategoryId}
                    onChange={e => setQuickCategoryId(e.target.value)}
                    options={expenseCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
                    className="text-sm py-2"
                 />

                 <div className="flex gap-2">
                   <Input 
                      type="number" 
                      placeholder="Valor" 
                      value={quickAmount} 
                      onChange={e => setQuickAmount(e.target.value)}
                      className="text-sm py-2"
                   />
                   <Button type="submit" variant="primary" disabled={isQuickAdding} className="px-3">
                     {isQuickAdding ? <Check size={18} /> : <ArrowRight size={18} />}
                   </Button>
                 </div>
              </form>
           </Card>
        </div>
      </div>
      
      {/* Credit Cards Section */}
      {creditCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {creditCards.map(card => {
             const limit = card.creditLimit || 0;
             const used = Math.abs(card.balance); // Assuming negative balance is debt
             const available = limit - used;
             const percentage = limit > 0 ? (used / limit) * 100 : 0;
             
             return (
               <Card key={card.id} title={`${card.name} (Fatura)`} className="border-rose-500/20">
                  <div className="flex justify-between items-end mb-2">
                     <div>
                       <p className="text-slate-400 text-xs uppercase">Limite Disponível</p>
                       <p className="text-2xl font-bold text-white">
                         <NumberTicker value={available} prefix="R$ " />
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-slate-400 text-xs uppercase">Fatura Atual</p>
                       <p className="text-xl font-bold text-rose-400">
                         <NumberTicker value={used} prefix="R$ " />
                       </p>
                     </div>
                  </div>
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-rose-500 transition-all duration-1000"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                     <span className="text-[10px] text-slate-500">0%</span>
                     <span className="text-[10px] text-slate-500">{Math.round(percentage)}% Utilizado</span>
                     <span className="text-[10px] text-slate-500">100%</span>
                  </div>
               </Card>
             );
           })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Charts Row */}
        <div className="lg:col-span-2 space-y-6">
           {/* Bar Chart - NOW AGGREGATED */}
           <Card title="Fluxo Recente (7 Dias)" className="min-h-[300px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'Inter'}} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'Inter'}} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-300 ml-1 text-xs uppercase font-bold">{value}</span>}
                />
                <Bar name="Receita" dataKey="receita" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar name="Despesa" dataKey="despesa" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
           </Card>

           {/* Pie Chart (Expenses by Category) */}
           {categoryExpenses.length > 0 && (
             <Card title="Gastos por Categoria" className="min-h-[300px]">
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie
                     data={categoryExpenses}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {categoryExpenses.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                   />
                   <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      formatter={(value, entry: any) => <span className="text-slate-300 ml-1 text-sm">{value}</span>}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </Card>
           )}
        </div>

        {/* Right Column: Accounts & Budget Summary */}
        <div className="space-y-6">
           {/* Accounts List */}
           <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-display font-bold text-xl text-white">Minhas Contas</h3>
               <Link to="/settings">
                 <button className="text-xs text-blue-400 hover:text-blue-300 underline">Gerenciar</button>
               </Link>
             </div>
             {accounts.map(acc => (
               <div key={acc.id} className="relative group bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800/60 transition-all hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl ${acc.color} drop-shadow-md group-hover:scale-110 transition-transform duration-300`}>{acc.icon}</div>
                    <div>
                      <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{acc.name}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium">{acc.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <p className="font-display font-bold text-lg text-white">
                    <NumberTicker value={acc.balance} prefix="R$ " />
                  </p>
               </div>
             ))}
           </div>
           
           {/* Budget Health Summary (Mini) */}
           {budgets.length > 0 && (
             <Card title="Alertas de Orçamento" className="border-yellow-500/20">
               <div className="space-y-3">
                 {budgets.slice(0, 3).map(budget => {
                   const cat = categories.find(c => c.id === budget.categoryId);
                   const status = getBudgetStatus(budget.categoryId);
                   const isDanger = status.percent > 90;
                   const isWarning = status.percent > 70;
                   const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500';

                   return (
                     <div key={budget.categoryId} className="space-y-1">
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-300 flex items-center gap-1">{cat?.icon} {cat?.name}</span>
                          <span className={`${isDanger ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                            {status.percent.toFixed(0)}%
                          </span>
                       </div>
                       <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full ${barColor} rounded-full`} style={{ width: `${status.percent}%` }}></div>
                       </div>
                     </div>
                   )
                 })}
                 <Link to="/planning" className="block text-center text-xs text-blue-400 hover:text-white mt-2">Ver Detalhes</Link>
               </div>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
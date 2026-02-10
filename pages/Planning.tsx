import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, Input } from '../components/RetroUI';
import { Shield, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Planning: React.FC = () => {
  const { categories, budgets, setBudget, getBudgetStatus } = useFinance();
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Local state for editing to avoid constant re-renders on context updates while typing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (catId: string, currentLimit: number) => {
    setEditingId(catId);
    setEditValue(currentLimit.toString());
  };

  const handleSave = (catId: string) => {
    const val = parseFloat(editValue);
    setBudget(catId, val);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
           <Shield className="w-8 h-8 text-purple-500" />
        </div>
        <div>
           <h1 className="text-4xl font-display font-bold uppercase text-white tracking-wide text-shadow-glow">Planejamento</h1>
           <p className="text-slate-400">Defina limites de "HP Financeiro" para suas categorias.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenseCategories.map(cat => {
          const status = getBudgetStatus(cat.id);
          const hasBudget = status.limit > 0;
          
          // Visual Health Logic
          const isCritical = status.percent >= 90;
          const isWarning = status.percent >= 70 && status.percent < 90;
          
          let barColor = 'from-emerald-500 to-green-400';
          let glowColor = 'shadow-emerald-500/20';
          let borderColor = 'border-emerald-500/20';
          
          if (isWarning) {
            barColor = 'from-yellow-500 to-amber-400';
            glowColor = 'shadow-yellow-500/20';
            borderColor = 'border-yellow-500/20';
          }
          if (isCritical) {
            barColor = 'from-red-600 to-rose-500';
            glowColor = 'shadow-red-500/20';
            borderColor = 'border-red-500/20';
          }
          
          if (!hasBudget) {
             borderColor = 'border-slate-700 border-dashed';
          }

          return (
            <Card key={cat.id} className={`transition-all duration-300 ${borderColor} ${hasBudget ? 'hover:scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-500">Gasto Mensal</p>
                  </div>
                </div>
                {isCritical && hasBudget && <AlertTriangle className="text-red-500 animate-pulse" size={20} />}
                {!isCritical && hasBudget && <CheckCircle2 className="text-emerald-500" size={20} />}
              </div>

              {hasBudget ? (
                <>
                  <div className="mb-2 flex justify-between items-end">
                    <span className={`text-2xl font-display font-bold ${isCritical ? 'text-red-400' : 'text-white'}`}>
                      R$ {status.spent.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-sm text-slate-400 font-mono mb-1">
                      / {status.limit.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* HP Bar */}
                  <div className={`h-4 bg-slate-950 rounded-lg overflow-hidden border border-white/5 relative ${glowColor} shadow-lg`}>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                     <div 
                        className={`h-full bg-gradient-to-r ${barColor} transition-all duration-700 relative`}
                        style={{ width: `${Math.min(status.percent, 100)}%` }}
                     >
                        <div className="absolute top-0 right-0 bottom-0 w-px bg-white/50"></div>
                     </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                     {editingId === cat.id ? (
                       <div className="flex gap-2 w-full animate-in fade-in slide-in-from-right-4">
                         <Input 
                            type="number" 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)} 
                            className="py-1 text-sm"
                            autoFocus
                         />
                         <Button variant="success" onClick={() => handleSave(cat.id)} className="px-3 py-1 text-xs">OK</Button>
                       </div>
                     ) : (
                       <button onClick={() => handleStartEdit(cat.id, status.limit)} className="text-xs text-slate-500 hover:text-blue-400 underline">
                         Ajustar Limite
                       </button>
                     )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 gap-3">
                   <p className="text-sm text-slate-500 text-center">Sem limite definido</p>
                   {editingId === cat.id ? (
                       <div className="flex gap-2 w-full">
                         <Input 
                            type="number" 
                            placeholder="R$ 0,00"
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)} 
                            className="py-1 text-sm"
                            autoFocus
                         />
                         <Button variant="primary" onClick={() => handleSave(cat.id)} className="px-3 py-1 text-xs">OK</Button>
                       </div>
                   ) : (
                     <Button variant="secondary" className="w-full text-sm border-dashed" onClick={() => handleStartEdit(cat.id, 0)}>
                       Definir Orçamento
                     </Button>
                   )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Planning;
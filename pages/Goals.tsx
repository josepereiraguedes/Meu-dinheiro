import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, Button, Input } from '../components/RetroUI';
import { Trophy, Target, Zap } from 'lucide-react';
import { Confetti } from '../components/Confetti';

const Goals: React.FC = () => {
  const { goals, addGoal, updateGoalAmount } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;

    // Select a random color and icon for the goal to simplify input
    const colors = ['text-cyan-400', 'text-purple-400', 'text-emerald-400', 'text-rose-400', 'text-yellow-400'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      deadline,
      icon: '🎯',
      color: randomColor
    });

    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setShowForm(false);
  };

  const handleAddFunds = async (goal: any) => {
     // Add 10% of target or remaining, whichever is smaller, or just a fixed amount simulation
     // For simplicity in this demo, we add a fixed amount or complete it if close.
     // In a real app, this would open a modal to ask "How much?".
     // Let's assume we add 10% of the target.
     const amountToAdd = goal.targetAmount * 0.10;
     
     // Check for completion trigger
     const newAmount = goal.currentAmount + amountToAdd;
     if (newAmount >= goal.targetAmount && goal.currentAmount < goal.targetAmount) {
         setShowCelebration(true);
         setTimeout(() => setShowCelebration(false), 5000);
     }

     updateGoalAmount(goal.id, amountToAdd);
  };

  return (
    <div className="space-y-8 relative">
      {showCelebration && <Confetti />}

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
           <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <div>
           <h1 className="text-4xl font-display font-bold uppercase text-white tracking-wide text-shadow-glow">Metas</h1>
           <p className="text-slate-400">Acompanhe seus objetivos financeiros.</p>
        </div>
      </div>

       {showForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <Card className="w-full max-w-lg border-yellow-500/50 shadow-2xl shadow-yellow-900/20">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-display font-bold uppercase text-white flex items-center gap-2">
                 <span className="text-yellow-400">Nova Meta</span>
               </h2>
               <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-5">
               <Input 
                 label="Nome da Meta" 
                 placeholder="Ex: PC Gamer..." 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
               />
               
               <div className="grid grid-cols-2 gap-4">
                 <Input 
                   label="Objetivo (R$)" 
                   type="number" 
                   step="0.01" 
                   value={targetAmount} 
                   onChange={e => setTargetAmount(e.target.value)} 
                 />
                 <Input 
                   label="Já guardado (R$)" 
                   type="number" 
                   step="0.01" 
                   value={currentAmount} 
                   onChange={e => setCurrentAmount(e.target.value)} 
                 />
               </div>

               <Input 
                 label="Prazo Final" 
                 type="date" 
                 value={deadline} 
                 onChange={e => setDeadline(e.target.value)} 
               />

               <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary">Criar Meta</Button>
               </div>
             </form>
           </Card>
         </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isComplete = progress >= 100;

          return (
            <Card key={goal.id} className="relative group hover:border-blue-500/40 transition-colors">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

               {isComplete && (
                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl animate-in fade-in duration-500">
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-bounce">
                      <p className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                        <Trophy size={24} /> Meta Concluída
                      </p>
                    </div>
                 </div>
               )}

               <div className="flex justify-between items-start mb-6 relative z-10">
                 <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-slate-800 ${goal.color}`}>
                     {goal.icon}
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{goal.name}</h2>
                     <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                        <span>PRAZO:</span>
                        <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-3xl font-display font-bold text-white">{Math.floor(progress)}%</p>
                 </div>
               </div>

               {/* Modern Progress Bar */}
               <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden mb-5 border border-white/5 shadow-inner">
                 <div 
                   className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out flex items-center relative overflow-hidden ${isComplete ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
                   style={{ width: `${progress}%` }}
                 >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                 </div>
               </div>

               <div className="flex justify-between items-center relative z-10">
                  <div className="text-sm">
                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Progresso Atual</p>
                    <p className="text-white font-mono">
                      <span className="text-blue-400">R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> <span className="text-slate-600">/</span> R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <Button 
                    className="py-1.5 px-4 text-sm" 
                    variant="primary"
                    disabled={isComplete}
                    onClick={() => handleAddFunds(goal)}
                    icon={Zap}
                    title="Adicionar 10%"
                  >
                    Boost
                  </Button>
               </div>
            </Card>
          );
        })}
        
        {/* Create New Goal Button - Now Functional */}
        <button 
          onClick={() => setShowForm(true)}
          className="h-full min-h-[200px] border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-400 hover:bg-slate-900/50 transition-all group cursor-pointer"
        >
           <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
              <Target className="w-8 h-8" />
           </div>
           <span className="font-display font-bold text-lg uppercase tracking-widest">Nova Meta</span>
        </button>
      </div>
    </div>
  );
};

export default Goals;
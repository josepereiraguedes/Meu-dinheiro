import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/RetroUI';
import { Trophy, Lock, Star } from 'lucide-react';
import { clsx } from 'clsx';

const Achievements: React.FC = () => {
  const { achievements, financialHealth } = useFinance();
  
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const progress = (unlockedCount / achievements.length) * 100;

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
         <div>
            <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wide text-shadow-glow">
              Sala de Troféus
            </h1>
            <p className="text-slate-400">Suas conquistas financeiras.</p>
         </div>
         
         {/* Level Badge */}
         <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold shadow-lg">
                <Star size={24} fill="currentColor" />
            </div>
            <div>
                <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Nível Atual</p>
                <p className="text-xl font-display font-bold text-white">{financialHealth.level}</p>
            </div>
         </div>
      </div>

      {/* Progress Bar */}
      <Card className="border-yellow-500/20">
         <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} /> Progresso Total
            </h3>
            <span className="text-yellow-500 font-mono font-bold">{Math.round(progress)}%</span>
         </div>
         <div className="h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div 
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 relative"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-white/20 w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
         </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {achievements.map(achievement => {
             const isUnlocked = !!achievement.unlockedAt;
             return (
                 <div 
                    key={achievement.id}
                    className={clsx(
                        "relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden min-h-[140px] flex flex-col justify-between",
                        isUnlocked 
                            ? "bg-slate-900/60 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:scale-[1.02]" 
                            : "bg-slate-950/40 border-slate-800 opacity-60 grayscale hover:opacity-80"
                    )}
                 >
                    {/* Glow Effect for Unlocked */}
                    {isUnlocked && <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl group-hover:bg-yellow-500/30 transition-colors"></div>}

                    <div className="flex justify-between items-start relative z-10">
                        <div className={clsx(
                            "w-12 h-12 rounded-lg flex items-center justify-center text-3xl shadow-inner",
                            isUnlocked ? "bg-slate-800" : "bg-slate-900"
                        )}>
                            {isUnlocked ? achievement.icon : <Lock size={20} className="text-slate-600" />}
                        </div>
                        {isUnlocked && (
                            <span className="text-[10px] font-mono text-yellow-500/80 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/20">
                                {new Date(achievement.unlockedAt!).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    
                    <div className="mt-3 relative z-10">
                        <h4 className={clsx("font-display font-bold text-lg", isUnlocked ? "text-white" : "text-slate-500")}>
                            {achievement.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {achievement.description}
                        </p>
                    </div>

                    {isUnlocked && (
                         <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-yellow-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                             +{achievement.xpReward} XP
                         </div>
                    )}
                 </div>
             )
         })}
      </div>
    </div>
  );
};

export default Achievements;
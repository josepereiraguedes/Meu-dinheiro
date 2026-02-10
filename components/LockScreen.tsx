import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Lock, Unlock, Delete } from 'lucide-react';
import { clsx } from 'clsx';

export const LockScreen: React.FC = () => {
  const { unlockApp } = useFinance();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (pin.length === 4) {
      // Small delay to let user see the 4th dot filled
      const timer = setTimeout(() => {
          const success = unlockApp(pin);
          if (!success) {
            setError(true);
            setTimeout(() => {
                setPin("");
                setError(false);
            }, 400); 
          }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pin, unlockApp]);

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background FX */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs">
         <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
               <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-widest uppercase mt-2">Segurança</h1>
            <p className="text-slate-500 text-sm">Digite seu PIN para acessar</p>
         </div>

         {/* PIN Dots */}
         <div className={clsx("flex gap-4 mb-4 transition-transform", error && "animate-[shake_0.4s_ease-in-out]")}>
            {[0, 1, 2, 3].map(i => (
               <div 
                 key={i} 
                 className={clsx(
                    "w-4 h-4 rounded-full border border-blue-500/50 transition-all duration-200",
                    i < pin.length ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] scale-110" : "bg-transparent"
                 )}
               ></div>
            ))}
         </div>

         {/* Keypad */}
         <div className="grid grid-cols-3 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
               <button 
                  key={num}
                  onClick={() => handlePress(num.toString())}
                  className="w-16 h-16 rounded-full bg-slate-900/50 border border-white/5 text-2xl font-display font-bold text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
               >
                  {num}
               </button>
            ))}
            <div className="w-16 h-16"></div> {/* Spacer */}
            <button 
                  onClick={() => handlePress("0")}
                  className="w-16 h-16 rounded-full bg-slate-900/50 border border-white/5 text-2xl font-display font-bold text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
               >
                  0
            </button>
            <button 
                  onClick={handleDelete}
                  className="w-16 h-16 rounded-full text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center mx-auto"
               >
                  <Delete size={24} />
            </button>
         </div>
      </div>
    </div>
  );
};
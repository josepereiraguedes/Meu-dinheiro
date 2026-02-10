import React, { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { LucideIcon, X, CheckCircle2, AlertCircle, Sparkles, Upload, Camera, Trophy } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

// Refactored to generic names to fit any theme (Modern/Retro)

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  color?: string; 
}

export const Card: React.FC<CardProps> = ({ children, className, title, color }) => {
  return (
    <div className={clsx(
      "relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
      className
    )}>
      {title && (
        <div className="mb-4 border-b border-white/10 pb-2">
          <h3 className="text-lg font-display font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
             {title}
          </h3>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', icon: Icon, ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 border-blue-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/20 border-red-500/30',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/20 border-emerald-500/30',
  };

  return (
    <button
      className={clsx(
        "relative group px-5 py-2.5 rounded-xl font-display font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 border active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      {Icon && <Icon className="w-5 h-5" strokeWidth={2} />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-display font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}
      <input
        className={clsx(
          "bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 hover:border-slate-600",
          className
        )}
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-display font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative">
        <select
          className={clsx(
            "w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-white outline-none appearance-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 hover:border-slate-600 cursor-pointer",
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
};

// --- ICON SELECTOR ---
const COMMON_ICONS = [
  "💰", "🏦", "💳", "💵", "🪙", "👛", "💎", 
  "🍔", "🛒", "🛍️", "🚗", "⛽", "🚌", "✈️", 
  "🏠", "💡", "🔌", "📡", "💊", "💪", "🎮", 
  "🎬", "🎵", "📚", "🎓", "👶", "👕", "🎁", 
  "🔧", "💼", "📈", "⚡", "🐾", "🍺", "☕", 
  "🏝️", "🚫", "🍕", "🏥", "🦷", "👠", "👓"
];

interface IconSelectorProps {
  selected: string;
  onSelect: (icon: string) => void;
  label?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ selected, onSelect, label }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-display font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}
      <div className="grid grid-cols-7 gap-2 p-3 bg-slate-950/50 border border-slate-700 rounded-xl h-40 overflow-y-auto custom-scrollbar">
        {COMMON_ICONS.map(emoji => (
          <button
            type="button"
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={clsx(
              "w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all",
              selected === emoji 
                ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- AVATAR INPUT (Image Upload or Emoji) ---
const AVATARS = ['🕹️', '👾', '🚀', '👽', '🤖', '🐱', '💀', '💎'];

interface AvatarInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const AvatarInput: React.FC<AvatarInputProps> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isImage = value.startsWith('data:') || value.startsWith('http');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.3)] group">
             {isImage ? (
               <img src={value} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-4xl">{value}</div>
             )}
             
             {/* Upload Overlay */}
             <div 
               className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
             >
                <Camera className="text-white w-8 h-8" />
             </div>
          </div>
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*"
             onChange={handleFileChange} 
          />
       </div>

       <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
         <p className="text-center text-xs text-slate-400 mb-2 uppercase tracking-wide">Ou escolha um clássico</p>
         <div className="flex justify-center gap-2 flex-wrap">
            {AVATARS.map(av => (
              <button
                key={av}
                type="button"
                onClick={() => onChange(av)}
                className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all",
                  value === av 
                    ? "bg-blue-600 text-white scale-110 shadow-lg" 
                    : "bg-slate-800 hover:bg-slate-700"
                )}
              >
                {av}
              </button>
            ))}
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                title="Fazer Upload"
              >
                <Upload size={18} />
              </button>
         </div>
       </div>
    </div>
  );
};

// --- NEW UX COMPONENTS ---

export const NumberTicker: React.FC<{ value: number, className?: string, prefix?: string }> = ({ value, className, prefix = '' }) => {
  const { isPrivacyMode } = useFinance();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 1000; // 1s animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (isPrivacyMode) {
     return (
        <span className={clsx(className, "blur-md select-none")}>
           {prefix}----
        </span>
     );
  }

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

export const Toast: React.FC<{ message: string, type: 'success' | 'error' | 'info' | 'achievement', onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-slate-900 border-emerald-500 text-emerald-400',
    error: 'bg-slate-900 border-rose-500 text-rose-400',
    info: 'bg-slate-900 border-blue-500 text-blue-400',
    achievement: 'bg-slate-900 border-yellow-500 text-yellow-400',
  };

  const icons = {
    success: <CheckCircle2 className="w-6 h-6" />,
    error: <AlertCircle className="w-6 h-6" />,
    info: <AlertCircle className="w-6 h-6" />,
    achievement: <Trophy className="w-6 h-6 text-yellow-500" />
  };

  return (
    <div className={clsx(
      "fixed top-4 md:bottom-8 md:top-auto right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border-l-4 shadow-2xl animate-in slide-in-from-right duration-300 max-w-sm w-full",
      styles[type]
    )}>
      <div className="shrink-0">
        {icons[type]}
      </div>
      <div className="flex-1 font-display font-bold tracking-wide">
         {type === 'error' ? 'ATENÇÃO' : type === 'achievement' ? 'CONQUISTA' : 'SISTEMA'}
         <p className="font-sans font-normal text-sm opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
        <X size={16} />
      </button>
    </div>
  );
};
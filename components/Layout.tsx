import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, WalletCards, Target, Settings, Gamepad2, Map, Eye, EyeOff, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import { useFinance } from '../context/FinanceContext';
import { Toast } from './RetroUI';
import { Mascot } from './Mascot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, notification, clearNotification, isPrivacyMode, togglePrivacy } = useFinance();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Painel' },
    { to: '/planning', icon: Map, label: 'Orçamento' },
    { to: '/transactions', icon: WalletCards, label: 'Extrato' },
    { to: '/goals', icon: Target, label: 'Metas' },
    { to: '/achievements', icon: Trophy, label: 'Troféus' }, // New
    { to: '/settings', icon: Settings, label: 'Config' },
  ];

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 rounded-full"></div>
        <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-blue-400 relative z-10" />
      </div>
      <div>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase tracking-wider text-white">
          Meu <span className="text-blue-500">Dinheiro</span>
        </h1>
      </div>
    </div>
  );

  const isImageAvatar = user.avatar.startsWith('data:') || user.avatar.startsWith('http');

  const PrivacyButton = () => (
      <button 
        onClick={togglePrivacy}
        className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all border border-white/5"
        title={isPrivacyMode ? "Mostrar Valores" : "Esconder Valores"}
      >
          {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
  );

  return (
    <div className="min-h-screen bg-transparent">
      
      {/* Toast Notification Layer */}
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={clearNotification} 
        />
      )}

      {/* BIT - O Mascote */}
      <Mascot />

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 z-50 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 p-6">
        <div className="mb-10 px-2 pt-2">
          <Logo />
        </div>

        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 p-3.5 rounded-xl text-lg font-medium transition-all duration-300 group",
                isActive 
                  ? "bg-gradient-to-r from-blue-600/20 to-blue-600/5 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={clsx("w-6 h-6 transition-transform group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-display tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        <div className="mt-auto flex flex-col gap-4">
            <div className="px-2">
                <button 
                    onClick={togglePrivacy}
                    className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors w-full p-2 hover:bg-white/5 rounded-lg text-sm"
                >
                    {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                    {isPrivacyMode ? "Modo Discreto Ativo" : "Ocultar Valores"}
                </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-xl text-white shadow-lg overflow-hidden border border-white/10">
                    {isImageAvatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        user.avatar
                    )}
                    </div>
                    <div>
                    <p className="text-sm font-bold text-white truncate max-w-[120px]">{user.name}</p>
                    <p className="text-xs text-blue-400 font-bold">Gerenciando</p>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 z-40 flex items-center px-4 justify-between shadow-lg">
        <Logo />
        <div className="flex items-center gap-3">
            <PrivacyButton />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white shadow-md overflow-hidden border border-white/10">
              {isImageAvatar ? (
                 <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
               ) : (
                 user.avatar
               )}
            </div>
        </div>
      </header>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 z-50 flex items-center justify-around px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] safe-area-bottom">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-300 w-full",
                isActive 
                  ? "text-blue-400" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={clsx("relative p-1 rounded-full transition-all", isActive && "bg-blue-500/20")}>
                    <item.icon className={clsx("w-5 h-5", isActive ? "scale-110" : "")} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={clsx("text-[10px] font-display font-bold uppercase tracking-wide transition-all duration-300", isActive ? "opacity-100 max-h-4" : "opacity-0 max-h-0 overflow-hidden")}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-72 min-h-screen flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
           <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Content Wrapper */}
        <div className="flex-1 p-4 pt-20 pb-24 md:p-8 md:pt-8 md:pb-8 max-w-5xl mx-auto w-full relative z-10">
           {children}
        </div>
      </main>
    </div>
  );
};
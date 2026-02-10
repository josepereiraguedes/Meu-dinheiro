import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Budget, Category, FinanceContextType, Goal, Notification, Transaction, UserProfile, Achievement } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_GOALS, INITIAL_TRANSACTIONS, ACHIEVEMENTS_LIST } from '../constants';
import { dbAPI, migrateFromLocalStorage } from '../db';

// Interface estendida para incluir funções de inteligência
interface IntelligentFinanceContextType extends FinanceContextType {
  financialHealth: {
    score: number; // 0-100
    level: string;
    xp: number;
    nextLevelXp: number;
  };
  forecast: {
    projectedExpense: number;
    status: 'safe' | 'warning' | 'danger';
    diff: number;
  };
  suggestCategoryAndAccount: (description: string) => { categoryId?: string, accountId?: string };
}

const FinanceContext = createContext<IntelligentFinanceContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  name: 'Usuário',
  avatar: '👤',
  onboardingCompleted: false,
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // --- STATE ---
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Privacy & Security State
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadData = async () => {
      try {
        await migrateFromLocalStorage();
        
        const [
          dbUser,
          dbAccounts,
          dbCategories,
          dbTransactions,
          dbGoals,
          dbBudgets,
          dbAchievements
        ] = await Promise.all([
          dbAPI.get<UserProfile>('system', 'user'),
          dbAPI.getAll<Account>('accounts'),
          dbAPI.getAll<Category>('categories'),
          dbAPI.getAll<Transaction>('transactions'),
          dbAPI.getAll<Goal>('goals'),
          dbAPI.getAll<Budget>('budgets'),
          dbAPI.getAll<Achievement>('system') // Storing unlocked achievements in system for now or specialized store
        ]);

        if (dbUser) {
           setUser(dbUser);
           // If user has a PIN, lock the app on startup
           if (dbUser.securityPin) {
             setIsLocked(true);
           }
        }

        if (dbUser?.onboardingCompleted) {
           setAccounts(dbAccounts || []);
           setCategories(dbCategories || []);
           setTransactions(dbTransactions || []);
           setGoals(dbGoals || []);
           setBudgets(dbBudgets || []);
           
           // Merge unlocked status with base list
           const unlockedIds = (dbAchievements || []).map((a: any) => a.id);
           const mergedAchievements = ACHIEVEMENTS_LIST.map(base => {
             const unlocked = (dbAchievements || []).find((u: any) => u.id === base.id);
             return unlocked ? { ...base, unlockedAt: unlocked.unlockedAt } : base;
           });
           setAchievements(mergedAchievements);

           checkRecurringTransactions(dbTransactions || []);
        } else {
           setCategories(INITIAL_CATEGORIES); 
        }

      } catch (error) {
        console.error("Failed to load database:", error);
        showNotification("Erro ao carregar banco de dados.", 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- RECURRING LOGIC ---
  const checkRecurringTransactions = (currentTransactions: Transaction[]) => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const recurring = currentTransactions.filter(t => t.isRecurring);
      
      let count = 0;
      recurring.forEach(rec => {
          const recDate = new Date(rec.date);
          if (recDate.getMonth() !== currentMonth || recDate.getFullYear() !== currentYear) {
              const hasCopy = currentTransactions.some(t => 
                  t.description === rec.description && 
                  t.amount === rec.amount &&
                  new Date(t.date).getMonth() === currentMonth &&
                  new Date(t.date).getFullYear() === currentYear
              );
              if (!hasCopy) count++;
          }
      });

      if (count > 0) {
          showNotification(`Você tem ${count} contas recorrentes para confirmar este mês.`, 'info');
      }
  };


  // --- INTELLIGENCE & GAMIFICATION ENGINE ---

  const checkAchievements = useCallback(async () => {
     let newUnlock = false;
     const updatedAchievements = [...achievements];
     const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

     const unlock = (id: string) => {
        const index = updatedAchievements.findIndex(a => a.id === id);
        if (index !== -1 && !updatedAchievements[index].unlockedAt) {
            updatedAchievements[index] = { ...updatedAchievements[index], unlockedAt: new Date().toISOString() };
            newUnlock = true;
            showNotification(`🏆 Conquista Desbloqueada: ${updatedAchievements[index].title}!`, 'achievement');
            // Save unlocked state essentially
            dbAPI.put('system', { id, unlockedAt: new Date().toISOString() }, `achievement_${id}`);
        }
     };

     // Condition Checks
     if (transactions.length > 0) unlock('first_step');
     if (totalBalance >= 1000) unlock('saver_bronze');
     if (totalBalance >= 10000) unlock('saver_gold');
     if (goals.some(g => g.currentAmount >= g.targetAmount)) unlock('goal_hunter');
     if (budgets.length > 0) unlock('responsible');
     if (accounts.some(a => a.type === 'investment')) unlock('investor');

     if (newUnlock) {
        setAchievements(updatedAchievements);
     }
  }, [transactions, accounts, goals, budgets, achievements]);

  // Run achievement check whenever relevant data changes
  useEffect(() => {
     if (!loading && user.onboardingCompleted) {
        checkAchievements();
     }
  }, [transactions, accounts, goals, budgets]);

  // 1. Cálculo de Saúde Financeira (Gamification)
  const getFinancialHealth = useCallback(() => {
    const now = new Date();
    const currentMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const income = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    let score = 0;

    // A. Fluxo de Caixa (40pts)
    if (income > expense) score += 40;
    else if (income > 0 && expense > income) score += Math.max(0, 40 - ((expense - income) / income) * 100);

    // B. Taxa de Poupança (30pts) - Meta: 20%
    const savingsRate = income > 0 ? (income - expense) / income : 0;
    score += Math.min(30, (savingsRate / 0.20) * 30); 

    // C. Disciplina de Orçamento (30pts)
    if (budgets.length > 0) {
       const budgetsOk = budgets.filter(b => {
         const spent = currentMonthTrans
            .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
         return spent <= b.limit;
       }).length;
       score += (budgetsOk / budgets.length) * 30;
    } else {
       score += 15; 
    }

    // Add XP from Achievements
    const achievementXp = achievements.filter(a => a.unlockedAt).reduce((acc, a) => acc + a.xpReward, 0);
    // Base score is monthly health (0-100) + Achievement XP accumulated over time
    // For the "Level", we use a formula.
    const totalXp = score + achievementXp;

    // Level formula: Level = sqrt(XP / 100)
    const levelNum = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    
    let levelTitle = "Novato";
    if (levelNum > 2) levelTitle = "Aprendiz";
    if (levelNum > 5) levelTitle = "Estrategista";
    if (levelNum > 8) levelTitle = "Investidor";
    if (levelNum > 12) levelTitle = "Magnata";

    return {
      score, // Monthly health score
      level: `${levelTitle} (Nvl ${levelNum})`,
      xp: totalXp,
      nextLevelXp: Math.pow(levelNum, 2) * 100 // XP needed for next level
    };
  }, [transactions, budgets, achievements]);

  // 2. Previsão de Gastos (Forecasting)
  const getForecast = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    const currentMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
    });

    const currentExpense = currentMonthTrans.reduce((acc, t) => acc + t.amount, 0);
    
    if (currentDay === 1 || currentExpense === 0) {
      return { projectedExpense: 0, status: 'safe' as const, diff: 0 };
    }

    const avgPerDay = currentExpense / currentDay;
    const projected = avgPerDay * daysInMonth;

    const currentIncome = transactions
      .filter(t => {
         const d = new Date(t.date);
         return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'income';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (projected > currentIncome && currentIncome > 0) status = 'danger';
    else if (projected > currentIncome * 0.9) status = 'warning';

    return {
      projectedExpense: projected,
      status,
      diff: projected - currentExpense
    };
  }, [transactions]);

  // 3. Sugestão Inteligente (Smart Match)
  const suggestCategoryAndAccount = useCallback((description: string) => {
    if (!description || description.length < 3) return {};

    const normalize = (str: string) => str.toLowerCase().trim();
    const target = normalize(description);

    const matches = transactions.filter(t => normalize(t.description).includes(target));
    
    if (matches.length === 0) return {};

    const bestMatch = matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      categoryId: bestMatch.categoryId,
      accountId: bestMatch.accountId
    };
  }, [transactions]);


  // --- ACTIONS ---

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'achievement') => {
    setNotification({ id: Date.now().toString(), message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };
  
  const togglePrivacy = () => {
      setIsPrivacyMode(prev => !prev);
  };

  const setAppPin = async (pin: string) => {
    if (pin.length !== 4) return;
    const updatedUser = { ...user, securityPin: pin };
    await dbAPI.put('system', updatedUser, 'user');
    setUser(updatedUser);
    showNotification('PIN de segurança definido!', 'success');
  };

  const unlockApp = (pin: string) => {
    if (user.securityPin === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const completeOnboarding = async (name: string, avatar: string, initialBalance: number) => {
    const newUser: UserProfile = {
      name,
      avatar,
      onboardingCompleted: true,
    };
    
    const mainAccount: Account = {
      id: '1',
      name: 'Conta Principal',
      type: 'checking',
      balance: initialBalance,
      color: 'text-blue-400',
      icon: '🏦'
    };

    // Save to DB
    await dbAPI.put('system', newUser, 'user');

    await dbAPI.replaceAll('accounts', [mainAccount]);
    await dbAPI.replaceAll('categories', INITIAL_CATEGORIES);
    await dbAPI.clearStore('transactions');
    await dbAPI.clearStore('goals');
    await dbAPI.clearStore('budgets');

    // Update State
    setUser(newUser);
    setAccounts([mainAccount]);
    setCategories(INITIAL_CATEGORIES);
    setTransactions([]);
    setGoals([]);
    setBudgets([]);
    
    showNotification('Perfil criado com sucesso! Bem-vindo.', 'success');
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    await dbAPI.put('system', updatedUser, 'user');
    setUser(updatedUser);
    showNotification('Perfil atualizado!', 'success');
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    
    await dbAPI.put('transactions', newTransaction);
    
    const account = accounts.find(a => a.id === t.accountId);
    if (account) {
        const amountChange = t.type === 'income' ? t.amount : -t.amount;
        const updatedAccount = { ...account, balance: account.balance + amountChange };
        await dbAPI.put('accounts', updatedAccount);
        setAccounts(prev => prev.map(a => a.id === t.accountId ? updatedAccount : a));
    }

    setTransactions(prev => [newTransaction, ...prev]);
    showNotification('Transação registrada!', 'success');
  };

  const editTransaction = async (id: string, updatedT: Omit<Transaction, 'id'>) => {
    const oldTransaction = transactions.find(t => t.id === id);
    if (!oldTransaction) return;

    const newTransaction = { ...updatedT, id };
    await dbAPI.put('transactions', newTransaction);

    let updatedAccounts = [...accounts];

    // Revert old
    const oldAccIndex = updatedAccounts.findIndex(a => a.id === oldTransaction.accountId);
    if (oldAccIndex >= 0) {
        const revertAmount = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
        updatedAccounts[oldAccIndex] = { 
            ...updatedAccounts[oldAccIndex], 
            balance: updatedAccounts[oldAccIndex].balance + revertAmount 
        };
    }

    // Apply new
    const newAccIndex = updatedAccounts.findIndex(a => a.id === updatedT.accountId);
    if (newAccIndex >= 0) {
        const applyAmount = updatedT.type === 'income' ? updatedT.amount : -updatedT.amount;
        updatedAccounts[newAccIndex] = {
            ...updatedAccounts[newAccIndex],
            balance: updatedAccounts[newAccIndex].balance + applyAmount
        };
    }

    for (const acc of updatedAccounts) {
        const original = accounts.find(a => a.id === acc.id);
        if (original && original.balance !== acc.balance) {
            await dbAPI.put('accounts', acc);
        }
    }

    setAccounts(updatedAccounts);
    setTransactions(prev => prev.map(t => t.id === id ? newTransaction : t));
    showNotification('Transação atualizada.', 'info');
  };

  const deleteTransaction = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    await dbAPI.delete('transactions', id);

    const account = accounts.find(a => a.id === transaction.accountId);
    if (account) {
        const amountChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        const updatedAccount = { ...account, balance: account.balance + amountChange };
        await dbAPI.put('accounts', updatedAccount);
        setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    showNotification('Transação removida.', 'info');
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    const newGoal = { ...g, id: Math.random().toString(36).substr(2, 9) };
    await dbAPI.put('goals', newGoal);
    setGoals(prev => [...prev, newGoal]);
    showNotification('Nova meta criada!', 'success');
  };

  const updateGoalAmount = async (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const completed = newAmount >= goal.targetAmount;
    const updatedGoal = { ...goal, currentAmount: newAmount, completed };
    
    await dbAPI.put('goals', updatedGoal);

    if (completed && !goal.completed) {
        showNotification('META ATINGIDA! Parabéns.', 'success');
    } else {
        showNotification('Progresso salvo!', 'info');
    }

    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
  };

  const getAccountBalance = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.balance || 0;
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: Math.random().toString(36).substr(2, 9) };
    await dbAPI.put('accounts', newAccount);
    setAccounts(prev => [...prev, newAccount]);
    showNotification('Conta criada com sucesso.', 'success');
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    const updatedAccount = { ...account, ...updates };
    await dbAPI.put('accounts', updatedAccount);
    setAccounts(prev => prev.map(a => a.id === id ? updatedAccount : a));
    showNotification('Conta atualizada.', 'info');
  };

  const removeAccount = async (id: string) => {
    const hasTransactions = transactions.some(t => t.accountId === id);
    if (hasTransactions) {
      showNotification('Erro: Conta possui transações vinculadas.', 'error');
      return;
    }
    await dbAPI.delete('accounts', id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    showNotification('Conta removida.', 'info');
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Math.random().toString(36).substr(2, 9) };
    await dbAPI.put('categories', newCategory);
    setCategories(prev => [...prev, newCategory]);
    showNotification('Categoria adicionada.', 'success');
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    const updatedCategory = { ...category, ...updates };
    await dbAPI.put('categories', updatedCategory);
    setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
    showNotification('Categoria atualizada.', 'info');
  };

  const removeCategory = async (id: string) => {
    const isInUse = transactions.some(t => t.categoryId === id);
    if (isInUse) {
      showNotification('Erro: Categoria em uso.', 'error');
      return;
    }
    const categoryType = categories.find(c => c.id === id)?.type;
    const countOfType = categories.filter(c => c.type === categoryType).length;
    if (countOfType <= 1) {
       showNotification('Mantenha pelo menos uma categoria.', 'error');
       return;
    }
    
    await dbAPI.delete('categories', id);
    await dbAPI.delete('budgets', id); 

    setCategories(prev => prev.filter(c => c.id !== id));
    setBudgets(prev => prev.filter(b => b.categoryId !== id));
    showNotification('Categoria removida.', 'info');
  };

  const setBudget = async (categoryId: string, limit: number) => {
    if (limit <= 0) {
        await dbAPI.delete('budgets', categoryId);
        setBudgets(prev => prev.filter(b => b.categoryId !== categoryId));
    } else {
        const newBudget = { categoryId, limit };
        await dbAPI.put('budgets', newBudget);
        setBudgets(prev => {
            const existing = prev.find(b => b.categoryId === categoryId);
            if (existing) {
                return prev.map(b => b.categoryId === categoryId ? newBudget : b);
            }
            return [...prev, newBudget];
        });
    }
    showNotification('Orçamento atualizado.', 'success');
  };

  const getBudgetStatus = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return { spent: 0, limit: 0, percent: 0 };
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const spent = transactions
      .filter(t => 
        t.categoryId === categoryId && 
        t.type === 'expense' &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = Math.min((spent / budget.limit) * 100, 100);
    return { spent, limit: budget.limit, percent };
  };

  const resetData = async () => {
    if (window.confirm('Tem certeza? Todo o progresso será reiniciado para o padrão.')) {
      await dbAPI.clearStore('accounts');
      await dbAPI.clearStore('categories');
      await dbAPI.clearStore('transactions');
      await dbAPI.clearStore('goals');
      await dbAPI.clearStore('budgets');
      
      await dbAPI.put('system', DEFAULT_USER, 'user');

      localStorage.clear();
      window.location.reload();
    }
  };

  const importData = async (jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent);
      
      if (!data.transactions || !data.accounts || !data.categories) {
        showNotification('Arquivo inválido: formato incorreto.', 'error');
        return false;
      }

      if (window.confirm('Atenção: Isso substituirá todos os dados atuais pelos do backup. Continuar?')) {
        await dbAPI.replaceAll('transactions', data.transactions);
        await dbAPI.replaceAll('accounts', data.accounts);
        await dbAPI.replaceAll('categories', data.categories);
        await dbAPI.replaceAll('goals', data.goals || []);
        await dbAPI.replaceAll('budgets', data.budgets || []);
        
        showNotification('Backup restaurado com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 2000);
        return true;
      }
      return false;
    } catch (e) {
      showNotification('Erro ao ler arquivo. Verifique se é um JSON válido.', 'error');
      return false;
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const financialHealth = getFinancialHealth();
  const forecast = getForecast();

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-blue-500">
           <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-display animate-pulse">Carregando Banco de Dados...</p>
           </div>
        </div>
     );
  }

  return (
    <FinanceContext.Provider value={{
      user,
      accounts,
      transactions,
      categories,
      goals,
      budgets,
      achievements,
      notification,
      isPrivacyMode,
      isLocked,
      togglePrivacy,
      unlockApp,
      setAppPin,
      financialHealth, // New
      forecast, // New
      suggestCategoryAndAccount, // New
      completeOnboarding,
      updateUser,
      addTransaction,
      editTransaction,
      deleteTransaction,
      addGoal,
      updateGoalAmount,
      getAccountBalance,
      totalBalance,
      resetData,
      importData,
      addAccount,
      updateAccount, // New
      removeAccount,
      addCategory,
      updateCategory, // New
      removeCategory,
      setBudget,
      getBudgetStatus,
      clearNotification
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
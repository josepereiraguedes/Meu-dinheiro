export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'wallet' | 'investment' | 'credit_card';
  balance: number;
  creditLimit?: number;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO Date
  categoryId: string;
  accountId: string;
  type: TransactionType;
  isRecurring: boolean;
  installments?: {
    current: number;
    total: number;
  };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  completed?: boolean; // New
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string; // internal code
  unlockedAt?: string; // ISO Date if unlocked
  xpReward: number;
}

export interface UserProfile {
  name: string;
  avatar: string; // Emoji char OR Base64 Image URL
  onboardingCompleted: boolean;
  securityPin?: string; // New: 4 digit pin
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'achievement';
}

export interface FinanceContextType {
  user: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  budgets: Budget[];
  notification: Notification | null;
  achievements: Achievement[]; // New
  
  // Privacy & Security
  isPrivacyMode: boolean;
  isLocked: boolean; // New
  togglePrivacy: () => void;
  unlockApp: (pin: string) => boolean;
  setAppPin: (pin: string) => void;

  // Actions
  completeOnboarding: (name: string, avatar: string, initialBalance: number) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoalAmount: (id: string, amount: number) => void;
  getAccountBalance: (accountId: string) => number;
  totalBalance: number;
  
  // Novas funções de gestão
  resetData: () => void;
  importData: (jsonContent: string) => boolean;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  
  // Funções de Budget
  setBudget: (categoryId: string, limit: number) => void;
  getBudgetStatus: (categoryId: string) => { spent: number; limit: number; percent: number };
  
  // UI Helpers
  clearNotification: () => void;
}
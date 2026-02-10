import { Account, Category, Goal, Transaction, Achievement } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Banco Digital', type: 'checking', balance: 2500, color: 'text-cyan-400', icon: '🏦' },
  { id: '2', name: 'Carteira Física', type: 'wallet', balance: 150, color: 'text-emerald-400', icon: '👛' },
  { id: '3', name: 'Cofre Cripto', type: 'investment', balance: 5000, color: 'text-violet-400', icon: '🪙' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Salário', icon: '💎', color: 'text-emerald-400', type: 'income' },
  { id: '2', name: 'Freelance', icon: '⚡', color: 'text-yellow-400', type: 'income' },
  { id: '3', name: 'Alimentação', icon: '🍔', color: 'text-rose-400', type: 'expense' },
  { id: '4', name: 'Transporte', icon: '🚀', color: 'text-orange-400', type: 'expense' },
  { id: '5', name: 'Games', icon: '🎮', color: 'text-purple-400', type: 'expense' },
  { id: '6', name: 'Setup', icon: '🖥️', color: 'text-cyan-400', type: 'expense' },
];

export const INITIAL_GOALS: Goal[] = [
  { id: '1', name: 'RTX 5090', targetAmount: 8000, currentAmount: 2200, deadline: '2024-12-25', icon: '📼', color: 'bg-purple-600' },
  { id: '2', name: 'Viagem Japão', targetAmount: 15000, currentAmount: 3000, deadline: '2025-07-01', icon: '⛩️', color: 'bg-rose-600' },
];

// Generate some dummy transactions for the last 30 days
const today = new Date();
export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Supermercado', amount: 450.50, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(), categoryId: '3', accountId: '1', type: 'expense', isRecurring: false },
  { id: '2', description: 'Salário Mensal', amount: 3500.00, date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString(), categoryId: '1', accountId: '1', type: 'income', isRecurring: true },
  { id: '3', description: 'Uber', amount: 24.90, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(), categoryId: '4', accountId: '1', type: 'expense', isRecurring: false },
  { id: '4', description: 'Steam Sale', amount: 120.00, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(), categoryId: '5', accountId: '1', type: 'expense', isRecurring: false },
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primeiros Passos',
    description: 'Adicione sua primeira transação.',
    icon: '👶',
    condition: 'has_transaction',
    xpReward: 100
  },
  {
    id: 'saver_bronze',
    title: 'Cofrinho Cheio',
    description: 'Acumule um saldo total de R$ 1.000.',
    icon: '🐷',
    condition: 'balance_1k',
    xpReward: 250
  },
  {
    id: 'saver_gold',
    title: 'Magnata',
    description: 'Acumule um saldo total de R$ 10.000.',
    icon: '🤵',
    condition: 'balance_10k',
    xpReward: 1000
  },
  {
    id: 'goal_hunter',
    title: 'Caçador de Metas',
    description: 'Conclua uma meta financeira.',
    icon: '🎯',
    condition: 'goal_completed',
    xpReward: 500
  },
  {
    id: 'responsible',
    title: 'Adulto Responsável',
    description: 'Crie um orçamento para uma categoria.',
    icon: '👔',
    condition: 'has_budget',
    xpReward: 150
  },
  {
    id: 'investor',
    title: 'Mente de Tubarão',
    description: 'Crie uma conta do tipo Investimento.',
    icon: '🦈',
    condition: 'has_investment',
    xpReward: 300
  }
];
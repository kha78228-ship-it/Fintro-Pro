export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id?: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO string
  userId: string;
}

export interface Budget {
  id?: string;
  categoryId: string;
  amount: number;
  period: 'monthly';
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  userId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  currency: string;
}

export interface Goal {
  id?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  userId: string;
}

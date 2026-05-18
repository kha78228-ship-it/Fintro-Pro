export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface Transaction {
  id?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  description: string;
  date: string; // ISO string
  userId: string;
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
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
  status?: 'online' | 'offline';
  lastSeen?: any;
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

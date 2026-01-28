
export enum TransactionType {
  Income = 'income',
  Expense = 'expense'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  INR = 'INR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD'
}

export enum Category {
  Housing = 'Housing & Utilities',
  Food = 'Food & Groceries',
  Finance = 'Financial Commitments',
  Travel = 'Travel & Vacation',
  Lifestyle = 'Personal & Lifestyle',
  Health = 'Health & Medical',
  Education = 'Education & Learning',
  Transport = 'Transportation',
  Family = 'Family & Social',
  Entertainment = 'Entertainment & Leisure',
  // Income Categories
  Salary = 'Salary',
  Freelance = 'Freelance',
  Investments = 'Investments',
  Gift = 'Gift',
  OtherIncome = 'Other Income'
}

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: Date;
  note: string;
  type: TransactionType;
}

export interface CategoryData {
  category: Category;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface BudgetStats {
  totalSpent: number;
  budgetLimit: number;
  categories: CategoryData[];
  currency: Currency;
}

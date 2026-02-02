export enum TransactionType {
  Income = 'income',
  Expense = 'expense'
}

export enum PaymentType {
  UPI = 'UPI',
  DebitCard = 'Debit Card',
  CreditCard = 'Credit Card',
  NetBanking = 'Net Banking'
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

export enum BillingCycle {
  Monthly = 'Monthly',
  Quarterly = '3 Months',
  Yearly = 'Yearly'
}

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: Date;
  note: string;
  type: TransactionType;
  paymentType: PaymentType;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  iconUrl: string;
  alertEnabled: boolean;
  alertLeadDays: number;
  category: Category;
}

export interface CategoryData {
  category: Category;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  name?: string;
  category: Category;
  limit: number;
}

export interface BudgetStats {
  totalSpent: number;
  budgetLimit: number;
  categories: CategoryData[];
  currency: Currency;
}
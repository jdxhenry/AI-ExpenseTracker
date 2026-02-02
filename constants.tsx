
import React from 'react';
import { Category, Transaction, TransactionType, BillingCycle, PaymentType } from './types.ts';
import { 
  Home, 
  ShoppingCart, 
  CreditCard, 
  Plane, 
  ShoppingBag, 
  HeartPulse, 
  GraduationCap, 
  Car, 
  Users, 
  Film,
  Banknote,
  Briefcase,
  TrendingUp,
  Gift,
  Coins
} from 'lucide-react';

export const CATEGORY_METADATA: Record<Category, { color: string; icon: React.ReactNode }> = {
  [Category.Housing]: { color: '#F8D548', icon: <Home size={18} /> },
  [Category.Food]: { color: '#F38B3C', icon: <ShoppingCart size={18} /> },
  [Category.Finance]: { color: '#E94D61', icon: <CreditCard size={18} /> },
  [Category.Travel]: { color: '#D63F8D', icon: <Plane size={18} /> },
  [Category.Lifestyle]: { color: '#6B52B2', icon: <ShoppingBag size={18} /> },
  [Category.Health]: { color: '#3062C0', icon: <HeartPulse size={18} /> },
  [Category.Education]: { color: '#2898D2', icon: <GraduationCap size={18} /> },
  [Category.Transport]: { color: '#63C1B5', icon: <Car size={18} /> },
  [Category.Family]: { color: '#72BF44', icon: <Users size={18} /> },
  [Category.Entertainment]: { color: '#A5CF4C', icon: <Film size={18} /> },
  // Income
  [Category.Salary]: { color: '#34C759', icon: <Banknote size={18} /> },
  [Category.Freelance]: { color: '#5856D6', icon: <Briefcase size={18} /> },
  [Category.Investments]: { color: '#AF52DE', icon: <TrendingUp size={18} /> },
  [Category.Gift]: { color: '#FF2D55', icon: <Gift size={18} /> },
  [Category.OtherIncome]: { color: '#8E8E8E', icon: <Coins size={18} /> },
};

export const CATEGORY_TAGS: Partial<Record<Category, string[]>> = {
  [Category.Housing]: ['House rent', 'Maintenance Charges', 'Property Tax', 'Electricity', 'Water Bill'],
  [Category.Food]: ['Groceries', 'Dining Out', 'Coffee', 'Snacks'],
  [Category.Finance]: ['Investment', 'Loan EMI', 'Insurance', 'Savings'],
  [Category.Travel]: ['Flight', 'Hotel', 'Taxi', 'Sightseeing'],
  [Category.Lifestyle]: ['Clothing', 'Personal Care', 'Spa', 'Gifts'],
  [Category.Health]: ['Medicine', 'Doctor Visit', 'Gym', 'Lab Test'],
  [Category.Education]: ['Course Fee', 'Books', 'Stationery'],
  [Category.Transport]: ['Fuel', 'Parking', 'Toll', 'Repairs'],
  [Category.Family]: ['Dining', 'Gift', 'Money Sent', 'Event'],
  [Category.Entertainment]: ['Netflix', 'Movies', 'Gaming', 'Concert'],
  // Income Tags
  [Category.Salary]: ['Monthly Pay', 'Bonus', 'Overtime'],
  [Category.Freelance]: ['Web Project', 'Design Work', 'Consultation'],
  [Category.Investments]: ['Dividends', 'Stock Sale', 'Crypto Gain'],
  [Category.Gift]: ['Birthday', 'Holiday', 'Red Envelope'],
  [Category.OtherIncome]: ['Sold Item', 'Refund', 'Tax Return'],
};

export const QUICK_ADD_SUBSCRIPTIONS = [
  { name: 'Netflix', amount: 15.99, color: '#E50914', icon: 'N', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Netflix-new-icon.png' },
  { name: 'Disney+', amount: 7.99, color: '#006E99', icon: 'D+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/100px-Disney%2B_logo.svg.png' },
  { name: 'Amazon Prime', amount: 14.99, color: '#FF9900', icon: 'AP', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg' },
  { name: 'Spotify', amount: 9.99, color: '#1DB954', icon: 'S', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
  { name: 'YouTube Prem...', amount: 11.99, color: '#FF0000', icon: 'YT', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png' },
  { name: 'Apple Music', amount: 10.99, color: '#FB233B', icon: 'AM', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_Music_logo.svg' },
  { name: 'ChatGPT Plus', amount: 20.00, color: '#10a37f', icon: 'GPT', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
  { name: 'iCloud+', amount: 0.99, color: '#007AFF', icon: 'iC', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/ICloud_icon.svg' },
  { name: 'Adobe CC', amount: 54.99, color: '#FF0000', icon: 'CC', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Creative_Cloud_logo_2020.svg' },
];

export const MOCK_EXPENSES: Transaction[] = [
  { id: '0', amount: 5000, category: Category.Salary, date: new Date(), note: 'Monthly Salary', type: TransactionType.Income, paymentType: PaymentType.NetBanking },
  { id: '1', amount: 850, category: Category.Housing, date: new Date(), note: 'Rent', type: TransactionType.Expense, paymentType: PaymentType.NetBanking },
  { id: '2', amount: 620, category: Category.Food, date: new Date(), note: 'Weekly Groceries', type: TransactionType.Expense, paymentType: PaymentType.UPI },
  { id: '3', amount: 610, category: Category.Finance, date: new Date(), note: 'Credit Card Pay', type: TransactionType.Expense, paymentType: PaymentType.NetBanking },
  { id: '4', amount: 380, category: Category.Travel, date: new Date(), note: 'Hotel Booking', type: TransactionType.Expense, paymentType: PaymentType.CreditCard },
  { id: '5', amount: 320, category: Category.Lifestyle, date: new Date(), note: 'New Clothes', type: TransactionType.Expense, paymentType: PaymentType.DebitCard },
  { id: '6', amount: 250, category: Category.Health, date: new Date(), note: 'Pharmacy', type: TransactionType.Expense, paymentType: PaymentType.UPI },
  { id: '7', amount: 240, category: Category.Education, date: new Date(), note: 'Online Course', type: TransactionType.Expense, paymentType: PaymentType.CreditCard },
  { id: '8', amount: 190, category: Category.Transport, date: new Date(), note: 'Gas', type: TransactionType.Expense, paymentType: PaymentType.UPI },
  { id: '9', amount: 180, category: Category.Family, date: new Date(), note: 'Dinner', type: TransactionType.Expense, paymentType: PaymentType.DebitCard },
  { id: '10', amount: 150, category: Category.Entertainment, date: new Date(), note: 'Cinema', type: TransactionType.Expense, paymentType: PaymentType.UPI },
];
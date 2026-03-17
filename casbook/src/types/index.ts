export type TransactionType = 'income' | 'expense' | 'withdrawal';

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  category_id: number;
  category_name?: string;
  description: string;
  amount: number;
  partner_id: number | null;
  partner_name?: string | null;
  running_balance?: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: TransactionType | 'all';
  color: string;
}

export interface Partner {
  id: number;
  name: string;
  role: string;
}

export interface Summary {
  total_income: number;
  total_expense: number;
  total_withdrawal: number;
  balance: number;
  transaction_count: number;
}

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  type?: TransactionType | '';
  category_id?: number | '';
  partner_id?: number | '';
  search?: string;
}

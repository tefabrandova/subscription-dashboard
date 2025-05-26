export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}
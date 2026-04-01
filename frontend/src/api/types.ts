export type Gender = "male" | "female" | "other";

export interface LoginResponse {
  id: string;
  email: string;
  token: string;
}

export interface User {
  id: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  category: Category;
  date: string;
  notes: string;
}

export interface ApiErrorBody {
  message?: string;
}

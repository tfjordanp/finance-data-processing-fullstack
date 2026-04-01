import { api } from "./client";
import type { Category, LoginResponse, Transaction, User } from "./types";

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password });
  return data;
}

export async function fetchProfile(): Promise<User> {
  const { data } = await api.get<User>("/api/users/me");
  return data;
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/api/users");
  return data;
}

export async function fetchUser(id: string): Promise<User> {
  const { data } = await api.get<User>(`/api/users/${id}`);
  return data;
}

export type CreateUserBody = {
  email: string;
  password: string;
  dateOfBirth: string;
  gender: User["gender"];
  isActive: boolean;
};

export async function createUser(body: CreateUserBody): Promise<User> {
  const { data } = await api.post<User>("/api/users", body);
  return data;
}

export async function updateUser(id: string, body: CreateUserBody): Promise<User> {
  const { data } = await api.put<User>(`/api/users/${id}`, body);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/users/${id}`);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>("/api/transactions");
  return data;
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const { data } = await api.get<Transaction>(`/api/transactions/${id}`);
  return data;
}

export type CreateTransactionBody = {
  amount: number;
  type: Transaction["type"];
  categoryId: string;
  date: string;
  notes?: string;
};

export async function createTransaction(body: CreateTransactionBody): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/api/transactions", body);
  return data;
}

export type PatchTransactionBody = Partial<CreateTransactionBody>;

export async function patchTransaction(id: string, body: PatchTransactionBody): Promise<Transaction> {
  const { data } = await api.patch<Transaction>(`/api/transactions/${id}`, body);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/api/transactions/${id}`);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/api/categories");
  return data;
}

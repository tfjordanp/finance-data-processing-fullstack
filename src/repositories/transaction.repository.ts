import { AppDataSource } from "../data-source";
import { Transaction } from "../models/Transaction";

export const TransactionRepository = AppDataSource.getRepository(Transaction);

export const getAllTransactions = async () => {
  return TransactionRepository.find({
    order: { date: "DESC" }
  });
};

export const getTransactionById = async (id: string) => {
  return TransactionRepository.findOne({
    where: { id }
  });
};

export const createTransaction = async (transaction: Partial<Transaction>) => {
  const entity = TransactionRepository.create(transaction);
  return TransactionRepository.save(entity);
};

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
  await TransactionRepository.update(id, data);
  return TransactionRepository.findOne({ where: { id } });
};

export const deleteTransaction = async (id: string) => {
  return TransactionRepository.delete({ id });
};

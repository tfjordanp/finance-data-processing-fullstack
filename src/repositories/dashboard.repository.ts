import { TransactionRepository } from "./transaction.repository";
import type { Transaction } from "../models/Transaction";


export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface CategoryTotal {
  categoryName: string;
  type: Transaction['type'];
  totalAmount: number;
}

export interface MonthlyTrend {
  month: string; // e.g., "2024-05"
  type: Transaction['type'];
  total: number;
}

/**
 * 1, 2, & 3. Summary Totals
 * Returns: { totalIncome: number, totalExpenses: number, netBalance: number }
 */
export async function getSummary(): Promise<Summary> {
    const result = await TransactionRepository.createQueryBuilder("t")
        .select("SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END)", "totalIncome")
        .addSelect("SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)", "totalExpenses")
        .getRawOne();

    const totalIncome = parseFloat(result?.totalIncome || "0");
    const totalExpenses = parseFloat(result?.totalExpenses || "0");

    return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
    };
}

/**
 * 4. Category Wise Totals
 * Joins categories and sums amounts by type.
 */
export async function getCategoryTotals(): Promise<CategoryTotal[]> {
    return TransactionRepository.createQueryBuilder("t")
        .leftJoin("t.category", "c")
        .select("c.name", "categoryName")
        .addSelect("t.type", "type")
        .addSelect("SUM(t.amount)", "totalAmount")
        .groupBy("c.id")
        .addGroupBy("t.type")
        .getRawMany();
}

/**
 * 5. Recent Activity
 * Reuses standard find logic but tailored for the dashboard view.
 */
export async function getRecentActivity(limit: number = 5) {
    return TransactionRepository.find({
        order: { date: "DESC", id: "DESC" },
        take: limit,
        relations: ["category"],
    });
}

/**
 * 6. Monthly Trends
 * Groups by the YYYY-MM part of the date string.
 */
export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
    return TransactionRepository.createQueryBuilder("t")
        .select("SUBSTRING(t.date, 1, 7)", "month") 
        .addSelect("t.type", "type")
        .addSelect("SUM(t.amount)", "total")
        .groupBy("month")
        .addGroupBy("t.type")
        .orderBy("month", "ASC")
        .getRawMany();
}



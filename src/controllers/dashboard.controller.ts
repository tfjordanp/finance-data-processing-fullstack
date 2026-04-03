import { Request, Response } from "express";
import { getSummary as getSummaryA, getCategoryTotals, getMonthlyTrends, getRecentActivity } from "../repositories/dashboard.repository";

/**
 * GET /api/dashboard
 * Returns the full suite of dashboard data in parallel
 */
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const [summary, categoryTotals, trends, recentActivity] = await Promise.all([
      getSummaryA(),
      getCategoryTotals(),
      getMonthlyTrends(),
      getRecentActivity(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary,
        categoryTotals,
        trends,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/dashboard/summary
 */
export const getSummary = async (req: Request, res: Response) => {
  try {
    const data = await getSummaryA();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as any).message });
  }
};

/**
 * GET /api/dashboard/trends
 */
export const getTrends = async (req: Request, res: Response) => {
  try {
    const data = await getMonthlyTrends();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as any).message });
  }
};
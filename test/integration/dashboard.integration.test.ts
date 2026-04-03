import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";
import { User } from "../../src/models/User";
import { Category } from "../../src/models/Category";
import { hashPassword } from "../../src/services/auth.service";
import { Transaction } from "../../src/models/Transaction";

describe("Dashboard Integration Tests", () => {
  let token: string;
  let categoryId: string;

  beforeEach(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    // 1. Setup Category
    const categoryRepo = AppDataSource.getRepository(Category);
    const cat = await categoryRepo.save({ name: "Food" });
    categoryId = cat.id;

    // 2. Setup User & Auth
    const userRepo = AppDataSource.getRepository(User);
    const rawPassword = "password123";
    const hashed = await hashPassword(rawPassword);
    await userRepo.save({ 
      email: "dash@example.com", 
      password: hashed, 
      dateOfBirth: "1995-01-01", 
      gender: "female", 
      isActive: true 
    });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "dash@example.com", password: rawPassword });
    token = login.body.token;

    // 3. Seed Transactions for Aggregation
    const txRepo = AppDataSource.getRepository(Transaction);
    await txRepo.save([
      { amount: 1000, type: "income", category: cat, date: "2026-01-10", notes: "Salary" },
      { amount: 200, type: "expense", category: cat, date: "2026-01-15", notes: "Grocery" },
      { amount: 300, type: "expense", category: cat, date: "2026-02-01", notes: "Rent" },
    ]);
  });

  afterEach(async () => {
    await AppDataSource.destroy();
  });

  it("should get complete dashboard overview with correct math", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    const { summary, categoryTotals, trends, recentActivity } = res.body.data;

    // Verify Summary (1000 - 200 - 300 = 500)
    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalExpenses).toBe(500);
    expect(summary.netBalance).toBe(500);

    // Verify Category Breakdown
    expect(categoryTotals.some((c: any) => c.categoryName === "Food")).toBe(true);

    // Verify Trends (Check that January and February both exist)
    expect(trends.length).toBeGreaterThanOrEqual(2);
    expect(trends.find((t: any) => t.month === "2026-01")).toBeDefined();
  });

  it("should get only summary data", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.data).toHaveProperty("netBalance", 500);
  });

  it("should return recent activity in descending order", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    const recent = res.body.data.recentActivity;
    // Feb 1st should be first, Jan 15th second
    const firstDate = new Date(recent[0].date).getTime();
    const secondDate = new Date(recent[1].date).getTime();
    
    expect(firstDate).toBeGreaterThanOrEqual(secondDate);
  });

  it("should return empty summary when no transactions exist", async () => {
    // Clear transactions
    await AppDataSource.getRepository(Transaction).deleteAll();

    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toEqual(200);
    expect(res.body.data).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0
    });
  });
});
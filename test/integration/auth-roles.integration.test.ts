import request from "supertest";
import app from "../../src/app";
import { AppDataSource } from "../../src/data-source";
import { User } from "../../src/models/User";
import { Category } from "../../src/models/Category";
import { Transaction } from "../../src/models/Transaction";
import { hashPassword } from "../../src/services/auth.service";

describe("Role-Based Access Control (RBAC) Tests", () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let categoryId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    const userRepo = AppDataSource.getRepository(User);
    const catRepo = AppDataSource.getRepository(Category);
    const password = await hashPassword("password123");

    // Setup Category
    const cat = await catRepo.save({ name: "General" });
    categoryId = cat.id;

    // Create Users for each role
    await userRepo.save([
      { email: "admin@test.com", password, role: "admin", dateOfBirth: "1990-01-01", gender: "male", isActive: true },
      { email: "analyst@test.com", password, role: "analyst", dateOfBirth: "1990-01-01", gender: "male", isActive: true },
      { email: "viewer@test.com", password, role: "viewer", dateOfBirth: "1990-01-01", gender: "male", isActive: true },
    ]);

    // Helper to get tokens
    const getToken = async (email: string) => {
      const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });
      return res.body.token;
    };

    adminToken = await getToken("admin@test.com");
    analystToken = await getToken("analyst@test.com");
    viewerToken = await getToken("viewer@test.com");
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  // --- USER MANAGEMENT SECTION ---
  describe("User Management Access", () => {
    it("ADMIN should be able to list users", async () => {
      const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("ANALYST should be forbidden from listing users", async () => {
      const res = await request(app).get("/api/users").set("Authorization", `Bearer ${analystToken}`);
      expect(res.status).toBe(403);
    });

    it("Everyone should be able to see their own profile (/me)", async () => {
      const roles = [adminToken, analystToken, viewerToken];
      for (const token of roles) {
        const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
      }
    });
  });

  // --- TRANSACTION SECTION ---
  describe("Transaction Access", () => {
    it("ANALYST should be able to list transactions", async () => {
      const res = await request(app).get("/api/transactions").set("Authorization", `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
    });

    it("VIEWER should be forbidden from listing transactions", async () => {
      const res = await request(app).get("/api/transactions").set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(403); // Per: unallowedRoles: ['viewer']
    });

    it("ADMIN should be able to create a transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 50, type: "expense", categoryId, date: "2026-04-01" });
      expect(res.status).toBe(201);
    });

    it("ANALYST should be forbidden from creating a transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ amount: 50, type: "expense", categoryId, date: "2026-04-01" });
      expect(res.status).toBe(403); // Per: allowedRoles: ['admin']
    });
  });

  // --- DASHBOARD SECTION ---
  describe("Dashboard Access", () => {
    it("VIEWER should be able to see the dashboard summary", async () => {
      // Your dashboard route currently only uses 'authenticate', no 'authorize'
      const res = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${viewerToken}`);
      expect(res.status).toBe(200);
    });

    it("Unauthenticated users should be blocked from dashboard", async () => {
      const res = await request(app).get("/api/dashboard/summary");
      expect(res.status).toBe(401);
    });
  });
});